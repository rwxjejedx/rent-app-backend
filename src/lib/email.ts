// import nodemailer from 'nodemailer';

// // Konfigurasi Transporter yang lebih tangguh untuk Railway
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465, // Menggunakan port SSL untuk koneksi yang lebih aman di Cloud
//   secure: true,
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD,
//   },
//   // Tambahan timeout agar server tidak menunggu terlalu lama
//   connectionTimeout: 10000, // 10 detik
//   greetingTimeout: 10000,
//   socketTimeout: 15000,
// });

// const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

// export const sendVerificationEmail = async (email: string, name: string, token: string, role: string) => {
//   const verificationUrl = `${APP_URL}/api/v1/auth/verify?token=${token}&role=${role}`;

//   try {
//     // Verifikasi koneksi sebelum mencoba mengirim
//     await transporter.verify();

//     await transporter.sendMail({
//       from: `"Anta.com" <${process.env.GMAIL_USER}>`,
//       to: email,
//       subject: 'Verifikasi Email & Set Password - StayEase',
//       html: `
//         <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
//           <div style="background-color: #0f172a; padding: 24px; text-align: center;">
//             <h1 style="color: #ffffff; margin: 0; font-size: 24px;">StayEase</h1>
//           </div>
//           <div style="padding: 32px; color: #1e293b;">
//             <h2 style="margin-top: 0;">Halo, ${name}!</h2>
//             <p style="line-height: 1.6;">Terima kasih telah bergabung. Klik tombol di bawah untuk verifikasi email kamu:</p>

//             <div style="text-align: center; margin: 32px 0;">
//               <a href="${verificationUrl}"
//                  style="display: inline-block; padding: 14px 28px; background-color: #1e293b;
//                         color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
//                 Verifikasi & Set Password
//               </a>
//             </div>

//             <p style="font-size: 12px; color: #94a3b8; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;">${verificationUrl}</p>

//             <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px;">
//               <p><strong>Penting:</strong> Link ini hanya berlaku selama <strong>1 jam</strong>.</p>
//             </div>
//           </div>
//         </div>
//       `,
//     });
//     console.log(`Verification email sent to ${email}`);
//   } catch (error) {
//     console.error('Email sending failed:', error);
//     // Kita lempar error agar ditangkap oleh controller dan tidak memberikan response 'success' palsu
//     throw new Error('Failed to send verification email due to connection timeout.');
//   }
// };


import { Resend } from 'resend';

// Inisialisasi Resend dengan API Key dari env
const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export const sendVerificationEmail = async (email: string, name: string, token: string, role: string) => {
  const verificationUrl = `${APP_URL}/api/v1/auth/verify?token=${token}&role=${role}`;

  try {
    const { data, error } = await resend.emails.send({
      // Jika belum verifikasi domain, gunakan email bawaan Resend ini
      from: 'Anta.com <onboarding@resend.dev>',
      to: email,
      subject: 'Verifikasi Email & Set Password - Anta.com',
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">StayEase</h1>
          </div>
          <div style="padding: 32px; color: #1e293b;">
            <h2 style="margin-top: 0;">Halo, ${name}!</h2>
            <p style="line-height: 1.6;">Terima kasih telah bergabung. Klik tombol di bawah untuk memverifikasi email Anda dan mengatur kata sandi:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}"
                 style="display: inline-block; padding: 14px 28px; background-color: #1e293b;
                        color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Verifikasi & Set Password
              </a>
            </div>

            <p style="font-size: 14px; color: #64748b;">Atau salin link ini ke browser Anda:</p>
            <p style="font-size: 12px; color: #94a3b8; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;">${verificationUrl}</p>
            
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px;">
              <p><strong>Penting:</strong> Link ini berlaku selama 1 jam.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully:', data?.id);
  } catch (err: any) {
    console.error('Internal Email Error:', err.message);
    throw new Error('Gagal mengirim email verifikasi.');
  }
};