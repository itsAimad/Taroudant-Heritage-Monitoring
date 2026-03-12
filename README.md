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
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](.)
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
│   ├── frontend/                  # React + Vite application
│   ├── backend/                   # Node.js + Express API
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
| **Frontend** | React + Vite | HTML / CSS / Vanilla JS |
| **Backend** | Node.js + Express | PHP / Node.js |
| **Database** | MySQL 3NF | MySQL 3NF |
| **Development Speed** | Measured | Measured |
| **Code Quality** | Evaluated | Evaluated |
| **Goal** | Build the same system | Build the same system |

> The comparison measures productivity, code quality, architecture decisions, and final output between AI-assisted and traditional development.

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

    subgraph API["⚙️ Backend API — Node.js + Express"]
        AUTH[🔐 JWT Auth<br/>Middleware]
        RBAC[🛡️ RBAC<br/>Role Guard]
        ROUTES[📡 REST API<br/>Routes]
        ENC[🔒 AES-256<br/>Encryption]
    end

    subgraph DB["🗄️ MySQL Database — 3NF"]
        subgraph CORE["Core Tables"]
            MON[(monuments)]
            USR[(users)]
            INS[(inspections)]
            CRK[(cracks)]
        end
        subgraph LOGIC["Business Logic"]
            SP1["⚙️ SP: CalculateVulnerabilityScore"]
            SP2["📄 SP: GenerateMonumentReport"]
            T1["⚡ Trigger: after_crack_insert"]
            T2["⚡ Trigger: after_score_insert"]
            T3["⚡ Trigger: after_report_insert"]
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
    VS -->|risk=critical| T2
    T2 --> NOT
    NOT --> AU
    SP2 --> REP
    REP -->|INSERT| T3
    T3 --> AUD
    ROUTES --> ENC
    ENC --> REP
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
    
    D --> E[age_score = current_year - construction_year ÷ 2]
    D --> F[crack_score = Σ severity weights]
    
    F --> F1[minor crack = 1 pt]
    F --> F2[moderate crack = 3 pts]
    F --> F3[major crack = 7 pts]
    F --> F4[critical crack = 15 pts]
    
    E & F --> G[total_score = age_score + crack_score]
    
    G --> H{Risk Level}
    H -->|0 - 25| I[🟢 LOW]
    H -->|26 - 50| J[🟡 MEDIUM]
    H -->|51 - 75| K[🟠 HIGH]
    H -->|76+| L[🔴 CRITICAL]
    
    K & L --> M[⚡ Trigger 2: Auto-Alert to Authorities]
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
        enum status
    }

    monument_assets {
        int photo_id PK
        int monument_id FK
        varchar photo_url
        varchar caption
        timestamp uploaded_at
        int uploaded_by FK
    }

    inspections {
        int inspection_id PK
        int monument_id FK
        int inspector_id FK
        date inspection_date
        text notes
        enum overall_condition
    }

    cracks {
        int crack_id PK
        int inspection_id FK
        varchar location_on_monument
        enum severity
        int length_cm
        varchar photo_url
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
        varchar title
        varchar file_path
        enum risk_level
        int total_score
        enum status
        timestamp created_at
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

    roles ||--o{ users : "has"
    users ||--o{ inspections : "performs"
    users ||--o{ monument_assets : "uploads"
    users ||--o{ notifications : "receives"
    users ||--o{ reports : "generates"
    users ||--o{ audit_logs : "tracked in"
    monument_categories ||--o{ monuments : "classifies"
    monuments ||--o{ monument_assets : "has"
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
| 🔑 Unauthorized access | JWT tokens with expiry + role embedded |
| 🛡️ Privilege escalation | RBAC middleware on every API route |
| 💉 SQL Injection | 100% prepared statements — zero string concatenation |
| 📄 Report data leaks | AES-256-CBC encryption — key never stored in DB |
| 🔓 Password theft | bcrypt hashing — plain text never stored |
| 👁️ Untracked access | Every sensitive action logged in audit_logs |

---

## 🧱 SQL Business Logic

### ⚙️ Stored Procedure 1 — `CalculateVulnerabilityScore`

```sql
-- Automatically called by Trigger 1 after each crack is logged
-- Computes risk level from monument age + crack severity weights
CALL CalculateVulnerabilityScore(inspection_id);
-- Output: INSERT into vulnerability_scores
```

### 📄 Stored Procedure 2 — `GenerateMonumentReport`

```sql
-- Called by inspector when field work is complete
-- Compiles all inspection data → encrypts → saves report
CALL GenerateMonumentReport(monument_id, inspection_id, generated_by);
-- Output: INSERT into reports (encrypted content)
```

### ⚡ Trigger Summary

| Trigger | Fires On | Action |
|---|---|---|
| `after_crack_insert` | INSERT on `cracks` | Calls `CalculateVulnerabilityScore` |
| `after_score_insert` | INSERT on `vulnerability_scores` | If HIGH/CRITICAL → INSERT notifications |
| `after_report_insert` | INSERT on `reports` | INSERT into `audit_logs` |

---

## 📁 SQL Files Structure

```
ai-team/sql/
├── 01_schema.sql                # All CREATE TABLE statements
├── 02_stored_procedures.sql     # SP: Score + Report
├── 03_triggers.sql              # 3 triggers
├── 04_rbac_users.sql            # Roles, users, permissions
└── 05_seed_data.sql             # Sample Taroudant monuments data
```

---

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.0.0
mysql >= 8.0
npm >= 9.0.0
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-team/taroudant-heritage-shield.git
cd taroudant-heritage-shield/ai-team

# 2. Setup the database
mysql -u root -p < sql/01_schema.sql
mysql -u root -p < sql/02_stored_procedures.sql
mysql -u root -p < sql/03_triggers.sql
mysql -u root -p < sql/04_rbac_users.sql
mysql -u root -p < sql/05_seed_data.sql

# 3. Configure environment
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret

# 4. Start backend
npm install
npm run dev

# 5. Start frontend
cd ../frontend
npm install
npm run dev
```

### Environment Variables

```env
# backend/.env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=taroudant_heritage_shield
JWT_SECRET=your_super_secret_jwt_key
AES_ENCRYPTION_KEY=your_32_char_aes_key
PORT=3001
```

---

## 📊 Pages & Features

| Page | Role | Description |
|---|---|---|
| `/` | All | Home — Taroudant heritage story + monument map |
| `/monuments` | All | Public catalogue with health indicators 🟢🟡🔴 |
| `/monuments/:id` | All | Single monument — history, photos, public status |
| `/analytics` | All | Public stats — monuments by risk level |
| `/dashboard` | Inspector | Assignments, notifications, inspection forms |
| `/inspect/:id` | Inspector | Create inspection + log cracks + upload photos |
| `/reports` | Inspector / Admin | Generated reports list |
| `/alerts` | Authority | Critical notification center |
| `/map` | Authority | Color-coded monument health map |
| `/users` | Admin | Create and manage user accounts |
| `/assignments` | Admin | Assign inspectors to monuments |
| `/system` | Admin | Audit logs, trigger history, system health |

---

## 👨‍💻 Academic Context

This project is developed as part of an academic curriculum requiring:

| Requirement | Implementation |
|---|---|
| ✅ Relational DB — MySQL 3NF | 11 normalized tables |
| ✅ Minimum 2 Stored Procedures | `CalculateVulnerabilityScore` + `GenerateMonumentReport` |
| ✅ Minimum 3 Triggers | `after_crack_insert`, `after_score_insert`, `after_report_insert` |
| ✅ Frontend Interface | React + Vite — role-based dashboards |
| ✅ RBAC Security | JWT + role middleware on all routes |
| ✅ Anti-SQL Injection | 100% prepared statements |
| ✅ Report Encryption | AES-256-CBC — sensitive structural data |
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
