import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'KioskStar <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const sendPasswordResetEmail = async (email: string, token: string, userName: string) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'KioskStar — Restablecer contraseña',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Hola ${userName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Recibimos una solicitud para restablecer tu contraseña en <strong>KioskStar</strong>.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0;">
          Restablecer contraseña
        </a>
        <p style="color: #888; font-size: 13px; line-height: 1.5;">
          Este enlace expira en 1 hora. Si no solicitaste esto, ignorá este email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 11px;">KioskStar — Gestión de kioscos</p>
      </div>
    `,
  });
};
