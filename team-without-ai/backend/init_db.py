import re
from pathlib import Path

import pymysql


# Connexion MySQL (à adapter si nécessaire)
HOST = "localhost"
USER = "root"
PASSWORD = ""
PORT = 3306
DB_NAME = "taroudant_heritage_shield"


def connect(db: str | None = None):
    return pymysql.connect(
        host=HOST,
        user=USER,
        password=PASSWORD,
        port=PORT,
        database=db,
        autocommit=True,
        cursorclass=pymysql.cursors.Cursor,
    )


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_delimiter_directives(sql: str) -> str:
    # Supprime les lignes "DELIMITER $$" / "DELIMITER ;"
    return "\n".join(
        line for line in sql.splitlines() if not re.match(r"^\s*DELIMITER\s+", line, flags=re.IGNORECASE)
    )


def strip_sql_comments(sql: str) -> str:
    """
    Enlève :
    - commentaires -- jusqu'à fin de ligne
    - commentaires /* ... */
    (simple mais suffisant pour nos fichiers SQL fournis)
    """
    sql = re.sub(r"/\*[\s\S]*?\*/", "", sql)
    sql = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
    return sql


def split_sql_statements(sql: str) -> list[str]:
    """
    Split "top-level" sur ';' en ignorant :
    - contenus entre quotes simples
    - contenus entre quotes doubles
    - commentaires -- et /* ... */
    """
    statements: list[str] = []
    buf: list[str] = []

    in_single = False
    in_double = False
    i = 0
    while i < len(sql):
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < len(sql) else ""

        # Commentaires
        if not in_single and not in_double and ch == "-" and nxt == "-":
            # saute jusqu'à fin de ligne
            i += 2
            while i < len(sql) and sql[i] not in ("\n", "\r"):
                i += 1
            continue
        if not in_single and not in_double and ch == "/" and nxt == "*":
            i += 2
            while i + 1 < len(sql) and not (sql[i] == "*" and sql[i + 1] == "/"):
                i += 1
            i += 2
            continue

        # Gestion quotes
        if not in_double and ch == "'" and (i == 0 or sql[i - 1] != "\\"):
            in_single = not in_single
            buf.append(ch)
            i += 1
            continue
        if not in_single and ch == '"' and (i == 0 or sql[i - 1] != "\\"):
            in_double = not in_double
            buf.append(ch)
            i += 1
            continue

        # Split sur ';' uniquement hors quotes
        if ch == ";" and not in_single and not in_double:
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def run_schema(cur):
    sql_path = Path(__file__).resolve().parent.parent / "sql" / "schema.sql"
    sql = read_text(sql_path)
    sql = strip_sql_comments(sql)

    # schema.sql ne contient pas de procédures/triggers -> split simple suffit
    for stmt in split_sql_statements(sql):
        cur.execute(stmt)


def run_procedures(cur):
    sql_path = Path(__file__).resolve().parent.parent / "sql" / "procedures.sql"
    raw = read_text(sql_path)
    raw = strip_delimiter_directives(raw)

    # DROP PROCEDURE...
    drop_match = re.search(
        r"DROP\s+PROCEDURE\s+IF\s+EXISTS\s+CalculerScoreVulnerabilite\s*;",
        raw,
        flags=re.IGNORECASE,
    )
    if drop_match:
        cur.execute(drop_match.group(0))

    # CREATE PROCEDURE ... END$$
    create_match = re.search(
        r"CREATE\s+PROCEDURE\s+CalculerScoreVulnerabilite\s*\([\s\S]*?\)\s*BEGIN[\s\S]*?END\$\$",
        raw,
        flags=re.IGNORECASE,
    )
    if not create_match:
        raise RuntimeError("Impossible de trouver CREATE PROCEDURE CalculerScoreVulnerabilite dans procedures.sql")

    stmt = create_match.group(0).strip()
    stmt = stmt.replace("END$$", "END")
    # Le serveur n'a pas besoin du ';' final, mais on l'ajoute pour rester standard.
    cur.execute(stmt + ";")


def run_triggers(cur):
    sql_path = Path(__file__).resolve().parent.parent / "sql" / "triggers.sql"
    raw = read_text(sql_path)
    raw = strip_delimiter_directives(raw)

    # DROP TRIGGER...
    for drop in re.findall(r"DROP\s+TRIGGER\s+IF\s+EXISTS\s+[\w_]+\s*;", raw, flags=re.IGNORECASE):
        cur.execute(drop)

    # CREATE TRIGGER ... END$$ (une par une)
    create_blocks = re.findall(
        r"CREATE\s+TRIGGER\s+[\w_]+\s*[\s\S]*?END\$\$",
        raw,
        flags=re.IGNORECASE,
    )
    if not create_blocks:
        raise RuntimeError("Impossible de trouver les CREATE TRIGGER dans triggers.sql")

    for block in create_blocks:
        stmt = block.strip().replace("END$$", "END")
        cur.execute(stmt + ";")


def main():
    backend_dir = Path(__file__).resolve().parent
    print(f"[init_db] backend dir: {backend_dir}")

    # 1) schema.sql (création DB + tables)
    conn = connect(db=None)
    cur = conn.cursor()
    try:
        print("[init_db] Exécution schema.sql ...")
        run_schema(cur)
    finally:
        cur.close()
        conn.close()

    # 2) procédures + triggers (dans la DB créée)
    conn = connect(db=DB_NAME)
    cur = conn.cursor()
    try:
        print("[init_db] Exécution procedures.sql ...")
        run_procedures(cur)

        print("[init_db] Exécution triggers.sql ...")
        run_triggers(cur)
    finally:
        cur.close()
        conn.close()

    print("[init_db] OK: DB + tables + procédures + triggers")


if __name__ == "__main__":
    main()

