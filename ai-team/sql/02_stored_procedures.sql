-- ================================================
-- Taroudant Heritage Shield
-- File: 02_stored_procedures.sql
-- Purpose: Define core stored procedures for vulnerability scoring and report generation
-- Run order: 2 of 5
-- Dependencies: 01_schema.sql (database and tables must exist)
-- ================================================

USE taroudant_heritage_shield;

-- Use a custom delimiter to allow procedure bodies containing semicolons
DELIMITER $$

-- ==========================================================
-- Procedure: CalculateVulnerabilityScore
-- Purpose : Compute vulnerability score for a given inspection
--           and persist the result in vulnerability_scores
-- Notes   : Uses both age of monument and aggregated crack data
-- ==========================================================
DROP PROCEDURE IF EXISTS CalculateVulnerabilityScore $$
CREATE PROCEDURE CalculateVulnerabilityScore (
  IN p_inspection_id INT
)
BEGIN
  -- All variable declarations MUST come before handlers in MySQL
  DECLARE v_monument_id        INT;
  DECLARE v_construction_year  INT;
  DECLARE v_age_years          INT;
  DECLARE v_age_score          INT DEFAULT 0;
  DECLARE v_crack_score        INT DEFAULT 0;
  DECLARE v_total_score        INT DEFAULT 0;
  DECLARE v_risk_level ENUM('low','medium','high','critical') DEFAULT 'low';

  -- Step 1 — Get monument and construction year from inspection
  SELECT
    i.monument_id,
    m.construction_year
  INTO
    v_monument_id,
    v_construction_year
  FROM inspections i
  JOIN monuments m ON m.monument_id = i.monument_id
  WHERE i.inspection_id = p_inspection_id
  FOR UPDATE;

  -- If construction_year is missing, we treat age as 0 years (neutral for scoring)
  IF v_construction_year IS NULL THEN
    SET v_age_years = 0;
  ELSE
    SET v_age_years = YEAR(CURDATE()) - v_construction_year;
    IF v_age_years < 0 THEN
      -- Guard against incorrect future years by clamping to zero
      SET v_age_years = 0;
    END IF;
  END IF;

  -- Step 2 — Compute age_score with capping at 50
  SET v_age_score = FLOOR(v_age_years / 2);
  IF v_age_score > 50 THEN
    SET v_age_score = 50;
  END IF;

  -- Step 3 — Compute crack_score based on severity weights
  SELECT
    COALESCE(SUM(
      CASE
        WHEN severity = 'minor'    THEN 1
        WHEN severity = 'moderate' THEN 3
        WHEN severity = 'major'    THEN 7
        WHEN severity = 'critical' THEN 15
        ELSE 0
      END
    ), 0)
  INTO v_crack_score
  FROM cracks
  WHERE inspection_id = p_inspection_id;

  -- Step 4 — Total score combination
  SET v_total_score = v_age_score + v_crack_score;

  -- Step 5 — Risk level classification based on total_score
  IF v_total_score <= 25 THEN
    SET v_risk_level = 'low';
  ELSEIF v_total_score BETWEEN 26 AND 50 THEN
    SET v_risk_level = 'medium';
  ELSEIF v_total_score BETWEEN 51 AND 75 THEN
    SET v_risk_level = 'high';
  ELSE
    SET v_risk_level = 'critical';
  END IF;

  -- Step 6 — Persist computed score
  INSERT INTO vulnerability_scores (
    monument_id,
    inspection_id,
    age_score,
    crack_score,
    total_score,
    risk_level,
    computed_at
  ) VALUES (
    v_monument_id,
    p_inspection_id,
    v_age_score,
    v_crack_score,
    v_total_score,
    v_risk_level,
    NOW()
  );

  -- Step 7 — If risk is high or critical, immediately flag monument as critical
  IF v_risk_level IN ('high', 'critical') THEN
    UPDATE monuments
    SET status = 'critical'
    WHERE monument_id = v_monument_id;
  END IF;
END $$


