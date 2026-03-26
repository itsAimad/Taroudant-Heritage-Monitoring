from fastapi import APIRouter, Depends
from ..database import get_db, execute_query
from ..dependencies import require_role
from ..models.user import UserRole

router = APIRouter(prefix='/analytics', tags=['Analytics'])

@router.get('/')
async def get_analytics(
    conn         = Depends(get_db),
    current_user = Depends(
        require_role(UserRole.AUTHORITY, UserRole.ADMIN)
    )
):
    # 1. Risk distribution across all monuments
    risk_dist = execute_query(conn, """
        SELECT
          vs.risk_level,
          COUNT(*) AS count
        FROM vulnerability_scores vs
        INNER JOIN (
          SELECT monument_id, MAX(computed_at) AS latest
          FROM vulnerability_scores
          GROUP BY monument_id
        ) latest ON vs.monument_id = latest.monument_id
          AND vs.computed_at = latest.latest
        GROUP BY vs.risk_level
    """)

    # 2. Inspections per month (last 6 months)
    inspections_trend = execute_query(conn, """
        SELECT
          DATE_FORMAT(inspection_date, '%Y-%m') AS month,
          COUNT(*) AS total,
          SUM(CASE WHEN overall_condition = 'critical'
              THEN 1 ELSE 0 END) AS critical_count
        FROM inspections
        WHERE inspection_date >=
          DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(inspection_date, '%Y-%m')
        ORDER BY month ASC
    """)

    # 3. Crack severity breakdown
    crack_severity = execute_query(conn, """
        SELECT severity, COUNT(*) AS count
        FROM cracks
        GROUP BY severity
        ORDER BY FIELD(severity,
          'minor','moderate','major','critical')
    """)

    # 4. Top 5 most vulnerable monuments
    vulnerable = execute_query(conn, """
        SELECT
          m.name,
          m.location,
          vs.total_score,
          vs.risk_level,
          vs.computed_at
        FROM monuments m
        JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id FROM vulnerability_scores
            WHERE monument_id = m.monument_id
            ORDER BY computed_at DESC LIMIT 1
          )
        ORDER BY vs.total_score DESC
        LIMIT 5
    """)

    # 5. Summary stats
    stats = execute_query(conn, """
        SELECT
          (SELECT COUNT(*) FROM monuments) AS total_monuments,
          (SELECT COUNT(*) FROM inspections) AS total_inspections,
          (SELECT COUNT(*) FROM cracks) AS total_cracks,
          (SELECT COUNT(*) FROM notifications
           WHERE is_read = FALSE) AS unread_alerts,
          (SELECT COUNT(*) FROM reports) AS total_reports
    """)

    return {
        'summary':           stats[0] if stats else {},
        'risk_distribution': risk_dist,
        'inspections_trend': inspections_trend,
        'crack_severity':    crack_severity,
        'most_vulnerable':   vulnerable,
    }
