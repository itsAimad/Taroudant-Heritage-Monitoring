from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    auth, users, access_requests, monuments,
    inspections, cracks, reports, notifications,
    analytics, admin, assignments
)

app = FastAPI(
    title       = 'Taroudant Heritage Monitoring API',
    description = 'Backend API for heritage inspection and monitoring system',
    version     = '1.0.0',
    docs_url    = '/docs' if settings.APP_ENV == 'development' else None,
    redoc_url   = None,
)

# CORS — must allow credentials for httpOnly cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.FRONTEND_URL],
    allow_credentials = True,
    allow_methods     = ['*'],
    allow_headers     = ['*'],
)

# Global exception handler — always return JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={'detail': 'Internal server error.'}
    )

# Register routers
app.include_router(auth.router,             prefix='/api')
app.include_router(users.router,            prefix='/api')
app.include_router(access_requests.router,  prefix='/api')
app.include_router(monuments.router,        prefix='/api')
app.include_router(inspections.router,      prefix='/api')
app.include_router(cracks.router,           prefix='/api')
app.include_router(reports.router,          prefix='/api')
app.include_router(notifications.router,    prefix='/api')
app.include_router(analytics.router,        prefix='/api')
app.include_router(admin.router,            prefix='/api')
app.include_router(assignments.router,      prefix='/api')

@app.get('/api/health')
async def health():
    return {'status': 'ok', 'service': 'Heritage Monitoring API'}


