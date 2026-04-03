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

    # UPDATE status from draft to pending if still draft
    if insp[0]['status'] == 'draft':
        execute_write(conn,
            "UPDATE inspections SET status = 'pending' WHERE inspection_id = %s",
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

    # Store the photo as BLOB with mime type
    execute_write(conn, """
        UPDATE cracks
        SET photo_blob = %s, photo_mime_type = %s
        WHERE crack_id = %s
    """, (content, file.content_type or 'image/jpeg', crack_id))

    return {
        'message':   'Photo uploaded and stored in database.',
        'crack_id':  crack_id,
        'file_size': len(content),
    }


@router.get('/{crack_id}/photos')
async def get_crack_photos(
    crack_id:    int,
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get photo metadata for a crack (blob available via /photo/{crack_id})."""
    rows = execute_query(conn, """
        SELECT c.crack_id,
               CASE WHEN c.photo_blob IS NOT NULL THEN 1 ELSE 0 END as has_photo,
               c.photo_mime_type as mime_type,
               LENGTH(c.photo_blob) as file_size,
               c.detected_at as uploaded_at
        FROM cracks c
        WHERE c.crack_id = %s
    """, (crack_id,))
    return {'count': len(rows), 'results': rows}


@router.get('/{crack_id}/image')
async def get_photo_data(
    crack_id:    int,
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve the photo blob for a specific crack."""
    rows = execute_query(conn, """
        SELECT c.photo_blob, c.photo_mime_type, i.inspector_id, i.monument_id
        FROM cracks c
        JOIN inspections i ON c.inspection_id = i.inspection_id
        WHERE c.crack_id = %s LIMIT 1
    """, (crack_id,))
    if not rows:
        raise HTTPException(404, 'Photo not found.')

    row = rows[0]
    if not row['photo_blob']:
        raise HTTPException(404, 'No photo uploaded for this crack.')

    return Response(
        content=bytes(row['photo_blob']),
        media_type=row['photo_mime_type'] or 'image/jpeg'
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
        SELECT c.crack_id, c.inspection_id, c.location_on_monument,
               c.severity, c.length_cm, c.detected_at,
               CASE WHEN c.photo_blob IS NOT NULL THEN 1 ELSE 0 END as has_photo,
               c.photo_mime_type
        FROM cracks c
        WHERE c.inspection_id = %s
        ORDER BY detected_at DESC
    """, (inspection_id,))

    # Build photo URLs pointing to the photo endpoint
    for r in rows:
        if r['has_photo']:
            # Return API endpoint URL that serves the blob
            r['photo_url'] = f"/api/cracks/{r['crack_id']}/image"
        else:
            r['photo_url'] = None
        # Remove internal columns from response
        del r['has_photo']
        del r['photo_mime_type']

    return {'count': len(rows), 'results': rows}
