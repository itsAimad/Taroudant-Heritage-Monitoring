from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional
from ..database import get_db, execute_query, execute_write
from ..dependencies import require_role, get_current_user
from ..models.user import UserRole

router = APIRouter(prefix='/monuments', tags=['Monuments'])

@router.get('/')
async def get_all_monuments(conn = Depends(get_db)):
    rows = execute_query(
        conn,
        """
        SELECT
          m.monument_id        AS id,
          m.name,
          m.location,
          m.city,
          m.latitude,
          m.longitude,
          m.construction_year,
          m.description,
          m.status,
          mc.category_name     AS type,
          vs.total_score       AS vulnerability_score,
          vs.risk_level,
          li.last_inspection_date AS last_inspection,
          CONCAT(
            DAYNAME(li.last_inspection_date), ' ',
            LPAD(DAY(li.last_inspection_date), 2, '0'), ' ',
            MONTHNAME(li.last_inspection_date), ' ',
            YEAR(li.last_inspection_date)
          ) AS last_inspection_display,
          CASE WHEN m.photo_blob IS NOT NULL THEN 1 ELSE 0 END AS has_photo
        FROM monuments m
        LEFT JOIN monument_categories mc
          ON m.category_id = mc.category_id
        LEFT JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id
            FROM vulnerability_scores
            WHERE monument_id = m.monument_id
            ORDER BY computed_at DESC
            LIMIT 1
          )
        LEFT JOIN (
          SELECT monument_id, MAX(inspection_date) AS last_inspection_date
          FROM inspections
          GROUP BY monument_id
        ) li ON li.monument_id = m.monument_id
        ORDER BY m.monument_id ASC
        """
    )
    for r in rows:
        if r['has_photo']:
            r['image_url'] = f"/api/monuments/{r['id']}/image"
        else:
            r['image_url'] = None
        del r['has_photo']
    return { 'count': len(rows), 'results': rows }

@router.get('/{monument_id}')
async def get_monument(
    monument_id: int,
    conn = Depends(get_db)
):
    rows = execute_query(
        conn,
        """
        SELECT
          m.*,
          mc.category_name     AS type,
          vs.total_score       AS vulnerability_score,
          vs.risk_level,
          vs.age_score,
          vs.crack_score,
          vs.computed_at       AS last_score_at,
          li.last_inspection_date AS last_inspection,
          CONCAT(
            DAYNAME(li.last_inspection_date), ' ',
            LPAD(DAY(li.last_inspection_date), 2, '0'), ' ',
            MONTHNAME(li.last_inspection_date), ' ',
            YEAR(li.last_inspection_date)
          ) AS last_inspection_display,
          CASE WHEN m.photo_blob IS NOT NULL THEN 1 ELSE 0 END AS has_photo
        FROM monuments m
        LEFT JOIN monument_categories mc
          ON m.category_id = mc.category_id
        LEFT JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id
            FROM vulnerability_scores
            WHERE monument_id = m.monument_id
            ORDER BY computed_at DESC
            LIMIT 1
          )
        LEFT JOIN (
          SELECT monument_id, MAX(inspection_date) AS last_inspection_date
          FROM inspections
          GROUP BY monument_id
        ) li ON li.monument_id = m.monument_id
        WHERE m.monument_id = %s
        LIMIT 1
        """,
        (monument_id,)
    )
    if not rows:
        raise HTTPException(status_code=404, detail='Monument not found.')
    
    res = rows[0]
    res['id'] = res['monument_id']
    if res['has_photo']:
        res['image_url'] = f"/api/monuments/{res['id']}/image"
    else:
        res['image_url'] = None
    del res['has_photo']
    del res['photo_blob']  # Do not send binary over JSON

    
    # Generate Plain-Language Summary
    year = res['construction_year'] or 0
    age = 2026 - year if year > 0 else 0
    score = res['vulnerability_score'] or 0
    risk = (res['risk_level'] or 'low').upper()
    
    # Fetch crack details from the most recent completed inspection
    crack_info = execute_query(conn, """
        SELECT 
          COUNT(c.crack_id) AS total,
          MAX(c.severity) AS worst
        FROM inspections i
        LEFT JOIN cracks c ON i.inspection_id = c.inspection_id
        WHERE i.monument_id = %s AND i.status = 'completed'
        GROUP BY i.inspection_id
        ORDER BY i.inspection_date DESC LIMIT 1
    """, (monument_id,))
    
    c_count = crack_info[0]['total'] if crack_info else 0
    c_worst = crack_info[0]['worst'] if crack_info else 'none'
    
    res['risk_summary'] = (
        f"This monument scored {score}/100 because of its age "
        f"(built {year if year > 0 else 'unknown'}) and {c_count} "
        f"{c_worst} structural cracks detected in the last inspection."
    )
    
    res['vulnerability_points'] = [
        f"Built in {year if year > 0 else 'unknown date'} — {age if age > 0 else 'Unknown'} years of structural aging",
        f"{c_count} cracks detected in last inspection, worst severity: {c_worst.capitalize()}",
        f"Status escalated to {risk} based on score of {score}/100"
    ]
    
    return res

