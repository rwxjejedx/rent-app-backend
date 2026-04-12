import prisma from '../lib/prisma.js';

export const createBooking = async (
  userId: number,
  data: { roomTypeId: number; checkIn: string; checkOut: string }
) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  const roomType = await prisma.roomType.findUnique({
    where: { id: data.roomTypeId },
    include: { rooms: true, peakRates: true },
  });
  if (!roomType) throw new Error('Room type not found');

  const overlappingBookings = await prisma.booking.count({
    where: {
      roomTypeId: data.roomTypeId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    },
  });

  const availableRooms = roomType.rooms.length - overlappingBookings;
  if (availableRooms <= 0) throw new Error('No rooms available for the selected dates');

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = calculateTotalPrice(roomType.basePrice, roomType.peakRates, checkIn, nights);

  return prisma.booking.create({
    data: { userId, roomTypeId: data.roomTypeId, checkIn, checkOut, totalPrice, status: 'PENDING' },
    include: {
      roomType: {
        include: { property: { select: { id: true, name: true, city: true } } },
      },
    },
  });
};

export const getUserBookings = async (userId: number) => {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      roomType: {
        include: {
          property: { include: { images: true } },
          images: true,
        },
      },
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getTenantBookings = async (ownerId: number) => {
  return prisma.booking.findMany({
    where: { roomType: { property: { ownerId } } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      roomType: {
        include: { property: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateBookingStatus = async (
  id: number,
  status: 'CONFIRMED' | 'CANCELLED',
  ownerId: number
) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { roomType: { include: { property: true } } },
  });
  if (!booking) throw new Error('Booking not found');
  if (booking.roomType.property.ownerId !== ownerId) throw new Error('Forbidden');
  if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be updated');

  return prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { id: true, name: true, email: true } },
      roomType: { include: { property: { select: { id: true, name: true } } } },
    },
  });
};

export const cancelBooking = async (id: number, userId: number) => {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new Error('Booking cannot be cancelled');
  }
  return prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
};

export const createReview = async (
  bookingId: number,
  userId: number,
  data: { rating: number; comment: string }
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { roomType: { include: { property: true } } },
  });
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (booking.status !== 'COMPLETED') throw new Error('Can only review completed bookings');

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw new Error('Review already submitted for this booking');

  return prisma.review.create({
    data: { ...data, userId, bookingId, propertyId: booking.roomType.propertyId },
  });
};

const calculateTotalPrice = (
  basePrice: any,
  peakRates: any[],
  checkIn: Date,
  nights: number
): number => {
  let total = 0;
  for (let i = 0; i < nights; i++) {
    const date = new Date(checkIn);
    date.setDate(date.getDate() + i);
    const applicable = peakRates.find(
      (pr) => new Date(pr.startDate) <= date && new Date(pr.endDate) >= date
    );
    let nightPrice = Number(basePrice);
    if (applicable) {
      if (applicable.rateType === 'NOMINAL') nightPrice += Number(applicable.rateValue);
      else nightPrice *= 1 + Number(applicable.rateValue) / 100;
    }
    total += nightPrice;
  }
  return total;
};
