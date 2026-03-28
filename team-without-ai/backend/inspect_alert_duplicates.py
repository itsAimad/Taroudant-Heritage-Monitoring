import pymysql


def main() -> None:
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="",
        database="taroudant_heritage_shield",
        autocommit=True,
    )
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(1) FROM ALERTE")
        total = cur.fetchone()[0]

        cur.execute(
            """
            SELECT id_inspection, COUNT(1) AS c
            FROM ALERTE
            GROUP BY id_inspection
            HAVING COUNT(1) > 1
            ORDER BY c DESC
            LIMIT 10
            """
        )
        top = cur.fetchall()

        print("total alerts:", total)
        print("top duplicate inspections:", top)
    finally:
        conn.close()


if __name__ == "__main__":
    main()

