import prisma from '../lib/prisma.js';

export const createNotification = async (
  userId: number,
  title: string,
  message: string,
  type: string,
  bookingId?: number
) => {
  return prisma.notification.create({
    data: { userId, title, message, type, bookingId },
  });
};

export const getNotifications = async (userId: number) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
};

export const markAsRead = async (id: number, userId: number) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: number) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const getUnreadCount = async (userId: number) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};
