<div align="center">

<br/>
 
```
      ████████╗ █████╗ ██████╗  ██████╗ ██╗   ██╗██████╗  █████╗ ███╗   ██╗████████╗
      ╚══██╔══╝██╔══██╗██╔══██╗██╔═══██╗██║   ██║██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝
         ██║   ███████║██████╔╝██║   ██║██║   ██║██║  ██║███████║██╔██╗ ██║   ██║   
         ██║   ██╔══██║██╔══██╗██║   ██║██║   ██║██║  ██║██╔══██║██║╚██╗██║   ██║   
         ██║   ██║  ██║██║  ██║╚██████╔╝╚██████╔╝██████╔╝██║  ██║██║ ╚████║   ██║   
         ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   
```

# 🏛️ HERITAGE SHIELD
### *Protecting the Soul of Taroudant — One Monument at a Time*

<br/>

[![Status](https://www.arabamerica.com/wp-content/uploads/2022/02/Taroudant-Morocco-4-scaled-1.jpeg)](.)
[![Database](https://img.shields.io/badge/Database-MySQL%203NF-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](.)
[![Frontend](https://img.shields.io/badge/Frontend-React%20+%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](.)
[![Backend](https://img.shields.io/badge/Backend-Python%20+%20FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](.)
[![Security](https://img.shields.io/badge/Security-AES--256%20+%20RBAC-DC143C?style=for-the-badge&logo=shield&logoColor=white)](.)
[![Academic](https://img.shields.io/badge/Type-Academic%20Project-8A2BE2?style=for-the-badge)](.)

<br/>

> *"Taroudant — the grandmother of Marrakech — holds within its ancient walls*
> *over seven centuries of Moroccan civilization. This platform exists*
> *to ensure those walls stand for seven centuries more."*

<br/>

</div>

---

## 🌍 The City We Protect

<div align="center">

| | |
|:---:|:---:|
| ![Taroudant Ramparts](https://l450v.alamy.com/450v/dkbnfd/entrance-gate-to-the-medina-old-city-taroudant-morocco-dkbnfd.jpg) | ![Taroudant Medina](https://i.pinimg.com/1200x/98/ca/8f/98ca8f60b84dd33a7db55f02e505fee8.jpg) |
| *The ancient ramparts of Taroudant — 7.5km of earthen walls* | *The historic medina, one of Morocco's most preserved* |

</div>

**Taroudant** is a walled city in Morocco's Souss Valley, nestled between the High Atlas and Anti-Atlas mountains. Its iconic **ochre ramparts**, stretching over **7.5 kilometers**, date back to the **16th century Saadian dynasty**. The city is home to mosques, fountains, souks, and gates — all classified as irreplaceable cultural heritage.

Yet these structures are **aging**. Cracks form. Walls erode. Foundations weaken. And until now, there has been **no automated system** to detect, score, and alert authorities about the structural degradation of these monuments.

**That is the problem Taroudant Heritage Shield solves.**

---

## 💡 The Vision

```
Imagine a world where a crack in Bab El Khemis is detected on Monday,
scored automatically by Tuesday, and a restoration order is signed by Wednesday.

That is the world this platform builds.
```

Taroudant Heritage Shield is a **full-stack web application** that:

- 📍 **Catalogs** every monument and rampart of Taroudant with GPS coordinates, photos, and historical data
- 🔍 **Tracks** structural inspections performed by certified field experts
- 🧮 **Scores** vulnerability automatically using age + crack severity formulas via MySQL stored procedures
- 🚨 **Alerts** municipal authorities in real-time when critical risk is detected via database triggers
- 📄 **Generates** encrypted expert reports accessible only to authorized decision-makers
- 🌐 **Displays** a public monument health catalogue for citizens and researchers

---

## 🏗️ Project Structure — Two Teams, One Goal

This is an **academic comparative study**: the same system is built by two teams using different methodologies.

```
taroudant-heritage-shield/
│
├── 🤖 ai-team/                    # Built with AI assistance (Claude + Cursor)
│   ├── frontend/                  # React + Vite (TypeScript)
│   ├── backend/                   # Python + FastAPI + Uvicorn
│   │   ├── app/
│   │   │   ├── routers/           # 11 API routers (auth, monuments, etc.)
│   │   │   ├── services/          # auth_service, email_service, user_service
│   │   │   ├── models/            # Pydantic request/response models
│   │   │   ├── config.py          # Settings (pydantic-settings, .env)
│   │   │   ├── database.py        # MySQL connection pool
│   │   │   └── dependencies.py    # JWT + RBAC deps
│   │   ├── main.py                # FastAPI app + CORS + routers
│   │   ├── run.py                 # Uvicorn entrypoint
│   │   └── requirements.txt
│   ├── sql/                       # MySQL schema, procedures, triggers
│   └── documents/                 # Architecture docs & diagrams
│
└── 👥 team-without-ai/            # Built with traditional methods
    ├── frontend/                  # HTML / CSS / JS
    ├── backend/                   # PHP or Node.js
    ├── sql/                       # MySQL schema
    └── documents/                 # Architecture docs
```

| Dimension | 🤖 AI Team | 👥 Traditional Team |
|---|---|---|
| **Methodology** | Claude + Cursor assisted | Manual planning & coding |
| **Frontend** | React + Vite (TypeScript) | HTML / CSS / Vanilla JS |
| **Backend** | Python + FastAPI + Uvicorn | PHP / Node.js |
| **Database** | MySQL 3NF | MySQL 3NF |
| **Development Speed** | Measured | Measured |
| **Code Quality** | Evaluated | Evaluated |
| **Goal** | Build the same system | Build the same system |

> The comparison measures productivity, code quality, architecture decisions, and final output between AI-assisted and traditional development.

---

## 🎬 Project Demonstrations

Experience the results of both development methodologies through these video walkthroughs. These demos showcase the final application features, user interface, and the core heritage monitoring workflow.

<div align="center">

| 🤖 AI-Assisted Team (Modern) | 👥 Traditional Team (Classic) |
| :---: | :---: |
| [![AI Team Demo](https://img.shields.io/badge/Watch_Demo-AI_Team_App-EE4C2C?style=for-the-badge&logo=googledrive&logoColor=white)](INSERT_AI_TEAM_DRIVE_LINK_HERE) | [![Traditional Team Demo](https://img.shields.io/badge/Watch_Demo-Traditional_Team-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/13IRdhkT1Bv3UKR-u5j6eU4ns7SKAFGsQ/view?usp=sharing) |
| *Showcasing high-speed React/FastAPI integration* | *Showcasing traditional development reliability* |

</div>

---

## 🗺️ System Architecture

```mermaid
graph TB
    subgraph CLIENT["🌐 Client Layer"]
        V[👁️ Viewer<br/>Public Portal]
        I[🔍 Inspector<br/>Field Dashboard]
        AU[⚠️ Authority<br/>Alert Center]
        AD[⚙️ Admin<br/>Control Panel]
    end

    subgraph API["⚙️ Backend API — Python + FastAPI"]
        AUTH[🔐 JWT Auth<br/>httpOnly Cookies]
        RBAC[🛡️ RBAC<br/>Role Guard]
        ROUTES[📡 REST API<br/>11 Routers]
        ENC[🔒 AES-256<br/>MySQL Encrypt]
        EMAIL[📧 SMTP<br/>fastapi-mail]
    end

    subgraph DB["🗄️ MySQL Database — 3NF"]
        subgraph CORE["Core Tables"]
            MON[(monuments)]
            USR[(users)]
            INS[(inspections)]
            CRK[(cracks)]
            ASGN[(inspector_assignments)]
            AREQ[(access_requests)]
        end
        subgraph LOGIC["Business Logic"]
            SP1["⚙️ SP: CalculateVulnerabilityScore"]
            SP2["📄 SP: GenerateMonumentReport"]
            T1["⚡ Trigger: after_crack_insert"]
            T2["⚡ Trigger: after_score_insert"]
            T3["⚡ Trigger: after_report_insert"]
            T4["⚡ Trigger: after_access_request_reviewed"]
        end
        subgraph OUTPUT["Output Tables"]
            VS[(vulnerability_scores)]
            NOT[(notifications)]
            REP[(reports)]
            AUD[(audit_logs)]
        end
    end

    V & I & AU & AD --> AUTH
    AUTH --> RBAC
    RBAC --> ROUTES
    ROUTES --> DB
    CRK -->|INSERT| T1
    T1 --> SP1
    SP1 --> VS
    VS -->|risk=high/critical| T2
    T2 --> NOT
    NOT --> AU
    SP2 --> REP
    REP -->|INSERT| T3
    T3 --> AUD
    AREQ -->|UPDATE status| T4
    T4 --> AUD
    ROUTES --> ENC
    ENC --> REP
    AREQ -->|approved| EMAIL
    EMAIL -->|send_approval_email| USR
```

---

## 👥 Role-Based Access Control (RBAC)

```mermaid
flowchart LR
    LOGIN([🔐 Login]) --> JWT{JWT Token<br/>Issued}
    
    JWT -->|role: viewer| PUB[🌐 Public Portal<br/>Monument catalogue<br/>Health indicators<br/>Public analytics]
    
    JWT -->|role: inspector| INSP[🔍 Inspector Dashboard<br/>My assignments<br/>Create inspections<br/>Log cracks + photos<br/>Generate reports]
    
    JWT -->|role: authority| AUTH[⚠️ Authority Center<br/>Critical alerts<br/>Encrypted reports<br/>Monument health map<br/>Decision notes]
    
    JWT -->|role: admin| ADMIN[⚙️ Admin Panel<br/>User management<br/>Monument management<br/>Assign inspections<br/>Full audit logs]
```

| Role | Created By | Key Permissions |
|---|---|---|
| 👁️ **Viewer** | Self-registration | Public catalogue, health indicators, public stats |
| 🔍 **Inspector** | Admin only | Inspections, crack logging, report generation |
| ⚠️ **Authority** | Admin only | Encrypted reports, alert center, decision notes |
| ⚙️ **Admin** | System init | Full access — users, monuments, assignments, audit |

---

## 🔄 Complete Workflow

```mermaid
sequenceDiagram
    actor Admin
    actor Inspector
    actor Authority
    actor Viewer
    participant DB as MySQL DB
    participant T1 as Trigger 1
    participant SP1 as SP: Score
    participant T2 as Trigger 2
    participant SP2 as SP: Report
    participant T3 as Trigger 3

    Admin->>DB: Add monument (Bab El Khemis)
    Admin->>Inspector: Assign inspection (notification sent)
    Inspector->>DB: Create inspection record
    Inspector->>DB: Log crack (major, 45cm, north wall)
    DB->>T1: AFTER INSERT on cracks
    T1->>SP1: CalculateVulnerabilityScore(inspection_id)
    SP1->>DB: INSERT vulnerability_scores (score=71, risk=HIGH)
    DB->>T2: AFTER INSERT on vulnerability_scores
    T2->>DB: INSERT notification for all authorities
    T2->>Authority: ⚠️ Alert — Bab El Khemis HIGH RISK
    Inspector->>SP2: Generate Report
    SP2->>DB: INSERT reports (AES-256 encrypted)
    DB->>T3: AFTER INSERT on reports
    T3->>DB: INSERT audit_log (REPORT_GENERATED)
    Authority->>DB: Open report (decrypted for role)
    DB->>T3: INSERT audit_log (REPORT_ACCESSED)
    Authority->>DB: Add Decision Note
    Viewer->>DB: View monument catalogue
    DB->>Viewer: 🔴 HIGH RISK — Last inspected: today
```

---

## 🧮 Vulnerability Scoring Formula

```mermaid
flowchart TD
    A[Inspection Created] --> B[Cracks Logged]
    B --> C{Trigger 1 Fires}
    C --> D[CalculateVulnerabilityScore SP]

    D --> CAT[Step 1 — Category Durability Factor]
    CAT --> CAT1[Rempart = ×0.8]
    CAT --> CAT2[Porte de ville = ×0.9]
    CAT --> CAT3[Kasbah = ×0.85]
    CAT --> CAT4[Mosquée = ×1.0]
    CAT --> CAT5[Maison traditionnelle = ×1.2]

    D --> F[Step 2 — Raw Crack Score with Length Factor]
    F --> F1["minor: 1 × min(length/10, 2)"]
    F --> F2["moderate: 3 × min(length/20, 3)"]
    F --> F3["major: 7 × min(length/30, 4)"]
    F --> F4[critical: always 15 pts]

    D --> E[Step 3 — Age Multiplier and Age Score]
    E --> E1["age_multiplier = 1.0 + min(age/1000, 0.5)"]
    E1 --> E2["range: 1.0 new → 1.5 for 500+ yr old"]
    E --> E3["age_score = min(age/20, 10)"]
    E3 --> E4[Only applied when cracks exist]

    F & E --> G["crack_score = raw_crack_score × age_multiplier"]
    G --> H["total_score = FLOOR((crack_score + age_score) × category_factor)"]

    H --> I{Risk Level}
    I -->|"0 – 15"| J["🟢 LOW"]
    I -->|"16 – 35"| K["🟡 MEDIUM"]
    I -->|"36 – 60"| L["🟠 HIGH"]
    I -->|">60"| M["🔴 CRITICAL"]

    N["⚠️ Override: any critical crack → minimum HIGH"]
    F4 --> N

    L & M --> O["⚡ Trigger 2: Auto-Alert all Authority users"]
```

---

## 🗄️ Database Schema — 3NF Normalized

```mermaid
erDiagram
    roles {
        int role_id PK
        varchar role_name
        text description
    }

    users {
        int id_user PK
        varchar full_name
        varchar email
        varchar password_hash
        int role_id FK
        varchar phone
        boolean is_active
        datetime last_login
        varchar organization
        varchar completion_token
        datetime completion_token_expiry
        timestamp created_at
    }

    monument_categories {
        int category_id PK
        varchar category_name
        text description
    }

    monuments {
        int monument_id PK
        varchar name
        varchar location
        varchar city
        decimal latitude
        decimal longitude
        int construction_year
        int category_id FK
        text description
        longblob photo_blob
        varchar photo_mime_type
        enum status
    }

    inspector_assignments {
        int assignment_id PK
        int monument_id FK
        int inspector_id FK
        int assigned_by FK
        text notes
        date due_date
        enum status
        timestamp created_at
    }

    inspections {
        int inspection_id PK
        int monument_id FK
        int inspector_id FK
        date inspection_date
        text notes
        enum overall_condition
        enum status
        timestamp created_at
    }

    cracks {
        int crack_id PK
        int inspection_id FK
        varchar location_on_monument
        enum severity
        decimal length_cm
        varchar photo_url
        longblob photo_blob
        varchar photo_mime_type
        timestamp detected_at
    }

    vulnerability_scores {
        int score_id PK
        int monument_id FK
        int inspection_id FK
        int age_score
        int crack_score
        int total_score
        enum risk_level
        timestamp computed_at
    }

    notifications {
        int notification_id PK
        int monument_id FK
        int triggered_by_inspection FK
        int recipient_id FK
        text message
        enum severity
        boolean is_read
        timestamp sent_at
    }

    reports {
        int report_id PK
        int monument_id FK
        int inspection_id FK
        int generated_by FK
        int validated_by FK
        varchar title
        varchar file_path
        longblob encrypted_content
        enum risk_level
        int total_score
        enum status
        timestamp created_at
        timestamp validated_at
        text validation_note
    }

    audit_logs {
        int log_id PK
        int user_id FK
        varchar action
        varchar target_table
        int target_id
        varchar ip_address
        text details
        timestamp performed_at
    }

    access_requests {
        int id PK
        varchar full_name
        varchar email
        varchar organization
        int requested_role_id FK
        text reason
        enum status
        datetime submitted_at
        datetime reviewed_at
        int reviewed_by_id FK
        text review_note
    }

    roles ||--o{ users : "has"
    roles ||--o{ access_requests : "requested in"
    users ||--o{ inspections : "performs"
    users ||--o{ notifications : "receives"
    users ||--o{ reports : "generates"
    users ||--o{ reports : "validates"
    users ||--o{ audit_logs : "tracked in"
    users ||--o{ inspector_assignments : "assigned to"
    users ||--o{ inspector_assignments : "assigned by"
    users ||--o{ access_requests : "reviewed by"
    monument_categories ||--o{ monuments : "classifies"
    monuments ||--o{ inspector_assignments : "has assignment"
    monuments ||--o{ inspections : "subject of"
    monuments ||--o{ vulnerability_scores : "scored in"
    monuments ||--o{ notifications : "triggers"
    monuments ||--o{ reports : "documented in"
    inspections ||--o{ cracks : "contains"
    inspections ||--o{ vulnerability_scores : "produces"
    inspections ||--o{ reports : "compiled into"
```

---

## 🔐 Security Architecture

```mermaid
flowchart TD
    subgraph REQUEST["Incoming Request"]
        REQ[HTTP Request]
    end

    subgraph AUTH_LAYER["Authentication Layer"]
        JWT_CHECK{Valid JWT<br/>Token?}
        REJECT1[❌ 401 Unauthorized]
    end

    subgraph RBAC_LAYER["Authorization Layer — RBAC"]
        ROLE_CHECK{Role has<br/>permission?}
        REJECT2[❌ 403 Forbidden]
    end

    subgraph DATA_LAYER["Data Layer"]
        PREP[Prepared Statements<br/>Anti-SQL Injection]
        EXEC[Query Execution]
    end

    subgraph ENCRYPT_LAYER["Encryption Layer"]
        SENS{Sensitive<br/>Data?}
        AES[AES-256 Encryption<br/>Key stored server-side]
        PLAIN[Plain Response]
    end

    subgraph AUDIT_LAYER["Audit Layer"]
        LOG[audit_logs<br/>INSERT]
    end

    REQ --> JWT_CHECK
    JWT_CHECK -->|No| REJECT1
    JWT_CHECK -->|Yes| ROLE_CHECK
    ROLE_CHECK -->|No| REJECT2
    ROLE_CHECK -->|Yes| PREP
    PREP --> EXEC
    EXEC --> SENS
    SENS -->|Yes — reports| AES
    SENS -->|No| PLAIN
    AES & PLAIN --> LOG
```

| Threat | Protection |
|---|---|
| 🔑 Unauthorized access | JWT stored in **httpOnly cookies** (access 60 min + refresh 7 days) |
| 🛡️ Privilege escalation | `require_role()` RBAC dependency on every protected route |
| 💉 SQL Injection | 100% parameterized queries via `mysql-connector-python` |
| 📄 Report data leaks | `AES_ENCRYPT` in MySQL — `encrypted_content` LONGBLOB, key never in DB |
| 🔓 Password theft | `bcrypt` hashing (rounds=12) — plain text never stored |
| 👁️ Untracked access | Every sensitive action logged in `audit_logs` via triggers + app |
| 📧 Account phishing | Single-use completion token (48 hr expiry) sent via SMTP (Gmail TLS) |

---

## 🧱 SQL Business Logic

### ⚙️ Stored Procedure 1 — `CalculateVulnerabilityScore`

```sql
-- Automatically called by Trigger 1 after each crack is logged
-- Weighted formula: crack severity × age multiplier × category factor
-- Step 1 — Crack severity weights (length-adjusted)
--   minor:    1  × min(length_cm / 10,  2)
--   moderate: 3  × min(length_cm / 20,  3)
--   major:    7  × min(length_cm / 30,  4)
--   critical: 15 (always maximum, length irrelevant)
-- Step 2 — Age multiplier: 1.0 + min(age_years / 1000, 0.5)
--   → 1.0 for new structures, up to 1.5 for 500+ year old ones
--   → applied only when cracks exist (old monument with no cracks = LOW)
-- Step 3 — Age score: min(age_years / 20, 10)  [capped at 10]
-- Step 4 — Category durability factor
--   Rempart 0.8 | Porte de ville 0.9 | Kasbah 0.85
--   Mosquée 1.0 | Maison traditionnelle 1.2 | Jardin 1.1
-- Step 5 — Final score
--   crack_score  = raw_crack_score × age_multiplier
--   total_score  = FLOOR((crack_score + age_score) × category_factor)
-- Override: any critical crack forces minimum HIGH risk
CALL CalculateVulnerabilityScore(inspection_id);
-- Output: INSERT into vulnerability_scores
```

**Risk level thresholds (post-formula):**

| Score Range | Risk Level |
|---|---|
| 0 – 15 | 🟢 LOW |
| 16 – 35 | 🟡 MEDIUM |
| 36 – 60 | 🟠 HIGH |
| 61+ | 🔴 CRITICAL |

### 📄 Stored Procedure 2 — `GenerateMonumentReport`

```sql
-- Called by inspector when field work is complete
-- Compiles all inspection data → builds French-language structured report
-- → AES-256 encrypts content → stores encrypted_content LONGBLOB in reports
CALL GenerateMonumentReport(monument_id, inspection_id, generated_by);
-- Output: INSERT into reports (encrypted_content, risk_level, total_score)
-- Returns: LAST_INSERT_ID() AS report_id
```

**Recommendations generated (French):**

| Risk Level | Recommendation |
|---|---|
| 🟢 LOW | Surveillance périodique recommandée |
| 🟡 MEDIUM | Inspection approfondie recommandée |
| 🟠 HIGH | Intervention urgente requise |
| 🔴 CRITICAL | DANGER: Fermeture et restauration immédiate |

### ⚡ Trigger Summary

| Trigger | Fires On | Action |
|---|---|---|
| `after_crack_insert` | INSERT on `cracks` | Calls `CalculateVulnerabilityScore` |
| `after_score_insert` | INSERT on `vulnerability_scores` | If HIGH/CRITICAL → INSERT notifications for all authority users |
| `after_report_insert` | INSERT on `reports` | INSERT into `audit_logs` (REPORT_GENERATED) |
| `after_access_request_reviewed` | UPDATE on `access_requests` (status change) | INSERT into `audit_logs` (APPROVED / REJECTED / PENDING) |

---

## 📁 SQL Files Structure

```
ai-team/sql/
├── 01_schema.sql                # 12 tables — roles, users, monument_categories,
│                                #   monuments, inspector_assignments, inspections,
│                                #   cracks, vulnerability_scores, notifications,
│                                #   reports, audit_logs, access_requests
│                                #   + roles seed + admin bootstrap
├── 02_stored_procedures.sql     # SP: CalculateVulnerabilityScore + GenerateMonumentReport
├── 03_triggers.sql              # 4 triggers (crack→score, score→notify,
│                                #             report→audit, access_request→audit)
├── 04_rbac_users.sql            # Roles, users, permissions
└── 05_seed_data.sql             # Sample Taroudant monuments data
```

---

## 🚀 Getting Started

### Prerequisites
```bash
Python >= 3.10
MySQL >= 8.0
Node.js >= 18.0.0   # frontend only
npm >= 9.0.0        # frontend only
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-team/taroudant-heritage-shield.git
cd taroudant-heritage-shield/ai-team

# 2. Setup the database (run in order)
mysql -u root -p < sql/01_schema.sql
mysql -u root -p < sql/02_stored_procedures.sql
mysql -u root -p < sql/03_triggers.sql
mysql -u root -p < sql/04_rbac_users.sql
mysql -u root -p < sql/05_seed_data.sql

# 3. Configure backend environment
cd backend
copy .env.example .env
# Fill in DB credentials, JWT keys, and SMTP settings

# 4. Start the backend (Python + FastAPI)
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python run.py               # Uvicorn on http://localhost:8000

# 5. Start the frontend (React + Vite)
cd ../frontend
npm install
npm run dev                 # Vite on http://localhost:5173
```

### Environment Variables

```env
# backend/.env
APP_ENV=development
APP_SECRET_KEY=your-secret-key-min-50-chars
FRONTEND_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3308
DB_NAME=taroudant_heritage_shield
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET_KEY=your-jwt-secret-key-min-50-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MINUTES=60
JWT_REFRESH_EXPIRE_DAYS=7

COOKIE_SECURE=False
COOKIE_SAMESITE=lax

# SMTP (Gmail App Password recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@heritage-taroudant.ma
```

---

## 📊 Pages & Features

### 🌐 Public Routes (no login required)

| Route | Description |
|---|---|
| `/` | Home — Taroudant heritage story, stats, call to action |
| `/monuments` | Public catalogue with risk indicators 🟢🟡🔴 |
| `/monument/:id` | Single monument — history, photos, public risk status |
| `/about` | About the project and academic context |
| `/map` | Color-coded monument health map (public) |
| `/login` | Login form |
| `/complete-account?token=…` | One-time account completion page (approved users) |

### 🔐 Protected Routes (any authenticated user)

| Route | Description |
|---|---|
| `/dashboard` | Role-based router → Inspector / Authority / Admin dashboard |
| `/analytics` | Stats — monuments by risk level, inspection activity |
| `/risk-lab` | Interactive vulnerability score simulator |
| `/architecture` | System architecture diagram viewer |

### 🔍 Inspector + Admin

| Route | Description |
|---|---|
| `/inspect/new` | Create a new inspection for a monument |
| `/inspect/:id` | View/edit inspection — log cracks, view score |

### ⚠️ Authority + Admin

| Route | Description |
|---|---|
| `/inspection/:id` | Read-only inspection view (authority review mode) |

### ⚙️ Admin Only

| Route | Description |
|---|---|
| `/admin/users` | User management — view, activate/deactivate accounts |
| `/admin/monuments` | Monument management — add, edit, delete monuments |

---

## 👨‍💻 Academic Context

This project is developed as part of an academic curriculum requiring:

| Requirement | Implementation |
|---|---|
| ✅ Relational DB — MySQL 3NF | 12 normalized tables |
| ✅ Minimum 2 Stored Procedures | `CalculateVulnerabilityScore` + `GenerateMonumentReport` |
| ✅ Minimum 3 Triggers | **4 triggers** — crack→score, score→notify, report→audit, access_request→audit |
| ✅ Frontend Interface | React + Vite (TypeScript) — animated, role-based dashboards |
| ✅ Backend API | Python + FastAPI — 11 routers, Uvicorn ASGI server |
| ✅ RBAC Security | httpOnly cookie JWT + `require_role()` dep on all protected routes |
| ✅ Anti-SQL Injection | 100% parameterized queries (`mysql-connector-python`) |
| ✅ Report Encryption | `AES_ENCRYPT` in MySQL — `encrypted_content` LONGBLOB in `reports` |
| ✅ Email Notifications | SMTP via `fastapi-mail` — approval/rejection emails with completion link |
| ✅ Access Request Workflow | `access_requests` table + admin review panel + 48 hr one-use token |
| ✅ AI vs Traditional Comparison | Two parallel development teams |

---

## 🏛️ Monuments of Taroudant — Initial Dataset

The seed data includes Taroudant's most significant heritage sites:

| Monument | Category | Est. Built | Location |
|---|---|---|---|
| 🏰 Remparts de Taroudant | Rampart | 16th century | Encircling the medina |
| 🚪 Bab El Khemis | City Gate | 16th century | North entrance |
| 🚪 Bab Zorgane | City Gate | 16th century | East entrance |
| 🕌 Grande Mosquée | Mosque | 14th century | Medina center |
| ⛲ Place Assarag | Historic Square | 19th century | City center |
| 🏰 Kasbah de Taroudant | Fortress | 16th century | Southwest medina |

---

## 📜 License & Academic Use

This project is developed for **academic purposes** as part of a database systems and web development curriculum. All monument data and historical references are based on publicly available cultural heritage documentation.

---

<div align="center">

<br/>

*Built with purpose. Guided by history. Powered by code.*

**🏛️ Taroudant Heritage Shield**

`Agadir — Souss-Massa — Morocco — 2026`

<br/>

![Morocco](https://img.shields.io/badge/🇲🇦-Morocco-C1272D?style=for-the-badge)
![Heritage](https://img.shields.io/badge/🏛️-Cultural%20Heritage-8B4513?style=for-the-badge)
![Academic](https://img.shields.io/badge/🎓-Academic%20Project-1a1a2e?style=for-the-badge)

</div>
