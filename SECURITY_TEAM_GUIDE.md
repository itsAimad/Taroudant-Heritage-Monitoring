# 🛡️ Taroudant Heritage Shield: Security Team Onboarding & Project Report

Bienvenue dans l'équipe de sécurité de **Taroudant Heritage Shield** ! Ce guide est conçu pour vous fournir une connaissance approfondie de l'état actuel du projet, de son architecture et de la manière de collaborer en toute sécurité via GitHub.

---

## 1. Vision du Projet
**Taroudant Heritage Shield** est une plateforme de surveillance structurelle dédiée à la protection du patrimoine historique de Taroudant (Maroc). 

### Le Problème
Les remparts de Taroudant (7,5 km de long), datant de la dynastie Saadienne (16ème siècle), subissent des dégradations naturelles. Jusqu'à présent, il n'existait pas de système automatisé pour détecter, évaluer et alerter les autorités sur les risques d'effondrement.

### La Solution
Une application full-stack qui permet aux inspecteurs de terrain de :
1.  **Cataloguer** les monuments avec leurs coordonnées GPS.
2.  **Enregistrer** des rapports d'inspection détaillés (fissures, état global).
3.  **Calculer** automatiquement un score de vulnérabilité via des procédures SQL.
4.  **Alerter** les autorités municipales en temps réel via des triggers de base de données.
5.  **Générer** des rapports cryptés (AES-256) accessibles uniquement aux décideurs.

---

## 2. Architecture Technique
Le projet est construit sur une architecture moderne et robuste :

- **Frontend** : React + Vite (Interface utilisateur réactive et rapide).
- **Backend** : FastAPI / Python (API RESTful haute performance, gérant la sécurité et la logique métier).
- **Base de Données** : MySQL 8.0 (Stockage normalisé 3NF).

---

## 3. Architecture de la Base de Données (MySQL 3NF)
La base de données `taroudant_heritage_shield` est le cœur du système. Elle suit la **3ème Forme Normale (3NF)** pour éviter la redondance des données.

### Tables Clés pour la Sécurité
- `users` : Stocke les comptes utilisateurs, leurs hashs de mots de passe (bcrypt) et leurs rôles.
- `roles` : Définit les privilèges (Admin, Inspecteur, Autorité).
- `audit_logs` : Trace chaque action sensible (connexion, génération de rapport, modification de statut).
- `reports` : Contient le `encrypted_content` (données structurelles sensibles cryptées).

### Logique SQL Avancée
Nous utilisons des **Procédures Stockées (SP)** et des **Triggers** pour garantir l'intégrité des données :

- **`CalculateVulnerabilityScore` (SP)** : Calcule mathématiquement le risque basé sur l'âge du monument et la sévérité des fissures (Mineure: 1pt, Modérée: 3pts, Majeure: 7pts, Critique: 15pts).
- **`GenerateMonumentReport` (SP)** : Compile les données, les traduit en français, et les **crypte avec AES-256** avant le stockage.
- **`after_crack_insert` (Trigger)** : Recalcule automatiquement le score dès qu'une fissure est ajoutée.
- **`after_score_insert` (Trigger)** : Envoie une notification immédiate au rôle `authority` si le risque est "Élevé" ou "Critique".

---

## 4. Sécurité Actuelle (Ce qui est déjà en place)
Voici les couches de sécurité que vous allez audit et renforcer :

1.  **Authentification** : Utilisation de **JWT (JSON Web Tokens)** stockés dans des **cookies HttpOnly / Secure**. Le mot de passe n'est jamais stocké en clair (Hachage **Bcrypt** avec 12 rounds).
2.  **Autorisation (RBAC)** : Chaque route API est protégée par un middleware qui vérifie si l'utilisateur possède le rôle requis (`admin`, `inspector` ou `authority`).
3.  **Protection des Données** :
    *   **Anti-Injection SQL** : Utilisation systématique de requêtes préparées (via l'ORM ou des drivers sécurisés).
    *   **Cryptage** : Les rapports structurels sensibles sont cryptés en **AES-256-CBC** au niveau de la base de données.
4.  **Auditabilité** : Toute action critique est enregistrée dans `audit_logs` avec l'ID utilisateur, l'action et l'horodatage.

---

## 5. Guide GitHub pour Débutants (Travailler en Sécurité)
Pour éviter de perturber le code principal, nous suivons un workflow strict :

### Étape 1 : Cloner le projet
Ouvrez votre terminal et tapez :
```bash
git clone https://github.com/[URL_DU_REPO]/taroudant-heritage-shield.git
cd taroudant-heritage-shield
```

### Étape 2 : Changer de Branche (TRÈS IMPORTANT)
Ne travaillez jamais sur la branche `main`. Nous avons créé une branche dédiée pour vous :
```bash
# Pour aller sur la branche de sécurité existante
git checkout security-team

# Pour créer votre propre sous-branche locale si besoin
git checkout -b feature-audit-audit-logs
```

### Étape 3 : Garder votre code à jour
Avant de commencer à coder chaque jour, récupérez le travail de vos collègues :
```bash
git pull origin security-team
```

### Étape 4 : Sauvegarder et Partager
```bash
git add .
git commit -m "Ajout d'une vérification de robustesse sur le middleware RBAC"
git push origin security-team
```

> [!CAUTION]
> **Règle d'or** : Ne faites JAMAIS de `git push --force`. Si GitHub refuse votre push, faites un `git pull` d'abord pour fusionner les changements.

---

## 6. Installation Locale (Setup)

### Backend (FastAPI)
1.  Aller dans `ai-team/backend`.
2.  Créer un environnement virtuel : `python -m venv venv`.
3.  Activer l'environnement : `.\venv\Scripts\activate` (Windows) ou `source venv/bin/activate` (Mac/Linux).
4.  Installer les dépendances : `pip install -r requirements.txt`.
5.  Configurer le fichier `.env` (Copiez `.env.example`).
6.  Lancer le serveur : `uvicorn main:app --reload`.

### Frontend (React)
1.  Aller dans `ai-team/frontend`.
2.  Installer : `npm install`.
3.  Lancer : `npm run dev`.

---

## Votre Mission
Votre objectif est d'explorer ce code, de comprendre les failles potentielles et de proposer/implémenter de nouvelles fonctionnalités de sécurité (ex: 2FA, rate limiting poussé, détection d'anomalies dans les logs d'audit, etc.).

**Bonne chance, l'équipe ! 🛡️**
