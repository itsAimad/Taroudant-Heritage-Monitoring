-- Taroudant Heritage Shield — Déclencheurs (équipe sans IA)
-- 1) Après nouvelle fissure → recalcul du score (procédure)
-- 2) Après mise'à jour inspection (score) → si monument critique → alertes pour chaque utilisateur « autorité »

USE taroudant_heritage_shield;

DROP TRIGGER IF EXISTS trg_fissure_apres_insert;
DROP TRIGGER IF EXISTS trg_inspection_apres_update_alerte;

DELIMITER $$

/* Trigger 1 — FR: après ajout d'une fissure, recalculer le score de l'inspection */
CREATE TRIGGER trg_fissure_apres_insert
AFTER INSERT ON FISSURE
FOR EACH ROW
BEGIN
    CALL CalculerScoreVulnerabilite(NEW.id_inspection);
END$$

/*
   Trigger 2 — FR: inspection mise à jour (score recalculé) → état monument critique → alerte autorités
   EN: on INSPECTION UPDATE, if linked MONUMENT.etat_structure = critique and score crosses critical band,
       insert one ALERTE per authority user (role autorite).
*/
CREATE TRIGGER trg_inspection_apres_update_alerte
AFTER UPDATE ON INSPECTION
FOR EACH ROW
BEGIN
    DECLARE v_etat VARCHAR(20);
    DECLARE v_nom_monument VARCHAR(150);

    IF NOT (NEW.score_vulnerabilite <=> OLD.score_vulnerabilite) THEN
        SELECT m.etat_structure, m.nom
        INTO v_etat, v_nom_monument
        FROM MONUMENT m
        WHERE m.id_monument = NEW.id_monument
        LIMIT 1;

        IF v_etat = 'critique' AND NEW.score_vulnerabilite >= 65 THEN
            INSERT INTO ALERTE (
                date_alerte,
                message,
                niveau,
                statut,
                type_degradation,
                alerte_recue,
                id_inspection,
                id_utilisateur
            )
            SELECT
                NOW(),
                CONCAT(
                    'Risque structurel critique : ',
                    IFNULL(v_nom_monument, CONCAT('monument #', NEW.id_monument)),
                    ' (inspection #', NEW.id_inspection, '). ',
                    'EN: Critical structural risk for monument after inspection update.'
                ),
                'critique',
                'nouvelle',
                'danger_structurel',
                FALSE,
                NEW.id_inspection,
                u.id_utilisateur
            FROM UTILISATEUR u
            WHERE u.role = 'autorite'
            AND NOT EXISTS (
                SELECT 1
                FROM ALERTE a
                WHERE a.id_inspection = NEW.id_inspection
                  AND a.id_utilisateur = u.id_utilisateur
                  AND a.niveau = 'critique'
                  AND a.statut IN ('nouvelle', 'en_cours')
            );
        END IF;
    END IF;
END$$

DELIMITER ;
