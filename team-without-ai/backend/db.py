from __future__ import annotations

import os
import sys
from typing import Any

import pymysql


# ---------------------------------------------------------------------------
# Startup guard — refuse to run if DB_PASSWORD is empty in production
# ---------------------------------------------------------------------------
_flask_env = os.getenv("FLASK_ENV", "production")
if _flask_env == "production" and not os.getenv("DB_PASSWORD", ""):
    print(
        "[db] FATAL: DB_PASSWORD is empty in production. "
        "Set it via environment variable.",
        file=sys.stderr,
    )
    sys.exit(1)


def get_connection(database: str | None = None):
    """
    Returns a PyMySQL connection with autocommit=False.

    CHANGED FROM ORIGINAL: autocommit was True — every statement committed
    immediately, making rollback impossible and hiding partial-write bugs.
    All write routes must now call conn.commit() explicitly (already done
    throughout app.py) or conn.rollback() on error.
    """
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    port = int(os.getenv("DB_PORT", "3306"))
    db_name = database or os.getenv("DB_NAME", "taroudant_heritage_shield")

    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        port=port,
        database=db_name,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,          # SECURITY FIX: was True
        connect_timeout=10,
        read_timeout=30,
        write_timeout=30,
    )


def fetch_one(sql: str, params: tuple[Any, ...]):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()
    finally:
        conn.close()


def fetch_all(sql: str, params: tuple[Any, ...] = ()):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()


def execute(sql: str, params: tuple[Any, ...] = ()):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

