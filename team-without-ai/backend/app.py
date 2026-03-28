from __future__ import annotations

import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable

import bcrypt
import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS

from db import fetch_one, get_connection
from mappers import (
    alerte_niveau_to_ui,
    alerte_statut_to_ui,
    db_role_to_ui,
    fissure_gravite_to_db,
    fissure_gravite_to_ui,
    inspection_statut_to_db,
    inspection_statut_to_ui,
    monument_etat_to_db,
    monument_etat_to_ui,
    rapport_priorite_to_db,
    rapport_priorite_to_ui,
    rapport_statut_to_db,
    rapport_statut_to_ui,
    to_iso_date,
)


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)  # dev-friendly; tighten origins later

    app.config["JWT_SECRET"] = os.getenv("JWT_SECRET", "dev-change-me")
    app.config["JWT_ALGO"] = os.getenv("JWT_ALGO", "HS256")
    app.config["JWT_TTL_MINUTES"] = int(os.getenv("JWT_TTL_MINUTES", "10080"))  # 7 days

    def require_auth(fn: Callable[..., Any]):
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify({"error": "Missing Bearer token"}), 401

            token = auth.removeprefix("Bearer ").strip()
            try:
                payload = jwt.decode(
                    token,
                    app.config["JWT_SECRET"],
                    algorithms=[app.config["JWT_ALGO"]],
                )
            except jwt.PyJWTError:
                return jsonify({"error": "Invalid token"}), 401

            request.user = payload  # type: ignore[attr-defined]
            return fn(*args, **kwargs)

        return wrapper

    def require_roles(*allowed_roles: str):
        def decorator(fn: Callable[..., Any]):
            @wraps(fn)
            def wrapper(*args: Any, **kwargs: Any):
                payload = getattr(request, "user", {}) or {}
                role = payload.get("role")
                if role not in allowed_roles:
                    return jsonify({"error": "Forbidden"}), 403
                return fn(*args, **kwargs)

            return wrapper

        return decorator

    def ui_role_to_db(role_ui: str) -> str:
        mapping = {
            "Admin": "admin",
            "Expert": "expert",
            "Authority": "autorite",
        }
        return mapping.get(role_ui, role_ui)

    def serialize_monument(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": f"m{row['id_monument']}",
            "name": row["nom"],
            "location": row["localisation"] or "",
            "dateCreation": to_iso_date(row["date_de_creation"]),
            "structuralState": monument_etat_to_ui(row["etat_structure"]),
            "description": row["description"] or "",
            "vulnerabilityScore": float(row["vulnerability_score"] or 0),
            "image": row["image_principale"] or "",
        }

    def serialize_seisme(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": f"s{row['id_seisme']}",
            "date": to_iso_date(row["date_seisme"]),
            "location": row["localisation"],
            "magnitude": float(row["magnitude"]),
            "depth": float(row["profondeur_km"]),
            "intensity": row["intensite"],
        }

    def serialize_inspection(row: dict[str, Any], fissures: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "id": f"i{row['id_inspection']}",
            "monumentId": f"m{row['id_monument']}",
            "expertId": str(row["id_utilisateur"]),
            "monumentName": row["monument_nom"] or "",
            "inspector": row["expert_nom"] or "",
            "inspectionDate": to_iso_date(row["date_inspection"]),
            "inspectionType": row["type_inspection"] or "",
            "observation": row["observation"] or "",
            "vulnerabilityScore": float(row["score_vulnerabilite"] or 0),
            "status": inspection_statut_to_ui(row["statut"]),
            "fissures": fissures,
            "image": row.get("image_url") or "",
        }

    def serialize_rapport(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": f"r{row['id_rapport']}",
            "dateRapport": to_iso_date(row["date_rapport"]),
            "diagnosticStructurel": row["diagnostic_structurel"] or "",
            "analyseFissures": row["analyse_fissures"] or "",
            "recommandations": row["recommandations"] or "",
            "niveauPriorite": rapport_priorite_to_ui(row["niveau_priorite"]),
            "statut": rapport_statut_to_ui(row["statut"]),
            "commentaireAutorite": row.get("commentaire_autorite") or "",
            "inspectionId": f"i{row['id_inspection']}",
            "idUtilisateur": str(row["id_utilisateur"]),
            "nomExpert": row["expert_nom"] or "",
            "monumentName": row["monument_nom"] or "",
        }

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    @app.post("/auth/login")
    def login():
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"error": "email and password are required"}), 400

        user_row = fetch_one(
            """
            SELECT id_utilisateur, nom, email, mot_de_passe, role
            FROM UTILISATEUR
            WHERE email = %s
            LIMIT 1
            """,
            (email,),
        )

        if not user_row:
            return jsonify({"error": "Invalid credentials"}), 401

        stored_hash = user_row["mot_de_passe"]
        if isinstance(stored_hash, memoryview):
            stored_hash = stored_hash.tobytes().decode("utf-8", errors="ignore")

        if not isinstance(stored_hash, str):
            stored_hash = str(stored_hash)

        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            return jsonify({"error": "Invalid credentials"}), 401

        now = datetime.utcnow()

        # Track last login time for Admin view (UTILISATEUR.last_login).
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE UTILISATEUR SET last_login = %s WHERE id_utilisateur = %s",
                    (now, user_row["id_utilisateur"]),
                )
        finally:
            conn.close()

        exp_dt = now + timedelta(minutes=app.config["JWT_TTL_MINUTES"])
        exp_ts = int(exp_dt.timestamp())

        role_ui = db_role_to_ui(user_row["role"])
        payload = {
            "sub": str(user_row["id_utilisateur"]),
            "email": user_row["email"],
            "name": user_row["nom"],
            "role": role_ui,
            "exp": exp_ts,
        }
        token = jwt.encode(payload, app.config["JWT_SECRET"], algorithm=app.config["JWT_ALGO"])

        return jsonify(
            {
                "token": token,
                "user": {
                    "id": str(user_row["id_utilisateur"]),
                    "name": user_row["nom"],
                    "email": user_row["email"],
                    "role": role_ui,
                },
            }
        )

    @app.get("/auth/me")
    @require_auth
    def me():
        payload = request.user  # type: ignore[attr-defined]
        return jsonify(
            {
                "user": {
                    "id": str(payload.get("sub", "")),
                    "name": payload.get("name", ""),
                    "email": payload.get("email", ""),
                    "role": payload.get("role", ""),
                }
            }
        )

    @app.post("/auth/register")
    def register():
        """
        Endpoint utile pour créer un premier admin/expert/autorité en dev.
        Le frontend actuel n'a pas encore de page register, mais cet endpoint aide à tester.
        """
        data = request.get_json(silent=True) or {}
        nom = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        role_db = (data.get("role") or "").strip().lower()  # admin|expert|autorite

        if not nom or not email or not password or role_db not in {"admin", "expert", "autorite"}:
            return jsonify({"error": "name, email, password, and valid role are required"}), 400

        # On évite import circular: pymysql insertion simple via fetch_one? -> on fera un INSERT direct via connection
        from db import execute

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # mot_de_passe est VARCHAR(255) : stocker str( bytes ) compatible
        execute(
            """
            INSERT INTO UTILISATEUR (nom, email, mot_de_passe, role)
            VALUES (%s, %s, %s, %s)
            """,
            (nom, email, hashed.decode("utf-8"), role_db),
        )

        return jsonify({"ok": True})

    @app.get("/users")
    @require_auth
    @require_roles("Admin")
    def users_list():
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id_utilisateur, nom, email, role, last_login
                    FROM UTILISATEUR
                    ORDER BY id_utilisateur DESC
                    """
                )
                rows = cur.fetchall()
            return jsonify(
                [
                    {
                        "id": str(r["id_utilisateur"]),
                        "name": r["nom"],
                        "email": r["email"],
                        "role": db_role_to_ui(r["role"]),
                        "status": "Actif",
                        "lastLogin": str(r["last_login"]) if r.get("last_login") else "—",
                    }
                    for r in rows
                ]
            )
        finally:
            conn.close()

    @app.post("/users")
    @require_auth
    @require_roles("Admin")
    def users_create():
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        role_ui = (data.get("role") or "").strip()
        password = data.get("password") or ""
        if not name or not email or not password:
            return jsonify({"error": "name, email and password are required"}), 400
        role_db = ui_role_to_db(role_ui)
        if role_db not in {"admin", "expert", "autorite"}:
            return jsonify({"error": "Invalid role"}), 400
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO UTILISATEUR (nom, email, mot_de_passe, role) VALUES (%s,%s,%s,%s)",
                    (name, email, hashed, role_db),
                )
                uid = cur.lastrowid
            conn.commit()
            return jsonify(
                {
                    "id": str(uid),
                    "name": name,
                    "email": email,
                    "role": db_role_to_ui(role_db),
                    "status": "Actif",
                    "lastLogin": "—",
                }
            )
        finally:
            conn.close()

    @app.put("/users/<int:user_id>")
    @require_auth
    @require_roles("Admin")
    def users_update(user_id: int):
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        role_ui = (data.get("role") or "").strip()
        if not name or not email:
            return jsonify({"error": "name and email are required"}), 400
        role_db = ui_role_to_db(role_ui)
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE UTILISATEUR SET nom=%s, email=%s, role=%s WHERE id_utilisateur=%s",
                    (name, email, role_db, user_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"error": "User not found"}), 404
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.delete("/users/<int:user_id>")
    @require_auth
    @require_roles("Admin")
    def users_delete(user_id: int):
        payload = request.user  # type: ignore[attr-defined]
        if int(payload.get("sub")) == user_id:
            return jsonify({"error": "Cannot delete current user"}), 400
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM UTILISATEUR WHERE id_utilisateur=%s", (user_id,))
                if cur.rowcount == 0:
                    return jsonify({"error": "User not found"}), 404
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.get("/monuments")
    @require_auth
    def monuments_list():
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      m.id_monument,
                      m.nom,
                      m.localisation,
                      m.date_de_creation,
                      m.etat_structure,
                      m.description,
                      m.image_principale,
                      COALESCE(
                        (
                          SELECT i.score_vulnerabilite
                          FROM INSPECTION i
                          WHERE i.id_monument = m.id_monument
                          ORDER BY i.date_inspection DESC, i.id_inspection DESC
                          LIMIT 1
                        ),
                        0
                      ) AS vulnerability_score
                    FROM MONUMENT m
                    ORDER BY m.id_monument DESC
                    """
                )
                rows = cur.fetchall()
            return jsonify([serialize_monument(r) for r in rows])
        finally:
            conn.close()

    @app.get("/monuments/<int:monument_id>")
    @require_auth
    def monuments_detail(monument_id: int):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      m.id_monument,
                      m.nom,
                      m.localisation,
                      m.date_de_creation,
                      m.etat_structure,
                      m.description,
                      m.image_principale,
                      COALESCE(
                        (
                          SELECT i.score_vulnerabilite
                          FROM INSPECTION i
                          WHERE i.id_monument = m.id_monument
                          ORDER BY i.date_inspection DESC, i.id_inspection DESC
                          LIMIT 1
                        ),
                        0
                      ) AS vulnerability_score
                    FROM MONUMENT m
                    WHERE m.id_monument = %s
                    LIMIT 1
                    """,
                    (monument_id,),
                )
                row = cur.fetchone()
            if not row:
                return jsonify({"error": "Monument not found"}), 404
            return jsonify(serialize_monument(row))
        finally:
            conn.close()

    @app.post("/monuments")
    @require_auth
    @require_roles("Admin")
    def monuments_create():
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        location = (data.get("location") or "").strip() or None
        date_creation = (data.get("dateCreation") or "").strip() or None
        structural_state_ui = (data.get("structuralState") or "").strip()
        description = (data.get("description") or "").strip() or None
        image = (data.get("image") or "").strip() or None

        if not name or not structural_state_ui:
            return jsonify({"error": "name and structuralState are required"}), 400

        structural_state_db = monument_etat_to_db(structural_state_ui)

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO MONUMENT (nom, localisation, date_de_creation, etat_structure, description, image_principale)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (name, location, date_creation, structural_state_db, description, image),
                )
                monument_id = cur.lastrowid
            conn.commit()
        finally:
            conn.close()

        return monuments_detail(monument_id)

    @app.put("/monuments/<int:monument_id>")
    @require_auth
    @require_roles("Admin")
    def monuments_update(monument_id: int):
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        location = (data.get("location") or "").strip() or None
        date_creation = (data.get("dateCreation") or "").strip() or None
        structural_state_ui = (data.get("structuralState") or "").strip()
        description = (data.get("description") or "").strip() or None
        image = (data.get("image") or "").strip() or None

        if not name or not structural_state_ui:
            return jsonify({"error": "name and structuralState are required"}), 400

        structural_state_db = monument_etat_to_db(structural_state_ui)

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE MONUMENT
                    SET nom = %s,
                        localisation = %s,
                        date_de_creation = %s,
                        etat_structure = %s,
                        description = %s,
                        image_principale = %s
                    WHERE id_monument = %s
                    """,
                    (name, location, date_creation, structural_state_db, description, image, monument_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"error": "Monument not found"}), 404
            conn.commit()
        finally:
            conn.close()

        return monuments_detail(monument_id)

    @app.delete("/monuments/<int:monument_id>")
    @require_auth
    @require_roles("Admin")
    def monuments_delete(monument_id: int):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("DELETE FROM MONUMENT WHERE id_monument = %s", (monument_id,))
                except Exception:
                    return jsonify({"error": "Cannot delete monument with related records"}), 409
                if cur.rowcount == 0:
                    return jsonify({"error": "Monument not found"}), 404
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.get("/seismes")
    @require_auth
    def seismes_list():
        payload = request.user  # type: ignore[attr-defined]
        user_id = int(payload.get("sub", 0))
        role = payload.get("role")
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                if role in {"Expert", "Authority"}:
                    cur.execute(
                        """
                        SELECT s.id_seisme, s.date_seisme, s.localisation, s.magnitude, s.profondeur_km, s.intensite,
                               CASE WHEN n.id_notification IS NULL THEN 0 ELSE 1 END AS is_read
                        FROM SEISME s
                        LEFT JOIN NOTIFICATION_SEISME_LUE n
                          ON n.id_seisme = s.id_seisme AND n.id_utilisateur = %s
                        ORDER BY s.date_seisme DESC, s.id_seisme DESC
                        """,
                        (user_id,),
                    )
                else:
                    cur.execute(
                        """
                        SELECT s.id_seisme, s.date_seisme, s.localisation, s.magnitude, s.profondeur_km, s.intensite, 1 AS is_read
                        FROM SEISME s
                        ORDER BY s.date_seisme DESC, s.id_seisme DESC
                        """
                    )
                rows = cur.fetchall()
            return jsonify([{**serialize_seisme(r), "read": bool(r.get("is_read", 0))} for r in rows])
        finally:
            conn.close()

    @app.post("/seismes")
    @require_auth
    @require_roles("Admin")
    def seismes_create():
        payload = request.user  # type: ignore[attr-defined]
        data = request.get_json(silent=True) or {}

        date_value = (data.get("date") or "").strip()
        location = (data.get("location") or "").strip()
        intensity = (data.get("intensity") or "").strip()

        try:
            magnitude = float(data.get("magnitude"))
            depth = float(data.get("depth"))
        except (TypeError, ValueError):
            return jsonify({"error": "magnitude and depth must be numbers"}), 400

        if not date_value or not location or not intensity:
            return jsonify({"error": "date, location and intensity are required"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO SEISME (date_seisme, localisation, magnitude, profondeur_km, intensite, id_utilisateur)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (date_value, location, magnitude, depth, intensity, int(payload.get("sub"))),
                )
                seisme_id = cur.lastrowid

                cur.execute(
                    """
                    SELECT id_seisme, date_seisme, localisation, magnitude, profondeur_km, intensite
                    FROM SEISME
                    WHERE id_seisme = %s
                    LIMIT 1
                    """,
                    (seisme_id,),
                )
                row = cur.fetchone()
            conn.commit()
            return jsonify(serialize_seisme(row))
        finally:
            conn.close()

    @app.put("/seismes/<int:seisme_id>")
    @require_auth
    @require_roles("Admin")
    def seismes_update(seisme_id: int):
        data = request.get_json(silent=True) or {}

        date_value = (data.get("date") or "").strip()
        location = (data.get("location") or "").strip()
        intensity = (data.get("intensity") or "").strip()

        try:
            magnitude = float(data.get("magnitude"))
            depth = float(data.get("depth"))
        except (TypeError, ValueError):
            return jsonify({"error": "magnitude and depth must be numbers"}), 400

        if not date_value or not location or not intensity:
            return jsonify({"error": "date, location and intensity are required"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE SEISME
                    SET date_seisme = %s,
                        localisation = %s,
                        magnitude = %s,
                        profondeur_km = %s,
                        intensite = %s
                    WHERE id_seisme = %s
                    """,
                    (date_value, location, magnitude, depth, intensity, seisme_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"error": "Seisme not found"}), 404

                cur.execute(
                    """
                    SELECT id_seisme, date_seisme, localisation, magnitude, profondeur_km, intensite
                    FROM SEISME
                    WHERE id_seisme = %s
                    LIMIT 1
                    """,
                    (seisme_id,),
                )
                row = cur.fetchone()
            conn.commit()
            return jsonify(serialize_seisme(row))
        finally:
            conn.close()

    @app.delete("/seismes/<int:seisme_id>")
    @require_auth
    @require_roles("Admin")
    def seismes_delete(seisme_id: int):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM SEISME WHERE id_seisme = %s", (seisme_id,))
                if cur.rowcount == 0:
                    return jsonify({"error": "Seisme not found"}), 404
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.post("/seismes/<int:seisme_id>/read")
    @require_auth
    @require_roles("Expert", "Authority")
    def seisme_mark_read(seisme_id: int):
        payload = request.user  # type: ignore[attr-defined]
        user_id = int(payload.get("sub"))
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT IGNORE INTO NOTIFICATION_SEISME_LUE (id_seisme, id_utilisateur)
                    VALUES (%s, %s)
                    """,
                    (seisme_id, user_id),
                )
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.post("/seismes/read-all")
    @require_auth
    @require_roles("Expert", "Authority")
    def seisme_mark_all_read():
        payload = request.user  # type: ignore[attr-defined]
        user_id = int(payload.get("sub"))
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT IGNORE INTO NOTIFICATION_SEISME_LUE (id_seisme, id_utilisateur)
                    SELECT id_seisme, %s FROM SEISME
                    """,
                    (user_id,),
                )
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.get("/dashboard/summary")
    @require_auth
    def dashboard_summary():
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) as c FROM MONUMENT")
                monuments_count = int(cur.fetchone()["c"])
                cur.execute("SELECT COUNT(*) as c FROM INSPECTION")
                inspections_count = int(cur.fetchone()["c"])
                # Nombre d'alertes actuellement "actives" (système, visibles aux autorités)
                cur.execute(
                    "SELECT COUNT(*) as c FROM ALERTE WHERE statut IN ('nouvelle','en_cours')"
                )
                active_alerts_count = int(cur.fetchone()["c"])
                cur.execute("SELECT COUNT(*) as c FROM SEISME")
                seismes_count = int(cur.fetchone()["c"])

                cur.execute(
                    """
                    SELECT i.id_inspection, i.id_monument, i.date_inspection, i.type_inspection, i.observation,
                           i.score_vulnerabilite, i.statut, m.nom AS monument_nom, u.nom AS expert_nom
                    FROM INSPECTION i
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = i.id_utilisateur
                    ORDER BY i.date_inspection DESC, i.id_inspection DESC
                    LIMIT 5
                    """
                )
                rows = cur.fetchall()
            inspections_recent = [
                {
                    "id": f"i{r['id_inspection']}",
                    "monumentName": r["monument_nom"] or "",
                    "inspector": r["expert_nom"] or "",
                    "vulnerabilityScore": float(r["score_vulnerabilite"] or 0),
                    "inspectionDate": to_iso_date(r["date_inspection"]),
                    "status": inspection_statut_to_ui(r["statut"]),
                }
                for r in rows
            ]
            return jsonify(
                {
                    "stats": {
                        "monuments": monuments_count,
                        "inspections": inspections_count,
                        "activeAlerts": active_alerts_count,
                        "seismes": seismes_count,
                    },
                    "recentInspections": inspections_recent,
                }
            )
        finally:
            conn.close()

    @app.get("/inspections")
    @require_auth
    def inspections_list():
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT i.id_inspection, i.id_monument, i.id_utilisateur, i.date_inspection, i.type_inspection, i.image_url,
                           i.observation, i.score_vulnerabilite, i.statut, m.nom AS monument_nom, u.nom AS expert_nom
                    FROM INSPECTION i
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = i.id_utilisateur
                    ORDER BY i.date_inspection DESC, i.id_inspection DESC
                    """
                )
                rows = cur.fetchall()

                inspection_ids = [r["id_inspection"] for r in rows]
                fissures_by_inspection: dict[int, list[dict[str, Any]]] = {}
                if inspection_ids:
                    placeholders = ",".join(["%s"] * len(inspection_ids))
                    cur.execute(
                        f"""
                        SELECT id_fissure, id_inspection, description, date_detection, gravite
                        FROM FISSURE
                        WHERE id_inspection IN ({placeholders})
                        ORDER BY id_fissure ASC
                        """,
                        tuple(inspection_ids),
                    )
                    for f in cur.fetchall():
                        fissures_by_inspection.setdefault(f["id_inspection"], []).append(
                            {
                                "id": f"f{f['id_fissure']}",
                                "description": f["description"] or "",
                                "detectionDate": to_iso_date(f["date_detection"]),
                                "gravityLevel": fissure_gravite_to_ui(f["gravite"]),
                            }
                        )
            data = [serialize_inspection(r, fissures_by_inspection.get(r["id_inspection"], [])) for r in rows]
            return jsonify(data)
        finally:
            conn.close()

    @app.post("/inspections")
    @require_auth
    @require_roles("Expert")
    def inspections_create():
        payload = request.user  # type: ignore[attr-defined]
        data = request.get_json(silent=True) or {}
        monument_id_raw = (data.get("monumentId") or "").strip()
        date_value = (data.get("inspectionDate") or "").strip()
        type_value = (data.get("inspectionType") or "").strip()
        observation = (data.get("observation") or "").strip()
        image_url = (data.get("image") or "").strip() or None
        status_ui = (data.get("status") or "En cours").strip()
        fissures = data.get("fissures") or []

        if not monument_id_raw or not date_value or not type_value:
            return jsonify({"error": "monumentId, inspectionDate and inspectionType are required"}), 400

        try:
            monument_id = int(monument_id_raw.replace("m", ""))
        except ValueError:
            return jsonify({"error": "Invalid monumentId"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO INSPECTION (date_inspection, type_inspection, observation, image_url, score_vulnerabilite, statut, id_monument, id_utilisateur)
                    VALUES (%s, %s, %s, %s, 0, %s, %s, %s)
                    """,
                    (date_value, type_value, observation, image_url, inspection_statut_to_db(status_ui), monument_id, int(payload.get("sub"))),
                )
                inspection_id = cur.lastrowid

                for f in fissures:
                    gravite_db = fissure_gravite_to_db((f.get("gravityLevel") or "").strip())
                    cur.execute(
                        """
                        INSERT INTO FISSURE (description, date_detection, gravite, id_inspection)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            (f.get("description") or "").strip(),
                            date_value,
                            gravite_db,
                            inspection_id,
                        ),
                    )

                cur.execute(
                    """
                    SELECT i.id_inspection, i.id_monument, i.id_utilisateur, i.date_inspection, i.type_inspection, i.image_url,
                           i.observation, i.score_vulnerabilite, i.statut, m.nom AS monument_nom, u.nom AS expert_nom
                    FROM INSPECTION i
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = i.id_utilisateur
                    WHERE i.id_inspection = %s
                    LIMIT 1
                    """,
                    (inspection_id,),
                )
                row = cur.fetchone()
                cur.execute(
                    """
                    SELECT id_fissure, id_inspection, description, date_detection, gravite
                    FROM FISSURE
                    WHERE id_inspection = %s
                    ORDER BY id_fissure ASC
                    """,
                    (inspection_id,),
                )
                fissure_rows = cur.fetchall()
            conn.commit()
            fissures_ui = [
                {
                    "id": f"f{f['id_fissure']}",
                    "description": f["description"] or "",
                    "detectionDate": to_iso_date(f["date_detection"]),
                    "gravityLevel": fissure_gravite_to_ui(f["gravite"]),
                }
                for f in fissure_rows
            ]
            return jsonify(serialize_inspection(row, fissures_ui))
        finally:
            conn.close()

    @app.put("/inspections/<int:inspection_id>")
    @require_auth
    @require_roles("Expert")
    def inspections_update(inspection_id: int):
        payload = request.user  # type: ignore[attr-defined]
        data = request.get_json(silent=True) or {}

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id_utilisateur FROM INSPECTION WHERE id_inspection = %s LIMIT 1", (inspection_id,))
                owner = cur.fetchone()
                if not owner:
                    return jsonify({"error": "Inspection not found"}), 404
                if int(owner["id_utilisateur"]) != int(payload.get("sub")):
                    return jsonify({"error": "Forbidden"}), 403

                monument_id = int(str(data.get("monumentId", "")).replace("m", ""))
                cur.execute(
                    """
                    UPDATE INSPECTION
                    SET date_inspection=%s, type_inspection=%s, observation=%s, image_url=%s, statut=%s, id_monument=%s
                    WHERE id_inspection=%s
                    """,
                    (
                        (data.get("inspectionDate") or "").strip(),
                        (data.get("inspectionType") or "").strip(),
                        (data.get("observation") or "").strip(),
                        (data.get("image") or "").strip() or None,
                        inspection_statut_to_db((data.get("status") or "En cours").strip()),
                        monument_id,
                        inspection_id,
                    ),
                )

                cur.execute("DELETE FROM FISSURE WHERE id_inspection = %s", (inspection_id,))
                for f in (data.get("fissures") or []):
                    cur.execute(
                        """
                        INSERT INTO FISSURE (description, date_detection, gravite, id_inspection)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            (f.get("description") or "").strip(),
                            (data.get("inspectionDate") or "").strip(),
                            fissure_gravite_to_db((f.get("gravityLevel") or "").strip()),
                            inspection_id,
                        ),
                    )

                cur.execute(
                    """
                    SELECT i.id_inspection, i.id_monument, i.id_utilisateur, i.date_inspection, i.type_inspection, i.image_url,
                           i.observation, i.score_vulnerabilite, i.statut, m.nom AS monument_nom, u.nom AS expert_nom
                    FROM INSPECTION i
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = i.id_utilisateur
                    WHERE i.id_inspection = %s
                    LIMIT 1
                    """,
                    (inspection_id,),
                )
                row = cur.fetchone()
                cur.execute(
                    "SELECT id_fissure, id_inspection, description, date_detection, gravite FROM FISSURE WHERE id_inspection=%s ORDER BY id_fissure ASC",
                    (inspection_id,),
                )
                fissure_rows = cur.fetchall()
            conn.commit()
            fissures_ui = [
                {"id": f"f{f['id_fissure']}", "description": f["description"] or "", "detectionDate": to_iso_date(f["date_detection"]), "gravityLevel": fissure_gravite_to_ui(f["gravite"])}
                for f in fissure_rows
            ]
            return jsonify(serialize_inspection(row, fissures_ui))
        finally:
            conn.close()

    @app.delete("/inspections/<int:inspection_id>")
    @require_auth
    @require_roles("Expert")
    def inspections_delete(inspection_id: int):
        payload = request.user  # type: ignore[attr-defined]
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id_utilisateur FROM INSPECTION WHERE id_inspection = %s LIMIT 1", (inspection_id,))
                owner = cur.fetchone()
                if not owner:
                    return jsonify({"error": "Inspection not found"}), 404
                if int(owner["id_utilisateur"]) != int(payload.get("sub")):
                    return jsonify({"error": "Forbidden"}), 403
                try:
                    cur.execute("DELETE FROM INSPECTION WHERE id_inspection = %s", (inspection_id,))
                except Exception:
                    return jsonify({"error": "Cannot delete inspection linked to reports/alerts"}), 409
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.get("/reports")
    @require_auth
    def reports_list():
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.*, u.nom AS expert_nom, m.nom AS monument_nom
                    FROM RAPPORT r
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = r.id_utilisateur
                    LEFT JOIN INSPECTION i ON i.id_inspection = r.id_inspection
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    ORDER BY r.date_rapport DESC, r.id_rapport DESC
                    """
                )
                rows = cur.fetchall()
            return jsonify([serialize_rapport(r) for r in rows])
        finally:
            conn.close()

    @app.post("/reports")
    @require_auth
    @require_roles("Expert")
    def reports_create():
        payload = request.user  # type: ignore[attr-defined]
        data = request.get_json(silent=True) or {}

        inspection_raw = (data.get("inspectionId") or "").strip()
        diagnostic = (data.get("diagnosticStructurel") or "").strip()
        analyse = (data.get("analyseFissures") or "").strip()
        recommandations = (data.get("recommandations") or "").strip()
        priorite_ui = (data.get("niveauPriorite") or "Moyen").strip()

        if not inspection_raw or not diagnostic or not recommandations:
            return jsonify({"error": "inspectionId, diagnosticStructurel and recommandations are required"}), 400

        try:
            inspection_id = int(inspection_raw.replace("i", ""))
        except ValueError:
            return jsonify({"error": "Invalid inspectionId"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO RAPPORT
                    (date_rapport, diagnostic_structurel, analyse_fissures, recommandations, niveau_priorite, statut, id_inspection, id_utilisateur)
                    VALUES (CURDATE(), %s, %s, %s, %s, 'en_attente', %s, %s)
                    """,
                    (diagnostic, analyse, recommandations, rapport_priorite_to_db(priorite_ui), inspection_id, int(payload.get("sub"))),
                )
                report_id = cur.lastrowid

                # Notification autorités à la création d'un rapport expert
                cur.execute(
                    """
                    INSERT INTO ALERTE (date_alerte, message, niveau, statut, type_degradation, alerte_recue, id_inspection, id_utilisateur)
                    SELECT NOW(), CONCAT('Nouveau rapport expert créé (inspection #', %s, ').'), 'moyen', 'nouvelle',
                           'rapport_expert', FALSE, %s, u.id_utilisateur
                    FROM UTILISATEUR u
                    WHERE u.role = 'autorite'
                    """,
                    (inspection_id, inspection_id),
                )

                cur.execute(
                    """
                    SELECT r.*, u.nom AS expert_nom, m.nom AS monument_nom
                    FROM RAPPORT r
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = r.id_utilisateur
                    LEFT JOIN INSPECTION i ON i.id_inspection = r.id_inspection
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    WHERE r.id_rapport = %s
                    LIMIT 1
                    """,
                    (report_id,),
                )
                row = cur.fetchone()
            conn.commit()
            return jsonify(serialize_rapport(row))
        finally:
            conn.close()

    @app.put("/reports/<int:report_id>")
    @require_auth
    @require_roles("Expert")
    def reports_update(report_id: int):
        payload = request.user  # type: ignore[attr-defined]
        data = request.get_json(silent=True) or {}

        diagnostic = (data.get("diagnosticStructurel") or "").strip()
        analyse = (data.get("analyseFissures") or "").strip()
        recommandations = (data.get("recommandations") or "").strip()
        priorite_ui = (data.get("niveauPriorite") or "Moyen").strip()
        inspection_raw = (data.get("inspectionId") or "").strip()

        if not diagnostic or not recommandations:
            return jsonify({"error": "diagnosticStructurel and recommandations are required"}), 400

        try:
            inspection_id = int(inspection_raw.replace("i", "")) if inspection_raw else None
        except ValueError:
            return jsonify({"error": "Invalid inspectionId"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id_utilisateur, id_inspection FROM RAPPORT WHERE id_rapport=%s LIMIT 1", (report_id,))
                existing = cur.fetchone()
                if not existing:
                    return jsonify({"error": "Rapport not found"}), 404
                if int(existing["id_utilisateur"]) != int(payload.get("sub")):
                    return jsonify({"error": "Forbidden"}), 403

                cur.execute(
                    """
                    UPDATE RAPPORT
                    SET diagnostic_structurel=%s,
                        analyse_fissures=%s,
                        recommandations=%s,
                        niveau_priorite=%s,
                        id_inspection=%s
                    WHERE id_rapport=%s
                    """,
                    (
                        diagnostic,
                        analyse,
                        recommandations,
                        rapport_priorite_to_db(priorite_ui),
                        inspection_id or int(existing["id_inspection"]),
                        report_id,
                    ),
                )

                cur.execute(
                    """
                    SELECT r.*, u.nom AS expert_nom, m.nom AS monument_nom
                    FROM RAPPORT r
                    LEFT JOIN UTILISATEUR u ON u.id_utilisateur = r.id_utilisateur
                    LEFT JOIN INSPECTION i ON i.id_inspection = r.id_inspection
                    LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                    WHERE r.id_rapport = %s
                    LIMIT 1
                    """,
                    (report_id,),
                )
                row = cur.fetchone()
            conn.commit()
            return jsonify(serialize_rapport(row))
        finally:
            conn.close()

    @app.put("/reports/<int:report_id>/status")
    @require_auth
    @require_roles("Authority")
    def reports_update_status(report_id: int):
        data = request.get_json(silent=True) or {}
        statut_ui = (data.get("statut") or "").strip()
        commentaire = (data.get("commentaireAutorite") or "").strip()
        statut_db = rapport_statut_to_db(statut_ui)
        if statut_db not in {"valide", "rejete"}:
            return jsonify({"error": "Invalid statut"}), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE RAPPORT
                    SET statut = %s
                    WHERE id_rapport = %s
                    """,
                    (statut_db, report_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"error": "Rapport not found"}), 404

                # commentaire authority stored in ALERTE message add-on for traceability (DB lacks dedicated column)
                if commentaire:
                    cur.execute(
                        """
                        INSERT INTO ALERTE (date_alerte, message, niveau, statut, type_degradation, alerte_recue, id_inspection, id_utilisateur)
                        SELECT NOW(),
                               CONCAT('Décision autorité sur rapport #', %s, ': ', %s),
                               'faible', 'nouvelle', 'decision_rapport', FALSE, r.id_inspection, r.id_utilisateur
                        FROM RAPPORT r
                        WHERE r.id_rapport = %s
                        """,
                        (report_id, commentaire, report_id),
                    )
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.get("/alerts")
    @require_auth
    def alerts_list():
        payload = request.user  # type: ignore[attr-defined]
        role = payload.get("role")
        user_id = int(payload.get("sub", 0))

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                if role == "Authority":
                    cur.execute(
                        """
                        SELECT a.id_alerte, a.date_alerte, a.message, a.niveau, a.statut, a.type_degradation,
                               a.alerte_recue, a.id_inspection, m.nom AS monument_nom
                        FROM ALERTE a
                        LEFT JOIN INSPECTION i ON i.id_inspection = a.id_inspection
                        LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                        WHERE a.id_utilisateur = %s OR a.id_utilisateur IS NULL
                        ORDER BY a.date_alerte DESC, a.id_alerte DESC
                        """,
                        (user_id,),
                    )
                else:
                    cur.execute(
                        """
                        SELECT a.id_alerte, a.date_alerte, a.message, a.niveau, a.statut, a.type_degradation,
                               a.alerte_recue, a.id_inspection, m.nom AS monument_nom
                        FROM ALERTE a
                        LEFT JOIN INSPECTION i ON i.id_inspection = a.id_inspection
                        LEFT JOIN MONUMENT m ON m.id_monument = i.id_monument
                        ORDER BY a.date_alerte DESC, a.id_alerte DESC
                        """
                    )
                rows = cur.fetchall()
            result = [
                {
                    "id": f"a{r['id_alerte']}",
                    "date": str(r["date_alerte"]),
                    "message": r["message"],
                    "alertLevel": alerte_niveau_to_ui(r["niveau"]),
                    "degradationType": r["type_degradation"] or "",
                    "status": alerte_statut_to_ui(r["statut"]),
                    "received": bool(r["alerte_recue"]),
                    "inspectionId": f"i{r['id_inspection']}",
                    "monumentName": r["monument_nom"] or "",
                }
                for r in rows
            ]
            return jsonify(result)
        finally:
            conn.close()

    @app.post("/alerts/<int:alert_id>/read")
    @require_auth
    @require_roles("Authority")
    def alerts_mark_read(alert_id: int):
        payload = request.user  # type: ignore[attr-defined]
        user_id = int(payload.get("sub", 0))
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE ALERTE
                    SET alerte_recue = TRUE
                    WHERE id_alerte = %s
                      AND (id_utilisateur = %s OR id_utilisateur IS NULL)
                    """,
                    (alert_id, user_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"error": "Alerte not found"}), 404
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    @app.post("/alerts/read-all")
    @require_auth
    @require_roles("Authority")
    def alerts_mark_all_read():
        payload = request.user  # type: ignore[attr-defined]
        user_id = int(payload.get("sub", 0))
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE ALERTE
                    SET alerte_recue = TRUE
                    WHERE id_utilisateur = %s OR id_utilisateur IS NULL
                    """,
                    (user_id,),
                )
            conn.commit()
            return jsonify({"ok": True})
        finally:
            conn.close()

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)

