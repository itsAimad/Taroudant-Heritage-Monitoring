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

        # Keep the latest alert row per inspection (regardless of recipient),
        # delete other rows for that inspection, then normalize to system alert (id_utilisateur = NULL).
        cur.execute(
            """
            DELETE FROM ALERTE
            WHERE id_alerte NOT IN (
              SELECT keep_id FROM (
                SELECT MAX(id_alerte) AS keep_id
                FROM ALERTE
                GROUP BY id_inspection
              ) x
            )
            """
        )

        cur.execute("UPDATE ALERTE SET id_utilisateur = NULL")

        # Verify duplicates removed
        cur.execute(
            """
            SELECT id_inspection, COUNT(1) AS c
            FROM ALERTE
            GROUP BY id_inspection
            HAVING COUNT(1) > 1
            LIMIT 10
            """
        )
        dup = cur.fetchall()
        print("duplicate groups after collapse:", len(dup))

    finally:
        conn.close()


if __name__ == "__main__":
    main()

