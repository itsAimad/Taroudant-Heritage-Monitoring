import pymysql


HOST = "localhost"
USER = "root"
PASSWORD = ""
PORT = 3306
DB_NAME = "taroudant_heritage_shield"
PROC_NAME = "CalculerScoreVulnerabilite"


def main():
    conn = pymysql.connect(
        host=HOST,
        user=USER,
        password=PASSWORD,
        port=PORT,
        database=DB_NAME,
        autocommit=True,
    )
    cur = conn.cursor()

    cur.execute("SHOW TABLES;")
    print("[verify_db] tables:", [r[0] for r in cur.fetchall()])

    cur.execute(
        "SHOW PROCEDURE STATUS WHERE Db=%s AND Name=%s;",
        (DB_NAME, PROC_NAME),
    )
    print("[verify_db] procedure rows:", cur.fetchall())

    # MariaDB/MySQL ne supporte pas toujours les placeholders sur "SHOW TRIGGERS FROM ..."
    cur.execute(f"SHOW TRIGGERS FROM {DB_NAME};")
    triggers = cur.fetchall()
    # triggers columns vary by MySQL version, but first columns typically include Trigger name.
    trigger_names = [t[0] for t in triggers] if triggers else []
    print("[verify_db] triggers:", trigger_names)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

