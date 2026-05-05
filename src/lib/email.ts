import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Timeout dipertahankan untuk keamanan di Railway
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export const sendVerificationEmail = async (email: string, name: string, token: string, role: string) => {
  const verificationUrl = `${APP_URL}/api/v1/auth/verify?token=${token}&role=${role}`;

  try {
    // Langsung kirim tanpa .verify() untuk memangkas waktu koneksi
    await transporter.sendMail({
      from: `"Anta.com" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verifikasi Email & Set Password - Anta.com',
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Anta.com</h1>
          </div>
          <div style="padding: 32px; color: #1e293b;">
            <h2 style="margin-top: 0;">Halo, ${name}!</h2>
            <p style="line-height: 1.6;">Terima kasih telah bergabung. Klik tombol di bawah untuk verifikasi email kamu:</p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}"
                 style="display: inline-block; padding: 14px 28px; background-color: #1e293b;
                        color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Verifikasi & Set Password
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;">${verificationUrl}</p>

            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px;">
              <p><strong>Penting:</strong> Link ini hanya berlaku selama <strong>1 jam</strong>.</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`Email successfully sent to: ${email}`);
  } catch (error: any) {
    // Logging detail error agar mudah didebug di Railway
    console.error('Nodemailer Error Details:', error);

    // Melempar error asli agar controller bisa memberikan feedback yang benar
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};