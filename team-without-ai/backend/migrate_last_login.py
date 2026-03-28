import pymysql


def column_exists(conn, table_name: str, column_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = %s
              AND column_name = %s
            """,
            (table_name, column_name),
        )
        return int(cur.fetchone()[0]) > 0


def main() -> None:
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="",
        database="taroudant_heritage_shield",
        autocommit=True,
    )
    try:
        if not column_exists(conn, "UTILISATEUR", "last_login"):
            with conn.cursor() as cur:
                cur.execute(
                    "ALTER TABLE UTILISATEUR ADD COLUMN last_login DATETIME NULL"
                )
            print("added column UTILISATEUR.last_login")
        else:
            print("column UTILISATEUR.last_login already exists")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

