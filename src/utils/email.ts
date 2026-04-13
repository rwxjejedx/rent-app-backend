import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (email: string, name: string, otp: string) => {
  await transporter.sendMail({
    from: `"RentApp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Kode Verifikasi RentApp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Halo, ${name}!</h2>
        <p>Gunakan kode OTP berikut untuk verifikasi akun kamu:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px;
                       color: #4F46E5; background: #EEF2FF; padding: 16px 24px;
                       border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p>Kode ini berlaku selama <strong>10 menit</strong>.</p>
        <p style="color: #6B7280;">Jika kamu tidak mendaftar, abaikan email ini.</p>
      </div>
    `,
  });
};
