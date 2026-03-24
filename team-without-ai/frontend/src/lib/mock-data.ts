import monument1 from "@/assets/monument-1.jpg";
import monument2 from "@/assets/monument-2.jpg";
import monument3 from "@/assets/monument-3.jpg";
import monument4 from "@/assets/monument-4.jpg";
import monument5 from "@/assets/monument-5.jpg";
import monument6 from "@/assets/monument-6.jpg";
import inspCrack1 from "@/assets/inspection-crack-1.jpg";
import inspCrack2 from "@/assets/inspection-crack-2.jpg";
import inspCrack3 from "@/assets/inspection-crack-3.jpg";
import inspCrack4 from "@/assets/inspection-crack-4.jpg";
import inspCrack5 from "@/assets/inspection-crack-5.jpg";

export interface Monument {
  id: string;
  name: string;
  location: string;
  dateCreation: string;
  structuralState: "Stable" | "À surveiller" | "Critique";
  description: string;
  vulnerabilityScore: number;
  image: string;
}

export interface Seisme {
  id: string;
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  intensity: string;
}

export interface Fissure {
  id: string;
  description: string;
  detectionDate: string;
  gravityLevel: "low" | "medium" | "high" | "critical";
}

export interface Inspection {
  id: string;
  monumentId: string;
  monumentName: string;
  inspector: string;
  inspectionDate: string;
  inspectionType: string;
  observation: string;
  vulnerabilityScore: number;
  status: "En cours" | "Terminée" | "Planifiée";
  fissures: Fissure[];
  image?: string;
}

export interface Alerte {
  id: string;
  date: string;
  message: string;
  alertLevel: "Info" | "Warning" | "Critical";
  degradationType: string;
  status: "Active" | "Résolue" | "En attente";
  received: boolean;
  inspectionId: string;
  monumentName: string;
}

export interface Rapport {
  id: string;
  dateRapport: string;
  diagnosticStructurel: string;
  analyseFissures: string;
  recommandations: string;
  niveauPriorite: "Faible" | "Moyen" | "Élevé" | "Critique";
  statut: "en_attente" | "validé" | "rejeté";
  commentaireAutorite: string;
  inspectionId: string;
  idUtilisateur: string;
  nomExpert: string;
  monumentName: string;
}

export interface Utilisateur {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Expert" | "Authority";
  status: "Actif" | "Inactif";
  lastLogin: string;
}

export const monuments: Monument[] = [
  { id: "m1", name: "Kasbah de Taroudant", location: "Centre-ville, Taroudant", dateCreation: "XIVe siècle", structuralState: "À surveiller", description: "Forteresse historique au cœur de la médina, symbole de la puissance saadienne.", vulnerabilityScore: 62, image: monument1 },
  { id: "m2", name: "Grande Mosquée", location: "Quartier Salam, Taroudant", dateCreation: "XVIe siècle", structuralState: "Stable", description: "Mosquée monumentale avec un minaret orné de zellige traditionnel.", vulnerabilityScore: 28, image: monument2 },
  { id: "m3", name: "Riad Al-Andalous", location: "Médina, Taroudant", dateCreation: "XVIIe siècle", structuralState: "Critique", description: "Ancien palais avec cour intérieure et décoration en plâtre sculpté.", vulnerabilityScore: 85, image: monument3 },
  { id: "m4", name: "Bab El-Kasbah", location: "Remparts Nord, Taroudant", dateCreation: "XVe siècle", structuralState: "Stable", description: "Porte principale de la kasbah avec architecture militaire mérinide.", vulnerabilityScore: 35, image: monument4 },
  { id: "m5", name: "Medersa Ben Youssef", location: "Quartier Historique, Taroudant", dateCreation: "XIVe siècle", structuralState: "À surveiller", description: "École coranique avec décor géométrique et boiseries de cèdre.", vulnerabilityScore: 55, image: monument5 },
  { id: "m6", name: "Pont Fortifié d'Oued", location: "Périphérie Sud, Taroudant", dateCreation: "XIIIe siècle", structuralState: "Critique", description: "Pont historique enjambant l'oued avec tours de garde défensives.", vulnerabilityScore: 78, image: monument6 },
];

