import re
from pathlib import Path

import pymysql


def apply_procedure(cur):
    path = Path(__file__).resolve().parent.parent / "sql" / "procedures.sql"
    sql = path.read_text(encoding="utf-8")
    sql = "\n".join(line for line in sql.splitlines() if not re.match(r"^\s*DELIMITER\s+", line, flags=re.IGNORECASE))

    cur.execute("DROP PROCEDURE IF EXISTS CalculerScoreVulnerabilite;")

    match = re.search(
        r"CREATE\s+PROCEDURE\s+CalculerScoreVulnerabilite\s*\([\s\S]*?\)\s*BEGIN[\s\S]*?END\$\$",
        sql,
        flags=re.IGNORECASE,
    )
    if not match:
        raise RuntimeError("Procedure block not found in procedures.sql")
    stmt = match.group(0).replace("END$$", "END").strip() + ";"
    cur.execute(stmt)


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
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS NOTIFICATION_SEISME_LUE (
                id_notification INT AUTO_INCREMENT PRIMARY KEY,
                id_seisme INT NOT NULL,
                id_utilisateur INT NOT NULL,
                date_lecture DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_seisme_user (id_seisme, id_utilisateur),
                FOREIGN KEY (id_seisme) REFERENCES SEISME(id_seisme) ON DELETE CASCADE,
                FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur) ON DELETE CASCADE
            ) ENGINE=InnoDB;
            """
        )
        apply_procedure(cur)
        print("notification table ensured + procedure updated")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()

