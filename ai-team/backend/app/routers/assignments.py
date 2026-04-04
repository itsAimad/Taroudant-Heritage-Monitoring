from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime, timezone
from ..database import get_db, execute_query, execute_write
from ..models.assignment import AssignmentCreate, AssignmentStatusUpdate
from ..dependencies import get_current_user, require_admin

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: AssignmentCreate,
    conn = Depends(get_db),
    admin = Depends(require_admin)
):
    # Verify inspector exists and is actually an inspector
    inspector = execute_query(conn, "SELECT role_id FROM users WHERE id_user = %s", (data.inspector_id,))
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
        
    # verify role
    role = execute_query(conn, "SELECT role_name FROM roles WHERE role_id = %s", (inspector[0]['role_id'],))
    if role[0]['role_name'] != 'inspector':
        raise HTTPException(status_code=400, detail="Assigned user is not an inspector")

    # Insert assignment
    assignment_id = execute_write(conn, """
        INSERT INTO inspector_assignments (monument_id, inspector_id, assigned_by, notes, due_date)
        VALUES (%s, %s, %s, %s, %s)
    """, (data.monument_id, data.inspector_id, admin['id'], data.notes, data.due_date))

    # Trigger internal notification
    execute_write(conn, """
        INSERT INTO notifications (monument_id, recipient_id, message, severity, sent_at)
        VALUES (%s, %s, %s, 'info', %s)
    """, (data.monument_id, data.inspector_id, "You have been assigned a new inspection task.", datetime.now(timezone.utc)))
    
    # Audit trail
    execute_write(conn, """
        INSERT INTO audit_logs (user_id, action, target_table, target_id, details)
        VALUES (%s, 'ASSIGNMENT_CREATED', 'inspector_assignments', %s, %s)
    """, (admin['id'], assignment_id, f"Assigned monument {data.monument_id} to inspector {data.inspector_id}"))

    return {"message": "Assignment created successfully", "assignment_id": assignment_id}


@router.get("/")
async def list_assignments(
    conn = Depends(get_db),
    user = Depends(get_current_user)
):
    base_query = """
        SELECT a.*, m.name as monument_name, u.full_name as inspector_name, a2.full_name as assigned_by_name
        FROM inspector_assignments a
        JOIN monuments m ON a.monument_id = m.monument_id
        JOIN users u ON a.inspector_id = u.id_user
        JOIN users a2 ON a.assigned_by = a2.id_user
    """
    
    if user['role'] == 'admin':
        rows = execute_query(conn, base_query + " ORDER BY a.created_at DESC")
    elif user['role'] == 'inspector':
        rows = execute_query(conn, base_query + " WHERE a.inspector_id = %s ORDER BY a.created_at DESC", (user['id'],))
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return {"results": rows}

@router.put("/{assignment_id}/status")
async def update_assignment_status(
    assignment_id: int,
    data: AssignmentStatusUpdate,
    conn = Depends(get_db),
    user = Depends(get_current_user)
):
    assignment = execute_query(conn, "SELECT inspector_id FROM inspector_assignments WHERE assignment_id = %s", (assignment_id,))
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if user['role'] != 'admin' and user['id'] != assignment[0]['inspector_id']:
        raise HTTPException(status_code=403, detail="Not authorized to update this assignment")
        
    execute_write(conn, "UPDATE inspector_assignments SET status = %s WHERE assignment_id = %s", (data.status, assignment_id))
    
    return {"message": "Status updated successfully"}

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    conn = Depends(get_db),
    _admin = Depends(require_admin)
):
    execute_write(conn, "DELETE FROM inspector_assignments WHERE assignment_id = %s", (assignment_id,))
    return {"message": "Assignment deleted successfully"}
