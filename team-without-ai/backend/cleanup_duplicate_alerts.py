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
        cur.execute("SELECT COUNT(*) AS c FROM ALERTE WHERE statut IN ('nouvelle','en_cours')")
        before = cur.fetchone()[0]

        cur.execute(
            """
            DELETE FROM ALERTE
            WHERE statut IN ('nouvelle','en_cours')
              AND id_alerte NOT IN (
                SELECT keep_id FROM (
                  SELECT MAX(id_alerte) AS keep_id
                  FROM ALERTE
                  WHERE statut IN ('nouvelle','en_cours')
                  GROUP BY id_inspection, id_utilisateur
                ) x
              )
            """
        )

        cur.execute("SELECT COUNT(*) AS c FROM ALERTE WHERE statut IN ('nouvelle','en_cours')")
        after = cur.fetchone()[0]

        # Vérification: s'il reste encore un doublon
        cur.execute(
            """
            SELECT id_inspection, id_utilisateur, COUNT(*) AS c
            FROM ALERTE
            WHERE statut IN ('nouvelle','en_cours')
            GROUP BY id_inspection, id_utilisateur
            HAVING COUNT(*) > 1
            LIMIT 20
            """
        )
        remaining = cur.fetchall()

        print(f"pending alerts: before={before}, after={after}")
        print(f"remaining duplicate groups: {len(remaining)}")
        if remaining:
            print("sample:", remaining[:5])
    finally:
        conn.close()


if __name__ == "__main__":
    main()