export const seismes: Seisme[] = [
  { id: "s1", date: "2023-09-08", location: "Al Haouz, Marrakech", magnitude: 6.8, depth: 18.5, intensity: "VIII (Sévère)" },
  { id: "s2", date: "2024-01-15", location: "Taroudant, Souss-Massa", magnitude: 4.2, depth: 12.0, intensity: "V (Modérée)" },
  { id: "s3", date: "2024-03-22", location: "Agadir, Souss-Massa", magnitude: 3.8, depth: 8.5, intensity: "IV (Légère)" },
  { id: "s4", date: "2024-06-10", location: "Tiznit, Souss-Massa", magnitude: 5.1, depth: 15.2, intensity: "VI (Forte)" },
  { id: "s5", date: "2025-01-05", location: "Ouarzazate, Draa-Tafilalet", magnitude: 3.5, depth: 10.0, intensity: "III (Faible)" },
];

export const inspections: Inspection[] = [
  { id: "i1", monumentId: "m1", monumentName: "Kasbah de Taroudant", inspector: "Dr. Amina Benali", inspectionDate: "2024-11-15", inspectionType: "Post-séisme", observation: "Fissures observées sur le mur est. Déformation légère de l'arche principale.", vulnerabilityScore: 62, status: "Terminée", image: inspCrack1, fissures: [{ id: "f1", description: "Fissure longitudinale mur est", detectionDate: "2024-11-15", gravityLevel: "high" }, { id: "f2", description: "Micro-fissure arche principale", detectionDate: "2024-11-15", gravityLevel: "medium" }] },
  { id: "i2", monumentId: "m3", monumentName: "Riad Al-Andalous", inspector: "Prof. Karim Essaidi", inspectionDate: "2024-12-01", inspectionType: "Urgente", observation: "Dégradation avancée des fondations. Risque d'effondrement partiel.", vulnerabilityScore: 85, status: "Terminée", image: inspCrack2, fissures: [{ id: "f3", description: "Fissure structurelle fondation nord", detectionDate: "2024-12-01", gravityLevel: "critical" }, { id: "f4", description: "Fissure diagonale mur porteur", detectionDate: "2024-12-01", gravityLevel: "critical" }, { id: "f5", description: "Craquelure plafond salle principale", detectionDate: "2024-12-01", gravityLevel: "high" }] },
  { id: "i3", monumentId: "m5", monumentName: "Medersa Ben Youssef", inspector: "Dr. Amina Benali", inspectionDate: "2025-01-10", inspectionType: "Périodique", observation: "État général acceptable. Quelques fissures mineures à surveiller.", vulnerabilityScore: 55, status: "Terminée", image: inspCrack5, fissures: [{ id: "f6", description: "Fissure capillaire mur sud", detectionDate: "2025-01-10", gravityLevel: "low" }] },
  { id: "i4", monumentId: "m6", monumentName: "Pont Fortifié d'Oued", inspector: "Ing. Hassan Moukhliss", inspectionDate: "2025-02-20", inspectionType: "Post-séisme", observation: "Érosion avancée des piliers. Fissures profondes détectées.", vulnerabilityScore: 78, status: "En cours", image: inspCrack3, fissures: [{ id: "f7", description: "Fissure profonde pilier central", detectionDate: "2025-02-20", gravityLevel: "critical" }, { id: "f8", description: "Fissure horizontale tablier", detectionDate: "2025-02-20", gravityLevel: "high" }] },
  { id: "i5", monumentId: "m2", monumentName: "Grande Mosquée", inspector: "Dr. Amina Benali", inspectionDate: "2025-03-05", inspectionType: "Périodique", observation: "Structure en bon état. Aucune anomalie majeure.", vulnerabilityScore: 28, status: "Planifiée", image: inspCrack4, fissures: [] },
];

