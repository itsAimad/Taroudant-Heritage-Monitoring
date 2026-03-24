-- Taroudant Heritage Shield — Procédures métier (équipe sans IA)
-- Calcul du score: âge du monument + fissures (gravité + nombre via la somme des points)
-- Met à jour INSPECTION.score_vulnerabilite et MONUMENT.etat_structure (chaîne vers alerte côté trigger)

USE taroudant_heritage_shield;

DROP PROCEDURE IF EXISTS CalculerScoreVulnerabilite;

DELIMITER $$

CREATE PROCEDURE CalculerScoreVulnerabilite(IN p_inspection INT)
BEGIN
    DECLARE v_id_monument INT;
    DECLARE d_creation DATE;
    DECLARE age_years INT DEFAULT 0;
    DECLARE crack_points FLOAT DEFAULT 0;
    DECLARE total_score FLOAT DEFAULT 0;

    SELECT i.id_monument, m.date_de_creation
    INTO v_id_monument, d_creation
    FROM INSPECTION i
    INNER JOIN MONUMENT m ON m.id_monument = i.id_monument
    WHERE i.id_inspection = p_inspection
    LIMIT 1;

    IF v_id_monument IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inspection introuvable.';
    END IF;

    IF d_creation IS NOT NULL THEN
        SET age_years = TIMESTAMPDIFF(YEAR, d_creation, CURDATE());
    END IF;

    /* Poids alignés avec le formulaire (Inspections.tsx) : low 5, medium 15, high 30, critical 50 */
    SELECT IFNULL(SUM(
        CASE gravite
            WHEN 'faible' THEN 5
            WHEN 'moyenne' THEN 15
            WHEN 'grave' THEN 30
            WHEN 'critique' THEN 50
        END
    ), 0)
    INTO crack_points
    FROM FISSURE
    WHERE id_inspection = p_inspection;

    /* Part âge (pondération faible) + points liés aux fissures */
    SET total_score = (age_years * 0.2) + crack_points;

    /*
     Seuils d'état monument (alignés avec le frontend : Stable / À surveiller / Critique)
     EN: tune thresholds — stable < 35, watch 35–64, critical >= 65
    */
    UPDATE MONUMENT
    SET etat_structure = CASE
        WHEN total_score >= 65 THEN 'critique'
        WHEN total_score >= 35 THEN 'a_surveiller'
        ELSE 'stable'
    END
    WHERE id_monument = v_id_monument;

    UPDATE INSPECTION
    SET score_vulnerabilite = total_score
    WHERE id_inspection = p_inspection;
END$$

DELIMITER ;
