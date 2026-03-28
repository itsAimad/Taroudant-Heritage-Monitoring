import pymysql


def main():
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="",
        database="taroudant_heritage_shield",
        autocommit=True,
    )
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE INSPECTION ADD COLUMN image_url VARCHAR(512) NULL")
        print("image_url column added.")
    except Exception as e:
        print("skip:", e)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()

