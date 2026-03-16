-- ================================================
-- Taroudant Heritage Shield
-- File: 01_schema.sql
-- Purpose: Define core MySQL schema for heritage monitoring system
-- Run order: 1 of 5
-- Dependencies: (none) – this file initializes the database
-- ================================================

-- Drop and recreate database to ensure a clean, predictable state for development/testing
DROP DATABASE IF EXISTS taroudant_heritage_shield;
CREATE DATABASE IF NOT EXISTS taroudant_heritage_shield
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE taroudant_heritage_shield;


-- ================================================
-- Table: roles
-- Purpose: Define high-level application roles used for RBAC and notifications
-- ================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id     INT AUTO_INCREMENT PRIMARY KEY,
  role_name   VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================
-- Table: users
-- Purpose: Store system users (admins, inspectors, authorities, viewers) with RBAC linkage
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id_user       INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id       INT NOT NULL,
  phone         VARCHAR(20),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key ensures each user has a valid role; RESTRICT prevents accidental role deletion
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id)
    REFERENCES roles (role_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extend users table for authentication needs
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active
    BOOLEAN DEFAULT TRUE
    COMMENT 'Soft-delete flag — FALSE means deactivated',
  ADD COLUMN IF NOT EXISTS last_login
    DATETIME NULL
    COMMENT 'Updated on every successful login',
  ADD COLUMN IF NOT EXISTS organization
    VARCHAR(200) DEFAULT ''
    COMMENT 'Department or office the user belongs to';

-- Index on foreign key for faster joins when filtering users by role
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);


