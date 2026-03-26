from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..database import get_db, execute_query, execute_write
from ..dependencies import require_role
from ..models.user import UserRole

router = APIRouter(prefix='/admin', tags=['Admin'])

class AssignmentCreate(BaseModel):
    inspector_id: int
    monument_id:  int
    notes:        Optional[str] = ''

@router.get('/audit-logs')
async def get_audit_logs(
    conn   = Depends(get_db),
    _admin = Depends(require_role(UserRole.ADMIN))
):
    rows = execute_query(conn, """
        SELECT
          al.*,
          u.full_name AS user_name,
          u.email     AS user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id_user
        ORDER BY al.performed_at DESC
        LIMIT 100
    """)
    return {'count': len(rows), 'results': rows}


@router.get('/stats')
async def get_admin_stats(
    conn   = Depends(get_db),
    _admin = Depends(require_role(UserRole.ADMIN))
):
    stats = execute_query(conn, """
        SELECT
          (SELECT COUNT(*) FROM users
           WHERE is_active = TRUE)   AS active_users,
          (SELECT COUNT(*) FROM users
           WHERE role_id = (
             SELECT role_id FROM roles
             WHERE role_name = 'inspector'))
                                     AS inspectors,
          (SELECT COUNT(*) FROM users
           WHERE role_id = (
             SELECT role_id FROM roles
             WHERE role_name = 'authority'))
                                     AS authorities,
          (SELECT COUNT(*) FROM access_requests
           WHERE status = 'pending') AS pending_requests,
          (SELECT COUNT(*) FROM monuments) AS monuments,
          (SELECT COUNT(*) FROM inspections
           WHERE status = 'in_progress')  AS active_inspections,
          (SELECT COUNT(*) FROM notifications
           WHERE is_read = FALSE)    AS unread_alerts,
          (SELECT COUNT(*) FROM audit_logs
           WHERE performed_at >= DATE_SUB(NOW(),
             INTERVAL 24 HOUR))      AS logs_today
    """)
    return stats[0] if stats else {}


@router.get('/assignments')
async def list_assignments(
    conn   = Depends(get_db),
    _admin = Depends(require_role(UserRole.ADMIN))
):
    rows = execute_query(conn, """
        SELECT
          u.id_user    AS inspector_id,
          u.full_name  AS inspector_name,
          u.email      AS inspector_email,
          m.monument_id,
          m.name       AS monument_name,
          m.location,
          m.status     AS monument_status,
          (SELECT COUNT(*) FROM inspections i
           WHERE i.inspector_id = u.id_user
             AND i.monument_id  = m.monument_id)
                       AS inspection_count
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        CROSS JOIN monuments m
        WHERE r.role_name = 'inspector'
          AND u.is_active = TRUE
        ORDER BY u.full_name, m.name
    """)
    return {'count': len(rows), 'results': rows}
