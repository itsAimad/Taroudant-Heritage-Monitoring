from typing import Optional
from ..database import execute_query, execute_write
from ..services.auth_service import hash_password, verify_password


# ─── Base SELECT used everywhere ───────────────────
# Joins roles table to expose role_name as 'role'
# All returned dicts will have a 'role' key with the
# string value: 'admin' | 'inspector' | 'authority'
_USER_SELECT = """
    SELECT
      u.id_user        AS id,
      u.email,
      u.full_name,
      u.organization,
      u.is_active,
      u.created_at,
      u.last_login,
      r.role_name      AS role
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
"""


def get_user_by_email(conn, email: str) -> Optional[dict]:
    rows = execute_query(
        conn,
        _USER_SELECT + """
          WHERE u.email = %s
          LIMIT 1
        """,
        (email,)
    )
    return rows[0] if rows else None


def get_user_by_id(conn, user_id: int) -> Optional[dict]:
    rows = execute_query(
        conn,
        _USER_SELECT + """
          WHERE u.id_user = %s
          LIMIT 1
        """,
        (user_id,)
    )
    return rows[0] if rows else None


def authenticate_user(
    conn, email: str, password: str
) -> Optional[dict]:
    # Fetch the full user row including password_hash
    rows = execute_query(
        conn,
        """
        SELECT
          u.id_user        AS id,
          u.email,
          u.full_name,
          u.organization,
          u.is_active,
          u.created_at,
          u.last_login,
          u.password_hash,
          r.role_name      AS role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.email = %s
        LIMIT 1
        """,
        (email,)
    )
    if not rows:
        return None
    user = rows[0]
    if not user.get('is_active'):
        return None
    if not verify_password(password, user['password_hash']):
        return None
    # Remove password_hash before returning to caller
    user.pop('password_hash', None)
    return user


def create_user(conn, data: dict) -> int:
    # Step 1: resolve role_name → role_id
    role_rows = execute_query(
        conn,
        'SELECT role_id FROM roles WHERE role_name = %s LIMIT 1',
        (data['role'],)
    )
    if not role_rows:
        raise ValueError(f"Role '{data['role']}' not found in roles table")
    role_id = role_rows[0]['role_id']

    # Step 2: insert user with the resolved role_id
    user_id = execute_write(
        conn,
        """
        INSERT INTO users
          (email, password_hash, full_name, organization,
           role_id, is_active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
        """,
        (
            data['email'],
            hash_password(data['password']),
            data['full_name'],
            data.get('organization', ''),
            role_id,
        )
    )
    return user_id


def update_last_login(conn, user_id: int):
    execute_write(
        conn,
        """
        UPDATE users
        SET last_login = NOW()
        WHERE id_user = %s
        """,
        (user_id,)
    )


def get_all_users(conn, role: str = None) -> list:
    if role:
        return execute_query(
            conn,
            _USER_SELECT + """
              WHERE r.role_name = %s
              ORDER BY u.created_at DESC
            """,
            (role,)
        )
    return execute_query(
        conn,
        _USER_SELECT + " ORDER BY u.created_at DESC"
    )


def deactivate_user(conn, user_id: int):
    execute_write(
        conn,
        """
        UPDATE users
        SET is_active = FALSE
        WHERE id_user = %s
        """,
        (user_id,)
    )

def update_user_fields(conn, user_id: int, updates: dict):
    if not updates:
        return
        
    set_clauses = []
    values = []
    
    for key, value in updates.items():
        if key == 'role':
            # Resolve role_id
            role_rows = execute_query(conn, 'SELECT role_id FROM roles WHERE role_name = %s LIMIT 1', (value,))
            if role_rows:
                set_clauses.append("role_id = %s")
                values.append(role_rows[0]['role_id'])
        else:
            set_clauses.append(f"{key} = %s")
            values.append(value)
            
    if not set_clauses:
        return
        
    query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id_user = %s"
    values.append(user_id)
    execute_write(conn, query, tuple(values))
