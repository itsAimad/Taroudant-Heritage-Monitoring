import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Optional
from datetime import datetime, timedelta, timezone
from ..database import get_db, execute_query, execute_write
from ..models.access_request import (
    AccessRequestCreate,
    AccessRequestResponse,
    ReviewRequest,
)
from ..dependencies import require_admin
from ..services.email_service import send_approval_email, send_rejection_email

router = APIRouter(prefix='/access-requests', tags=['Access Requests'])


@router.post('/', status_code=status.HTTP_201_CREATED)
async def submit_request(
    data: AccessRequestCreate,
    conn  = Depends(get_db)
):
    # 1. Validate role_id is 2 or 3 only
    if data.requested_role_id not in (2, 3):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid role requested. Only Inspector (2) or Authority (3) roles can be requested.'
        )

    # 2. Check if email already exists in users table
    user_exists = execute_query(
        conn,
        "SELECT id_user FROM users WHERE email = %s LIMIT 1",
        (data.email,)
    )
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # 3. Check for duplicate pending request
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

    # 4. INSERT into access_requests
    req_id = execute_write(
        conn,
        '''INSERT INTO access_requests
           (full_name, email, phone, organization, requested_role_id, reason, status)
           VALUES (%s, %s, %s, %s, %s, %s, 'pending')''',
        (data.full_name, data.email, data.phone, data.organization,
         data.requested_role_id, data.reason)
    )

    # 5. INSERT into audit_logs
    execute_write(
        conn,
        '''INSERT INTO audit_logs (action, target_table, target_id, details)
           VALUES ('ACCESS_REQUEST_SUBMITTED', 'access_requests', %s, %s)''',
        (req_id, f"Request from {data.email} for role_id {data.requested_role_id}")
    )

    return {
        'message':    'Request submitted successfully. You will receive an email when reviewed.',
        'request_id': req_id,
    }


@router.get('/')
async def list_requests(
    status: Optional[str] = None,
    conn           = Depends(get_db),
    _admin         = Depends(require_admin)
):
    base_query = """
        SELECT
          ar.*,
          r.role_name,
          u.full_name AS reviewed_by_name
        FROM access_requests ar
        JOIN roles r ON ar.requested_role_id = r.role_id
        LEFT JOIN users u ON ar.reviewed_by_id = u.id_user
    """
    valid_statuses = ('pending', 'approved', 'rejected')

    if status and status in valid_statuses:
        rows = execute_query(
            conn,
            base_query + ' WHERE ar.status = %s ORDER BY ar.submitted_at DESC',
            (status,)
        )
    else:
        rows = execute_query(
            conn,
            base_query + ' ORDER BY ar.submitted_at DESC'
        )

    return {'count': len(rows), 'results': rows}


@router.post('/{request_id}/approve')
async def approve_request(
    request_id:      int,
    data:            ReviewRequest,
    background_tasks: BackgroundTasks,
    conn             = Depends(get_db),
    current_admin    = Depends(require_admin)
):
    # 1. Verify request is pending
    rows = execute_query(
        conn,
        'SELECT * FROM access_requests WHERE id = %s LIMIT 1',
        (request_id,)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req = rows[0]
    if req['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Request already reviewed")

    # 2. Check email not already in users table
    user_exists = execute_query(conn, "SELECT id_user FROM users WHERE email = %s LIMIT 1", (req['email'],))
    if user_exists:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    # 3. Generate secure token
    token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(hours=48)

    # 4. Create placeholder user account
    execute_write(
        conn,
        '''INSERT INTO users (full_name, email, password_hash, role_id, organization, phone, completion_token, completion_token_expiry, is_active)
           VALUES (%s, %s, '', %s, %s, %s, %s, %s, FALSE)''',
        (req['full_name'], req['email'], req['requested_role_id'], req['organization'], req['phone'], token, expiry)
    )

    # 5. UPDATE access_requests
    review_note = data.review_note or ''
    execute_write(
        conn,
        '''UPDATE access_requests
           SET status = 'approved', reviewed_by_id = %s, reviewed_at = %s, review_note = %s
           WHERE id = %s''',
        (current_admin['id'], datetime.now(timezone.utc), review_note, request_id)
    )

    # 6. Notify user via email (Background)
    background_tasks.add_task(send_approval_email, req['email'], req['full_name'], token)

    # 7. Log to audit_logs
    execute_write(
        conn,
        "INSERT INTO audit_logs (action, details) VALUES ('ACCESS_REQUEST_APPROVED', %s)",
        (f"Approved by admin {current_admin['id']} for {req['email']}",)
    )

    return {"message": "Request approved and email sent."}


@router.post('/{request_id}/reject')
async def reject_request(
    request_id:      int,
    data:            ReviewRequest,
    background_tasks: BackgroundTasks,
    conn             = Depends(get_db),
    current_admin    = Depends(require_admin)
):
    # 1. Verify request is pending
    rows = execute_query(
        conn,
        'SELECT * FROM access_requests WHERE id = %s LIMIT 1',
        (request_id,)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req = rows[0]
    if req['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Request already reviewed")

    # 2. UPDATE access_requests
    # Force check for review_note on rejection since Pydantic validator might be skipped if status is omitted in body
    review_note = data.review_note
    if not review_note or not review_note.strip():
        raise HTTPException(status_code=400, detail="Review note is required when rejecting a request")

    execute_write(
        conn,
        '''UPDATE access_requests
           SET status = 'rejected', reviewed_by_id = %s, reviewed_at = %s, review_note = %s
           WHERE id = %s''',
        (current_admin['id'], datetime.now(timezone.utc), review_note, request_id)
    )

    # 3. Notify user via email (Background)
    background_tasks.add_task(send_rejection_email, req['email'], req['full_name'], data.review_note)

    # 4. Log to audit_logs
    execute_write(
        conn,
        "INSERT INTO audit_logs (action, details) VALUES ('ACCESS_REQUEST_REJECTED', %s)",
        (f"Rejected by admin {current_admin['id']}. Reason: {data.review_note}",)
    )

    return {"message": "Request rejected and user notified."}
