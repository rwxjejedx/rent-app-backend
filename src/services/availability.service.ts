import prisma from '../lib/prisma.js';

export const setRoomAvailability = async (
  roomTypeId: number,
  ownerId: number,
  dates: { date: string; isAvailable: boolean }[]
) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { property: true },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  // Upsert availability untuk setiap tanggal
  const results = await Promise.all(
    dates.map((d) =>
      prisma.roomAvailability.upsert({
        where: {
          date_roomTypeId: {
            date: new Date(d.date),
            roomTypeId,
          },
        },
        update: { isAvailable: d.isAvailable },
        create: {
          date: new Date(d.date),
          isAvailable: d.isAvailable,
          roomTypeId,
        },
      })
    )
  );

  return results;
};

export const getRoomAvailability = async (
  roomTypeId: number,
  year: number,
  month: number
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return prisma.roomAvailability.findMany({
    where: {
      roomTypeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });
};

export const deleteRoomAvailability = async (id: number, ownerId: number) => {
  const availability = await prisma.roomAvailability.findUnique({
    where: { id },
    include: { roomType: { include: { property: true } } },
  });
  if (!availability) throw new Error('Availability not found');
  if (availability.roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  await prisma.roomAvailability.delete({ where: { id } });
};
