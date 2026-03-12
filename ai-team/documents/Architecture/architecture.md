# 🏛️ Taroudant Heritage Shield — System Architecture

## Vision
Taroudant Heritage Shield is an academic web application designed to 
monitor, score, and protect the historic monuments and ramparts of 
Taroudant, Morocco. The system automates structural vulnerability 
detection by combining field inspections, AI-assisted scoring logic, 
and real-time authority alerts — all within a secure, role-based platform.

---

## Architecture Overview

The system is structured in 4 layers:

### 1. Frontend Layer
- Technology: React + Vite
- Responsible for all user interfaces, separated by role
- Communicates with backend via REST API
- Pages: Public monument catalogue, Inspector dashboard, 
  Authority alert center, Admin control panel

### 2. Backend Layer
- Technology: Node.js (Express)
- Handles authentication (JWT), RBAC middleware, 
  file uploads, report encryption/decryption
- All database queries use prepared statements 
  (anti-SQL injection)
- Connects to MySQL via secure credentials

### 3. Business Logic Layer (Inside MySQL)
- 2 Stored Procedures:
  → CalculateVulnerabilityScore: computes risk index 
    from monument age + crack severity
  → GenerateMonumentReport: compiles inspection data 
    into an encrypted expert report
- 3 Triggers:
  → after_crack_insert: fires scoring SP automatically
  → after_score_insert: sends alert if risk is high/critical
  → after_report_insert: logs report generation in audit trail

### 4. Database Layer
- MySQL — 10 tables, normalized to 3NF
- Tables: monuments, monument_categories, monument_assets,
  users, roles, inspections, cracks, vulnerability_scores,
  notifications, reports, audit_logs

---

## Security Architecture

| Layer | Mechanism |
|---|---|
| Authentication | JWT tokens with role embedded |
| Authorization | RBAC — role checked on every API route |
| SQL Protection | 100% prepared statements |
| Report Security | AES-256 encryption, key never stored in DB |
| Audit | Every sensitive action logged in audit_logs |

---

## Folder Structure
