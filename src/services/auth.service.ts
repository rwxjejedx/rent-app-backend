import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sendOtpEmail } from '../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET!;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (email: string, password: string, name: string, role?: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.isVerified) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, name, otpCode: otp, otpExpiry },
    create: {
      email,
      password: hashed,
      name,
      role: (role as any) ?? 'USER',
      otpCode: otp,
      otpExpiry,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await sendOtpEmail(email, name, otp);

  return user;
};

export const verifyOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Email not found');
  if (user.isVerified) throw new Error('Email already verified');
  if (!user.otpCode || !user.otpExpiry) throw new Error('OTP not found, please register again');
  if (new Date() > user.otpExpiry) throw new Error('OTP expired, please request a new one');
  if (user.otpCode !== otp) throw new Error('Invalid OTP');

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otpCode: null, otpExpiry: null },
  });

  return { message: 'Email verified successfully. You can now login.' };
};

export const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Email not found');
  if (user.isVerified) throw new Error('Email already verified');

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
  await sendOtpEmail(email, user.name, otp);

  return { message: 'OTP resent to your email' };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');
  if (!user.isVerified) throw new Error('Please verify your email before logging in');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid email or password');

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
};
