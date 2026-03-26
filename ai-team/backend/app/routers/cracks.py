from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional
from pydantic import BaseModel
from ..database import get_db, execute_query, execute_write
from ..dependencies import get_current_user, require_role
from ..models.user import UserRole

router = APIRouter(prefix='/cracks', tags=['Cracks'])

class CrackCreate(BaseModel):
    inspection_id:        int
    location_on_monument: str
    severity:             str  # minor|moderate|major|critical
    length_cm:            Optional[float] = None

@router.post('/', status_code=201)
async def log_crack(
    data:         CrackCreate,
    conn          = Depends(get_db),
    current_user  = Depends(
        require_role(UserRole.INSPECTOR, UserRole.ADMIN)
    )
):
    valid = ['minor','moderate','major','critical']
    if data.severity not in valid:
        raise HTTPException(422,
            f'severity must be one of {valid}')

    insp = execute_query(conn,
        "SELECT * FROM inspections WHERE inspection_id = %s LIMIT 1",
        (data.inspection_id,))
    if not insp:
        raise HTTPException(404, 'Inspection not found.')
    if (current_user['role'] == 'inspector' and
        insp[0]['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    # UPDATE status from draft to in_progress if still draft
    if insp[0]['status'] == 'draft':
        execute_write(conn,
            "UPDATE inspections SET status = 'in_progress' WHERE inspection_id = %s",
            (data.inspection_id,))

    # INSERT crack — triggers CalculateVulnerabilityScore
    crack_id = execute_write(conn, """
        INSERT INTO cracks
          (inspection_id, location_on_monument, severity, length_cm)
        VALUES (%s, %s, %s, %s)
    """, (
        data.inspection_id,
        data.location_on_monument,
        data.severity,
        data.length_cm,
    ))

    # Fetch updated vulnerability score
    score = execute_query(conn, """
        SELECT vs.*
        FROM vulnerability_scores vs
        WHERE vs.inspection_id = %s
        ORDER BY vs.computed_at DESC
        LIMIT 1
    """, (data.inspection_id,))

    return {
        'message':  'Crack logged. Vulnerability score updated.',
        'crack_id': crack_id,
        'score':    score[0] if score else None,
    }


@router.post('/{crack_id}/photo', status_code=201)
async def upload_crack_photo(
    crack_id:    int,
    file:        UploadFile = File(...),
    caption:     str        = Form(default=''),
    conn         = Depends(get_db),
    current_user = Depends(
        require_role(UserRole.INSPECTOR, UserRole.ADMIN)
    )
):
    allowed = ['image/jpeg','image/png','image/heic','image/webp']
    if file.content_type not in allowed:
        raise HTTPException(422,
            f'File type not allowed. Use: {allowed}')

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, 'File too large. Max 10MB.')

    crack_rows = execute_query(conn, """
        SELECT c.*, i.inspector_id
        FROM cracks c
        JOIN inspections i ON c.inspection_id = i.inspection_id
        WHERE c.crack_id = %s LIMIT 1
    """, (crack_id,))
    if not crack_rows:
        raise HTTPException(404, 'Crack not found.')
    if (current_user['role'] == 'inspector' and
        crack_rows[0]['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    photo_id = execute_write(conn, """
        INSERT INTO crack_photos
          (crack_id, photo_data, mime_type, file_size, caption)
        VALUES (%s, %s, %s, %s, %s)
    """, (crack_id, content, file.content_type, len(content), caption))

    return {
        'message':   'Photo uploaded.',
        'photo_id':  photo_id,
        'file_size': len(content),
    }


@router.get('/{crack_id}/photos')
async def get_crack_photos(
    crack_id:    int,
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rows = execute_query(conn, """
        SELECT photo_id, mime_type, file_size, caption, uploaded_at
        FROM crack_photos
        WHERE crack_id = %s
        ORDER BY uploaded_at ASC
    """, (crack_id,))
    return {'count': len(rows), 'results': rows}


@router.get('/photo/{photo_id}')
async def get_photo_data(
    photo_id:    int,
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rows = execute_query(conn, """
        SELECT photo_data, mime_type
        FROM crack_photos
        WHERE photo_id = %s LIMIT 1
    """, (photo_id,))
    if not rows:
        raise HTTPException(404, 'Photo not found.')
    return Response(
        content=bytes(rows[0]['photo_data']),
        media_type=rows[0]['mime_type']
    )


@router.get('/inspection/{inspection_id}')
async def get_cracks_for_inspection(
    inspection_id: int,
    conn           = Depends(get_db),
    current_user   = Depends(get_current_user)
):
    insp = execute_query(conn,
        'SELECT * FROM inspections WHERE inspection_id = %s',
        (inspection_id,))
    if not insp:
        raise HTTPException(404, 'Inspection not found.')
    if (current_user['role'] == 'inspector' and
        insp[0]['inspector_id'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    rows = execute_query(conn, """
        SELECT c.*,
          (SELECT COUNT(*) FROM crack_photos cp WHERE cp.crack_id = c.crack_id) AS photo_count
        FROM cracks c
        WHERE c.inspection_id = %s
        ORDER BY detected_at DESC
    """, (inspection_id,))
    return {'count': len(rows), 'results': rows}
