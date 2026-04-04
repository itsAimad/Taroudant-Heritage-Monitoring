from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..database import get_db, execute_query, execute_write
from ..dependencies import require_role
from ..models.user import UserRole

router = APIRouter(prefix='/admin', tags=['Admin'])

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
          (SELECT COUNT(*) FROM inspector_assignments
           WHERE status = 'pending')      AS assignments_pending,
          (SELECT COUNT(*) FROM inspector_assignments
           WHERE status = 'in_progress')  AS assignments_in_progress,
          (SELECT COUNT(*) FROM inspector_assignments
           WHERE status = 'completed')    AS assignments_completed,
          (SELECT COUNT(*) FROM notifications
           WHERE is_read = FALSE)    AS unread_alerts,
          (SELECT COUNT(*) FROM audit_logs
           WHERE performed_at >= DATE_SUB(NOW(),
             INTERVAL 24 HOUR))      AS logs_today
    """)
    return stats[0] if stats else {}


# Assignments logic moved to assignments.py
