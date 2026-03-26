-- ================================================
-- Taroudant Heritage Shield
-- File: 05_seed_data.sql
-- Purpose: Realistic seed data with all major Taroudant monuments,
--          multi-condition inspections, and crack data that fires
--          the after_crack_insert → CalculateVulnerabilityScore →
--          after_score_insert → notifications pipeline.
-- Run order: 5 of 5
-- ================================================

USE taroudant_heritage_shield;

-- --------------------------------------------------
-- SECTION 1 — Monument categories
-- --------------------------------------------------
INSERT IGNORE INTO monument_categories (category_name, description) VALUES
  ('Rempart',        'Fortified walls surrounding the medina'),
  ('Porte de ville', 'Historic city gates and entry points'),
  ('Mosquée',        'Islamic places of worship'),
  ('Kasbah',         'Fortified citadel or governor residence'),
  ('Place',          'Historic public squares and gathering spaces'),
  ('Fontaine',       'Traditional Moroccan public fountains'),
  ('Borj',           'Defensive tower or bastion'),
  ('Souk',           'Traditional market district'),
  ('Medersa',        'Historic Islamic school');

-- --------------------------------------------------
-- SECTION 2 — All major Taroudant monuments
--   Coordinates verified against OpenStreetMap / Google Maps
-- --------------------------------------------------
INSERT INTO monuments
  (name, location, city, latitude, longitude, construction_year,
   category_id, description, status)
