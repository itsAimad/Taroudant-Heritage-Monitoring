-- Fix reports table schema to support authority validation
ALTER TABLE reports
  ADD COLUMN validated_by INT AFTER generated_by,
  ADD COLUMN validated_at TIMESTAMP NULL AFTER created_at,
  ADD COLUMN validation_note TEXT AFTER validated_at;

-- Expand the status enum for reports
ALTER TABLE reports
  MODIFY COLUMN status ENUM('draft', 'final', 'validated', 'disputed', 'archived') DEFAULT 'draft';

-- Add foreign key constraint for validated_by
ALTER TABLE reports
  ADD CONSTRAINT fk_reports_validated_by
    FOREIGN KEY (validated_by)
    REFERENCES users (id_user)
    ON DELETE SET NULL;
