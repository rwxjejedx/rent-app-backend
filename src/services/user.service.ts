import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

export const updateTenantProfile = async (
  userId: number,
  data: {
    phone?: string;
    npwp?: string;
    officeAddress?: string;
    bankName?: string;
    bankAccount?: string;
    name?: string;
  }
) => {
  const required = ['phone', 'npwp', 'officeAddress', 'bankName', 'bankAccount'];
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const merged = { ...user, ...data };
  const isProfileComplete = required.every(
    (key) => merged[key as keyof typeof merged]
  );

  return prisma.user.update({
    where: { id: userId },
    data: { ...data, isProfileComplete },
    select: {
      id: true, email: true, name: true, role: true, avatar: true,
      phone: true, npwp: true, officeAddress: true, bankName: true,
      bankAccount: true, isProfileComplete: true,
    },
  });
};

export const getProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      isVerified: true,
      phone: true,
      npwp: true,
      officeAddress: true,
      bankName: true,
      bankAccount: true,
      isProfileComplete: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error('User not found');
  return user;
};

export const updateProfile = async (userId: number, data: { name?: string }) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error('Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return { message: 'Password changed successfully' };
};

export const deleteAvatar = async (userId: number) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatar: null },
    select: { id: true, name: true, email: true, avatar: true },
  });
};
