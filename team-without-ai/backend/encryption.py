"""
encryption.py — Chiffrement AES-256-GCM des champs sensibles des rapports d'expertise.

Pourquoi AES-256-GCM ?
  - Confidentialité : chiffrement symétrique 256 bits, résistant aux attaques brute-force actuelles
  - Intégrité     : le tag d'authentification (16 octets) détecte toute altération des données
  - Performances  : opérations en O(n) sur la taille des données, pas de surcharge asymétrique

Schéma de stockage en base :
  Le champ chiffré est stocké sous forme de chaîne base64 :
      <nonce_12b>:<ciphertext>:<tag_16b>
  Chaque chiffrement utilise un nonce aléatoire frais → deux chiffrements du même texte
  produisent des ciphertexts différents (sécurité IND-CPA).

Clé de chiffrement :
  Fournie via la variable d'environnement FIELD_ENCRYPTION_KEY (32 octets hex).
  Génération : python -c "import secrets; print(secrets.token_hex(32))"
"""

from __future__ import annotations

import base64
import os
import struct
from typing import Optional

# ---------------------------------------------------------------------------
# Dépendance : cryptography >= 3.x  (pip install cryptography)
# ---------------------------------------------------------------------------
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    _CRYPTO_AVAILABLE = True
except ImportError:  # pragma: no cover
    _CRYPTO_AVAILABLE = False


# ---------------------------------------------------------------------------
# Clé de chiffrement
# ---------------------------------------------------------------------------

_SENTINEL = object()
_cached_key: bytes | None | object = _SENTINEL


def _load_key() -> bytes:
    """Charge et valide la clé AES-256 depuis l'environnement."""
    global _cached_key
    if _cached_key is not _SENTINEL:
        return _cached_key  # type: ignore[return-value]

    if not _CRYPTO_AVAILABLE:
        raise RuntimeError(
            "La bibliothèque 'cryptography' est requise : pip install cryptography"
        )

    raw = os.getenv("FIELD_ENCRYPTION_KEY", "")
    if not raw:
        raise EnvironmentError(
            "Variable FIELD_ENCRYPTION_KEY manquante. "
            "Générez une clé : python -c \"import secrets; print(secrets.token_hex(32))\""
        )

    try:
        key = bytes.fromhex(raw)
    except ValueError as exc:
        raise ValueError("FIELD_ENCRYPTION_KEY doit être en hexadécimal.") from exc

    if len(key) != 32:
        raise ValueError(
            f"FIELD_ENCRYPTION_KEY doit faire 32 octets (256 bits), "
            f"reçu {len(key)} octets."
        )

    _cached_key = key
    return key


# ---------------------------------------------------------------------------
# Fonctions publiques
# ---------------------------------------------------------------------------

ENCRYPTED_PREFIX = "ENC:"  # marqueur pour distinguer les valeurs chiffrées


def encrypt_field(plaintext: str | None) -> str | None:
    """
    Chiffre une valeur de champ texte avec AES-256-GCM.

    Args:
        plaintext: Valeur en clair. None est passé tel quel (champ optionnel).

    Returns:
        Chaîne préfixée "ENC:<nonce_b64>:<ciphertext_b64>:<tag_b64>"
        ou None si l'entrée est None.

    Raises:
        EnvironmentError: Clé absente.
        RuntimeError   : Bibliothèque cryptography absente.
    """
    if plaintext is None:
        return None

    key = _load_key()
    nonce = os.urandom(12)  # 96 bits — recommandé par NIST SP 800-38D pour GCM
    aesgcm = AESGCM(key)
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)

    # Le tag GCM (16 derniers octets) est concaténé au ciphertext par cryptography
    ciphertext = ciphertext_with_tag[:-16]
    tag = ciphertext_with_tag[-16:]

    encoded = (
        ENCRYPTED_PREFIX
        + base64.b64encode(nonce).decode()
        + ":"
        + base64.b64encode(ciphertext).decode()
        + ":"
        + base64.b64encode(tag).decode()
    )
    return encoded


def decrypt_field(stored: str | None) -> str | None:
    """
    Déchiffre une valeur chiffrée avec AES-256-GCM.

    Si la valeur n'est pas préfixée "ENC:" (données migrées en clair), elle
    est renvoyée telle quelle pour assurer la rétrocompatibilité.

    Args:
        stored: Valeur stockée en base (chiffrée ou non).

    Returns:
        Texte en clair, ou None.

    Raises:
        ValueError          : Données corrompues ou format invalide.
        cryptography.exceptions.InvalidTag : Tag d'authentification invalide
                                             (altération détectée).
    """
    if stored is None:
        return None

    if not stored.startswith(ENCRYPTED_PREFIX):
        # Donnée en clair (avant migration) — rétrocompatibilité
        return stored

    key = _load_key()
    payload = stored[len(ENCRYPTED_PREFIX):]

    try:
        nonce_b64, ciphertext_b64, tag_b64 = payload.split(":")
        nonce = base64.b64decode(nonce_b64)
        ciphertext = base64.b64decode(ciphertext_b64)
        tag = base64.b64decode(tag_b64)
    except (ValueError, Exception) as exc:
        raise ValueError(f"Format de champ chiffré invalide : {exc}") from exc

    aesgcm = AESGCM(key)
    # Reconstitue ciphertext||tag comme attendu par AESGCM.decrypt
    plaintext_bytes = aesgcm.decrypt(nonce, ciphertext + tag, None)
    return plaintext_bytes.decode("utf-8")


def is_encrypted(value: str | None) -> bool:
    """Retourne True si la valeur est déjà chiffrée."""
    return isinstance(value, str) and value.startswith(ENCRYPTED_PREFIX)


# ---------------------------------------------------------------------------
# Migration utilitaire
# ---------------------------------------------------------------------------

def migrate_encrypt_field(current_value: str | None) -> str | None:
    """
    Chiffre uniquement si la valeur n'est pas déjà chiffrée.
    Utile pour la migration des données existantes.
    """
    if is_encrypted(current_value):
        return current_value
    return encrypt_field(current_value)
