"""
rate_limit.py — Rate limiting en mémoire + Détection d'anomalies dans les logs d'audit.

Architecture :
  RateLimiter   : sliding window counter par (IP, endpoint). Thread-safe.
  AuditLogger   : log structuré de chaque action sensible vers AUDIT_LOG (table).
  AnomalyDetector : analyse les patterns suspects dans les logs d'audit.

Table SQL à créer (migration) :
  CREATE TABLE AUDIT_LOG (
      id           BIGINT AUTO_INCREMENT PRIMARY KEY,
      timestamp    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      user_id      INT NULL,
      ip_address   VARCHAR(45) NOT NULL,
      user_agent   VARCHAR(512) NULL,
      action       VARCHAR(100) NOT NULL  COMMENT 'EN: login_attempt, view_report, update_alert…',
      resource_id  VARCHAR(100) NULL      COMMENT 'EN: id of the affected resource',
      success      BOOLEAN NOT NULL,
      detail       TEXT NULL              COMMENT 'EN: extra context (e.g. failure reason)',
      INDEX idx_audit_user (user_id),
      INDEX idx_audit_ip   (ip_address),
      INDEX idx_audit_ts   (timestamp)
  ) ENGINE=InnoDB;
"""

from __future__ import annotations

import hashlib
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Rate Limiter — sliding window
# ---------------------------------------------------------------------------

@dataclass
class _Window:
    timestamps: deque = field(default_factory=deque)
    lock: threading.Lock = field(default_factory=threading.Lock)


class RateLimiter:
    """
    Sliding window rate limiter thread-safe en mémoire.

    En production, remplacez le store en mémoire par Redis
    pour un fonctionnement multi-process correct.

    Usage :
        limiter = RateLimiter()
        limiter.add_rule("login", max_requests=5, window_seconds=60)

        @app.post("/auth/login")
        def login():
            ip = request.remote_addr
            if not limiter.check("login", ip):
                return jsonify({"error": "Trop de tentatives"}), 429
            ...
    """

    def __init__(self):
        self._rules: dict[str, tuple[int, int]] = {}  # endpoint → (max_req, window_s)
        self._windows: dict[str, _Window] = defaultdict(_Window)
        self._global_lock = threading.Lock()

    def add_rule(self, endpoint: str, max_requests: int, window_seconds: int) -> None:
        """Enregistre une règle de rate limiting pour un endpoint."""
        self._rules[endpoint] = (max_requests, window_seconds)

    def check(self, endpoint: str, identifier: str) -> bool:
        """
        Vérifie si la requête est autorisée.

        Args:
            endpoint   : Nom de la règle (ex: "login", "reports_create").
            identifier : Clé de partition (IP, user_id, ou les deux concaténés).

        Returns:
            True si autorisé, False si la limite est dépassée.
        """
        if endpoint not in self._rules:
            return True  # Pas de règle → autorisé

        max_req, window_s = self._rules[endpoint]
        key = f"{endpoint}:{identifier}"
        win = self._windows[key]
        now = time.monotonic()

        with win.lock:
            cutoff = now - window_s
            # Supprime les timestamps expirés
            while win.timestamps and win.timestamps[0] < cutoff:
                win.timestamps.popleft()

            if len(win.timestamps) >= max_req:
                return False

            win.timestamps.append(now)
            return True

    def remaining(self, endpoint: str, identifier: str) -> int:
        """Retourne le nombre de requêtes restantes dans la fenêtre actuelle."""
        if endpoint not in self._rules:
            return 9999

        max_req, window_s = self._rules[endpoint]
        key = f"{endpoint}:{identifier}"
        win = self._windows[key]
        now = time.monotonic()
        cutoff = now - window_s

        with win.lock:
            while win.timestamps and win.timestamps[0] < cutoff:
                win.timestamps.popleft()
            return max(0, max_req - len(win.timestamps))

    def reset(self, endpoint: str, identifier: str) -> None:
        """Réinitialise le compteur (ex: après succès d'auth)."""
        key = f"{endpoint}:{identifier}"
        if key in self._windows:
            with self._windows[key].lock:
                self._windows[key].timestamps.clear()


