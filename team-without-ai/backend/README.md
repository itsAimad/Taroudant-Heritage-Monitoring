# Backend Python Flask — équipe "team-without-ai"

Ce dossier contient le serveur Python de l'équipe sans IA pour le projet Taroudant Heritage Shield.

## Architecture
- Backend : `Flask` + `PyMySQL`
- Base de données : `MySQL`
- Schéma SQL : `team-without-ai/sql/schema.sql`
- Procédures : `team-without-ai/sql/procedures.sql`
- Triggers : `team-without-ai/sql/triggers.sql`

## Prérequis
- Python 3.10+ (recommandé)
- MySQL installé et démarré
- Node.js + npm pour le frontend

## Installation du backend
1. Ouvrir un terminal dans `team-without-ai/backend`
2. Créer et activer un environnement virtuel :
   - PowerShell : `python -m venv .venv` puis `.\.venv\Scripts\Activate.ps1`
   - CMD : `python -m venv .venv` puis `.\.venv\Scripts\activate.bat`
3. Mettre à jour pip : `python -m pip install --upgrade pip`
4. Installer les dépendances : `python -m pip install -r requirements.txt`

## Initialisation de la base de données
La base de données est générée par `team-without-ai/backend/init_db.py` à partir des fichiers SQL du dossier `team-without-ai/sql`.

Commandes :

```powershell
cd team-without-ai/backend
python init_db.py
```

Par défaut, le script utilise :
- `DB_HOST=localhost`
- `DB_USER=root`
- `DB_PASSWORD=` (vide)
- `DB_PORT=3306`
- `DB_NAME=taroudant_heritage_shield`

Si vous avez des identifiants différents, utilisez des variables d'environnement avant d'exécuter `python init_db.py`.

## Variables d'environnement utiles
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_PORT`
- `DB_NAME`
- `JWT_SECRET` (par défaut `dev-change-me`)
- `JWT_ALGO` (par défaut `HS256`)
- `PORT` (par défaut `5000`)

## Lancer le serveur backend
```powershell
python app.py
```
Le backend écoute ensuite sur `http://localhost:5000`.

## Frontend
Ce backend est utilisé par le frontend du projet.
Pour lancer le frontend :

```powershell
cd team-without-ai/frontend
npm install
npm run dev
```

Ouvrir ensuite l'URL affichée par Vite (généralement `http://localhost:5173`).

## À propos de `.venv` et `__pycache__`
Ce sont des fichiers locaux générés automatiquement :
- `.venv` contient les dépendances Python locales
- `__pycache__` contient les fichiers Python compilés

Il est correct et recommandé de ne pas les pousser dans Git. Ils doivent rester dans votre machine locale.

## Partager la base de données avec les mêmes données
Si tu as déjà créé des utilisateurs et ajouté des données, tu peux partager la même base avec tes camarades en exportant la base et en leur demandant de l’importer.

### Option 1 : Avec phpMyAdmin
1. Ouvre phpMyAdmin et sélectionne la base `taroudant_heritage_shield`.
2. Va dans l’onglet `Exporter`.
3. Choisis le format `SQL` et exporte tout (`Structure et données`).
4. Envoie le fichier `.sql` à tes camarades.

Pour eux :
1. Crée la base de données ou vide la base existante.
2. Va dans `Importer` dans phpMyAdmin.
3. Sélectionne le fichier `.sql` que tu as envoyé.
4. Exécute l’import.

### Option 2 : Avec `mysqldump`
Sur ta machine où la base existe :

```powershell
mysqldump -u root -p taroudant_heritage_shield > taroudant_heritage_shield_dump.sql
```

Puis partage ce fichier `taroudant_heritage_shield_dump.sql`.

Pour tes camarades :

```powershell
mysql -u root -p taroudant_heritage_shield < taroudant_heritage_shield_dump.sql
```

### Notes importantes
- L’export/import va conserver les données existantes, y compris les utilisateurs et les monuments.
- Si vous utilisez un autre nom d’utilisateur MySQL ou un autre mot de passe, adaptez la commande `-u` et `-p`, ou utilisez des variables d’environnement.
- Si le frontend attend des utilisateurs ou des monuments existants, c’est la meilleure façon de garder les mêmes données.

## Si la base ne contient pas de données
Le script `init_db.py` crée la structure de la base de données. Si vous avez besoin de données de test, ajoutez des `INSERT` dans la base ou utilisez des scripts de migration / de peuplement.

