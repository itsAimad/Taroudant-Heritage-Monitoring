from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import date
from pydantic import BaseModel
from ..database import get_db, execute_query, execute_write, call_procedure
from ..dependencies import get_current_user, require_role
from ..models.user import UserRole

router = APIRouter(prefix='/inspections', tags=['Inspections'])

class InspectionCreate(BaseModel):
    monument_id:       int
    inspection_date:   date
    notes:             Optional[str] = ''
    overall_condition: str = 'fair'

class InspectionEdit(BaseModel):
    notes:             Optional[str] = None
    overall_condition: Optional[str] = None


@router.get('/')
async def list_inspections(
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user['role'] == 'inspector':
        rows = execute_query(conn, """
            SELECT
              i.*,
              m.name       AS monument_name,
              m.location   AS monument_location,
              u.full_name  AS inspector_name,
              (SELECT COUNT(*) FROM cracks c
               WHERE c.inspection_id = i.inspection_id) AS crack_count,
              vs.total_score AS vulnerability_score,
              vs.risk_level
            FROM inspections i
            JOIN monuments m ON i.monument_id = m.monument_id
            JOIN users u     ON i.inspector_id = u.id_user
            LEFT JOIN vulnerability_scores vs
              ON vs.score_id = (
                SELECT score_id FROM vulnerability_scores
                WHERE inspection_id = i.inspection_id
                ORDER BY computed_at DESC LIMIT 1
              )
            WHERE i.inspector_id = %s
            ORDER BY i.inspection_date DESC
        """, (current_user['id'],))
    else:
        rows = execute_query(conn, """
            SELECT
              i.*,
              m.name       AS monument_name,
              m.location   AS monument_location,
              u.full_name  AS inspector_name,
              (SELECT COUNT(*) FROM cracks c
               WHERE c.inspection_id = i.inspection_id) AS crack_count,
              vs.total_score AS vulnerability_score,
              vs.risk_level
            FROM inspections i
            JOIN monuments m ON i.monument_id = m.monument_id
            JOIN users u     ON i.inspector_id = u.id_user
            LEFT JOIN vulnerability_scores vs
              ON vs.score_id = (
                SELECT score_id FROM vulnerability_scores
                WHERE inspection_id = i.inspection_id
                ORDER BY computed_at DESC LIMIT 1
              )
            ORDER BY i.inspection_date DESC
        """)
    return {'count': len(rows), 'results': rows}


@router.post('/', status_code=201)
async def create_inspection(
    data:        InspectionCreate,
    conn         = Depends(get_db),
    current_user = Depends(require_role(UserRole.INSPECTOR, UserRole.ADMIN))
):
    mon = execute_query(conn,
        'SELECT monument_id FROM monuments WHERE monument_id = %s',
        (data.monument_id,))
    if not mon:
        raise HTTPException(404, 'Monument not found.')

    inspection_id = execute_write(conn, """
        INSERT INTO inspections
          (monument_id, inspector_id, inspection_date,
           notes, overall_condition, status)
        VALUES (%s, %s, %s, %s, %s, 'pending')
    """, (
        data.monument_id, current_user['id'],
        data.inspection_date, data.notes, data.overall_condition,
    ))
    return {'message': 'Inspection created.', 'inspection_id': inspection_id, 'id': inspection_id}


@router.get('/{inspection_id}')
async def get_inspection(
    inspection_id: int,
    conn           = Depends(get_db),
    current_user   = Depends(get_current_user)
):
    rows = execute_query(conn, """
        SELECT
          i.*,
          m.name         AS monument_name,
          m.location     AS monument_location,
          m.latitude,
          m.longitude,
          u.full_name    AS inspector_name,
          vs.total_score AS vulnerability_score,
          vs.risk_level,
          vs.age_score,
          vs.crack_score
        FROM inspections i
        JOIN monuments m ON i.monument_id = m.monument_id
        JOIN users u     ON i.inspector_id = u.id_user
        LEFT JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id FROM vulnerability_scores
            WHERE inspection_id = i.inspection_id
            ORDER BY computed_at DESC LIMIT 1
          )
        WHERE i.inspection_id = %s
        LIMIT 1
    """, (inspection_id,))

    if not rows:
        raise HTTPException(404, 'Inspection not found.')

    inspection = rows[0]
    if (current_user['role'] == 'inspector' and
        inspection['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    cracks = execute_query(conn, """
        SELECT
          crack_id, inspection_id, location_on_monument,
          severity, length_cm, detected_at
        FROM cracks
        WHERE inspection_id = %s
        ORDER BY detected_at DESC
    """, (inspection_id,))

    # Add photo_url for each crack (served via dedicated blob endpoint)
    for c in cracks:
        c['photo_url'] = f"/api/cracks/{c['crack_id']}/image"

    inspection['cracks'] = cracks
    return inspection


@router.patch('/{inspection_id}')
async def edit_inspection(
    inspection_id: int,
    data:          InspectionEdit,
    conn           = Depends(get_db),
    current_user   = Depends(require_role(UserRole.INSPECTOR, UserRole.ADMIN))
):
    rows = execute_query(conn,
        'SELECT * FROM inspections WHERE inspection_id = %s LIMIT 1',
        (inspection_id,))
    if not rows:
        raise HTTPException(404, 'Inspection not found.')
    insp = rows[0]
    if (current_user['role'] == 'inspector' and
        insp['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')
    if insp['status'] == 'completed':
        raise HTTPException(400, 'Cannot edit a completed inspection.')

    updates = {}
    if data.notes is not None:
        updates['notes'] = data.notes
    if data.overall_condition is not None:
        updates['overall_condition'] = data.overall_condition
    if not updates:
        return {'message': 'Nothing to update.'}

    set_clause = ', '.join(f"{k} = %s" for k in updates)
    execute_write(conn,
        f'UPDATE inspections SET {set_clause} WHERE inspection_id = %s',
        (*updates.values(), inspection_id))
    return {'message': 'Inspection updated.'}


@router.patch('/{inspection_id}/complete')
async def complete_inspection(
    inspection_id: int,
    conn           = Depends(get_db),
    current_user   = Depends(require_role(UserRole.INSPECTOR, UserRole.ADMIN))
):
    """Mark inspection as completed (final step of inspector workflow)."""
    rows = execute_query(conn,
        'SELECT * FROM inspections WHERE inspection_id = %s LIMIT 1',
        (inspection_id,))
    if not rows:
        raise HTTPException(404, 'Inspection not found.')
    insp = rows[0]
    if (current_user['role'] == 'inspector' and
        insp['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')
    if insp['status'] == 'completed':
        return {'message': 'Already completed.'}

    # 1. Explicitly call scoring procedure one final time
    try:
        call_procedure(conn, 'CalculateVulnerabilityScore', (inspection_id,))
    except Exception as e:
        # If it fails, we still want to complete if cracks exist, but scoring is critical
        print(f"Scoring procedure failed: {e}")

    # 2. Set status to completed
    execute_write(conn,
        "UPDATE inspections SET status = 'completed' WHERE inspection_id = %s",
        (inspection_id,))

    # 3. Get latest score to check risk level
    score_rows = execute_query(conn, """
        SELECT total_score, risk_level
        FROM vulnerability_scores
        WHERE inspection_id = %s
        ORDER BY computed_at DESC LIMIT 1
    """, (inspection_id,))
    
    score = score_rows[0] if score_rows else {'total_score': 0, 'risk_level': 'low'}
    risk = score['risk_level']

    # 4. Handle notifications
    # Note: Trigger 'after_score_insert' already handles HIGH and CRITICAL.
    # We only handle LOW and MEDIUM here to ensure ALL authorities are notified for every inspection.
    notified_count = 0
    if risk in ('low', 'medium'):
        authorities = execute_query(conn, """
            SELECT u.id_user FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE r.role_name = 'authority' AND u.is_active = TRUE
        """)
        
        mon_name = execute_query(conn,
            'SELECT name FROM monuments WHERE monument_id = %s',
            (insp['monument_id'],))
        monument_name = mon_name[0]['name'] if mon_name else 'Unknown'

        msg = (
            f"Inspection completed for {monument_name}. "
            f"Vulnerability score: {score['total_score']}/100 ({risk.upper()} risk). "
            f"Inspector: {current_user['full_name']}."
        )
        
        severity = 'info' if risk == 'low' else 'warning'
        
        for auth in authorities:
            execute_write(conn, """
                INSERT INTO notifications
                  (monument_id, triggered_by_inspection, recipient_id, message, severity)
                VALUES (%s, %s, %s, %s, %s)
            """, (insp['monument_id'], inspection_id, auth['id_user'], msg, severity))
            notified_count += 1

    return {
        'message':  'Inspection marked as completed.',
        'notified': notified_count,
        'risk_level': risk,
        'total_score': score['total_score']
    }


@router.patch('/{inspection_id}/acknowledge')
async def acknowledge_inspection(
    inspection_id: int,
    conn           = Depends(get_db),
    current_user   = Depends(require_role(UserRole.AUTHORITY, UserRole.ADMIN))
):
    """Authority acknowledges they have seen the critical alert/inspection."""
    rows = execute_query(conn,
        'SELECT * FROM inspections WHERE inspection_id = %s LIMIT 1',
        (inspection_id,))
    if not rows:
        raise HTTPException(404, 'Inspection not found.')
    
    # 1. Update inspection status
    execute_write(conn,
        "UPDATE inspections SET status = 'acknowledged' WHERE inspection_id = %s",
        (inspection_id,))
    
    # 2. Automate report validation if report exists
    # We set status to 'validated', record the validator (authority), and set the timestamp.
    execute_write(conn, """
        UPDATE reports 
        SET status = 'validated', 
            validated_by = %s, 
            validated_at = NOW() 
        WHERE inspection_id = %s AND status = 'final'
    """, (current_user['id'], inspection_id))
    
    # 3. Mark related notifications as read for this authority
    execute_write(conn,
        "UPDATE notifications SET is_read = TRUE WHERE triggered_by_inspection = %s AND recipient_id = %s",
        (inspection_id, current_user['id']))

    return {'message': 'Inspection acknowledged.'}


@router.get('/{inspection_id}/detail')
async def get_inspection_detail(
    inspection_id: int,
    conn           = Depends(get_db),
    current_user   = Depends(get_current_user)
):
    """Full inspection detail: cracks with photo counts + latest report."""
    rows = execute_query(conn, """
        SELECT
          i.*,
          m.name         AS monument_name,
          m.location     AS monument_location,
          m.latitude,
          m.longitude,
          m.construction_year,
          u.full_name    AS inspector_name,
          vs.total_score AS vulnerability_score,
          vs.risk_level,
          vs.age_score,
          vs.crack_score,
          vs.computed_at AS score_computed_at
        FROM inspections i
        JOIN monuments m
          ON i.monument_id = m.monument_id
        JOIN users u
          ON i.inspector_id = u.id_user
        LEFT JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id FROM vulnerability_scores
            WHERE inspection_id = i.inspection_id
            ORDER BY computed_at DESC LIMIT 1
          )
        WHERE i.inspection_id = %s
        LIMIT 1
    """, (inspection_id,))

    if not rows:
        raise HTTPException(404, 'Inspection not found.')

    insp = rows[0]

    # Role check
    if (current_user['role'] == 'inspector'
            and insp['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    # Fetch cracks — photo stored directly as photo_blob on the crack row
    cracks = execute_query(conn, """
        SELECT
          crack_id,
          inspection_id,
          location_on_monument,
          severity,
          length_cm,
          detected_at,
          CASE WHEN photo_blob IS NOT NULL THEN 1 ELSE 0 END AS photo_count
        FROM cracks
        WHERE inspection_id = %s
        ORDER BY detected_at ASC
    """, (inspection_id,))

    # Fetch latest report for this inspection
    report_rows = execute_query(conn, """
        SELECT
          r.report_id, r.title, r.risk_level,
          r.total_score, r.status, r.created_at,
          r.validated_by, r.validated_at,
          u.full_name AS validated_by_name
        FROM reports r
        LEFT JOIN users u ON r.validated_by = u.id_user
        WHERE r.inspection_id = %s
        ORDER BY r.created_at DESC
        LIMIT 1
    """, (inspection_id,))

    insp['cracks'] = cracks
    insp['report'] = report_rows[0] if report_rows else None
    return insp


@router.patch('/{inspection_id}/submit')
async def submit_inspection(
    inspection_id: int,
    conn           = Depends(get_db),
    current_user   = Depends(require_role(UserRole.INSPECTOR, UserRole.ADMIN))
):
    """Inspector submits the inspection for authority review."""
    rows = execute_query(conn,
        'SELECT * FROM inspections WHERE inspection_id = %s LIMIT 1',
        (inspection_id,))
    if not rows:
        raise HTTPException(404, 'Inspection not found.')
    insp = rows[0]
    if (current_user['role'] == 'inspector' and
            insp['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    execute_write(conn,
        "UPDATE inspections SET status = 'submitted' WHERE inspection_id = %s",
        (inspection_id,))
    return {'message': 'Inspection submitted for review.'}

