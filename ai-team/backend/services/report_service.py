from utils.encryption import encrypt_data

def save_inspector_report(db_connection, monument_id, inspection_id, inspector_id, text_content):
    """Prépare et enregistre le rapport chiffré dans la base de données."""
    try:
        cursor = db_connection.cursor()
        
        # 1. On utilise ton code de sécurité pour chiffrer le rapport
        encrypted_text = encrypt_data(text_content)
        
        # 2. On prépare la commande SQL pour la table 'reports'
        # On enregistre l'ID du monument, de l'inspection et le contenu illisible
        query = """
            INSERT INTO reports (monument_id, inspection_id, generated_by, encrypted_content, status)
            VALUES (%s, %s, %s, %s, 'final')
        """
        
        # 3. On envoie les données
        cursor.execute(query, (monument_id, inspection_id, inspector_id, encrypted_text))
        db_connection.commit()
        
        print("✅ Rapport chiffré et sauvegardé avec succès !")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde : {e}")
        return False
    finally:
        cursor.close()