VALUES
  -- 1. Remparts (the iconic 7.5 km Saadian walls)
  ('Remparts de Taroudant',
   'Enceinte de la médina', 'Taroudant',
   30.4702, -8.8776, 1528,
   1,
   'Les remparts saadiens s''étendent sur 7,5 km autour de la médina. Parmi les mieux conservés du Maroc, ils atteignent 8 m de hauteur et comprennent cinq portes et plusieurs bastions défensifs.',
   'active'),

  -- 2. Bab El Khemis (north gate, busiest)
  ('Bab El Khemis',
   'Entrée nord de la médina', 'Taroudant',
   30.4739, -8.8754, 1528,
   2,
   'La Porte du Jeudi, principale entrée nord de la médina. Symbole historique utilisé comme point de passage commercial depuis le XVIe siècle. Décorée de motifs géométriques saadiens.',
   'active'),

  -- 3. Bab Zorgane (east gate)
  ('Bab Zorgane',
   'Entrée est de la médina', 'Taroudant',
   30.4698, -8.8701, 1528,
   2,
   'Porte orientale donnant accès aux routes caravanières du Souss et de l''Anti-Atlas. Architecture typique saadienne avec arc en fer à cheval et motifs en stuc.',
   'active'),

  -- 4. Bab Sedra (south gate)
  ('Bab Sedra',
   'Entrée sud de la médina', 'Taroudant',
   30.4665, -8.8763, 1528,
   2,
   'Porte méridionale de la médina, ouvrant vers les jardins et les quartiers artisanaux. Connue pour sa double arche caractéristique et ses peintures murales géométriques.',
   'active'),

  -- 5. Bab El Kasbah (kasbah gate)
  ('Bab El Kasbah',
   'Accès à la Kasbah, sud-ouest de la médina', 'Taroudant',
   30.4680, -8.8795, 1571,
   2,
   'Entrée principale de la Kasbah saadienne. Monumentale arche flanquée de deux tours, avec décoration en zellij et calligraphie arabe en relief. Point stratégique de défense de la cité.',
   'active'),

  -- 6. Grande Mosquée
  ('Grande Mosquée de Taroudant',
   'Centre de la médina', 'Taroudant',
   30.4715, -8.8745, 1363,
   3,
   'Plus ancienne mosquée de Taroudant, datant de la période mérinide. Minaret octogonal orné de faïences vertes. Centre spirituel et culturel de la ville depuis six siècles.',
   'active'),

  -- 7. Kasbah de Taroudant
  ('Kasbah de Taroudant',
   'Quartier Kasbah, sud-ouest', 'Taroudant',
   30.4685, -8.8802, 1571,
   4,
   'Ancienne résidence des gouverneurs saadiens. Complexe en pisé caractéristique de l''architecture de terre marocaine, avec douves, tours de guet et jardins intérieurs en partie préservés.',
   'active'),

  -- 8. Place Assarag
  ('Place Assarag',
   'Centre-ville', 'Taroudant',
   30.4720, -8.8769, 1850,
   5,
   'Cœur social et commercial de Taroudant. Entourée de cafés traditionnels et d''orangers centenaires. Lieu de rassemblement quotidien et de marchés hebdomadaires.',
   'active'),

  -- 9. Place An-Nasr (Place Talmokta)
  ('Place An-Nasr',
   'Quartier nord de la médina', 'Taroudant',
   30.4724, -8.8738, 1900,
   5,
   'Deuxième grande place de la médina, également connue sous le nom de Place Talmokta. Point névralgique du quartier artisanal avec ses ateliers de cuivre et de cuir.',
   'active'),

  -- 10. Borj El Oued (water tower bastion)
  ('Borj El Oued',
   'Angle nord-est des remparts', 'Taroudant',
   30.4745, -8.8711, 1528,
   7,
   'Bastion défensif à l''angle nord-est des remparts, dominant le lit de l''oued asséché. Bâti en pisé sur socle de pierre taillée, il offre une vue panoramique sur la plaine du Souss.',
   'active'),

  -- 11. Borj Sud (south bastion)
  ('Borj Sud',
   'Angle sud des remparts', 'Taroudant',
   30.4658, -8.8782, 1528,
   7,
   'Bastion méridional des remparts, le plus imposant des tours de défense. Sa structure à talus et mâchicoulis témoigne des techniques militaires saadiennes avancées.',
   'critical'),

  -- 12. Souk des Bijoutiers
  ('Souk des Bijoutiers',
   'Médina, rue des orfèvres', 'Taroudant',
   30.4718, -8.8756, 1750,
   8,
   'Quartier des artisans joailliers, célèbre pour la filigrane en argent berbère. Couvert de voûtes en berceau datant du XVIIIe siècle, avec boutiques encastrées dans la maçonnerie médiévale.',
   'active'),

  -- 13. Fontaine Ben Youssef
  ('Fontaine Ben Youssef',
   'Médina, quartier central', 'Taroudant',
   30.4716, -8.8762, 1820,
   6,
   'Fontaine publique en marbre et zellij, alimentée par le réseau de séguias traditionnelles. Composée d''un bassin central, de quatre robinets en laiton et d''une vasque ornementale en céramique de Fès.',
   'active');

-- --------------------------------------------------
-- SECTION 3 — Test users (password: Heritage2026!)
-- --------------------------------------------------
SET @bcrypt_hash := '$2b$12$q4V05SFqa2aqN0tpvwMCJuS6V8NqGZ0Tp9FqtVA5QcQaoxiGw8QIe';

INSERT IGNORE INTO users (full_name, email, password_hash, role_id, organization, phone) VALUES
  ('Aimad Bouya',        'admin@heritage-taroudant.ma',     @bcrypt_hash, 1, 'Heritage Monitoring System', '+212600000001'),
  ('Youssef Amrani',     'inspector@heritage-taroudant.ma', @bcrypt_hash, 2, 'Direction Régionale de la Culture', '+212600000002'),
  ('Fatima Zahra Idri',  'authority@heritage-taroudant.ma', @bcrypt_hash, 3, 'Délégation du Patrimoine Souss', '+212600000003'),
  ('Hassan Elkhaldi',    'inspector2@heritage-taroudant.ma',@bcrypt_hash, 2, 'Direction Régionale de la Culture', '+212600000004');

-- --------------------------------------------------
-- SECTION 4 — Inspections: one per key monument, spanning 6 months
--   inspector_id 2 = Youssef, inspector_id 5 = Hassan
-- --------------------------------------------------
INSERT INTO inspections
  (monument_id, inspector_id, inspection_date, notes, overall_condition, status)
