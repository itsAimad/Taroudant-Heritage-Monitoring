from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection  # On suppose que ce fichier existe pour ta BDD
from services.report_service import save_inspector_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate")
def generate_report(monument_id: int, inspection_id: int, inspector_id: int, content: str):
    # 1. On récupère la connexion à la base de données
    db = get_db_connection()
    
    # 2. On appelle TA fonction de service qui chiffre et sauvegarde
    success = save_inspector_report(db, monument_id, inspection_id, inspector_id, content)
    
    if success:
        return {"message": "Rapport généré, chiffré et sauvegardé avec succès !"}
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du rapport")