"""
migrate_encrypt_reports.py — Migration de chiffrement des champs sensibles de RAPPORT.

Ce script chiffre en place les colonnes :
  - diagnostic_structurel
  - analyse_fissures
  - recommandations

Fonctionnement :
  1. Lit chaque rapport en batch (100 lignes)
  2. Pour chaque champ non encore chiffré, applique encrypt_field()
  3. Met à jour la ligne en base
  4. Affiche un résumé final

Pré-requis :
  export FIELD_ENCRYPTION_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

Sécurité :
  - Idempotent : peut être relancé sans danger (is_encrypted guard)
  - Transactionnel : rollback sur erreur par batch
  - Vérifie la déchiffrement après chiffrement (round-trip check)

Usage :
  python migrate_encrypt_reports.py [--dry-run] [--batch-size 100]
"""

from __future__ import annotations

import argparse
import sys
import os

# Ajout du répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pymysql
    import pymysql.cursors
except ImportError:
    print("ERREUR: pip install pymysql", file=sys.stderr)
    sys.exit(1)


SENSITIVE_FIELDS = ["diagnostic_structurel", "analyse_fissures", "recommandations"]
BATCH_SIZE = 100


def get_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "taroudant_heritage_shield"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def run(dry_run: bool = False, batch_size: int = BATCH_SIZE):
    # Import du module de chiffrement
    try:
        from encryption import encrypt_field, decrypt_field, is_encrypted
    except ImportError:
        print("ERREUR: Le module encryption.py est introuvable.", file=sys.stderr)
        sys.exit(1)

    # Vérification de la clé
    try:
        test_enc = encrypt_field("test")
        test_dec = decrypt_field(test_enc)
        assert test_dec == "test", "Round-trip échoué"
    except Exception as exc:
        print(f"ERREUR: Vérification de la clé échouée : {exc}", file=sys.stderr)
        sys.exit(1)

    conn = get_conn()
    total_updated = 0
    total_skipped = 0
    total_errors = 0

    try:
        offset = 0
        while True:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id_rapport, {', '.join(SENSITIVE_FIELDS)} "
                    f"FROM RAPPORT ORDER BY id_rapport LIMIT %s OFFSET %s",
                    (batch_size, offset),
                )
                rows = cur.fetchall()

            if not rows:
                break

            for row in rows:
                rapport_id = row["id_rapport"]
                updates = {}

                for field_name in SENSITIVE_FIELDS:
                    value = row[field_name]
                    if value is None or is_encrypted(value):
                        total_skipped += 1
                        continue

                    encrypted = encrypt_field(value)

                    # Vérification round-trip
                    try:
                        decrypted = decrypt_field(encrypted)
                        assert decrypted == value
                    except Exception as exc:
                        print(
                            f"  ERREUR round-trip rapport #{rapport_id} "
                            f"champ {field_name}: {exc}",
                            file=sys.stderr
                        )
                        total_errors += 1
                        continue

                    updates[field_name] = encrypted

                if not updates:
                    continue

                if dry_run:
                    print(
                        f"  [DRY-RUN] Rapport #{rapport_id} : "
                        f"chiffrement de {list(updates.keys())}"
                    )
                    total_updated += len(updates)
                    continue

                try:
                    set_clause = ", ".join(f"{k}=%s" for k in updates)
                    values = list(updates.values()) + [rapport_id]
                    with conn.cursor() as cur:
                        cur.execute(
                            f"UPDATE RAPPORT SET {set_clause} WHERE id_rapport=%s",
                            values,
                        )
                    conn.commit()
                    total_updated += len(updates)
                    print(f"  OK rapport #{rapport_id} → {list(updates.keys())}")
                except Exception as exc:
                    conn.rollback()
                    print(
                        f"  ERREUR rapport #{rapport_id}: {exc}",
                        file=sys.stderr
                    )
                    total_errors += 1

            offset += batch_size

    finally:
        conn.close()

    print("\n" + "="*50)
    print(f"Migration {'(DRY-RUN) ' if dry_run else ''}terminée :")
    print(f"  Champs chiffrés  : {total_updated}")
    print(f"  Déjà chiffrés    : {total_skipped}")
    print(f"  Erreurs          : {total_errors}")

    if total_errors > 0:
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Chiffre les champs sensibles des rapports d'expertise."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Simule sans modifier la base de données"
    )
    parser.add_argument(
        "--batch-size", type=int, default=BATCH_SIZE,
        help=f"Nombre de rapports traités par batch (défaut: {BATCH_SIZE})"
    )
    args = parser.parse_args()
    run(dry_run=args.dry_run, batch_size=args.batch_size)


if __name__ == "__main__":
    main()