from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Literal
from pydantic import BaseModel
from ..database import get_db, execute_query, call_procedure, execute_write
from ..dependencies import get_current_user, require_role
from ..models.user import UserRole
import json
import io

router = APIRouter(prefix='/reports', tags=['Reports'])

class ReportCreate(BaseModel):
    monument_id:   int
    inspection_id: int
    title:         str

class ReportValidation(BaseModel):
    status:          Literal['validated', 'disputed']
    validation_note: Optional[str] = ''

@router.post('/', status_code=201)
async def generate_report(
    data:         ReportCreate,
    conn          = Depends(get_db),
    current_user  = Depends(
        require_role(UserRole.INSPECTOR, UserRole.ADMIN)
    )
):
    try:
        # call_procedure returns the last result set ($$ SELECT LAST_INSERT_ID() $$)
        results = call_procedure(conn,
            'GenerateMonumentReport',
            (data.monument_id, data.inspection_id, current_user['id'])
        )
        conn.commit()
        report_id = results[0]['report_id'] if results else None
    except Exception as e:
        raise HTTPException(500,
            f'Report generation failed: {str(e)}')

    if not report_id:
        raise HTTPException(500, 'Report record could not be retrieved.')

    reports = execute_query(conn, """
        SELECT
          r.*,
          m.name       AS monument_name,
          u.full_name  AS generated_by_name
        FROM reports r
        JOIN monuments m ON r.monument_id = m.monument_id
        JOIN users u     ON r.generated_by = u.id_user
        WHERE r.report_id = %s
    """, (report_id,))

    import base64
    if reports and reports[0].get('encrypted_content') is not None:
        try:
            reports[0]['encrypted_content'] = base64.b64encode(reports[0]['encrypted_content']).decode('utf-8')
        except Exception:
            pass

    return {
        'message': 'Report generated and encrypted.',
        'report':  reports[0] if reports else None,
    }


