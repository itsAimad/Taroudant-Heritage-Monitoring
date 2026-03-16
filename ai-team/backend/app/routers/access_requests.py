from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime, timezone
from ..database import get_db, execute_query, execute_write
from ..models.access_request import (
    AccessRequestCreate,
    AccessRequestResponse,
    ReviewRequest,
)
from ..dependencies import require_admin

router = APIRouter(prefix='/access-requests', tags=['Access Requests'])


@router.post('/', status_code=status.HTTP_201_CREATED)
async def submit_request(
    data: AccessRequestCreate,
    conn  = Depends(get_db)
):
    # Check for duplicate pending request
    existing = execute_query(
        conn,
        '''SELECT id FROM access_requests
           WHERE email = %s AND status = 'pending' LIMIT 1''',
        (data.email,)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='A pending request for this email already exists.'
        )

    req_id = execute_write(
        conn,
        '''INSERT INTO access_requests
           (full_name, email, organization, role, reason, status)
           VALUES (%s, %s, %s, %s, %s, 'pending')''',
        (data.full_name, data.email, data.organization,
         data.role, data.reason)
    )

    return {
        'message':    'Request submitted. Admin will review within 48 hours.',
        'request_id': req_id,
    }


@router.get('/')
async def list_requests(
    filter_status: Optional[str] = None,
    conn           = Depends(get_db),
    _admin         = Depends(require_admin)
):
    base_query = """
        SELECT
          ar.*,
          u.full_name AS reviewed_by_name
        FROM access_requests ar
        LEFT JOIN users u ON ar.reviewed_by_id = u.id_user
    """
    valid_statuses = ('pending', 'approved', 'rejected')

    if filter_status and filter_status in valid_statuses:
        rows = execute_query(
            conn,
            base_query + ' WHERE ar.status = %s ORDER BY ar.submitted_at DESC',
            (filter_status,)
        )
    else:
        rows = execute_query(
            conn,
            base_query + ' ORDER BY ar.submitted_at DESC'
        )

    return {'count': len(rows), 'results': rows}


@router.get('/pending-count')
async def pending_count(
    conn   = Depends(get_db),
    _admin = Depends(require_admin)
):
    rows = execute_query(
        conn,
        "SELECT COUNT(*) AS count FROM access_requests WHERE status = 'pending'"
    )
    return {'pending': rows[0]['count']}


@router.patch('/{request_id}/review')
async def review_request(
    request_id:   int,
    data:         ReviewRequest,
    conn          = Depends(get_db),
    current_admin = Depends(require_admin)
):
    rows = execute_query(
        conn,
        'SELECT * FROM access_requests WHERE id = %s LIMIT 1',
        (request_id,)
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Access request not found.'
        )

    req = rows[0]

    if req['status'] != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='This request has already been reviewed.'
        )

    execute_write(
        conn,
        '''UPDATE access_requests
           SET status         = %s,
               review_note    = %s,
               reviewed_at    = %s,
               reviewed_by_id = %s
           WHERE id = %s''',
        (
            data.status,
            data.review_note or '',
            datetime.now(timezone.utc),
            current_admin['id'],
            request_id,
        )
    )

    updated = execute_query(
        conn,
        'SELECT * FROM access_requests WHERE id = %s LIMIT 1',
        (request_id,)
    )
    return updated[0]
