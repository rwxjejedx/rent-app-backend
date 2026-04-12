import prisma from '../lib/prisma.js';

// ─── Room Type ────────────────────────────────────────────────────────────────

export const createRoomType = async (
  propertyId: number,
  ownerId: number,
  data: { name: string; description: string; basePrice: number; capacity: number; images?: string[] }
) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new Error('Property not found');
  if (property.ownerId !== ownerId) throw new Error('Forbidden');

  const { images, ...roomTypeData } = data;
  return prisma.roomType.create({
    data: {
      ...roomTypeData,
      propertyId,
      images: images ? { create: images.map((url) => ({ url })) } : undefined,
    },
    include: { images: true, rooms: true },
  });
};

export const updateRoomType = async (
  id: number,
  ownerId: number,
  data: Partial<{ name: string; description: string; basePrice: number; capacity: number }>
) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  return prisma.roomType.update({ where: { id }, data, include: { images: true, rooms: true } });
};

export const deleteRoomType = async (id: number, ownerId: number) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType.property.ownerId !== ownerId) throw new Error('Forbidden');
  await prisma.roomType.delete({ where: { id } });
};

// ─── Room ─────────────────────────────────────────────────────────────────────

export const createRoom = async (roomTypeId: number, ownerId: number, number: string) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { property: true },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  return prisma.room.create({ data: { number, roomTypeId } });
};

export const deleteRoom = async (id: number, ownerId: number) => {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { roomType: { include: { property: true } } },
  });
  if (!room) throw new Error('Room not found');
  if (room.roomType.property.ownerId !== ownerId) throw new Error('Forbidden');
  await prisma.room.delete({ where: { id } });
};

// ─── Peak Rate ────────────────────────────────────────────────────────────────

export const createPeakRate = async (
  roomTypeId: number,
  ownerId: number,
  data: { startDate: string; endDate: string; rateType: 'NOMINAL' | 'PERCENTAGE'; rateValue: number }
) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { property: true },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  return prisma.peakRate.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      roomTypeId,
    },
  });
};

export const deletePeakRate = async (id: number, ownerId: number) => {
  const peakRate = await prisma.peakRate.findUnique({
    where: { id },
    include: { roomType: { include: { property: true } } },
  });
  if (!peakRate) throw new Error('Peak rate not found');
  if (peakRate.roomType.property.ownerId !== ownerId) throw new Error('Forbidden');
  await prisma.peakRate.delete({ where: { id } });
};

export const getPeakRates = async (roomTypeId: number) => {
  return prisma.peakRate.findMany({
    where: { roomTypeId },
    orderBy: { startDate: 'asc' },
  });
};
