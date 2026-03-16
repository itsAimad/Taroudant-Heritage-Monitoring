from fastapi import APIRouter, Depends
from ..database import get_db, execute_query

router = APIRouter(prefix='/monuments', tags=['Monuments'])

@router.get('/')
async def get_all_monuments(conn = Depends(get_db)):
    rows = execute_query(
        conn,
        """
        SELECT
          m.monument_id        AS id,
          m.name,
          m.location,
          m.city,
          m.latitude,
          m.longitude,
          m.construction_year,
          m.description,
          m.status,
          mc.category_name     AS type,
          vs.total_score       AS vulnerability_score,
          vs.risk_level,
          vs.computed_at       AS last_inspection
        FROM monuments m
        LEFT JOIN monument_categories mc
          ON m.category_id = mc.category_id
        LEFT JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id
            FROM vulnerability_scores
            WHERE monument_id = m.monument_id
            ORDER BY computed_at DESC
            LIMIT 1
          )
        ORDER BY m.monument_id ASC
        """
    )
    return { 'count': len(rows), 'results': rows }

@router.get('/{monument_id}')
async def get_monument(
    monument_id: int,
    conn = Depends(get_db)
):
    rows = execute_query(
        conn,
        """
        SELECT
          m.*,
          mc.category_name     AS type,
          vs.total_score       AS vulnerability_score,
          vs.risk_level,
          vs.age_score,
          vs.crack_score,
          vs.computed_at       AS last_score_at
        FROM monuments m
        LEFT JOIN monument_categories mc
          ON m.category_id = mc.category_id
        LEFT JOIN vulnerability_scores vs
          ON vs.score_id = (
            SELECT score_id
            FROM vulnerability_scores
            WHERE monument_id = m.monument_id
            ORDER BY computed_at DESC
            LIMIT 1
          )
        WHERE m.monument_id = %s
        LIMIT 1
        """,
        (monument_id,)
    )
    if not rows:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Monument not found.')
    return rows[0]
