import re
from pathlib import Path

import pymysql


def main():
    sql_path = Path(__file__).resolve().parent.parent / "sql" / "triggers.sql"
    raw = sql_path.read_text(encoding="utf-8")
    raw = "\n".join(line for line in raw.splitlines() if not re.match(r"^\s*DELIMITER\s+", line, flags=re.IGNORECASE))

    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="",
        database="taroudant_heritage_shield",
        autocommit=True,
    )
    cur = conn.cursor()
    try:
        for drop in re.findall(r"DROP\s+TRIGGER\s+IF\s+EXISTS\s+[\w_]+\s*;", raw, flags=re.IGNORECASE):
            cur.execute(drop)
        create_blocks = re.findall(r"CREATE\s+TRIGGER\s+[\w_]+\s*[\s\S]*?END\$\$", raw, flags=re.IGNORECASE)
        for block in create_blocks:
            stmt = block.replace("END$$", "END").strip() + ";"
            cur.execute(stmt)
        print("triggers applied")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()

