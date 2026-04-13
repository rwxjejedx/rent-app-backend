import prisma from '../lib/prisma.js';
import cloudinary from '../lib/cloudinary.js';

export const createBooking = async (
  userId: number,
  data: { roomTypeId: number; checkIn: string; checkOut: string; paymentMethod?: string }
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
      status: { in: ['WAITING_PAYMENT', 'PENDING', 'CONFIRMED'] },
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    },
  });

  const availableRooms = roomType.rooms.length - overlappingBookings;
  if (availableRooms <= 0) throw new Error('No rooms available for the selected dates');

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = calculateTotalPrice(roomType.basePrice, roomType.peakRates, checkIn, nights);
  const paymentDeadline = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
  const paymentMethod = data.paymentMethod === 'PAYMENT_GATEWAY' ? 'PAYMENT_GATEWAY' : 'MANUAL_TRANSFER';

  return prisma.booking.create({
    data: {
      userId,
      roomTypeId: data.roomTypeId,
      checkIn,
      checkOut,
      totalPrice,
      paymentDeadline,
      paymentMethod: paymentMethod as any,
      status: 'WAITING_PAYMENT',
    },
    include: {
      roomType: {
        include: { property: { select: { id: true, name: true, city: true } } },
      },
    },
  });
};

export const uploadPaymentProof = async (
  bookingId: number,
  userId: number,
  file: Express.Multer.File
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (booking.status !== 'WAITING_PAYMENT') throw new Error('Booking is not waiting for payment');
  if (new Date() > booking.paymentDeadline) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
    throw new Error('Payment deadline has passed. Booking has been cancelled.');
  }

  // Upload ke Cloudinary
  const url = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'rentapp/payment-proofs' }, (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      })
      .end(file.buffer);
  });

  return prisma.booking.update({
    where: { id: bookingId },
    data: { paymentProof: url, status: 'PENDING' },
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
  if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be confirmed or cancelled');

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
  if (!['WAITING_PAYMENT', 'PENDING'].includes(booking.status)) {
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

// Auto cancel expired bookings
export const cancelExpiredBookings = async () => {
  const result = await prisma.booking.updateMany({
    where: {
      status: 'WAITING_PAYMENT',
      paymentDeadline: { lt: new Date() },
    },
    data: { status: 'CANCELLED' },
  });
  if (result.count > 0) {
    console.log(`[CRON] Auto-cancelled ${result.count} expired booking(s)`);
  }
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
