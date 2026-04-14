import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Mengambil Base URL dari env
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export const sendVerificationEmail = async (email: string, name: string, token: string, role: string) => {
  // Update: Menambahkan /api/v1 sesuai struktur API kamu
  const verificationUrl = `${APP_URL}/api/v1/auth/verify?token=${token}&role=${role}`;

  await transporter.sendMail({
    from: `"StayEase" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verifikasi Email & Set Password - StayEase',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">StayEase</h1>
        </div>
        <div style="padding: 32px; color: #1e293b;">
          <h2 style="margin-top: 0;">Halo, ${name}!</h2>
          <p style="line-height: 1.6;">Terima kasih telah bergabung. Satu langkah lagi untuk mulai menyewa atau menyewakan properti. Klik tombol di bawah untuk verifikasi email kamu:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 14px 28px; background-color: #1e293b;
                      color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verifikasi & Set Password
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b;">Atau salin link ini ke browser kamu:</p>
          <p style="font-size: 12px; color: #94a3b8; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;">${verificationUrl}</p>
          
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px;">
            <p><strong>Penting:</strong> Link ini hanya berlaku selama <strong>1 jam</strong>.</p>
            <p style="color: #ef4444;">Jika sudah kadaluarsa, silakan lakukan pendaftaran ulang.</p>
          </div>
        </div>
      </div>
    `,
  });
};