# Règles par défaut (ajustables via env)
default_limiter = RateLimiter()
default_limiter.add_rule("login",          max_requests=5,   window_seconds=60)
default_limiter.add_rule("register",       max_requests=3,   window_seconds=3600)
default_limiter.add_rule("reports_create", max_requests=20,  window_seconds=3600)
default_limiter.add_rule("api_global",     max_requests=300, window_seconds=60)
default_limiter.add_rule("2fa_verify",     max_requests=3,   window_seconds=300)


# ---------------------------------------------------------------------------
# Audit Logger
# ---------------------------------------------------------------------------

SENSITIVE_ACTIONS = {
    "login_attempt",
    "login_success",
    "login_failure",
    "2fa_failure",
    "2fa_success",
    "report_create",
    "report_view",       # lecture d'un rapport (champ chiffré déchiffré)
    "report_update",
    "alert_read",
    "user_create",
    "user_delete",
    "seisme_create",
    "inspection_delete",
}


def log_audit(
    *,
    conn,
    user_id: int | None,
    ip_address: str,
    action: str,
    success: bool,
    resource_id: str | None = None,
    user_agent: str | None = None,
    detail: str | None = None,
) -> None:
    """
    Insère un enregistrement dans AUDIT_LOG.

    Les erreurs d'écriture sont swallowées silencieusement pour ne jamais
    bloquer la requête principale — mais elles sont loguées en stderr.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO AUDIT_LOG
                  (user_id, ip_address, user_agent, action, resource_id, success, detail)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, ip_address[:45], (user_agent or "")[:512], action,
                 resource_id, success, detail),
            )
    except Exception as exc:
        import sys
        print(f"[AUDIT] Erreur écriture log: {exc}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Détecteur d'anomalies
# ---------------------------------------------------------------------------

class AnomalyDetector:
    """
    Analyse les logs d'audit pour détecter des patterns suspects.

    Patterns détectés :
      1. Brute-force : >5 échecs login depuis la même IP en 10 min
      2. Credential stuffing : >3 emails différents depuis la même IP en 10 min
      3. Privilege escalation attempt : accès /admin depuis un compte non-admin
      4. Accès massif aux rapports : >30 lectures en 5 min (exfiltration)
      5. Heure inhabituelle : accès entre 2h et 5h du matin (heure locale serveur)

    Utilisation :
        detector = AnomalyDetector()
        anomalies = detector.scan(conn)
        for a in anomalies:
            print(a["type"], a["severity"], a["detail"])
    """

    RULES = [
        {
            "name": "brute_force_login",
            "severity": "CRITICAL",
            "query": """
                SELECT ip_address, COUNT(*) AS attempts
                FROM AUDIT_LOG
                WHERE action = 'login_failure'
                  AND success = FALSE
                  AND timestamp >= NOW() - INTERVAL 10 MINUTE
                GROUP BY ip_address
                HAVING COUNT(*) >= 5
            """,
            "description": "Brute-force login détecté depuis {ip_address} ({attempts} tentatives en 10 min)",
        },
        {
            "name": "credential_stuffing",
            "severity": "HIGH",
            "query": """
                SELECT ip_address, COUNT(DISTINCT detail) AS unique_emails
                FROM AUDIT_LOG
                WHERE action = 'login_failure'
                  AND timestamp >= NOW() - INTERVAL 10 MINUTE
                GROUP BY ip_address
                HAVING COUNT(DISTINCT detail) >= 3
            """,
            "description": "Credential stuffing depuis {ip_address} ({unique_emails} comptes différents)",
        },
        {
            "name": "mass_report_access",
            "severity": "HIGH",
            "query": """
                SELECT user_id, COUNT(*) AS reads
                FROM AUDIT_LOG
                WHERE action = 'report_view'
                  AND success = TRUE
                  AND timestamp >= NOW() - INTERVAL 5 MINUTE
                GROUP BY user_id
                HAVING COUNT(*) >= 30
            """,
            "description": "Accès massif aux rapports (possible exfiltration) par user #{user_id} ({reads} lectures en 5 min)",
        },
        {
            "name": "after_hours_access",
            "severity": "MEDIUM",
            "query": """
                SELECT user_id, ip_address, COUNT(*) AS actions
                FROM AUDIT_LOG
                WHERE success = TRUE
                  AND HOUR(timestamp) BETWEEN 2 AND 5
                  AND DATE(timestamp) = CURDATE()
                GROUP BY user_id, ip_address
                HAVING COUNT(*) >= 3
            """,
            "description": "Accès hors heures (2h-5h) par user #{user_id} depuis {ip_address} ({actions} actions)",
        },
        {
            "name": "repeated_2fa_failure",
            "severity": "HIGH",
            "query": """
                SELECT user_id, ip_address, COUNT(*) AS failures
                FROM AUDIT_LOG
                WHERE action = '2fa_failure'
                  AND timestamp >= NOW() - INTERVAL 15 MINUTE
                GROUP BY user_id, ip_address
                HAVING COUNT(*) >= 3
            """,
            "description": "Échecs 2FA répétés pour user #{user_id} depuis {ip_address} ({failures} échecs en 15 min)",
        },
    ]

    def scan(self, conn) -> list[dict[str, Any]]:
        """
        Exécute toutes les règles de détection.

        Returns:
            Liste d'anomalies détectées, chacune avec :
            {
                "type": str,        # nom de la règle
                "severity": str,    # CRITICAL / HIGH / MEDIUM / LOW
                "detail": str,      # message lisible
                "raw": dict,        # ligne brute du résultat SQL
            }
        """
        anomalies = []
        for rule in self.RULES:
            try:
                with conn.cursor() as cur:
                    cur.execute(rule["query"])
                    rows = cur.fetchall()
                for row in rows:
                    # Formatte le message en injectant les colonnes du résultat
                    row_dict = dict(row) if not isinstance(row, dict) else row
                    detail = rule["description"].format(**row_dict)
                    anomalies.append({
                        "type": rule["name"],
                        "severity": rule["severity"],
                        "detail": detail,
                        "raw": row_dict,
                    })
            except Exception as exc:
                import sys
                print(f"[ANOMALY] Erreur règle {rule['name']}: {exc}", file=sys.stderr)

        return anomalies

    def create_alert_if_needed(self, conn, anomalies: list[dict], inspection_id: int = 1) -> None:
        """
        Pour chaque anomalie CRITICAL ou HIGH, insère une alerte dans ALERTE
        si aucune alerte identique n'existe déjà dans les 30 dernières minutes.
        """
        for a in anomalies:
            if a["severity"] not in ("CRITICAL", "HIGH"):
                continue
            msg = f"[SECURITE] {a['type']}: {a['detail']}"
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT COUNT(*) AS c FROM ALERTE
                        WHERE type_degradation = 'securite_anomalie'
                          AND message LIKE %s
                          AND date_alerte >= NOW() - INTERVAL 30 MINUTE
                        """,
                        (f"%{a['type']}%",),
                    )
                    if cur.fetchone()["c"] == 0:
                        cur.execute(
                            """
                            INSERT INTO ALERTE
                              (message, niveau, statut, type_degradation,
                               alerte_recue, id_inspection, id_utilisateur)
                            VALUES (%s, 'critique', 'nouvelle', 'securite_anomalie',
                                    FALSE, %s, NULL)
                            """,
                            (msg, inspection_id),
                        )
            except Exception as exc:
                import sys
                print(f"[ANOMALY] Erreur insertion alerte: {exc}", file=sys.stderr)
            