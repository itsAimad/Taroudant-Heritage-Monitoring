"""
test_security.py — Tests unitaires des modules de sécurité.

Lancement :
    FIELD_ENCRYPTION_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") \
    python -m pytest test_security.py -v
"""

from __future__ import annotations

import os
import sys
import time
import unittest

# Clé de test — injectée avant tout import de encryption.py
os.environ.setdefault(
    "FIELD_ENCRYPTION_KEY",
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ---------------------------------------------------------------------------
# Tests — Chiffrement AES-256-GCM
# ---------------------------------------------------------------------------

class TestEncryption(unittest.TestCase):

    def setUp(self):
        # Reset le cache de clé pour repartir propre
        import encryption
        encryption._cached_key = encryption._SENTINEL

    def _module(self):
        import encryption
        return encryption

    def test_encrypt_decrypt_roundtrip(self):
        enc = self._module()
        plain = "Fissures profondes en arc de cercle, risque d'effondrement partiel."
        encrypted = enc.encrypt_field(plain)
        self.assertIsNotNone(encrypted)
        self.assertTrue(encrypted.startswith("ENC:"))
        decrypted = enc.decrypt_field(encrypted)
        self.assertEqual(decrypted, plain)

    def test_encrypt_produces_different_ciphertexts(self):
        """Deux chiffrements du même texte doivent donner des résultats différents (nonce aléatoire)."""
        enc = self._module()
        plain = "Données sensibles identiques"
        c1 = enc.encrypt_field(plain)
        c2 = enc.encrypt_field(plain)
        self.assertNotEqual(c1, c2)

    def test_decrypt_none_returns_none(self):
        enc = self._module()
        self.assertIsNone(enc.decrypt_field(None))

    def test_encrypt_none_returns_none(self):
        enc = self._module()
        self.assertIsNone(enc.encrypt_field(None))

    def test_plaintext_passthrough(self):
        """Valeur non préfixée ENC: → retournée telle quelle (rétrocompatibilité)."""
        enc = self._module()
        plain = "Ancien rapport non chiffré"
        result = enc.decrypt_field(plain)
        self.assertEqual(result, plain)

    def test_is_encrypted(self):
        enc = self._module()
        encrypted = enc.encrypt_field("test")
        self.assertTrue(enc.is_encrypted(encrypted))
        self.assertFalse(enc.is_encrypted("texte normal"))
        self.assertFalse(enc.is_encrypted(None))

    def test_tamper_detection(self):
        """Une modification du ciphertext doit lever une exception."""
        enc = self._module()
        encrypted = enc.encrypt_field("données critiques")
        # Modifie un caractère dans la partie ciphertext
        parts = encrypted.split(":")
        corrupted = parts[0] + ":" + parts[1] + ":" + parts[2][:-4] + "XXXX:" + parts[3]
        with self.assertRaises(Exception):
            enc.decrypt_field(corrupted)

    def test_migrate_encrypt_idempotent(self):
        enc = self._module()
        plain = "Données à migrer"
        encrypted = enc.migrate_encrypt_field(plain)
        self.assertTrue(encrypted.startswith("ENC:"))
        # Relancer sur valeur déjà chiffrée → inchangé
        same = enc.migrate_encrypt_field(encrypted)
        self.assertEqual(same, encrypted)

    def test_empty_string(self):
        enc = self._module()
        encrypted = enc.encrypt_field("")
        self.assertTrue(encrypted.startswith("ENC:"))
        self.assertEqual(enc.decrypt_field(encrypted), "")

    def test_unicode_content(self):
        enc = self._module()
        text = "Patrimoine historique : دار السلطان — fissures ≥ 3 mm. Urgence: ‼️"
        self.assertEqual(enc.decrypt_field(enc.encrypt_field(text)), text)

    def test_long_content(self):
        enc = self._module()
        text = "A" * 50_000  # 50 Ko de texte
        encrypted = enc.encrypt_field(text)
        self.assertEqual(enc.decrypt_field(encrypted), text)

    def test_wrong_key_fails(self):
        """Un chiffrement avec clé A ne peut pas être déchiffré avec clé B."""
        import encryption
        original_key = os.environ["FIELD_ENCRYPTION_KEY"]

        encryption._cached_key = encryption._SENTINEL
        encrypted = encryption.encrypt_field("secret")

        # Change la clé
        os.environ["FIELD_ENCRYPTION_KEY"] = "b" * 64
        encryption._cached_key = encryption._SENTINEL

        with self.assertRaises(Exception):
            encryption.decrypt_field(encrypted)

        # Restaure
        os.environ["FIELD_ENCRYPTION_KEY"] = original_key
        encryption._cached_key = encryption._SENTINEL

    def test_invalid_key_format(self):
        import encryption
        encryption._cached_key = encryption._SENTINEL
        os.environ["FIELD_ENCRYPTION_KEY"] = "not_hex!!"
        with self.assertRaises(ValueError):
            encryption.encrypt_field("test")
        # Restaure
        os.environ["FIELD_ENCRYPTION_KEY"] = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
        encryption._cached_key = encryption._SENTINEL

    def test_key_too_short(self):
        import encryption
        encryption._cached_key = encryption._SENTINEL
        os.environ["FIELD_ENCRYPTION_KEY"] = "a1b2"  # 2 octets seulement
        with self.assertRaises(ValueError):
            encryption.encrypt_field("test")
        # Restaure
        os.environ["FIELD_ENCRYPTION_KEY"] = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
        encryption._cached_key = encryption._SENTINEL


# ---------------------------------------------------------------------------
# Tests — Rate Limiter
# ---------------------------------------------------------------------------

class TestRateLimiter(unittest.TestCase):

    def _make_limiter(self, max_req=3, window_s=2):
        from rate_limit import RateLimiter
        limiter = RateLimiter()
        limiter.add_rule("test_endpoint", max_requests=max_req, window_seconds=window_s)
        return limiter

    def test_under_limit_allowed(self):
        limiter = self._make_limiter(max_req=5)
        for _ in range(5):
            self.assertTrue(limiter.check("test_endpoint", "192.168.1.1"))

    def test_over_limit_blocked(self):
        limiter = self._make_limiter(max_req=3)
        for _ in range(3):
            limiter.check("test_endpoint", "10.0.0.1")
        self.assertFalse(limiter.check("test_endpoint", "10.0.0.1"))

    def test_different_ips_independent(self):
        limiter = self._make_limiter(max_req=2)
        limiter.check("test_endpoint", "1.2.3.4")
        limiter.check("test_endpoint", "1.2.3.4")
        # IP différente : indépendante
        self.assertTrue(limiter.check("test_endpoint", "9.9.9.9"))

    def test_sliding_window_expires(self):
        limiter = self._make_limiter(max_req=2, window_s=1)
        limiter.check("test_endpoint", "5.5.5.5")
        limiter.check("test_endpoint", "5.5.5.5")
        self.assertFalse(limiter.check("test_endpoint", "5.5.5.5"))
        time.sleep(1.1)  # Fenêtre expirée
        self.assertTrue(limiter.check("test_endpoint", "5.5.5.5"))

    def test_no_rule_allows_all(self):
        limiter = self._make_limiter()
        for _ in range(100):
            self.assertTrue(limiter.check("unknown_endpoint", "x.x.x.x"))

    def test_reset_clears_counter(self):
        limiter = self._make_limiter(max_req=2)
        limiter.check("test_endpoint", "7.7.7.7")
        limiter.check("test_endpoint", "7.7.7.7")
        self.assertFalse(limiter.check("test_endpoint", "7.7.7.7"))
        limiter.reset("test_endpoint", "7.7.7.7")
        self.assertTrue(limiter.check("test_endpoint", "7.7.7.7"))

    def test_remaining_decrements(self):
        limiter = self._make_limiter(max_req=5)
        self.assertEqual(limiter.remaining("test_endpoint", "3.3.3.3"), 5)
        limiter.check("test_endpoint", "3.3.3.3")
        self.assertEqual(limiter.remaining("test_endpoint", "3.3.3.3"), 4)

    def test_thread_safety(self):
        """Vérifie qu'il n'y a pas de race condition sous charge."""
        import threading
        limiter = self._make_limiter(max_req=50, window_s=10)
        results = []
        lock = threading.Lock()

        def worker():
            allowed = limiter.check("test_endpoint", "concurrent")
            with lock:
                results.append(allowed)

        threads = [threading.Thread(target=worker) for _ in range(60)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        allowed_count = sum(1 for r in results if r)
        self.assertLessEqual(allowed_count, 50)


# ---------------------------------------------------------------------------
# Tests — Performance du chiffrement
# ---------------------------------------------------------------------------

class TestEncryptionPerformance(unittest.TestCase):

    def test_encrypt_100_fields(self):
        import encryption
        text = "Diagnostic complet : fissures verticales sur pilier nord-est, " \
               "éclatement du béton en surface, armatures visibles sur 40 cm. " \
               "Risque d'effondrement progressif estimé à 6 mois sans intervention."

        start = time.perf_counter()
        for _ in range(100):
            enc = encryption.encrypt_field(text)
            encryption.decrypt_field(enc)
        elapsed = time.perf_counter() - start

        # 100 cycles chiffrement+déchiffrement < 1 seconde sur hardware moderne
        self.assertLess(elapsed, 1.0, f"Chiffrement trop lent: {elapsed:.3f}s pour 100 cycles")


if __name__ == "__main__":
    unittest.main(verbosity=2)