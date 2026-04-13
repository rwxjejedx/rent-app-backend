import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import prisma from '../lib/prisma.js';
import { sendVerificationEmail } from '../lib/email.js';

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (email: string, name: string, role: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.isVerified) throw new Error('Email already registered');

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  await prisma.user.upsert({
    where: { email },
    update: { name, role: role as any, verificationToken, tokenExpiry, isVerified: false },
    create: { email, name, role: role as any, verificationToken, tokenExpiry },
  });

  await sendVerificationEmail(email, name, verificationToken, role);

  return { message: 'Registration successful. Please check your email to verify and set your password.' };
};

export const verifyAndSetPassword = async (token: string, password: string) => {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) throw new Error('Invalid or expired verification link');
  if (user.isVerified) throw new Error('Email already verified');
  if (!user.tokenExpiry || new Date() > user.tokenExpiry) {
    throw new Error('Verification link has expired. Please register again.');
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, isVerified: true, verificationToken: null, tokenExpiry: null },
  });

  return { message: 'Email verified and password set. You can now login.' };
};

export const resendVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Email not found');
  if (user.isVerified) throw new Error('Email already verified');

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({ where: { id: user.id }, data: { verificationToken, tokenExpiry } });
  await sendVerificationEmail(email, user.name, verificationToken, user.role);

  return { message: 'Verification email resent' };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new Error('Invalid email or password');
  if (!user.isVerified) throw new Error('Please verify your email before logging in');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid email or password');

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
};

export const generateJwtForUser = (user: { id: number; email: string; name: string; role: string }) => {
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};