@router.get('/{monument_id}/inspections/public')
async def get_monument_inspections_public(
    monument_id: int,
    conn = Depends(get_db)
):
    """Public endpoint — returns only aggregate summary + trend (no sensitive data)."""
    summary = execute_query(conn, """
        SELECT
          COUNT(*) AS total_inspections,
          MAX(i.inspection_date) AS last_inspection_date,
          (SELECT i2.overall_condition
           FROM inspections i2
           WHERE i2.monument_id = %s
           ORDER BY i2.inspection_date DESC
           LIMIT 1) AS last_condition
        FROM inspections i
        WHERE i.monument_id = %s
    """, (monument_id, monument_id))

    trend = execute_query(conn, """
        SELECT
          i.inspection_date,
          vs.total_score,
          vs.risk_level
        FROM inspections i
        JOIN vulnerability_scores vs
          ON vs.inspection_id = i.inspection_id
        WHERE i.monument_id = %s
        ORDER BY i.inspection_date ASC
        LIMIT 12
    """, (monument_id,))

    return {
        'summary': summary[0] if summary else {},
        'trend': trend,
    }


@router.get('/{monument_id}/inspections')
async def get_monument_inspections(
    monument_id: int,
    conn = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Role-filtered inspection history. Returns different data per role."""
    role = current_user['role']

    # Base query — what everyone gets
    base = execute_query(conn, """
        SELECT
          i.inspection_id,
          i.inspection_date,
          i.overall_condition,
          i.status,
          i.created_at,
          vs.total_score,
          vs.risk_level,
          vs.age_score,
          vs.crack_score,
          (SELECT COUNT(*) FROM cracks c
           WHERE c.inspection_id = i.inspection_id) AS crack_count
        FROM inspections i
        LEFT JOIN vulnerability_scores vs
          ON vs.inspection_id = i.inspection_id
        WHERE i.monument_id = %s
        ORDER BY i.inspection_date DESC
        LIMIT 20
    """, (monument_id,))

    if role == 'authority' or role == 'admin':
        # Full data — inspector name, notes, cracks detail, report info
        for insp in base:
            iid = insp['inspection_id']

            detail = execute_query(conn, """
                SELECT u.full_name AS inspector_name, i.notes
                FROM inspections i
                JOIN users u ON i.inspector_id = u.id_user
                WHERE i.inspection_id = %s
            """, (iid,))
            if detail:
                insp['inspector_name'] = detail[0]['inspector_name']
                insp['notes'] = detail[0]['notes']

            cracks = execute_query(conn, """
                SELECT
                  c.crack_id,
                  c.location_on_monument,
                  c.severity,
                  c.length_cm,
                  CASE WHEN c.photo_blob IS NOT NULL THEN 1 ELSE 0 END AS photo_count
                FROM cracks c
                WHERE c.inspection_id = %s
                ORDER BY c.detected_at ASC
            """, (iid,))
            insp['cracks'] = cracks

            report = execute_query(conn, """
                SELECT report_id, title, risk_level, status, created_at
                FROM reports
                WHERE inspection_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (iid,))
            insp['report'] = report[0] if report else None

    elif role == 'inspector':
        # Inspector sees own inspections fully, others get basic only
        for insp in base:
            iid = insp['inspection_id']
            detail = execute_query(conn, """
                SELECT u.full_name AS inspector_name, i.notes, i.inspector_id
                FROM inspections i
                JOIN users u ON i.inspector_id = u.id_user
                WHERE i.inspection_id = %s
            """, (iid,))
            if detail:
                is_own = detail[0].get('inspector_id') == current_user['id']
                if is_own:
                    insp['inspector_name'] = detail[0]['inspector_name']
                    insp['notes'] = detail[0]['notes']
                    cracks = execute_query(conn, """
                        SELECT c.crack_id, c.location_on_monument, c.severity, c.length_cm
                        FROM cracks c
                        WHERE c.inspection_id = %s
                        ORDER BY c.detected_at
                    """, (iid,))
                    insp['cracks'] = cracks
                    report = execute_query(conn, """
                        SELECT report_id, title, status
                        FROM reports
                        WHERE inspection_id = %s AND generated_by = %s
                        LIMIT 1
                    """, (iid, current_user['id']))
                    insp['report'] = report[0] if report else None
                else:
                    insp['inspector_name'] = 'Heritage Inspector'
                    insp['notes'] = None
                    insp['cracks'] = []
                    insp['report'] = None
            else:
                insp['inspector_name'] = 'Heritage Inspector'
                insp['notes'] = None
                insp['cracks'] = []
                insp['report'] = None

    else:
        # Minimal data only
        for insp in base:
            insp.pop('age_score', None)
            insp.pop('crack_score', None)
            insp['inspector_name'] = None
            insp['notes'] = None
            insp['cracks'] = []
            insp['report'] = None

    # Summary stats for all roles
    summary = execute_query(conn, """
        SELECT
          COUNT(*) AS total_inspections,
          MAX(i.inspection_date) AS last_inspection_date,
          MIN(i.inspection_date) AS first_inspection_date,
          AVG(vs.total_score) AS avg_score
        FROM inspections i
        LEFT JOIN vulnerability_scores vs
          ON vs.inspection_id = i.inspection_id
        WHERE i.monument_id = %s
    """, (monument_id,))

    # Score trend for sparkline (all roles)
    trend = execute_query(conn, """
        SELECT
          i.inspection_date,
          vs.total_score,
          vs.risk_level
        FROM inspections i
        JOIN vulnerability_scores vs
          ON vs.inspection_id = i.inspection_id
        WHERE i.monument_id = %s
        ORDER BY i.inspection_date ASC
        LIMIT 12
    """, (monument_id,))

    return {
        'role': role,
        'summary': summary[0] if summary else {},
        'trend': trend,
        'inspections': base,
    }

