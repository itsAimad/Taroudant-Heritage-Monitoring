import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from ..config import settings
from ..database import execute_write, get_db

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME = settings.SMTP_USER,
    MAIL_PASSWORD = settings.SMTP_PASSWORD,
    MAIL_FROM     = settings.SMTP_FROM,
    MAIL_PORT     = settings.SMTP_PORT,
    MAIL_SERVER   = settings.SMTP_HOST,
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS  = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_approval_email(email: str, full_name: str, token: str):
    """Send an approval email with a link to complete account setup."""
    html = f"""
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #1a1c1e 0%, #2d3436 100%); padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid rgba(196, 140, 92, 0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 40px;">🏛️</span>
                <h1 style="color: #c48c5c; margin: 10px 0 0 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Taroudant Heritage Shield</h1>
            </div>
            
            <div style="background-color: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-top: 0;">Bonjour <strong>{full_name}</strong>,</p>
                <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6;">Nous avons le plaisir de vous informer que votre demande d'accès au système de surveillance du patrimoine de Taroudant a été <strong style="color: #c48c5c;">approuvée</strong>.</p>
                <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6;">Veuillez cliquer sur le bouton ci-dessous pour configurer votre mot de passe et finaliser la création de votre compte :</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{settings.FRONTEND_URL}/complete-account?token={token}" 
                       style="background: linear-gradient(to right, #c48c5c, #a67346); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(196, 140, 92, 0.3);">
                       Finaliser mon compte
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px; text-align: center; margin-bottom: 0;"><strong>Note:</strong> Ce lien sécurisé expirera dans 48 heures.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px;">
                <p style="color: #666; font-size: 12px; margin: 0;">Système de Protection du Patrimoine — Taroudant, Maroc</p>
                <p style="color: #c48c5c; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">heritage-taroudant.ma</p>
            </div>
        </div>
    </div>
    """
    
    message = MessageSchema(
        subject="🏛️ Taroudant Heritage Shield — Demande d'accès approuvée",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    account_link = f"{settings.FRONTEND_URL}/complete-account?token={token}"
    if settings.SMTP_PASSWORD == 'your-app-password-here':
        print("\n" + "="*70)
        print(f"[MOCK EMAIL - APPROVAL] To: {email}")
        print(f"User {full_name} has been approved.")
        print(f"ACCOUNT COMPLETION LINK: {account_link}")
        print("="*70 + "\n")
        return

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send approval email to {email}: {str(e)}")
        # Log failure to audit_logs
        # (We use a direct write here to avoid dependency issues if called from a router)
        try:
            with next(get_db()) as conn:
                execute_write(conn, """
                    INSERT INTO audit_logs (action, details)
                    VALUES ('EMAIL_SEND_FAILED', %s)
                """, (f"Failed to send to {email}: {str(e)}",))
        except:
            pass

async def send_rejection_email(email: str, full_name: str, review_note: str):
    """Send a rejection email with the admin's note."""
    html = f"""
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8f9fa;">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e0e0e0;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0; font-size: 22px;">Taroudant Heritage Shield</h2>
            </div>
            
            <p style="color: #444; font-size: 16px; line-height: 1.6;">Bonjour <strong>{full_name}</strong>,</p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Nous avons bien reçu votre demande d'accès, mais nous regrettons de vous informer qu'elle n'a pas été approuvée pour le moment.</p>
            
            <div style="background-color: #fff5f5; padding: 20px; border-left: 4px solid #f87171; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; font-style: italic; color: #991b1b; font-size: 15px;"><strong>Motif :</strong> {review_note}</p>
            </div>
            
            <p style="color: #888; font-size: 14px;">Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez fournir des informations complémentaires, vous pouvez contacter l'administrateur du système.</p>
            
            <div style="margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="color: #999; font-size: 12px; margin: 0;">Taroudant Heritage Shield</p>
            </div>
        </div>
    </div>
    """
    
    message = MessageSchema(
        subject="Taroudant Heritage Shield — Demande d'accès non approuvée",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    if settings.SMTP_PASSWORD == 'your-app-password-here':
        print("\n" + "="*70)
        print(f"[MOCK EMAIL - REJECTED] To: {email}")
        print(f"User {full_name} has been rejected.")
        print(f"Reason: {review_note}")
        print("="*70 + "\n")
        return

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send rejection email to {email}: {str(e)}")
        try:
            with next(get_db()) as conn:
                execute_write(conn, """
                    INSERT INTO audit_logs (action, details)
                    VALUES ('EMAIL_SEND_FAILED', %s)
                """, (f"Failed to send to {email}: {str(e)}",))
        except:
            pass

async def send_test_email(email: str):
    """Simple test email sender."""
    message = MessageSchema(
        subject="Taroudant Heritage Shield — Test Email",
        recipients=[email],
        body="This is a test email from Taroudant Heritage Shield system.",
        subtype=MessageType.plain
    )
    fm = FastMail(conf)
    await fm.send_message(message)
