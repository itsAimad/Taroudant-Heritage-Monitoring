-- ================================================
-- Taroudant Heritage Shield
-- File: 04_rbac_users.sql
-- Purpose: Define application roles and MySQL users with scoped privileges
-- Run order: 4 of 5
-- Dependencies: 01_schema.sql, 02_stored_procedures.sql
-- ================================================

USE taroudant_heritage_shield;

-- ==========================================================
-- SECTION 1 — Insert logical application roles
-- These roles are used both for RBAC enforcement and alert routing
-- ==========================================================
INSERT INTO roles (role_name, description) VALUES
  ('admin',     'Full system access — manages users, monuments, assignments'),
  ('inspector', 'Field expert — creates inspections, logs cracks, generates reports'),
  ('authority', 'Municipal authority — receives alerts, reads encrypted reports'),
  ('viewer',    'Public access — read-only monument catalogue and public stats');


-- ==========================================================
-- SECTION 2 — Create MySQL database users with restricted privileges
-- Each technical user corresponds to an application profile with
-- the least privileges required to perform its responsibilities.
-- ==========================================================

-- Clean up any existing users to make script re-runnable in dev environments
DROP USER IF EXISTS 'app_admin'@'localhost';
DROP USER IF EXISTS 'app_inspector'@'localhost';
DROP USER IF EXISTS 'app_authority'@'localhost';
DROP USER IF EXISTS 'app_viewer'@'localhost';

-- Create dedicated MySQL accounts with strong, role-specific passwords
CREATE USER 'app_admin'@'localhost' IDENTIFIED BY 'Admin@Heritage2026';
CREATE USER 'app_inspector'@'localhost' IDENTIFIED BY 'Inspector@Heritage2026';
CREATE USER 'app_authority'@'localhost' IDENTIFIED BY 'Authority@Heritage2026';
CREATE USER 'app_viewer'@'localhost' IDENTIFIED BY 'Viewer@Heritage2026';


-- -------------------------
-- Privileges for app_admin
-- -------------------------
-- Admin has full access for maintenance and migrations
GRANT ALL PRIVILEGES ON taroudant_heritage_shield.* TO 'app_admin'@'localhost';


-- -----------------------------
-- Privileges for app_inspector
-- -----------------------------
-- Inspectors create/update inspections, cracks, reports, and media
GRANT SELECT, INSERT, UPDATE ON taroudant_heritage_shield.inspections       TO 'app_inspector'@'localhost';
GRANT SELECT, INSERT          ON taroudant_heritage_shield.cracks            TO 'app_inspector'@'localhost';
GRANT SELECT, INSERT          ON taroudant_heritage_shield.reports           TO 'app_inspector'@'localhost';
GRANT SELECT, INSERT          ON taroudant_heritage_shield.monument_assets   TO 'app_inspector'@'localhost';

-- Read-only access to core reference data needed during inspections
GRANT SELECT ON taroudant_heritage_shield.monuments             TO 'app_inspector'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.monument_categories   TO 'app_inspector'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.users                 TO 'app_inspector'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.vulnerability_scores  TO 'app_inspector'@'localhost';

-- Allow inspectors to execute scoring and report generation logic
GRANT EXECUTE ON PROCEDURE taroudant_heritage_shield.CalculateVulnerabilityScore TO 'app_inspector'@'localhost';
GRANT EXECUTE ON PROCEDURE taroudant_heritage_shield.GenerateMonumentReport      TO 'app_inspector'@'localhost';


-- ------------------------------
-- Privileges for app_authority
-- ------------------------------
-- Authorities focus on consuming reports and alerts, not editing inspections
GRANT SELECT ON taroudant_heritage_shield.reports              TO 'app_authority'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.notifications        TO 'app_authority'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.monuments            TO 'app_authority'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.vulnerability_scores TO 'app_authority'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.inspections          TO 'app_authority'@'localhost';

-- Allow authorities to acknowledge alerts and generate audit entries
GRANT UPDATE (is_read) ON taroudant_heritage_shield.notifications TO 'app_authority'@'localhost';
GRANT INSERT           ON taroudant_heritage_shield.audit_logs    TO 'app_authority'@'localhost';


-- ---------------------------
-- Privileges for app_viewer
-- ---------------------------
-- Viewer has strictly read-only access to public-facing data
GRANT SELECT ON taroudant_heritage_shield.monuments           TO 'app_viewer'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.monument_categories TO 'app_viewer'@'localhost';
GRANT SELECT ON taroudant_heritage_shield.monument_assets     TO 'app_viewer'@'localhost';

-- Column-level privilege to expose only non-sensitive vulnerability data
GRANT SELECT (monument_id, risk_level, computed_at)
ON taroudant_heritage_shield.vulnerability_scores
TO 'app_viewer'@'localhost';


-- Apply privilege changes immediately
FLUSH PRIVILEGES;

-- ✅ RBAC users and privileges created successfully


