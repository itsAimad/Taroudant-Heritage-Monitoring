#!/usr/bin/env python3
"""Generate LaTeX report for Taroudant Heritage Monitoring project."""

import json
import os
import re
from pathlib import Path

def latex_french_report(
    project_root: str,
    students: list,
    supervisor: str,
    subtitle: str = "Monitoring et valorisation du patrimoine de Taroudant",
    include_sections: list = None
) -> dict:
    """Generate a LaTeX report for the project."""

    project_root = Path(project_root).resolve()
    if not project_root.is_dir():
        raise FileNotFoundError(f"Folder {project_root} does not exist")

    include_sections = include_sections or [
        "introduction",
        "project_overview",
        "architecture",
        "dcm",
        "dml",
        "api_endpoints"
    ]

    def read_all(ext_set):
        txt = ""
        for f in project_root.rglob("*"):
            if f.suffix.lower() in ext_set and f.is_file():
                try:
                    txt += "\n" + f.read_text(encoding="utf-8")
                except Exception:
                    pass
        return txt

    # ---- Architecture -------------------------------------------------
    arch_text = ""
    arch_candidates = list(project_root.rglob("*archi*")) + list(project_root.rglob("*architecture*"))
    for cand in arch_candidates:
        if cand.is_file() and cand.suffix.lower() in {".md", ".txt"}:
            arch_text = cand.read_text(encoding="utf-8", errors="ignore")
            break

    # Also look for tech stack in README
    readme_paths = list(project_root.rglob("README.md")) + list(project_root.rglob("readme.md"))
    for readme in readme_paths:
        try:
            content = readme.read_text(encoding="utf-8", errors="ignore")
            if "Tech Stack" in content or "Stack" in content:
                arch_text += "\n\n" + content
                break
        except:
            pass

    # ---- DCM / DML ----------------------------------------------------
    sql_blob = read_all({".sql", ".ddl", ".dml"})
    dcm_text = "\n".join([ln for ln in sql_blob.splitlines()
                           if re.search(r"CREATE\s+TABLE", ln, re.I)])
    dml_text = "\n".join([ln for ln in sql_blob.splitlines()
                           if re.search(r"INSERT|UPDATE|DELETE", ln, re.I)])

    # ---- API endpoints -------------------------------------------------
    api_endpoints = []
    source_blob = read_all({".py", ".js", ".ts"})
    route_pat = re.compile(
        r"(@app\.(get|post|put|delete)\(|router\.(get|post|put|delete)\()\s*['\"]([^'\"]+)['\"]",
        re.I)
    for m in route_pat.finditer(source_blob):
        meth = (m.group(2) or m.group(3)).upper()
        path = m.group(4)
        api_endpoints.append(f"{meth} {path}")

    # ---- Extract SQL schema details ----
    sql_files = list(project_root.rglob("*.sql"))
    full_sql_content = ""
    for sql_file in sql_files:
        try:
            full_sql_content += sql_file.read_text(encoding="utf-8", errors="ignore")
        except:
            pass

    # ---- Build LaTeX sections ----
    warnings = []
    sections_tex = ""

    title_map = {
        "introduction": "Introduction",
        "project_overview": "Présentation du projet",
        "architecture": "Architecture du système",
        "dcm": "Modèle Conceptuel de Données (DCM)",
        "dml": "Modèle Logique de Données (DML)",
        "api_endpoints": "Points de terminaison de l'API",
        "conclusion": "Conclusion"
    }

    # Build content for each section
    section_content = {
        "introduction": """Ce projet vise à développer un système de surveillance et de valorisation du patrimoine bâti de la ville de Taroudant, au Maroc. L'application permet aux autorités municipales de suivre l'état des monuments historiques et des remparts, d'identifier les risques structurels et de prendre des décisions éclairées pour la préservation du patrimoine culturel.

Le système offre une plateforme centralisée qui automatise la collecte des données d'inspection, fournit des analyses en temps réel et génère des rapports détaillés pour les décideurs.""",

        "project_overview": """Le projet Taroudant Heritage Shield est un système complet de gestion du patrimoine comprenant:

\\begin{itemize}
    \\item Une application web moderne avec React et Vite
    \\item Un backend API développé avec FastAPI (Python)
    \\item Une base de données MySQL avec procédures stockées et triggers
    \\item Des fonctionnalités de sécurité avancées (JWT, RBAC, AES-256)
    \\item Un système de scoring automatique de la vulnérabilité structurelle
    \\item Des alertes pour les autorités en cas de risque critique
\\end{itemize}""",

        "architecture": arch_text if arch_text else """L'architecture du système suit une approche moderne en couches:

\\begin{itemize}
    \\item \\textbf{Frontend}: React 18 avec TypeScript, Vite comme outil de build, Tailwind CSS pour le styling, et React Query pour la gestion d'état
    \\item \\textbf{Backend}: FastAPI (Python) avec Uvicorn, authentification JWT, et encryption AES-256
    \\item \\textbf{Base de données}: MySQL 8.0 avec schéma en 3NF, procédures stockées et triggers
    \\item \\textbf{Communication}: API RESTful avec CORS configuré pour les cookies httpOnly
\\end{itemize}""",

        "dcm": "Le schéma de la base de données comprend les entités principales suivantes: utilisateurs, monuments, inspections, fissures, rapports, notifications, et demandes d'accès." if not dcm_text else f"\\begin{{verbatim}}\n{dcm_text[:2000]}\n\\end{{verbatim}}",

        "dml": "Les opérations DML comprennent l'insertion des données d'inspection, les mises à jour d'état des monuments, et la gestion des notifications." if not dml_text else f"\\begin{{verbatim}}\n{dml_text[:2000]}\n\\end{{verbatim}}",

        "api_endpoints": ("\\begin{itemize}\n" + "\n".join([f"    \\item \\texttt{{{ep}}}" for ep in api_endpoints[:30]]) + "\n\\end{itemize}") if api_endpoints else """\\begin{itemize}
    \\item \\texttt{POST /api/auth/login} - Authentification
    \\item \\texttt{GET /api/monuments} - Liste des monuments
    \\item \\texttt{POST /api/inspections} - Créer une inspection
    \\item \\texttt{GET /api/reports} - Générer des rapports
\\end{itemize}"""
    }

    for sec in include_sections:
        title = title_map.get(sec, sec.title())
        content = section_content.get(sec, "")
        if not content:
            warnings.append(f"Section <<{title}>> is empty → inserted TODO.")
            sections_tex += f"\\section{{{title}}}\n\\textcolor{{red}}{{TODO: ajouter le contenu de {title}.}}\n\n"
        else:
            sections_tex += f"\\section{{{title}}}\n{content}\n\n"

    # Abstract
    abstract = (
        "Le suivi du patrimoine bâti de Taroudant repose actuellement sur des procédures "
        "manuelles, longues et sujettes à erreurs. Ce projet propose une solution numérique "
        "centralisant les données de chaque monument, automatisant la collecte d'informations et "
        "fournissant des visualisations en temps réel. L'application permet ainsi de réduire "
        "considérablement le temps d'inspection, d'améliorer la traçabilité des interventions "
        "et d'offrir aux décideurs une vision claire et actualisée du patrimoine."
    )

    # Build LaTeX document
    latex_template = r"""\documentclass[12pt,a4paper]{article}
% ---------------- Packages (French-ready) -----------------
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[french]{babel}
\usepackage{geometry}
\usepackage{hyperref}
\usepackage{graphicx}
\usepackage{float}
\usepackage{booktabs}
\usepackage{xcolor}
\usepackage{enumitem}
\usepackage{setspace}
\usepackage{titlesec}
\usepackage{titling}
\usepackage{lmodern}
\usepackage{listings}
\usepackage{xcolor}

\geometry{
  left=2.5cm,
  right=2.5cm,
  top=2.5cm,
  bottom=2.5cm
}

\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    citecolor=blue,
    urlcolor=blue,
    pdfauthor={STUDENT_LIST},
    pdftitle={Taroudant Heritage Monitoring},
    pdflanguage={fr}
}

\lstset{
    basicstyle=\ttfamily\small,
    breaklines=true,
    frame=single,
    backgroundcolor=\color{gray!10}
}

\begin{document}
% -------------------- Cover page -----------------------
\begin{titlepage}
    \vspace*{\fill}
    \begin{center}
        {\Huge\bfseries Taroudant Heritage Monitoring \par}
        \vspace{1.2cm}
        {\Large\itshape SUBTITLE \par}
    \end{center}
    \vspace*{\fill}
    \noindent
    \begin{minipage}[t]{0.45\textwidth}
        \raggedright
        \textbf{Étudiants}\\
        STUDENT_LIST
    \end{minipage}
    \hfill
    \begin{minipage}[t]{0.45\textwidth}
        \raggedleft
        \textbf{Encadrant}\\
        SUPERVISOR
    \end{minipage}
    \vspace{2cm}
\end{titlepage}
% -------------------- Abstract -----------------------
\begin{abstract}
ABSTRACT
\end{abstract}
\clearpage
% ------------------ Table of contents -----------------
\tableofcontents
\clearpage
% -------------------- Body sections -----------------
SECTION_CONTENT
% -------------------- Bibliography (optional) -------
\begin{thebibliography}{9}
    \bibitem{fastapi} FastAPI Documentation, \url{https://fastapi.tiangolo.com/}
    \bibitem{react} React Documentation, \url{https://react.dev/}
    \bibitem{mysql} MySQL 8.0 Reference Manual, \url{https://dev.mysql.com/doc/}
\end{thebibliography}
\end{document}
"""

    tex_code = (latex_template
                .replace("STUDENT_LIST", " \\\\\n".join(students))
                .replace("SUPERVISOR", supervisor)
                .replace("SUBTITLE", subtitle)
                .replace("ABSTRACT", abstract)
                .replace("SECTION_CONTENT", sections_tex))

    return {
        "tex_code": tex_code,
        "extracted_info": {
            "architecture": arch_text,
            "dcm": dcm_text,
            "dml": dml_text,
            "api_endpoints": api_endpoints,
            "sql_content": full_sql_content
        },
        "warnings": warnings
    }


if __name__ == "__main__":
    # Generate report
    result = latex_french_report(
        project_root=".",
        students=["Carl", "Jaden"],
        supervisor="James"
    )

    # Write the .tex file
    output_path = Path("rapport.tex")
    output_path.write_text(result["tex_code"], encoding="utf-8")

    print(f"✓ Report generated: {output_path.absolute()}")
    print(f"✓ API Endpoints found: {len(result['extracted_info']['api_endpoints'])}")
    print(f"✓ SQL content length: {len(result['extracted_info']['sql_content'])} characters")

    if result["warnings"]:
        print("\n⚠ Warnings:")
        for w in result["warnings"]:
            print(f"  - {w}")
    else:
        print("\n✓ No warnings")
