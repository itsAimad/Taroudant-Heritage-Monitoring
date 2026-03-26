from fastapi import APIRouter, Depends
from ..database import get_db, execute_query, execute_write
from ..dependencies import require_role
from ..models.user import UserRole

router = APIRouter(
    prefix='/notifications', tags=['Notifications']
)

@router.get('/')
async def get_notifications(
    conn         = Depends(get_db),
    current_user = Depends(
        require_role(UserRole.AUTHORITY, UserRole.ADMIN)
    )
):
    rows = execute_query(conn, """
        SELECT
          n.*,
          m.name       AS monument_name,
          m.location   AS monument_location,
          m.latitude,
          m.longitude
        FROM notifications n
        LEFT JOIN monuments m ON n.monument_id = m.monument_id
        WHERE n.recipient_id = %s
        ORDER BY n.sent_at DESC
        LIMIT 50
    """, (current_user['id'],))

    unread = sum(1 for r in rows if not r['is_read'])
    return {
        'unread':  unread,
        'count':   len(rows),
        'results': rows
    }


@router.patch('/{notification_id}/read')
async def mark_read(
    notification_id: int,
    conn             = Depends(get_db),
    current_user     = Depends(
        require_role(UserRole.AUTHORITY, UserRole.ADMIN)
    )
):
    execute_write(conn, """
        UPDATE notifications
        SET is_read = TRUE
        WHERE notification_id = %s
          AND recipient_id = %s
    """, (notification_id, current_user['id']))
    return {'message': 'Notification marked as read.'}


@router.patch('/read-all')
async def mark_all_read(
    conn         = Depends(get_db),
    current_user = Depends(
        require_role(UserRole.AUTHORITY, UserRole.ADMIN)
    )
):
    execute_write(conn, """
        UPDATE notifications
        SET is_read = TRUE
        WHERE recipient_id = %s
    """, (current_user['id'],))
    return {'message': 'All notifications marked as read.'}
