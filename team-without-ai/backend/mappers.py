from __future__ import annotations

from datetime import date, datetime


def db_role_to_ui(role: str) -> str:
    mapping = {
        "admin": "Admin",
        "expert": "Expert",
        "autorite": "Authority",
    }
    return mapping.get(role, role)


def monument_etat_to_ui(etat: str) -> str:
    mapping = {
        "stable": "Stable",
        "a_surveiller": "À surveiller",
        "critique": "Critique",
    }
    return mapping.get(etat, etat)


def monument_etat_to_db(etat_ui: str) -> str:
    mapping = {
        "Stable": "stable",
        "À surveiller": "a_surveiller",
        "Critique": "critique",
    }
    return mapping.get(etat_ui, etat_ui)


def inspection_statut_to_ui(statut: str) -> str:
    mapping = {
        "planifiee": "Planifiée",
        "en_cours": "En cours",
        "terminee": "Terminée",
    }
    return mapping.get(statut, statut)


def inspection_statut_to_db(statut_ui: str) -> str:
    mapping = {
        "Planifiée": "planifiee",
        "En cours": "en_cours",
        "Terminée": "terminee",
    }
    return mapping.get(statut_ui, "en_cours")


def fissure_gravite_to_ui(gravite: str) -> str:
    mapping = {
        "faible": "low",
        "moyenne": "medium",
        "grave": "high",
        "critique": "critical",
    }
    return mapping.get(gravite, gravite)


def fissure_gravite_to_db(gravite_ui: str) -> str:
    mapping = {
        "low": "faible",
        "medium": "moyenne",
        "high": "grave",
        "critical": "critique",
    }
    return mapping.get(gravite_ui, "faible")


def alerte_niveau_to_ui(niveau: str) -> str:
    mapping = {
        "faible": "Info",
        "moyen": "Warning",
        "critique": "Critical",
    }
    return mapping.get(niveau, niveau)


def alerte_statut_to_ui(statut: str) -> str:
    mapping = {
        "nouvelle": "En attente",
        "en_cours": "Active",
        "traitee": "Résolue",
    }
    return mapping.get(statut, statut)


def rapport_priorite_to_ui(niveau_priorite: str) -> str:
    mapping = {
        "faible": "Faible",
        "moyen": "Moyen",
        "urgent": "Élevé",
        "critique": "Critique",
    }
    return mapping.get(niveau_priorite, niveau_priorite)


def rapport_statut_to_ui(statut: str) -> str:
    mapping = {
        "en_attente": "en_attente",
        "valide": "validé",
        "rejete": "rejeté",
    }
    return mapping.get(statut, statut)


def rapport_statut_to_db(statut_ui: str) -> str:
    mapping = {
        "en_attente": "en_attente",
        "validé": "valide",
        "rejeté": "rejete",
    }
    return mapping.get(statut_ui, "en_attente")


def rapport_priorite_to_db(priorite_ui: str) -> str:
    mapping = {
        "Faible": "faible",
        "Moyen": "moyen",
        "Élevé": "urgent",
        "Critique": "critique",
    }
    return mapping.get(priorite_ui, "moyen")


def to_iso_date(value: date | datetime | str | None) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return str(value)

