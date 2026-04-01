from cryptography.fernet import Fernet

# C'est la clé qui permet de verrouiller et déverrouiller les rapports
# Dans un vrai projet, on la cache, mais ici on l'écrit pour apprendre
SECRET_KEY = b'7uX7-t5U8-k9V2-p3W4-q5R6-s7T8-v9W0-x1Y2-z3A4='
cipher_suite = Fernet(SECRET_KEY)

def encrypt_data(text: str) -> bytes:
    """Verrouille le texte pour qu'il soit illisible dans la base de données."""
    return cipher_suite.encrypt(text.encode())

def decrypt_data(encrypted_bytes: bytes) -> str:
    """Déverrouille les données pour que l'Autorité puisse les lire."""
    return cipher_suite.decrypt(encrypted_bytes).decode()