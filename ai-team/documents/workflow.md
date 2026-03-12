# 🔄 Taroudant Heritage Shield — System Workflow

## The Problem We Solve
The historic monuments and ramparts of Taroudant are aging 
structures vulnerable to cracks, erosion, and structural 
degradation. There is currently no automated system to track 
their condition, score their vulnerability, or alert the 
responsible authorities in real time. This platform changes that.

---

## The 4 Roles

| Role | Who | Access Level |
|---|---|---|
| Admin | System manager | Full access — manages all users, monuments, assignments |
| Inspector | Field expert | Creates inspections, logs cracks, generates reports |
| Authority | Municipality / Ministry | Receives alerts, reads encrypted reports, makes decisions |
| Viewer | Public / Researcher | Read-only access to monument catalogue and public stats |

> Viewers can self-register. All other roles are created by Admin only.

---

## Complete Workflow — Step by Step

### Phase 1 — Monument Setup (Admin)
1. Admin logs in → JWT issued with role: admin
2. Admin adds a monument (name, location, GPS, construction year)
3. Admin uploads photos to monument_assets
4. Admin creates an inspector account and assigns a role

### Phase 2 — Inspection Assignment (Admin → Inspector)
5. Admin creates an inspection assignment:
   → selects monument + inspector + due date + priority
6. Inspector receives a notification inside the app
   "You are assigned to inspect: Bab El Khemis — due 15 March"

### Phase 3 — Field Inspection (Inspector)
7. Inspector visits the monument on-site
8. Inspector opens the app → fills the inspection form
9. Inspector logs each crack found:
   → location on monument, severity, length in cm, photo
10. TRIGGER 1 fires on each crack insert
    → CalculateVulnerabilityScore SP runs automatically

### Phase 4 — Automated Scoring (MySQL SP)
11. SP calculates:
    age_score  = (current year - construction_year) / 2
    crack_score = sum of severity weights
                  minor=1, moderate=3, major=7, critical=15
    total_score = age_score + crack_score
    risk_level:
      0–25  → low
      26–50 → medium
      51–75 → high
      76+   → critical
12. Score saved in vulnerability_scores table

### Phase 5 — Automatic Alert (Trigger → Authority)
13. TRIGGER 2 fires after score is saved
    → IF risk_level IN ('high', 'critical')
    → Auto-insert notification for all Authority users
    "⚠️ Bab El Khemis — HIGH RISK — Score: 71/100"

### Phase 6 — Report Generation (Inspector)
14. Inspector clicks "Generate Report"
15. GenerateMonumentReport SP compiles:
    → monument info + inspection data + all cracks + score
16. Report content is AES-256 encrypted → saved in reports table
17. TRIGGER 3 fires → audit_log records who generated it and when

### Phase 7 — Authority Response
18. Authority logs in → sees alert in notification center
19. Authority opens encrypted report → decrypted for their role
20. Every access to the report is logged in audit_logs
21. Authority adds a Decision Note (restoration order, budget, etc.)

### Phase 8 — Public Visibility (Viewer)
22. Viewer visits the monument catalogue
23. Sees: monument card with 🟢🟡🔴 health indicator
24. Sees: "Last inspected: March 2026" — public summary only
25. Cannot access crack details, scores, or encrypted reports

---

## The Connected Chain
Admin adds monument : <br>
→ Admin assigns inspector <br>
→ Inspector logs cracks on-site <br>
→ Trigger fires → Score calculated automatically <br>
→ If critical → Alert sent to Authority automatically <br>
→ Authority reads encrypted report <br>
→ Authority makes real-world decision <br>
→ Viewer sees updated health status 🟢🟡🔴