VALUES
  -- Remparts — high risk (old, will accumulate crack score)
  (1, 2, DATE_SUB(CURDATE(), INTERVAL 5 MONTH),
   'Inspection semestrielle des remparts nord. Fissures verticales observées sur 3 zones. Effritement du pisé en surface. Végétation parasite pénétrante en base.',
   'poor', 'completed'),

  -- Bab El Khemis — moderate
  (2, 2, DATE_SUB(CURDATE(), INTERVAL 4 MONTH),
   'Inspection de la porte nord. Fissuration légère de l''arc supérieur. Joints décollés sur le mur est. État général acceptable.',
   'fair', 'completed'),

  -- Bab Zorgane — moderate
  (3, 4, DATE_SUB(CURDATE(), INTERVAL 3 MONTH),
   'Contrôle visuel de la porte est. Infiltrations d''humidité par le sommet de la voûte. Écaillage des enduits intérieurs.',
   'fair', 'completed'),

  -- Bab Sedra — fair
  (4, 4, DATE_SUB(CURDATE(), INTERVAL 2 MONTH),
   'Bab Sedra en bon état général. Légères fissures de séchage sur le parement externe. Aucune déformation structurelle.',
   'good', 'completed'),

  -- Bab El Kasbah — critical (major cracks, will trigger high-risk notifications)
  (5, 2, DATE_SUB(CURDATE(), INTERVAL 1 MONTH),
   'ALERTE: Fissures profondes traversantes sur le pilier droit de l''arche. Décrochage du linteau. Risque d''effondrement partiel. Intervention urgente requise.',
   'critical', 'completed'),

  -- Grande Mosquée — fair
  (6, 2, DATE_SUB(CURDATE(), INTERVAL 45 DAY),
   'Inspection du minaret et des murs périphériques. Fissuration superficielle sur le côté nord du minaret. Enduits extérieurs dégradés.',
   'fair', 'completed'),

  -- Kasbah — poor
  (7, 4, DATE_SUB(CURDATE(), INTERVAL 2 MONTH),
   'Muraille est de la Kasbah: effondrement partiel d''un tronçon de 4 mètres. Fondations exposées suite aux pluies. Zones à risque balisées.',
   'poor', 'completed'),

  -- Borj Sud — critical (oldest, worst state per monument status)
  (11, 2, DATE_SUB(CURDATE(), INTERVAL 15 DAY),
   'URGENCE: Lézardes traversantes sur toute la hauteur du bastion sud. Base minée par l''humidité capillaire. Risque d''effondrement imminent.',
   'critical', 'completed'),

  -- Remparts — second inspection (recent)
  (1, 4, DATE_SUB(CURDATE(), INTERVAL 20 DAY),
   'Suivi de l''inspection de mai. Progression des fissures zone nord-est. Nouveaux décollements observés sur 6 mètres linéaires.',
   'poor', 'in_progress'),

  -- Borj El Oued — recent pending
  (10, 4, DATE_SUB(CURDATE(), INTERVAL 5 DAY),
   'Première visite de la saison. Effritement du couronnement. Quelques fissures horizontales sur la face nord.',
   'fair', 'pending');

-- --------------------------------------------------
-- SECTION 5 — Cracks per inspection
--   Each INSERT fires after_crack_insert → CalculateVulnerabilityScore
--   High/critical totals fire after_score_insert → notifications to authority
-- --------------------------------------------------

-- Inspection 1: Remparts (monument 1, age ~497 yrs = age_score ~50)
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (1, 'Mur nord, 2m du sol',              'major',    52.0, NULL),
  (1, 'Tour nord-est, face externe',      'major',    38.5, NULL),
  (1, 'Angle remparts, zone de jointure', 'moderate', 21.0, NULL),
  (1, 'Couronnement, section ouest',      'minor',    11.0, NULL);

