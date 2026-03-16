import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool
from contextlib import contextmanager
from typing import Generator
from .config import settings

# Connection pool — 5 connections, reused across requests
_pool = MySQLConnectionPool(
    pool_name    = 'heritage_pool',
    pool_size    = 5,
    host         = settings.DB_HOST,
    port         = settings.DB_PORT,
    database     = settings.DB_NAME,
    user         = settings.DB_USER,
    password     = settings.DB_PASSWORD,
    charset      = 'utf8mb4',
    collation    = 'utf8mb4_unicode_ci',
    autocommit   = False,
    time_zone    = '+00:00',
)

@contextmanager
def get_connection():
    """Context manager — always returns connection to pool."""
    conn = _pool.get_connection()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()   # returns to pool, not actual close

def get_db() -> Generator:
    """FastAPI dependency — yields a connection per request."""
    with get_connection() as conn:
        yield conn

def call_procedure(conn, proc_name: str, args: tuple = ()):
    """
    Helper to call MySQL stored procedures cleanly.
    Returns all rows from the last result set.
    Usage:
      rows = call_procedure(conn, 'CalculateVulnerabilityScore', (inspection_id,))
    """
    cursor = conn.cursor(dictionary=True)
    cursor.callproc(proc_name, args)
    results = []
    for result in cursor.stored_results():
        results = result.fetchall()
    cursor.close()
    return results

def execute_query(conn, query: str, params: tuple = ()):
    """Execute a SELECT query, return list of dicts."""
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    return rows

def execute_write(conn, query: str, params: tuple = ()):
    """Execute INSERT/UPDATE/DELETE, return lastrowid."""
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    last_id = cursor.lastrowid
    cursor.close()
    return last_id
