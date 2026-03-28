-- Taroudant Heritage Shield — Schéma MySQL (équipe sans IA)
-- FR: modèle métier en français (noms de colonnes)
-- EN: mapping UI / API documenté en COMMENT pour le frontend (Admin, Expert, Authority, etc.)

CREATE DATABASE IF NOT EXISTS taroudant_heritage_shield
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taroudant_heritage_shield;

/* ================= UTILISATEUR ================= */
-- EN roles: Admin | Expert | Authority (pas d'inspecteur dans l'app)

CREATE TABLE UTILISATEUR (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL COMMENT 'EN: full name',
    email VARCHAR(120) NOT NULL UNIQUE COMMENT 'EN: email',
    mot_de_passe VARCHAR(255) NOT NULL COMMENT 'EN: password hash (bcrypt)',
    role ENUM('admin', 'expert', 'autorite') NOT NULL COMMENT 'EN: Admin | Expert | Authority',
    INDEX idx_utilisateur_role (role)
) ENGINE=InnoDB;

/* ================= MONUMENT ================= */
-- EN structuralState: Stable | À surveiller | Critique → stocké normalisé en DB

CREATE TABLE MONUMENT (
    id_monument INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL COMMENT 'EN: name',
    localisation VARCHAR(150) COMMENT 'EN: location',
    date_de_creation DATE NULL COMMENT 'EN: construction / origin date (approx. OK)',
    etat_structure ENUM('stable', 'a_surveiller', 'critique') NOT NULL DEFAULT 'stable'
        COMMENT 'EN: Stable | Watch | Critical (UI labels)',
    description TEXT COMMENT 'EN: description',
    image_principale VARCHAR(512) COMMENT 'EN: main image URL/path',
    INDEX idx_monument_etat (etat_structure)
) ENGINE=InnoDB;                                                         

/* ================= INSPECTION ================= */
-- EN status: Planifiée | En cours | Terminée

CREATE TABLE INSPECTION (
    id_inspection INT AUTO_INCREMENT PRIMARY KEY,
    date_inspection DATE COMMENT 'EN: inspection date',
    type_inspection VARCHAR(50) COMMENT 'EN: inspection type (e.g. post-earthquake)',
    observation TEXT COMMENT 'EN: observations',
    image_url VARCHAR(512) NULL COMMENT 'EN: optional inspection image URL',
    score_vulnerabilite FLOAT NOT NULL DEFAULT 0 COMMENT 'EN: vulnerability score',
    statut ENUM('planifiee', 'en_cours', 'terminee') NOT NULL DEFAULT 'planifiee'
        COMMENT 'EN: scheduled | in_progress | completed',
    id_monument INT NOT NULL,
    id_utilisateur INT NOT NULL COMMENT 'EN: expert user who performs inspection',
    FOREIGN KEY (id_monument) REFERENCES MONUMENT(id_monument),
    FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur),
    INDEX idx_inspection_monument (id_monument),
    INDEX idx_inspection_statut (statut)
) ENGINE=InnoDB;

/* ================= FISSURE ================= */
-- EN gravityLevel: low | medium | high | critical

CREATE TABLE FISSURE (
    id_fissure INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT COMMENT 'EN: crack description',
    date_detection DATE COMMENT 'EN: detection date',
    gravite ENUM('faible', 'moyenne', 'grave', 'critique') NOT NULL DEFAULT 'faible'
        COMMENT 'EN: low | medium | high | critical',
    id_inspection INT NOT NULL,
    FOREIGN KEY (id_inspection)
        REFERENCES INSPECTION(id_inspection)
        ON DELETE CASCADE,
    INDEX idx_fissure_inspection (id_inspection)
) ENGINE=InnoDB;

/* ================= ALERTE ================= */
-- EN: alertLevel Info / Warning / Critical; status Active / pending / resolved (mapper côté API)

CREATE TABLE ALERTE (
    id_alerte INT AUTO_INCREMENT PRIMARY KEY,
    date_alerte DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'EN: alert timestamp',
    message TEXT NOT NULL COMMENT 'EN: message',
    niveau ENUM('faible', 'moyen', 'critique') NOT NULL DEFAULT 'moyen'
        COMMENT 'EN: ~ Info | Warning | Critical',
    statut ENUM('nouvelle', 'en_cours', 'traitee') NOT NULL DEFAULT 'nouvelle'
        COMMENT 'EN: new | in_progress | treated',
    type_degradation VARCHAR(100) COMMENT 'EN: degradation type (structural, erosion…)',
    alerte_recue BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'EN: received flag (Authority UI)',
    id_inspection INT NOT NULL,
    id_utilisateur INT NULL COMMENT 'EN: recipient user (NULL = all authorities / system)',
    FOREIGN KEY (id_inspection) REFERENCES INSPECTION(id_inspection),
    FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur),
    INDEX idx_alerte_niveau (niveau),
    INDEX idx_alerte_inspection (id_inspection)
) ENGINE=InnoDB;

/* ================= RAPPORT ================= */

CREATE TABLE RAPPORT (
    id_rapport INT AUTO_INCREMENT PRIMARY KEY,
    date_rapport DATE COMMENT 'EN: report date',
    diagnostic_structurel TEXT COMMENT 'EN: structural diagnostic',
    analyse_fissures TEXT COMMENT 'EN: crack analysis',
    recommandations TEXT COMMENT 'EN: recommendations',
    niveau_priorite ENUM('faible', 'moyen', 'urgent', 'critique') NOT NULL DEFAULT 'faible'
        COMMENT 'EN: low | medium | urgent/high | critical',
    statut ENUM('en_attente', 'valide', 'rejete') NOT NULL DEFAULT 'en_attente'
        COMMENT 'EN: pending | approved | rejected',
    id_inspection INT NOT NULL,
    id_utilisateur INT NOT NULL COMMENT 'EN: expert who authored the report',
    FOREIGN KEY (id_inspection) REFERENCES INSPECTION(id_inspection),
    FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur),
    INDEX idx_rapport_inspection (id_inspection)
) ENGINE=InnoDB;

/* ================= SEISME ================= */
-- EN: seismic events recorded by admin, visible to expert + authority

CREATE TABLE SEISME (
    id_seisme INT AUTO_INCREMENT PRIMARY KEY,
    date_seisme DATE NOT NULL COMMENT 'EN: quake date',
    localisation VARCHAR(150) NOT NULL COMMENT 'EN: location',
    magnitude DECIMAL(4,2) NOT NULL COMMENT 'EN: Richter magnitude',
    profondeur_km DECIMAL(6,2) NOT NULL COMMENT 'EN: depth in kilometers',
    intensite VARCHAR(50) NOT NULL COMMENT 'EN: intensity label',
    id_utilisateur INT NOT NULL COMMENT 'EN: admin who created record',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur),
    INDEX idx_seisme_date (date_seisme)
) ENGINE=InnoDB;

/* ================= NOTIFICATION SEISME LUE ================= */
-- EN: stores per-user read state for seism notifications

CREATE TABLE NOTIFICATION_SEISME_LUE (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    id_seisme INT NOT NULL,
    id_utilisateur INT NOT NULL,
    date_lecture DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_seisme_user (id_seisme, id_utilisateur),
    FOREIGN KEY (id_seisme) REFERENCES SEISME(id_seisme) ON DELETE CASCADE,
    FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB;
