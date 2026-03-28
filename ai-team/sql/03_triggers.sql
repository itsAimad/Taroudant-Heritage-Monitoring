-- ================================================
-- Taroudant Heritage Shield
-- File: 03_triggers.sql
-- Purpose: Define triggers for automatic scoring, notifications, and auditing
-- Run order: 3 of 5
-- Dependencies: 01_schema.sql, 02_stored_procedures.sql
-- ================================================

USE taroudant_heritage_shield;

DELIMITER $$

-- ==========================================================
-- Trigger: after_crack_insert
-- Purpose: Each new crack immediately recalculates vulnerability
--          to keep risk assessment up to date
-- ==========================================================
DROP TRIGGER IF EXISTS after_crack_insert $$
CREATE TRIGGER after_crack_insert
AFTER INSERT ON cracks
FOR EACH ROW
BEGIN
  -- Delegate scoring logic to the dedicated stored procedure for consistency
  CALL CalculateVulnerabilityScore(NEW.inspection_id);
END $$


-- ==========================================================
-- Trigger: after_score_insert
-- Purpose: When a high-risk or critical score is stored, automatically
--          notify all users with the 'authority' role
-- ==========================================================
DROP TRIGGER IF EXISTS after_score_insert $$
CREATE TRIGGER after_score_insert
AFTER INSERT ON vulnerability_scores
FOR EACH ROW
BEGIN
  DECLARE v_authority_role_id INT;
  DECLARE v_monument_name VARCHAR(150);

  -- Only generate alerts for high or critical risks
  IF NEW.risk_level IN ('high', 'critical') THEN
    -- Find the role id of municipal authorities
    SELECT role_id
    INTO v_authority_role_id
    FROM roles
    WHERE role_name = 'authority'
    LIMIT 1;

    -- Get monument name to contextualize the alert message
    SELECT name
    INTO v_monument_name
    FROM monuments
    WHERE monument_id = NEW.monument_id;

    -- Insert one notification per authority user using INSERT...SELECT
    INSERT INTO notifications (
      monument_id,
      triggered_by_inspection,
      recipient_id,
      message,
      severity,
      is_read,
      sent_at
    )
    SELECT
      NEW.monument_id,
      NEW.inspection_id,
      u.id_user,
      CONCAT(
        '⚠️ ALERTE: Monument [', v_monument_name,
        '] - Niveau de risque: ', NEW.risk_level,
        ' - Score: ', NEW.total_score, '/100'
      ),
      NEW.risk_level,
      FALSE,
      NOW()
    FROM users u
    WHERE u.role_id = v_authority_role_id;
  END IF;
END $$


-- ==========================================================
-- Trigger: after_report_insert
-- Purpose: Log report generation for accountability and auditing
-- ==========================================================
DROP TRIGGER IF EXISTS after_report_insert $$
CREATE TRIGGER after_report_insert
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    target_table,
    target_id,
    ip_address,
    details,
    performed_at
  ) VALUES (
    NEW.generated_by,
    'REPORT_GENERATED',
    'reports',
    NEW.report_id,
    NULL, -- IP address can be injected by application layer if available
    CONCAT(
      'Report generated for monument_id: ',
      NEW.monument_id,
      ' | risk_level: ',
      COALESCE(NEW.risk_level, 'unknown'),
      ' | score: ',
      COALESCE(NEW.total_score, 0)
    ),
    NOW()
  );
END $$


-- Trigger for after_access_request_reviewed

DROP TRIGGER IF EXISTS after_access_request_reviewed $$
CREATE TRIGGER after_access_request_reviewed
AFTER UPDATE ON access_requests
FOR EACH ROW
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO audit_logs(
      user_id,
      action,
      target_table,
      target_id,
      ip_address,
      details,
      performed_at
    )
    VALUES(
      NEW.reviewed_by_id,
      CASE NEW.status
        WHEN 'approved'  THEN 'ACCESS_REQUEST_APPROVED'
        WHEN 'rejected'  THEN 'ACCESS_REQUEST_REJECTED'
        WHEN 'pending'   THEN 'ACCESS_REQUEST_PENDING'
        ELSE 'ACCESS_REQUEST_UPDATED'
      END,
      'access_requests',
      NEW.id,
      NULL,
      CONCAT('Request from:', NEW.email,
      ' | Role requested: ', NEW.role,
      ' | Note: ', NEW.note),
      NOW()
    );
  END IF;
END;
$$

DELIMITER ;

-- ✅ Triggers created successfully


