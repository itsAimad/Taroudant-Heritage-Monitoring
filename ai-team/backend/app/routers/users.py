from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from ..database import get_db
from ..models.user import UserCreate, UserResponse
from ..services.user_service import (
    create_user, get_all_users, deactivate_user, update_user_fields,
    get_user_by_id, get_user_by_email
)
from ..models.user_update import UserUpdate
from ..dependencies import require_admin, get_current_user

router = APIRouter(prefix='/users', tags=['User Management'])


@router.post('/', response_model=UserResponse,
             status_code=status.HTTP_201_CREATED)
async def create_new_user(
    data:  UserCreate,
    conn   = Depends(get_db),
    _admin = Depends(require_admin)
):
    if get_user_by_email(conn, data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f'User with email {data.email} already exists.'
        )

    user_id = create_user(conn, data.model_dump())
    user    = get_user_by_id(conn, user_id)
    return user


@router.get('/')
async def list_users(
    role:   Optional[str] = None,
    conn    = Depends(get_db),
    _admin  = Depends(require_admin)
):
    users = get_all_users(conn, role)
    return {
        'count':   len(users),
        'results': users
    }


@router.patch('/{user_id}/deactivate')
async def deactivate(
    user_id:      int,
    conn          = Depends(get_db),
    current_user  = Depends(require_admin)
):
    if user_id == current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='You cannot deactivate your own account.'
        )

    user = get_user_by_id(conn, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.'
        )

    deactivate_user(conn, user_id)
    return {'message': f"User {user['email']} deactivated."}

@router.patch('/{user_id}')
async def modify_user(
    user_id: int,
    data: UserUpdate,
    conn = Depends(get_db),
    _admin = Depends(require_admin)
):
    user = get_user_by_id(conn, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    updated = update_user_fields(conn, user_id, data.model_dump(exclude_unset=True))
    return {"message": "User updated successfully"}
