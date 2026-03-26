import os
import sys

# Add the app directory to sys.path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import get_connection, execute_write, execute_query
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run():
    with get_connection() as conn:
        # Get role IDs
        roles = execute_query(conn, "SELECT role_id, role_name FROM roles")
        role_map = {r['role_name']: r['role_id'] for r in roles}
        
        inspector_role = role_map.get('inspector', 2)
        authority_role = role_map.get('authority', 3)
        admin_role = role_map.get('admin', 1)

        hashed_pw = pwd_context.hash("password123")
        
        # Check if users exist and insert if not
        users = [
            ("inspector@taroudant.ma", hashed_pw, "Ahmed Inspector", "Ministry of Culture", inspector_role),
            ("authority@taroudant.ma", hashed_pw, "Fatima Authority", "City Council", authority_role),
            ("admin@taroudant.ma", hashed_pw, "System Admin", "IT Department", admin_role)
        ]
        
        for email, pw, name, org, r_id in users:
            existing = execute_query(conn, "SELECT id_user FROM users WHERE email = %s", (email,))
            if not existing:
                execute_write(conn, """
                    INSERT INTO users (email, password_hash, full_name, organization, role_id, is_active)
                    VALUES (%s, %s, %s, %s, %s, TRUE)
                """, (email, pw, name, org, r_id))
                print(f"Inserted user: {email}")
            else:
                print(f"User already exists: {email}")

if __name__ == '__main__':
    run()
