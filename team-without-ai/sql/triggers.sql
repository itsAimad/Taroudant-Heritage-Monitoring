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
    DECLARE v_niveau VARCHAR(20);
    DECLARE v_msg TEXT;

    IF NOT (NEW.score_vulnerabilite <=> OLD.score_vulnerabilite) THEN
        SELECT m.etat_structure, m.nom
        INTO v_etat, v_nom_monument
        FROM MONUMENT m
        WHERE m.id_monument = NEW.id_monument
        LIMIT 1;

        IF NEW.score_vulnerabilite >= 65 THEN
            SET v_niveau = 'critique';
            SET v_msg = CONCAT(
                'Risque structurel critique : ',
                IFNULL(v_nom_monument, CONCAT('monument #', NEW.id_monument)),
                ' (inspection #', NEW.id_inspection, ').'
            );
        ELSEIF NEW.score_vulnerabilite >= 50 OR v_etat = 'a_surveiller' THEN
            SET v_niveau = 'moyen';
            SET v_msg = CONCAT(
                'Risque élevé / urgent à surveiller : ',
                IFNULL(v_nom_monument, CONCAT('monument #', NEW.id_monument)),
                ' (inspection #', NEW.id_inspection, ').'
            );
        ELSE
            SET v_niveau = NULL;
        END IF;

        IF v_niveau IS NOT NULL THEN
            -- On veut UNE SEULE alerte par inspection (système), visible à toutes les autorités.
            -- Comme le score peut être recalculé plusieurs fois pendant la création (via fissures),
            -- on remplace l'alerte active existante (nouvelle/en_cours) par une seule ligne.
            DELETE FROM ALERTE
            WHERE id_inspection = NEW.id_inspection
              AND statut IN ('nouvelle', 'en_cours');

            INSERT INTO ALERTE (
                date_alerte,
                message,
                niveau,
                statut,
                type_degradation,
                alerte_recue,
                id_inspection,
                id_utilisateur
            ) VALUES (
                NOW(),
                v_msg,
                v_niveau,
                'nouvelle',
                'danger_structurel',
                FALSE,
                NEW.id_inspection,
                NULL
            );
        END IF;
    END IF;
END$$

DELIMITER ;