-- Inspection 2: Bab El Khemis (monument 2, age ~497 yrs)
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (2, 'Arc supérieur, clé de voûte',      'moderate', 18.5, NULL),
  (2, 'Mur est, joint dégradé',           'minor',    9.0,  NULL),
  (2, 'Soubassement ouest',               'minor',    7.5,  NULL);

-- Inspection 3: Bab Zorgane (monument 3)
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (3, 'Voûte intérieure, infiltration',   'moderate', 25.0, NULL),
  (3, 'Enduit intérieur, écaillage',      'minor',    14.0, NULL);

-- Inspection 4: Bab Sedra (monument 4) — Minor only → low/medium
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (4, 'Parement externe, fissure séchage','minor',    8.0,  NULL),
  (4, 'Face nord, micro-fissure',         'minor',    5.5,  NULL);

-- Inspection 5: Bab El Kasbah (monument 5) — CRITICAL → triggers notifications
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (5, 'Pilier droit, fissure traversante','critical', 92.0, NULL),
  (5, 'Linteau, décrochage amorce',       'critical', 67.0, NULL),
  (5, 'Arche, zone de compression',       'major',    45.0, NULL),
  (5, 'Piédroit gauche, éclatement',      'major',    33.0, NULL),
  (5, 'Base du pilier, délavage',         'moderate', 28.0, NULL);

-- Inspection 6: Grande Mosquée (monument 6)
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (6, 'Minaret, face nord, mi-hauteur',   'moderate', 22.0, NULL),
  (6, 'Mur périphérique nord',            'minor',    13.0, NULL);

-- Inspection 7: Kasbah (monument 7) — HIGH risk
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (7, 'Muraille est, effondrement partiel','critical', 420.0,NULL),
  (7, 'Fondations exposées, zone A',       'major',    85.0, NULL),
  (7, 'Tour d''angle, lézarde verticale',  'major',    61.0, NULL),
  (7, 'Courtine nord, déversement',        'moderate', 34.0, NULL);

-- Inspection 8: Borj Sud (monument 11) — CRITICAL, triggers immediate alerts
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (8, 'Face principale, lézarde traversante','critical',145.0,NULL),
  (8, 'Base, humidité capillaire',           'critical', 98.0,NULL),
  (8, 'Angle NE, désolidarisation',          'major',    72.0,NULL),
  (8, 'Couronnement, effritements massifs',  'major',    55.0,NULL),
  (8, 'Face ouest, fissures en réseau',      'moderate', 38.0,NULL),
  (8, 'Face est, micro-lézardes',            'minor',    15.0,NULL);

-- Inspection 9: Remparts second visit (monument 1)
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (9, 'Zone nord-est, progression fissure', 'major',   48.0, NULL),
  (9, 'Décollement nouveau, 6m linéaire',   'moderate',19.0, NULL);

-- Inspection 10: Borj El Oued (monument 10) — recent, light
INSERT INTO cracks (inspection_id, location_on_monument, severity, length_cm, photo_url) VALUES
  (10,'Couronnement, effritement',          'minor',   12.0, NULL),
  (10,'Face nord, fissure horizontale',     'minor',    8.5, NULL);

-- --------------------------------------------------
-- SECTION 6 — Generate reports for completed inspections
--   Called manually (stored procedure) for inspections 1, 5, 7, 8
--   (the ones that produce high/critical risk scores)
-- --------------------------------------------------
CALL GenerateMonumentReport(1,  1,  2);   -- Remparts
CALL GenerateMonumentReport(5,  5,  2);   -- Bab El Kasbah
CALL GenerateMonumentReport(7,  7,  4);   -- Kasbah
CALL GenerateMonumentReport(11, 8,  2);   -- Borj Sud

-- ✅ Seed data inserted successfully.
-- ⚡ Pipeline executed:
--    after_crack_insert → CalculateVulnerabilityScore (per inspection)
--    after_score_insert → notifications to authority (high/critical only)
--    GenerateMonumentReport → AES-encrypted reports + after_report_insert audit log