@router.get('/')
async def list_reports(
    conn         = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user['role'] == 'inspector':
        rows = execute_query(conn, """
            SELECT
              r.report_id, r.title, r.risk_level,
              r.total_score, r.status, r.created_at,
              m.name      AS monument_name,
              u.full_name AS generated_by_name
            FROM reports r
            JOIN monuments m ON r.monument_id = m.monument_id
            JOIN users u     ON r.generated_by = u.id_user
            WHERE r.generated_by = %s
            ORDER BY r.created_at DESC
        """, (current_user['id'],))
    else:
        rows = execute_query(conn, """
            SELECT
              r.report_id, r.title, r.risk_level,
              r.total_score, r.status, r.created_at,
              r.validated_by, r.validated_at, r.validation_note,
              m.name      AS monument_name,
              u.full_name AS generated_by_name,
              vu.full_name AS validated_by_name
            FROM reports r
            JOIN monuments m ON r.monument_id = m.monument_id
            JOIN users u     ON r.generated_by = u.id_user
            LEFT JOIN users vu ON r.validated_by = vu.id_user
            ORDER BY r.created_at DESC
        """)
    return {'count': len(rows), 'results': rows}


@router.patch('/{report_id}/validate')
async def validate_report(
    report_id:   int,
    data:        ReportValidation,
    conn         = Depends(get_db),
    current_user = Depends(
        require_role(UserRole.AUTHORITY, UserRole.ADMIN)
    )
):
    rows = execute_query(conn,
        'SELECT * FROM reports WHERE report_id = %s LIMIT 1',
        (report_id,))
    if not rows:
        raise HTTPException(404, 'Report not found.')
    if rows[0]['status'] in ('validated', 'disputed', 'archived'):
        raise HTTPException(400,
            'Report cannot be validated in its current state.')

    execute_write(conn, """
        UPDATE reports
        SET status          = %s,
            validated_by    = %s,
            validated_at    = NOW(),
            validation_note = %s
        WHERE report_id = %s
    """, (data.status, current_user['id'],
           data.validation_note, report_id))

    execute_write(conn, """
        INSERT INTO audit_logs
          (user_id, action, target_table, target_id, details)
        VALUES (%s, %s, 'reports', %s, %s)
    """, (current_user['id'], 'REPORT_VALIDATED', report_id,
           f"Status set to {data.status} by {current_user['full_name']}"))

    return {
        'message':   f'Report {data.status} successfully.',
        'report_id': report_id,
    }

@router.get('/{report_id}')
async def get_report(
    report_id:    int,
    conn          = Depends(get_db),
    current_user  = Depends(require_role(UserRole.AUTHORITY, UserRole.ADMIN, UserRole.INSPECTOR))
):
    """Fetch details of a single report, including monument and inspector info."""
    rows = execute_query(conn, """
        SELECT
          r.*,
          m.name       AS monument_name,
          m.location   AS monument_location,
          u.full_name  AS generated_by_name,
          vu.full_name AS validated_by_name
        FROM reports r
        JOIN monuments m ON r.monument_id = m.monument_id
        JOIN users u     ON r.generated_by = u.id_user
        LEFT JOIN users vu ON r.validated_by = vu.id_user
        WHERE r.report_id = %s
        LIMIT 1
    """, (report_id,))

    if not rows:
        raise HTTPException(404, 'Report not found.')

    report = rows[0]
    # Inspectors can only see their own reports
    if current_user['role'] == 'inspector' and report['generated_by'] != current_user['id']:
        raise HTTPException(403, 'Access denied.')

    import base64
    if report.get('encrypted_content'):
        report['encrypted_content'] = base64.b64encode(report['encrypted_content']).decode('utf-8')

    return report

@router.get('/{report_id}/pdf')
async def download_report_pdf(
    report_id:    int,
    conn          = Depends(get_db),
    current_user  = Depends(get_current_user)
):
    # Fetch report with encrypted content
    rows = execute_query(conn, """
        SELECT
          r.*,
          m.name       AS monument_name,
          m.location   AS monument_location,
          u.full_name  AS inspector_name
        FROM reports r
        JOIN inspections i
          ON r.inspection_id = i.inspection_id
        JOIN monuments m
          ON i.monument_id = m.monument_id
        JOIN users u
          ON r.generated_by = u.id_user
        WHERE r.report_id = %s
        LIMIT 1
    """, (report_id,))

    if not rows:
        raise HTTPException(404,
            'Report not found.')

    report = rows[0]

    # Role check — inspector sees only own reports
    if (current_user['role'] == 'inspector' and
        report['generated_by'] != current_user['id']):
        raise HTTPException(403, 'Access denied.')

    # Decrypt content from DB using the key from the stored procedure
    decrypted = execute_query(conn, """
        SELECT CAST(
          AES_DECRYPT(
            encrypted_content,
            SHA2('TaroudantHeritage2026Key', 256)
          ) AS CHAR
        ) AS content
        FROM reports
        WHERE report_id = %s
    """, (report_id,))

    content_str = None
    if decrypted and decrypted[0]['content']:
        content_str = decrypted[0]['content']

    # Parse JSON content if available
    report_data = {}
    if content_str:
        try:
            report_data = json.loads(content_str)
        except Exception:
            report_data = {}

    # Fetch cracks for this inspection — photos stored as photo_blob on the crack row
    cracks = execute_query(conn, """
        SELECT
          crack_id,
          location_on_monument,
          severity,
          length_cm,
          detected_at,
          CASE WHEN photo_blob IS NOT NULL THEN 1 ELSE 0 END AS photo_count
        FROM cracks
        WHERE inspection_id = %s
        ORDER BY detected_at ASC
    """, (report['inspection_id'],))


    # Build PDF using reportlab or fpdf2
    # Try fpdf2 first, fallback to plain text
    try:
        from fpdf import FPDF

        class HeritagePDF(FPDF):
            def header(self):
                self.set_font('Helvetica', 'B', 11)
                self.set_text_color(101, 67, 33)
                self.cell(0, 10,
                  'TAROUDANT HERITAGE SHIELD',
                  align='C', new_x='LMARGIN',
                  new_y='NEXT')
                self.set_font('Helvetica', '', 8)
                self.set_text_color(120, 100, 80)
                self.cell(0, 6,
                  'Heritage Monitoring System - Confidential Report',
                  align='C', new_x='LMARGIN',
                  new_y='NEXT')
                self.ln(2)
                self.set_draw_color(180, 140, 100)
                self.set_line_width(0.5)
                self.line(10, self.get_y(),
                          200, self.get_y())
                self.ln(4)

            def footer(self):
                self.set_y(-15)
                self.set_font('Helvetica', 'I', 8)
                self.set_text_color(150, 130, 110)
                self.cell(0, 10,
                  f'Page {self.page_no()} - '
                  f'AES-256 Encrypted Source - '
                  f'Taroudant Heritage Shield',
                  align='C')

        pdf = HeritagePDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True,
                                 margin=15)

        # Helper to ensure text is latin-1 compatible for default fonts
        def clean(text):
            if not text: return "—"
            # Replace common non-latin1 characters or just encode/decode to skip them
            return str(text).encode('latin-1', 'replace').decode('latin-1')

        # ── Report Title ────────────────────
        pdf.set_font('Helvetica', 'B', 16)
        pdf.set_text_color(60, 40, 20)
        pdf.cell(0, 12, clean(report.get('title', 'Report')),
                 new_x='LMARGIN', new_y='NEXT')

        # ── Meta info row ───────────────────
        pdf.set_font('Helvetica', '', 9)
        pdf.set_text_color(120, 100, 80)
        pdf.cell(0, 6,
          f"Generated by: {clean(report.get('inspector_name'))}"
          f"   |   Date: {str(report.get('created_at',''))[:10]}"
          f"   |   Report ID: #{report_id}",
          new_x='LMARGIN', new_y='NEXT')
        pdf.ln(4)

        # ── Section divider helper ──────────
        def section(title):
            pdf.set_draw_color(200, 170, 130)
            pdf.set_fill_color(245, 238, 225)
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(101, 67, 33)
            pdf.cell(0, 8, f'  {title}',
                     fill=True,
                     new_x='LMARGIN',
                     new_y='NEXT')
            pdf.ln(2)

        # ── Monument Info ───────────────────
        section('MONUMENT INFORMATION')
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(50, 35, 20)

        info_rows = [
          ('Monument',
           report.get('monument_name')),
          ('Location',
           report.get('monument_location')),
        ]
        m_data = report_data.get('monument')
        if m_data and isinstance(m_data, dict):
            if m_data.get('construction_year'):
                info_rows.append((
                  'Construction Year',
                  str(m_data['construction_year'])))

        for label, value in info_rows:
            pdf.set_font('Helvetica', 'B', 9)
            pdf.set_text_color(120, 90, 60)
            pdf.cell(45, 7, label + ':')
            pdf.set_font('Helvetica', '', 9)
            pdf.set_text_color(50, 35, 20)
            pdf.cell(0, 7, clean(value),
                     new_x='LMARGIN',
                     new_y='NEXT')
        pdf.ln(3)

        # ── Vulnerability Score ─────────────
        section('VULNERABILITY ASSESSMENT')
        score = report.get('total_score', 0) or 0
        risk  = report.get('risk_level', '—') or '—'

        pdf.set_font('Helvetica', 'B', 24)
        risk_colors = {
          'critical': (180, 30, 30),
          'high':     (180, 100, 20),
          'medium':   (160, 130, 20),
          'low':      (40, 130, 60),
        }
        rc = risk_colors.get(
            str(risk).lower(), (80, 60, 40))
        pdf.set_text_color(*rc)
        pdf.cell(0, 14,
          f'{score} / 100',
          new_x='LMARGIN', new_y='NEXT')

        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(0, 8,
          f'Risk Level: {clean(risk).upper()}',
          new_x='LMARGIN', new_y='NEXT')
        pdf.set_text_color(50, 35, 20)

        v_data = report_data.get('vulnerability')
        if v_data and isinstance(v_data, dict):
            pdf.set_font('Helvetica', '', 9)
            pdf.set_text_color(100, 80, 60)
            pdf.cell(0, 6,
              f"Age Score: {v_data.get('age_score',0)}"
              f"  +  Crack Score: "
              f"{v_data.get('crack_score',0)}"
              f"  =  Total: {v_data.get('total_score',0)}",
              new_x='LMARGIN', new_y='NEXT')
        pdf.ln(3)

        # ── Inspection Details ──────────────
        section('INSPECTION DETAILS')
        pdf.set_text_color(50, 35, 20)
        insp_data = report_data.get('inspection')
        if insp_data and isinstance(insp_data, dict):
            rows_data = [
              ('Date', str(insp_data.get('date','—'))),
              ('Condition',
               str(insp_data.get('condition','—'))
               .capitalize()),
              ('Notes',
               str(insp_data.get('notes','—'))),
            ]
            for label, value in rows_data:
                pdf.set_font('Helvetica', 'B', 9)
                pdf.set_text_color(120, 90, 60)
                pdf.cell(45, 7, label + ':')
                pdf.set_font('Helvetica', '', 9)
                pdf.set_text_color(50, 35, 20)
                pdf.multi_cell(0, 7,
                    clean(value)[:500])
        pdf.ln(3)

        # ── Cracks Table ────────────────────
        section('CRACK OBSERVATIONS')
        if cracks:
            # Table header
            pdf.set_fill_color(230, 215, 195)
            pdf.set_font('Helvetica', 'B', 9)
            pdf.set_text_color(80, 55, 30)
            headers = [
              ('Location', 70),
              ('Severity', 30),
              ('Length', 25),
              ('Photos', 20),
            ]
            for h, w in headers:
                pdf.cell(w, 8, h,
                         border=1, fill=True)
            pdf.ln()

            severity_colors = {
              'critical': (180, 30, 30),
              'major':    (180, 100, 20),
              'moderate': (160, 130, 20),
              'minor':    (40, 130, 60),
            }
            for crack in cracks:
                pdf.set_font('Helvetica', '', 8)
                sev = str(
                  crack.get('severity','')
                ).lower()
                sc = severity_colors.get(
                  sev, (80, 60, 40))
                pdf.set_text_color(50, 35, 20)
                pdf.cell(70, 7,
                  clean(crack.get(
                    'location_on_monument',
                    '—'))[:40],
                  border=1)
                pdf.set_text_color(*sc)
                pdf.cell(30, 7,
                  clean(sev).capitalize(), border=1)
                pdf.set_text_color(50, 35, 20)
                pdf.cell(25, 7,
                  f"{crack.get('length_cm','—')} cm",
                  border=1)
                pdf.cell(20, 7,
                  str(crack.get(
                    'photo_count', 0)),
                  border=1)
                pdf.ln()
        else:
            pdf.set_font('Helvetica', 'I', 9)
            pdf.set_text_color(140, 120, 100)
            pdf.cell(0, 8,
              'No cracks recorded for this '
              'inspection.',
              new_x='LMARGIN', new_y='NEXT')
        pdf.ln(3)

        # ── Raw Report Content (if not JSON) ──────────
        if content_str and not report_data:
            section('REPORT SUMMARY')
            pdf.set_font('Helvetica', '', 9)
            pdf.set_text_color(50, 35, 20)
            # Replace common markers for better display
            display_text = content_str.replace('===', '\n---').replace('\n\n', '\n')
            pdf.multi_cell(0, 5, clean(display_text))
            pdf.ln(3)

        # ── Signature block ─────────────────

        section('CERTIFICATION')
        pdf.set_font('Helvetica', '', 9)
        pdf.set_text_color(80, 60, 40)
        pdf.multi_cell(0, 6,
          f"This report was generated by "
          f"{clean(report.get('inspector_name'))} and "
          f"encrypted with AES-256 at source. "
          f"Content integrity is guaranteed by "
          f"the Taroudant Heritage Shield "
          f"monitoring system. Any unauthorized "
          f"modification will invalidate this "
          f"document.")
        pdf.ln(8)
        pdf.set_draw_color(180, 140, 100)
        pdf.line(10, pdf.get_y(),
                 90, pdf.get_y())
        pdf.cell(80, 8,
          'Inspector Signature', border=0)
        pdf.line(110, pdf.get_y(),
                 200, pdf.get_y())
        pdf.cell(0, 8,
          'Authority Validation', border=0)

        # ── Output PDF bytes ────────────────
        pdf_bytes = pdf.output()
        # In fpdf2, output() returns bytearray. Use bytes() to convert.
        if pdf_bytes is None:
             raise Exception("PDF generation resulted in empty output.")
             
        final_bytes = bytes(pdf_bytes)

        mon_slug = clean(report.get('monument_name', 'monument')).replace(' ', '_')
        date_str = str(report.get('created_at',''))[:10]
        filename = f"heritage_report_{mon_slug}_{date_str}.pdf"

        return StreamingResponse(
            io.BytesIO(final_bytes),
            media_type='application/pdf',
            headers={
              'Content-Disposition':
                f'attachment; filename="{filename}"'
            }
        )

    except ImportError:
        raise HTTPException(500, 'PDF library not installed. Run: pip install fpdf2')
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error generating PDF: {str(e)}")


