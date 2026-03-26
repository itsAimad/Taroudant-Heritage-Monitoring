from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Literal
from pydantic import BaseModel
from ..database import get_db, execute_query, call_procedure, execute_write
from ..dependencies import get_current_user, require_role
from ..models.user import UserRole

router = APIRouter(prefix='/reports', tags=['Reports'])

class ReportCreate(BaseModel):
    monument_id:   int
    inspection_id: int
    title:         str

class ReportValidation(BaseModel):
    status:          Literal['validated', 'disputed']
    validation_note: Optional[str] = ''

@router.post('/', status_code=201)
async def generate_report(
    data:         ReportCreate,
    conn          = Depends(get_db),
    current_user  = Depends(
        require_role(UserRole.INSPECTOR, UserRole.ADMIN)
    )
):
    try:
        call_procedure(conn,
            'GenerateMonumentReport',
            (data.monument_id, data.inspection_id, current_user['id'])
        )
        conn.commit()
    except Exception as e:
        raise HTTPException(500,
            f'Report generation failed: {str(e)}')

    reports = execute_query(conn, """
        SELECT
          r.*,
          m.name       AS monument_name,
          u.full_name  AS generated_by_name
        FROM reports r
        JOIN monuments m ON r.monument_id = m.monument_id
        JOIN users u     ON r.generated_by = u.id_user
        WHERE r.inspection_id = %s
        ORDER BY r.created_at DESC
        LIMIT 1
    """, (data.inspection_id,))

    return {
        'message': 'Report generated and encrypted.',
        'report':  reports[0] if reports else None,
    }


@router.get('/')
async def list_reports(
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user['role'] == 'inspector':
        rows = execute_query(conn, """
            SELECT
              r.report_id, r.title, r.risk_level,
              r.total_score, r.status, r.created_at,
              m.name      AS monument_name,
              u.full_name AS generated_by_name
            FROM reports r
            JOIN monuments m ON r.monument_id = m.monument_id
            JOIN users u     ON r.generated_by = u.id_user
            WHERE r.generated_by = %s
            ORDER BY r.created_at DESC
        """, (current_user['id'],))
    else:
        rows = execute_query(conn, """
            SELECT
              r.report_id, r.title, r.risk_level,
              r.total_score, r.status, r.created_at,
              r.validated_by, r.validated_at, r.validation_note,
              m.name      AS monument_name,
              u.full_name AS generated_by_name,
              vu.full_name AS validated_by_name
            FROM reports r
            JOIN monuments m ON r.monument_id = m.monument_id
            JOIN users u     ON r.generated_by = u.id_user
            LEFT JOIN users vu ON r.validated_by = vu.id_user
            ORDER BY r.created_at DESC
        """)
    return {'count': len(rows), 'results': rows}


@router.patch('/{report_id}/validate')
async def validate_report(
    report_id:   int,
    data:        ReportValidation,
    conn         = Depends(get_db),
    current_user = Depends(
        require_role(UserRole.AUTHORITY, UserRole.ADMIN)
    )
):
    rows = execute_query(conn,
        'SELECT * FROM reports WHERE report_id = %s LIMIT 1',
        (report_id,))
    if not rows:
        raise HTTPException(404, 'Report not found.')
    if rows[0]['status'] in ('validated', 'disputed', 'archived'):
        raise HTTPException(400,
            'Report cannot be validated in its current state.')

    execute_write(conn, """
        UPDATE reports
        SET status          = %s,
            validated_by    = %s,
            validated_at    = NOW(),
            validation_note = %s
        WHERE report_id = %s
    """, (data.status, current_user['id'],
           data.validation_note, report_id))

    execute_write(conn, """
        INSERT INTO audit_logs
          (user_id, action, target_table, target_id, details)
        VALUES (%s, %s, 'reports', %s, %s)
    """, (current_user['id'], 'REPORT_VALIDATED', report_id,
           f"Status set to {data.status} by {current_user['full_name']}"))

    return {
        'message':   f'Report {data.status} successfully.',
        'report_id': report_id,
    }