-- ================================================
-- Table: monument_categories
-- Purpose: Normalize monument classification (walls, gates, mosques, etc.)
-- ================================================
CREATE TABLE IF NOT EXISTS monument_categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================
-- Table: monuments
-- Purpose: Core entity representing each monitored heritage monument
-- ================================================
CREATE TABLE IF NOT EXISTS monuments (
  monument_id       INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  location          VARCHAR(255) NOT NULL,
  city              VARCHAR(100) DEFAULT 'Taroudant',
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  construction_year INT,
  category_id       INT,
  description       TEXT,
  status            ENUM('active','under_restoration','closed','critical') DEFAULT 'active',

  -- Category is optional; if the category is deleted we allow the monument to remain without it
  CONSTRAINT fk_monuments_category
    FOREIGN KEY (category_id)
    REFERENCES monument_categories (category_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index on category for reporting and filtering by monument type
CREATE INDEX IF NOT EXISTS idx_monuments_category_id ON monuments (category_id);


-- ================================================
-- Table: monument_assets
-- Purpose: Store media assets (photos) linked to monuments for visual documentation
-- ================================================
CREATE TABLE IF NOT EXISTS monument_assets (
  photo_id    INT AUTO_INCREMENT PRIMARY KEY,
  monument_id INT NOT NULL,
  photo_url   VARCHAR(500) NOT NULL,
  caption     VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT,

  -- Asset must always be tied to a monument; deletion is restricted to preserve asset integrity
  CONSTRAINT fk_assets_monument
    FOREIGN KEY (monument_id)
    REFERENCES monuments (monument_id)
    ON DELETE RESTRICT,

  -- Uploader is optional; if the user is deleted we keep the asset but drop the reference
  CONSTRAINT fk_assets_uploader
    FOREIGN KEY (uploaded_by)
    REFERENCES users (id_user)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes to speed up lookups by monument and uploader
CREATE INDEX IF NOT EXISTS idx_assets_monument_id ON monument_assets (monument_id);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON monument_assets (uploaded_by);


-- ================================================
-- Table: inspections
-- Purpose: Capture each field inspection performed on a monument
-- ================================================
CREATE TABLE IF NOT EXISTS inspections (
  inspection_id     INT AUTO_INCREMENT PRIMARY KEY,
  monument_id       INT NOT NULL,
  inspector_id      INT NOT NULL,
  inspection_date   DATE NOT NULL,
  notes             TEXT,
  overall_condition ENUM('good','fair','poor','critical') DEFAULT 'fair',
  status            ENUM('pending','in_progress','completed') DEFAULT 'pending',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Tie inspection to a specific monument; restriction avoids orphan inspections
  CONSTRAINT fk_inspections_monument
    FOREIGN KEY (monument_id)
    REFERENCES monuments (monument_id)
    ON DELETE RESTRICT,

  -- Ensure inspections always reference a valid inspector account
  CONSTRAINT fk_inspections_inspector
    FOREIGN KEY (inspector_id)
    REFERENCES users (id_user)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for fast reporting by monument and by inspector
CREATE INDEX IF NOT EXISTS idx_inspections_monument_id ON inspections (monument_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections (inspector_id);


-- ================================================
-- Table: cracks
-- Purpose: Store fine-grained crack observations linked to an inspection
-- ================================================
CREATE TABLE IF NOT EXISTS cracks (
  crack_id             INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id        INT NOT NULL,
  location_on_monument VARCHAR(255) NOT NULL,
  severity             ENUM('minor','moderate','major','critical') NOT NULL,
  length_cm            DECIMAL(8,2),
  photo_url            VARCHAR(500),
  detected_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Each crack must belong to a valid inspection; restriction avoids losing diagnostic history
  CONSTRAINT fk_cracks_inspection
    FOREIGN KEY (inspection_id)
    REFERENCES inspections (inspection_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for aggregating cracks per inspection when computing scores
CREATE INDEX IF NOT EXISTS idx_cracks_inspection_id ON cracks (inspection_id);


-- ================================================
-- Table: vulnerability_scores
-- Purpose: Store computed vulnerability metrics per monument and inspection
-- ================================================
CREATE TABLE IF NOT EXISTS vulnerability_scores (
  score_id      INT AUTO_INCREMENT PRIMARY KEY,
  monument_id   INT NOT NULL,
  inspection_id INT NOT NULL,
  age_score     INT DEFAULT 0,
  crack_score   INT DEFAULT 0,
  total_score   INT DEFAULT 0,
  risk_level    ENUM('low','medium','high','critical') DEFAULT 'low',
  computed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Link score to the physical monument for risk dashboards
  CONSTRAINT fk_scores_monument
    FOREIGN KEY (monument_id)
    REFERENCES monuments (monument_id)
    ON DELETE RESTRICT,

  -- Link score to a specific inspection so we can trace how it was computed
  CONSTRAINT fk_scores_inspection
    FOREIGN KEY (inspection_id)
    REFERENCES inspections (inspection_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes to support common queries by monument and inspection
CREATE INDEX IF NOT EXISTS idx_scores_monument_id ON vulnerability_scores (monument_id);
CREATE INDEX IF NOT EXISTS idx_scores_inspection_id ON vulnerability_scores (inspection_id);


-- ================================================
-- Table: notifications
-- Purpose: Send alerts to authorities when risk thresholds are exceeded
-- ================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id          INT AUTO_INCREMENT PRIMARY KEY,
  monument_id              INT NOT NULL,
  triggered_by_inspection  INT,
  recipient_id             INT NOT NULL,
  message                  TEXT NOT NULL,
  severity                 ENUM('info','warning','high','critical') DEFAULT 'info',
  is_read                  BOOLEAN DEFAULT FALSE,
  sent_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Notification is always tied to a monument to give context to authorities
  CONSTRAINT fk_notifications_monument
    FOREIGN KEY (monument_id)
    REFERENCES monuments (monument_id)
    ON DELETE RESTRICT,

  -- Triggering inspection is optional; if removed we keep the alert but drop the back-link
  CONSTRAINT fk_notifications_inspection
    FOREIGN KEY (triggered_by_inspection)
    REFERENCES inspections (inspection_id)
    ON DELETE SET NULL,

  -- Recipient user must exist; restriction prevents orphan notifications
  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_id)
    REFERENCES users (id_user)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes to speed up inbox queries and traceability
CREATE INDEX IF NOT EXISTS idx_notifications_monument_id ON notifications (monument_id);
CREATE INDEX IF NOT EXISTS idx_notifications_triggered_by ON notifications (triggered_by_inspection);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications (recipient_id);


-- Table: reports
-- Purpose: Archive generated inspection reports, including encrypted content
-- ================================================
CREATE TABLE IF NOT EXISTS reports (
  report_id     INT AUTO_INCREMENT PRIMARY KEY,
  monument_id   INT NOT NULL,
  inspection_id INT NOT NULL,
  generated_by  INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  file_path     VARCHAR(500),
  -- Encrypted report content stored inside the database for secure access
  encrypted_content LONGBLOB,
  risk_level    ENUM('low','medium','high','critical'),
  total_score   INT,
  status        ENUM('draft','final','archived') DEFAULT 'draft',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Reports are always tied to a specific monument for long-term tracking
  CONSTRAINT fk_reports_monument
    FOREIGN KEY (monument_id)
    REFERENCES monuments (monument_id)
    ON DELETE RESTRICT,

  -- Inspection link allows validation of report inputs over time
  CONSTRAINT fk_reports_inspection
    FOREIGN KEY (inspection_id)
    REFERENCES inspections (inspection_id)
    ON DELETE RESTRICT,

  -- Generated-by user must exist to maintain accountability
  CONSTRAINT fk_reports_generated_by
    FOREIGN KEY (generated_by)
    REFERENCES users (id_user)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes to accelerate search by monument, inspection, and author
CREATE INDEX IF NOT EXISTS idx_reports_monument_id ON reports (monument_id);
CREATE INDEX IF NOT EXISTS idx_reports_inspection_id ON reports (inspection_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports (generated_by);


-- ================================================
-- Table: audit_logs
-- Purpose: Track sensitive operations (e.g., report generation, status changes)
-- ================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT,
  action       VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id    INT,
  ip_address   VARCHAR(45),
  details      TEXT,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- User is optional; if the account is removed we keep the audit record but nullify the link
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users (id_user)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index to query logs by user for accountability reviews
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);


-- ================================================
-- Table: access_requests
-- Purpose: Store public requests for system access
--          pending admin review before account creation
-- ================================================
CREATE TABLE IF NOT EXISTS access_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(150)  NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  organization    VARCHAR(200)  NOT NULL,
  -- role stores the role_name string (inspector/authority)
  -- validated against roles table at application level
  role            VARCHAR(50)   NOT NULL,
  reason          TEXT          NOT NULL,
  status          ENUM('pending','approved','rejected')
                    DEFAULT 'pending',
  submitted_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  reviewed_at     DATETIME      NULL,
  -- FK to users.id_user — the admin who reviewed this request
  reviewed_by_id  INT           NULL,
  review_note     TEXT          DEFAULT '',

  CONSTRAINT fk_access_requests_reviewer
    FOREIGN KEY (reviewed_by_id)
      REFERENCES users(id_user)
      ON DELETE SET NULL,

  INDEX idx_access_requests_status (status),
  INDEX idx_access_requests_email  (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Seed: roles
-- Purpose: Insert required application roles
--          Safe to run multiple times (INSERT IGNORE)
-- ================================================
INSERT IGNORE INTO roles (role_name, description) VALUES
  ('admin',
   'System administrator — full access to all modules'),
  ('inspector',
   'Heritage field inspector — submits inspections and cracks'),
  ('authority',
   'Regional heritage authority — views alerts and reports');

-- ================================================
-- Seed: admin user
-- Purpose: Bootstrap the first admin account
-- IMPORTANT: Replace the password_hash value below with
--            a real bcrypt hash generated by running:
--   python -c "from passlib.context import CryptContext; \
--   print(CryptContext(schemes=['bcrypt']).hash('Admin@Heritage2024!'))"
-- Then paste the output hash string in place of REPLACE_THIS_HASH
-- ================================================
INSERT IGNORE INTO users
  (full_name, email, password_hash, role_id,
   organization, is_active)
VALUES (
  'Aimad Bouya',
  'admin@heritage-taroudant.ma',
  '$2b$12$d8HkX4qU8UQy.YMo6QexNehvcpKfysxZC7hQxoQGHJAfXeGWJztRi',
  (SELECT role_id FROM roles WHERE role_name = 'admin'),
  'Heritage Monitoring System',
  TRUE
);

-- ✅ Schema created successfully
-- Last updated: added is_active, last_login, organization
--               to users table; added access_requests table;
--               added role and admin seed data
