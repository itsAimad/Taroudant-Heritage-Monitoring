"""
two_factor.py — Authentification à deux facteurs (TOTP / RFC 6238).

Protocole : Time-based One-Time Password (Google Authenticator, Authy, etc.)
  - Secret par utilisateur (32 caractères base32, stocké chiffré en base)
  - Fenêtre de validité : ±1 intervalle de 30s (tolérance dérive d'horloge)
  - QR code pour onboarding via app mobile

Schéma de migration requis :
  ALTER TABLE UTILISATEUR
    ADD COLUMN totp_secret      VARCHAR(64)  NULL COMMENT 'EN: TOTP secret (encrypted)',
    ADD COLUMN totp_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN totp_backup_used BOOLEAN      NOT NULL DEFAULT FALSE;

Endpoints à ajouter dans app.py :
  POST /auth/2fa/setup   → génère secret + QR code (Expert, Authority, Admin)
  POST /auth/2fa/verify  → vérifie code OTP + active 2FA
  POST /auth/2fa/disable → désactive 2FA (Admin uniquement sur un autre user)
  POST /auth/login/2fa   → second facteur après mot de passe valide (nouveau flow)
"""

from __future__ import annotations

import base64
import io
import os
import struct
import time
from typing import Optional

try:
    import pyotp
    _PYOTP_AVAILABLE = True
except ImportError:
    _PYOTP_AVAILABLE = False

try:
    import qrcode
    _QRCODE_AVAILABLE = True
except ImportError:
    _QRCODE_AVAILABLE = False


APP_NAME = "Taroudant Heritage Shield"
TOTP_WINDOW = 1  # ±1 intervalle de 30s


# ---------------------------------------------------------------------------
# Gestion du secret TOTP
# ---------------------------------------------------------------------------

def generate_totp_secret() -> str:
    """Génère un secret TOTP aléatoire (base32, 32 caractères = 160 bits)."""
    if not _PYOTP_AVAILABLE:
        raise RuntimeError("pip install pyotp")
    return pyotp.random_base32()


def get_totp_uri(secret: str, user_email: str) -> str:
    """Retourne l'URI otpauth:// pour scanner en QR code."""
    if not _PYOTP_AVAILABLE:
        raise RuntimeError("pip install pyotp")
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=user_email, issuer_name=APP_NAME)


def generate_qr_code_base64(uri: str) -> str:
    """
    Génère un QR code PNG encodé en base64 à partir de l'URI TOTP.
    Retourne une data URI utilisable directement dans un <img src="...">.
    """
    if not _QRCODE_AVAILABLE:
        # Fallback : retourne l'URI brute pour saisie manuelle
        return ""

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=6,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def verify_totp(secret: str, code: str) -> bool:
    """
    Vérifie un code TOTP à 6 chiffres.

    Args:
        secret : Secret base32 de l'utilisateur (déchiffré).
        code   : Code saisi par l'utilisateur (6 chiffres).

    Returns:
        True si valide dans la fenêtre temporelle ±TOTP_WINDOW.
    """
    if not _PYOTP_AVAILABLE:
        raise RuntimeError("pip install pyotp")

    # Nettoyage défensif — évite les attaques par padding
    code = code.strip().replace(" ", "")
    if not code.isdigit() or len(code) != 6:
        return False

    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=TOTP_WINDOW)


# ---------------------------------------------------------------------------
# Codes de récupération (backup codes)
# ---------------------------------------------------------------------------

def generate_backup_codes(count: int = 8) -> list[str]:
    """
    Génère N codes de récupération à usage unique (format XXXX-XXXX).
    À stocker hashés (bcrypt) en base, jamais en clair.
    """
    import secrets as _secrets
    codes = []
    for _ in range(count):
        raw = _secrets.token_hex(4).upper()
        codes.append(f"{raw[:4]}-{raw[4:]}")
    return codes


# ---------------------------------------------------------------------------
# Flow d'authentification 2FA — exemple d'intégration Flask
# ---------------------------------------------------------------------------

TWO_FACTOR_FLOW_EXAMPLE = """
# Intégration dans app.py

# 1) login() émet un token de pré-authentification si 2FA est activé
@app.post("/auth/login")
def login():
    ...
    if user_row["totp_enabled"]:
        # Token court (5 min) encodant l'état "en attente 2FA"
        pre_auth_payload = {
            "sub": str(user_row["id_utilisateur"]),
            "phase": "2fa_pending",
            "exp": int((datetime.utcnow() + timedelta(minutes=5)).timestamp()),
        }
        pre_token = jwt.encode(pre_auth_payload, app.config["JWT_SECRET"], ...)
        return jsonify({"requires2FA": True, "preAuthToken": pre_token}), 200
    # Sinon : émet le token complet (flow actuel inchangé)
    ...

# 2) Endpoint de validation du code TOTP
@app.post("/auth/login/2fa")
def login_2fa():
    data = request.get_json() or {}
    pre_token = (data.get("preAuthToken") or "").strip()
    code = (data.get("totpCode") or "").strip()

    try:
        payload = jwt.decode(pre_token, app.config["JWT_SECRET"], ...)
    except jwt.PyJWTError:
        return jsonify({"error": "Token invalide"}), 401

    if payload.get("phase") != "2fa_pending":
        return jsonify({"error": "Token invalide"}), 401

    user_id = int(payload["sub"])
    user = fetch_one("SELECT * FROM UTILISATEUR WHERE id_utilisateur=%s", (user_id,))

    from encryption import decrypt_field
    from two_factor import verify_totp

    secret = decrypt_field(user["totp_secret"])
    if not verify_totp(secret, code):
        # Log tentative échouée dans AUDIT_LOG
        return jsonify({"error": "Code invalide"}), 401

    # Émet le token complet
    ...

# 3) Setup 2FA
@app.post("/auth/2fa/setup")
@require_auth
def setup_2fa():
    from two_factor import generate_totp_secret, get_totp_uri, generate_qr_code_base64
    from encryption import encrypt_field

    secret = generate_totp_secret()
    uri = get_totp_uri(secret, request.user["email"])
    qr = generate_qr_code_base64(uri)

    # Stocke le secret chiffré (non encore activé)
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE UTILISATEUR SET totp_secret=%s WHERE id_utilisateur=%s",
            (encrypt_field(secret), int(request.user["sub"]))
        )
    conn.commit()

    return jsonify({"qrCode": qr, "manualCode": secret})
"""
