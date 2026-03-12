-- ================================================
-- Taroudant Heritage Shield
-- File: 05_seed_data.sql
-- Purpose: Insert reference data and test records for development
-- Run order: 5 of 5
-- Dependencies: 01_schema.sql, 04_rbac_users.sql
-- ================================================

USE taroudant_heritage_shield;

-- ==========================================================
-- SECTION 1 — Monument categories
-- Provides normalized classification for Taroudant heritage sites
-- ==========================================================
INSERT INTO monument_categories (category_name, description) VALUES
  ('Rempart',        'Fortified walls surrounding the city'),
  ('Porte de ville', 'Historic city gates and entry points'),
  ('Mosquée',        'Islamic places of worship'),
  ('Kasbah',         'Fortified citadel or governor residence'),
  ('Place',          'Historic public squares and gathering spaces'),
  ('Fontaine',       'Traditional Moroccan fountains');


-- ==========================================================
-- SECTION 2 — Real Taroudant monuments (6 records)
-- All descriptive content is in French to match local context
-- ==========================================================
INSERT INTO monuments
  (name, location, city, latitude, longitude, construction_year, category_id, description, status)
VALUES
  ('Remparts de Taroudant',
   'Enceinte de la médina', 'Taroudant',
   30.4702, -8.8776, 1528, 1,
   'Les remparts de Taroudant s''étendent sur 7,5 km autour de la médina. Construits sous la dynastie Saadienne, ils constituent l''un des exemples les mieux conservés de l''architecture militaire marocaine.',
   'active'),

  ('Bab El Khemis',
   'Entrée nord de la médina', 'Taroudant',
   30.4739, -8.8754, 1528, 2,
   'La porte du jeudi, principale entrée nord de la médina de Taroudant. Symbole historique de la ville, utilisée comme point de passage commercial depuis le XVIe siècle.',
   'active'),

  ('Bab Zorgane',
   'Entrée est de la médina', 'Taroudant',
   30.4698, -8.8701, 1528, 2,
   'Porte historique de l''est, point d''entrée vers les routes caravanières du Souss. Architecture typique saadienne avec des motifs géométriques gravés.',
   'active'),

  ('Grande Mosquée de Taroudant',
   'Centre de la médina', 'Taroudant',
   30.4715, -8.8745, 1363, 3,
   'La plus ancienne mosquée de Taroudant, datant de la période mérinide. Centre spirituel et culturel de la ville depuis plus de six siècles.',
   'active'),

  ('Kasbah de Taroudant',
   'Sud-ouest de la médina', 'Taroudant',
   30.4688, -8.8798, 1571, 4,
   'Ancienne résidence des gouverneurs saadiens, la Kasbah domine le quartier sud-ouest de la médina. Murs en pisé caractéristiques de l''architecture de terre marocaine.',
   'active'),

  ('Place Assarag',
   'Centre-ville, Taroudant', 'Taroudant',
   30.4720, -8.8769, 1850, 5,
   'Place centrale historique de Taroudant, cœur social et commercial de la ville. Entourée de cafés traditionnels et d''orangers centenaires.',
   'active');


-- ==========================================================
-- SECTION 3 — Sample test users (one per role)
-- Passwords are stored as bcrypt hash of 'Heritage2026!'
-- Same hash used for all sample accounts to simplify testing
-- ==========================================================
SET @bcrypt_hash := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGVRSGD3aIKQeqUVsxHqXJGOaKi';

INSERT INTO users (full_name, email, password_hash, role_id, phone) VALUES
  ('Admin Système',      'admin@heritage-taroudant.ma',     @bcrypt_hash, 1, '+212600000001'),
  ('Youssef Inspecteur', 'inspector@heritage-taroudant.ma', @bcrypt_hash, 2, '+212600000002'),
  ('Fatima Autorité',    'authority@heritage-taroudant.ma', @bcrypt_hash, 3, '+212600000003'),
  ('Mohammed Visiteur',  'viewer@heritage-taroudant.ma',    @bcrypt_hash, 4, '+212600000004');


-- ==========================================================
-- SECTION 4 — Sample inspection (to test triggers)
-- Creates a completed inspection that will later receive cracks,
-- automatically generating vulnerability_scores and notifications
-- ==========================================================
INSERT INTO inspections
  (monument_id, inspector_id, inspection_date, notes, overall_condition, status)
VALUES
  (2, 2, CURDATE(),
   'Inspection de routine de Bab El Khemis. Plusieurs fissures détectées sur le mur nord et la voûte principale. Végétation parasite observée à la base.',
   'poor', 'completed');


-- ==========================================================
-- SECTION 5 — Sample cracks for this inspection
-- Inserting cracks will fire triggers:
--   - after_crack_insert → recalculates vulnerability_scores
--   - after_score_insert → may generate notifications for authorities
-- ==========================================================
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (1, 'Mur nord, 2m du sol',        'major',    45.5, '/assets/cracks/crack_001.jpg'),
  (1, 'Voûte principale, centre',   'critical', 78.0, '/assets/cracks/crack_002.jpg'),
  (1, 'Base gauche de l''arcade',   'moderate', 23.0, '/assets/cracks/crack_003.jpg'),
  (1, 'Mur est, angle supérieur',   'minor',    12.5, '/assets/cracks/crack_004.jpg');


-- ==========================================================
-- SECTION 6 — Sample monument assets (photos)
-- These assets let the frontend and reports show realistic imagery
-- while also validating foreign key relationships
-- ==========================================================
INSERT INTO monument_assets (monument_id, photo_url, caption, uploaded_by) VALUES
  (1, '/assets/monuments/remparts_01.jpg', 'Vue panoramique des remparts depuis le nord', 1),
  (1, '/assets/monuments/remparts_02.jpg', 'Détail des murs en pisé saadien', 1),
  (2, '/assets/monuments/bab_khemis_01.jpg', 'Façade principale de Bab El Khemis', 2),
  (3, '/assets/monuments/bab_zorgane_01.jpg', 'Vue extérieure de Bab Zorgane', 2),
  (4, '/assets/monuments/mosquee_01.jpg', 'Minaret de la Grande Mosquée', 1),
  (5, '/assets/monuments/kasbah_01.jpg', 'Murs de la Kasbah au coucher du soleil', 1);


-- ✅ Seed data inserted successfully
-- ⚡ Triggers fired: vulnerability_scores and notifications auto-generated