export const alertes: Alerte[] = [
  { id: "a1", date: "2024-12-01", message: "Score de vulnérabilité critique détecté pour Riad Al-Andalous", alertLevel: "Critical", degradationType: "Structurelle", status: "Active", received: true, inspectionId: "i2", monumentName: "Riad Al-Andalous" },
  { id: "a2", date: "2025-02-20", message: "Fissures profondes détectées sur le Pont Fortifié d'Oued", alertLevel: "Critical", degradationType: "Érosion", status: "Active", received: true, inspectionId: "i4", monumentName: "Pont Fortifié d'Oued" },
  { id: "a3", date: "2024-11-15", message: "Augmentation du score de vulnérabilité de la Kasbah", alertLevel: "Warning", degradationType: "Fissuration", status: "En attente", received: false, inspectionId: "i1", monumentName: "Kasbah de Taroudant" },
  { id: "a4", date: "2025-01-10", message: "Surveillance recommandée pour Medersa Ben Youssef", alertLevel: "Info", degradationType: "Usure", status: "Résolue", received: true, inspectionId: "i3", monumentName: "Medersa Ben Youssef" },
];

export const rapports: Rapport[] = [
  { id: "r1", dateRapport: "2024-11-20", diagnosticStructurel: "Fissures sur mur est et déformation légère de l'arche principale. Structure encore fonctionnelle mais nécessite renforcement.", analyseFissures: "2 fissures détectées : 1 longitudinale (gravité élevée) sur mur est, 1 micro-fissure (moyenne) sur arche principale.", recommandations: "Renforcement structural du mur est par injection de résine époxy. Surveillance mensuelle de l'arche.", niveauPriorite: "Élevé", statut: "validé", commentaireAutorite: "Intervention approuvée. Budget alloué pour les travaux de renforcement.", inspectionId: "i1", idUtilisateur: "u1", nomExpert: "Dr. Amina Benali", monumentName: "Kasbah de Taroudant" },
  { id: "r2", dateRapport: "2024-12-05", diagnosticStructurel: "Dégradation avancée des fondations. Risque d'effondrement partiel imminent. Structure classée en danger critique.", analyseFissures: "3 fissures critiques : fondation nord (critique), mur porteur diagonal (critique), plafond salle principale (élevée).", recommandations: "Évacuation immédiate des occupants. Étaiement d'urgence. Étude géotechnique approfondie avant toute réhabilitation.", niveauPriorite: "Critique", statut: "en_attente", commentaireAutorite: "", inspectionId: "i2", idUtilisateur: "u2", nomExpert: "Prof. Karim Essaidi", monumentName: "Riad Al-Andalous" },
  { id: "r3", dateRapport: "2025-01-15", diagnosticStructurel: "État général acceptable. Usure normale liée à l'âge du monument. Aucun risque structurel immédiat.", analyseFissures: "1 fissure capillaire de faible gravité sur mur sud. Pas d'évolution depuis la dernière inspection.", recommandations: "Surveillance semestrielle. Application d'un traitement hydrofuge préventif sur les murs extérieurs.", niveauPriorite: "Faible", statut: "rejeté", commentaireAutorite: "Rapport incomplet. Veuillez ajouter les mesures précises des fissures et les photos associées.", inspectionId: "i3", idUtilisateur: "u1", nomExpert: "Dr. Amina Benali", monumentName: "Medersa Ben Youssef" },
];

export const utilisateurs: Utilisateur[] = [
  { id: "u1", name: "Dr. Amina Benali", email: "amina.benali@heritage.ma", role: "Expert", status: "Actif", lastLogin: "2025-03-14" },
  { id: "u2", name: "Prof. Karim Essaidi", email: "karim.essaidi@heritage.ma", role: "Expert", status: "Actif", lastLogin: "2025-03-13" },
  { id: "u3", name: "Mohammed Alaoui", email: "m.alaoui@autorite.ma", role: "Authority", status: "Actif", lastLogin: "2025-03-12" },
  { id: "u4", name: "Fatima Zahra El Idrissi", email: "fz.idrissi@heritage.ma", role: "Admin", status: "Actif", lastLogin: "2025-03-14" },
  { id: "u5", name: "Ing. Hassan Moukhliss", email: "h.moukhliss@heritage.ma", role: "Expert", status: "Inactif", lastLogin: "2025-02-28" },
];
