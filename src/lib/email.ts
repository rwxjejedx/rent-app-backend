import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export const sendVerificationEmail = async (email: string, name: string, token: string, role: string) => {
  const verificationUrl = `${APP_URL}/auth/verify?token=${token}&role=${role}`;

  await transporter.sendMail({
    from: `"RentApp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verifikasi Email & Set Password - RentApp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Halo, ${name}!</h2>
        <p>Terima kasih telah mendaftar di RentApp. Klik tombol di bawah untuk verifikasi email dan set password kamu:</p>
        <a href="${verificationUrl}"
          style="display: inline-block; padding: 12px 24px; background-color: #4F46E5;
                 color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verifikasi & Set Password
        </a>
        <p>Atau copy link berikut ke browser kamu:</p>
        <p style="color: #6B7280; word-break: break-all;">${verificationUrl}</p>
        <p>Link ini akan kadaluarsa dalam <strong>1 jam</strong>.</p>
        <p style="color: #EF4444;">Jika sudah lewat 1 jam, kamu perlu mendaftar ulang.</p>
        <p>Jika kamu tidak mendaftar, abaikan email ini.</p>
      </div>
    `,
  });
};