-- ==========================================================
-- Procedure: GenerateMonumentReport
-- Purpose : Assemble structured French report text, encrypt it,
--           and store metadata in the reports table
-- ==========================================================
DROP PROCEDURE IF EXISTS GenerateMonumentReport $$
CREATE PROCEDURE GenerateMonumentReport (
  IN p_monument_id   INT,
  IN p_inspection_id INT,
  IN p_generated_by  INT
)
BEGIN
  -- All variable declarations MUST come before handlers in MySQL
  DECLARE v_monument_name      VARCHAR(150);
  DECLARE v_location           VARCHAR(255);
  DECLARE v_construction_year  INT;
  DECLARE v_inspection_date    DATE;
  DECLARE v_overall_condition  ENUM('good','fair','poor','critical');
  DECLARE v_notes              TEXT;
  DECLARE v_age_score          INT;
  DECLARE v_crack_score        INT;
  DECLARE v_total_score        INT;
  DECLARE v_risk_level         ENUM('low','medium','high','critical');
  DECLARE v_total_cracks       INT DEFAULT 0;
  DECLARE v_minor_cnt          INT DEFAULT 0;
  DECLARE v_moderate_cnt       INT DEFAULT 0;
  DECLARE v_major_cnt          INT DEFAULT 0;
  DECLARE v_critical_cnt       INT DEFAULT 0;
  DECLARE v_title              VARCHAR(255);
  DECLARE v_recommendation     TEXT;
  DECLARE v_report_content     TEXT;
  DECLARE v_encrypted_content  LONGBLOB;

  -- Exit handler keeps report creation consistent in case of runtime SQL errors
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
  END;

  START TRANSACTION;

  -- Step 1 — Fetch monument info
  SELECT
    name,
    location,
    construction_year
  INTO
    v_monument_name,
    v_location,
    v_construction_year
  FROM monuments
  WHERE monument_id = p_monument_id
  FOR UPDATE;

  -- Step 2 — Fetch inspection summary
  SELECT
    inspection_date,
    overall_condition,
    notes
  INTO
    v_inspection_date,
    v_overall_condition,
    v_notes
  FROM inspections
  WHERE inspection_id = p_inspection_id
  FOR UPDATE;

  -- Step 3 — Fetch vulnerability score and risk_level for this inspection
  SELECT
    age_score,
    crack_score,
    total_score,
    risk_level
  INTO
    v_age_score,
    v_crack_score,
    v_total_score,
    v_risk_level
  FROM vulnerability_scores
  WHERE inspection_id = p_inspection_id
    AND monument_id = p_monument_id
  ORDER BY computed_at DESC
  LIMIT 1;

  -- Step 4 — Crack statistics (total + per severity)
  SELECT
    COUNT(*) AS total_cracks,
    SUM(CASE WHEN severity = 'minor'    THEN 1 ELSE 0 END) AS minor_cnt,
    SUM(CASE WHEN severity = 'moderate' THEN 1 ELSE 0 END) AS moderate_cnt,
    SUM(CASE WHEN severity = 'major'    THEN 1 ELSE 0 END) AS major_cnt,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_cnt
  INTO
    v_total_cracks,
    v_minor_cnt,
    v_moderate_cnt,
    v_major_cnt,
    v_critical_cnt
  FROM cracks
  WHERE inspection_id = p_inspection_id;

  -- Step 5 — Build human-readable French title
  SET v_title = CONCAT('Rapport - ', v_monument_name, ' - ', DATE_FORMAT(NOW(), '%M %Y'));

  -- Step 6 — Build structured French report content using CONCAT_WS for clarity
  SET v_report_content = CONCAT_WS(
    '\n\n',

    -- Monument section
    CONCAT(
      '=== Informations sur le monument ===\n',
      'Nom : ', v_monument_name, '\n',
      'Localisation : ', v_location, '\n',
      'Année de construction : ',
      COALESCE(CAST(v_construction_year AS CHAR), 'Inconnue')
    ),

    -- Inspection section
    CONCAT(
      '=== Synthèse de l''inspection ===\n',
      'Date d''inspection : ', DATE_FORMAT(v_inspection_date, '%d/%m/%Y'), '\n',
      'État global : ', v_overall_condition, '\n',
      'Observations : ', COALESCE(v_notes, 'Aucune observation supplémentaire.')
    ),

    -- Crack statistics section
    CONCAT(
      '=== Fissures observées ===\n',
      'Nombre total de fissures : ', COALESCE(v_total_cracks, 0), '\n',
      ' - Fissures mineures : ', COALESCE(v_minor_cnt, 0), '\n',
      ' - Fissures modérées : ', COALESCE(v_moderate_cnt, 0), '\n',
      ' - Fissures majeures : ', COALESCE(v_major_cnt, 0), '\n',
      ' - Fissures critiques : ', COALESCE(v_critical_cnt, 0)
    ),

    -- Vulnerability and recommendation section
    CONCAT(
      '=== Vulnérabilité et recommandation ===\n',
      'Score d''âge : ', COALESCE(v_age_score, 0), '\n',
      'Score de fissuration : ', COALESCE(v_crack_score, 0), '\n',
      'Score total : ', COALESCE(v_total_score, 0), '/100', '\n',
      'Niveau de risque : ', COALESCE(v_risk_level, 'low')
    )
  );

  -- Recommendation in French according to risk level
  IF v_risk_level = 'low' THEN
    SET v_recommendation = 'Surveillance périodique recommandée';
  ELSEIF v_risk_level = 'medium' THEN
    SET v_recommendation = 'Inspection approfondie recommandée';
  ELSEIF v_risk_level = 'high' THEN
    SET v_recommendation = 'Intervention urgente requise';
  ELSE
    SET v_recommendation = 'DANGER: Fermeture et restauration immédiate';
  END IF;

  -- Append recommendation as final section
  SET v_report_content = CONCAT(
    v_report_content,
    '\n\n=== Recommandation ===\n',
    v_recommendation
  );

  -- Step 7 — Encrypt content using a strong symmetric key
  SET v_encrypted_content = AES_ENCRYPT(
    v_report_content,
    SHA2('TaroudantHeritage2026Key', 256)
  );

  -- Step 8 — Insert metadata + encrypted payload into reports
  INSERT INTO reports (
    monument_id,
    inspection_id,
    generated_by,
    title,
    file_path,
    encrypted_content,
    risk_level,
    total_score,
    status,
    created_at
  ) VALUES (
    p_monument_id,
    p_inspection_id,
    p_generated_by,
    v_title,
    NULL, -- file_path can be managed by the application layer if exporting to disk
    v_encrypted_content,
    v_risk_level,
    v_total_score,
    'final',
    NOW()
  );

  -- Step 9 — Return the new report identifier to the caller
  SELECT LAST_INSERT_ID() AS report_id;

  COMMIT;
END $$

-- Restore default delimiter for subsequent statements or tools
DELIMITER ;

-- ✅ Stored procedures created successfully


