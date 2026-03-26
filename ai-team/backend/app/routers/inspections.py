from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import date
from pydantic import BaseModel
from ..database import get_db, execute_query, execute_write
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

    cracks = execute_query(conn,
        'SELECT * FROM cracks WHERE inspection_id = %s ORDER BY detected_at DESC',
        (inspection_id,))
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

    # Get latest score so we can include risk in the notification
    score = execute_query(conn, """
        SELECT vs.total_score, vs.risk_level
        FROM vulnerability_scores vs
        WHERE vs.inspection_id = %s
        ORDER BY vs.computed_at DESC LIMIT 1
    """, (inspection_id,))

    execute_write(conn,
        "UPDATE inspections SET status = 'completed' WHERE inspection_id = %s",
        (inspection_id,))

    # Notify authorities that a new inspection was completed
    authorities = execute_query(conn, """
        SELECT u.id_user FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'authority' AND u.is_active = TRUE
    """)

    mon_name = execute_query(conn,
        'SELECT name FROM monuments WHERE monument_id = %s',
        (insp['monument_id'],))
    monument_name = mon_name[0]['name'] if mon_name else 'Unknown'

    risk  = score[0]['risk_level'] if score else 'unknown'
    total = score[0]['total_score'] if score else 0
    severity = ('critical' if risk == 'critical' else
                'high'     if risk == 'high'     else
                'warning'  if risk == 'medium'   else 'info')
    msg = (
        f"Inspection completed for {monument_name}. "
        f"Vulnerability score: {total}/100 ({risk.upper()} risk). "
        f"Inspector: {current_user['full_name']}. Please review."
    )
    for auth in authorities:
        execute_write(conn, """
            INSERT INTO notifications
              (monument_id, triggered_by_inspection,
               recipient_id, message, severity)
            VALUES (%s, %s, %s, %s, %s)
        """, (insp['monument_id'], inspection_id,
               auth['id_user'], msg, severity))

    return {
        'message':  'Inspection marked as completed. Authorities notified.',
        'notified': len(authorities)
    }