@router.get('/{monument_id}/image')
async def get_monument_image(monument_id: int, conn = Depends(get_db)):
    rows = execute_query(conn, "SELECT photo_blob, photo_mime_type FROM monuments WHERE monument_id = %s LIMIT 1", (monument_id,))
    if not rows or not rows[0]['photo_blob']:
        raise HTTPException(404, 'No photo found for this monument.')
    return Response(content=bytes(rows[0]['photo_blob']), media_type=rows[0]['photo_mime_type'] or 'image/jpeg')


@router.post('/')
async def create_monument(
    name: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    construction_year: Optional[int] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    category_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    conn = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN))
):
    content = None
    mime_type = None
    if file:
        content = await file.read()
        mime_type = file.content_type or 'image/jpeg'
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(413, 'File too large. Max 10MB.')

    monument_id = execute_write(conn, """
        INSERT INTO monuments 
          (name, location, description, construction_year, latitude, longitude, category_id, photo_blob, photo_mime_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (name, location, description, construction_year, latitude, longitude, category_id, content, mime_type))
    
    return {'message': 'Monument created', 'id': monument_id}


@router.put('/{monument_id}')
async def update_monument(
    monument_id: int,
    name: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    construction_year: Optional[int] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    category_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    conn = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN))
):
    # Retrieve existing to prevent 404
    rows = execute_query(conn, "SELECT monument_id FROM monuments WHERE monument_id = %s LIMIT 1", (monument_id,))
    if not rows:
        raise HTTPException(404, 'Monument not found.')

    if file:
        content = await file.read()
        mime_type = file.content_type or 'image/jpeg'
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(413, 'File too large. Max 10MB.')
            
        execute_write(conn, """
            UPDATE monuments 
            SET name = %s, location = %s, description = %s, 
                construction_year = %s, latitude = %s, longitude = %s, 
                category_id = %s, photo_blob = %s, photo_mime_type = %s
            WHERE monument_id = %s
        """, (name, location, description, construction_year, latitude, longitude, category_id, content, mime_type, monument_id))
    else:
        execute_write(conn, """
            UPDATE monuments 
            SET name = %s, location = %s, description = %s, 
                construction_year = %s, latitude = %s, longitude = %s, category_id = %s
            WHERE monument_id = %s
        """, (name, location, description, construction_year, latitude, longitude, category_id, monument_id))

    return {'message': 'Monument updated'}


@router.delete('/{monument_id}')
async def delete_monument(
    monument_id: int,
    conn = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN))
):
    rows = execute_query(conn, "SELECT monument_id FROM monuments WHERE monument_id = %s LIMIT 1", (monument_id,))
    if not rows:
        raise HTTPException(404, 'Monument not found.')
        
    try:
        execute_write(conn, "DELETE FROM monuments WHERE monument_id = %s", (monument_id,))
    except Exception as e:
        raise HTTPException(500, f'Error deleting monument (perhaps foreign key constraints?): {e}')
        
    return {'message': 'Monument deleted'}
