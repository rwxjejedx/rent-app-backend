import prisma from '../lib/prisma.js';
import cloudinary from '../lib/cloudinary.js';
import { createNotification } from './notification.service.js';

/**
 * Membuat pesanan baru (Booking)
 */
export const createBooking = async (
  userId: number,
  data: {
    roomTypeId: number;
    checkIn: string;
    checkOut: string;
    paymentMethod?: string;
    guestName: string;
    guestNik: string;
    guestPhone: string;
    guestAddress: string;
  }
) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  // 1. Validasi keberadaan tipe kamar
  const roomType = await prisma.roomType.findUnique({
    where: { id: data.roomTypeId },
    include: { rooms: true, peakRates: true },
  });
  if (!roomType) throw new Error('Room type not found');

  // 2. Cek ketersediaan berdasarkan pesanan yang sudah ada
  const overlappingBookings = await prisma.booking.count({
    where: {
      roomTypeId: data.roomTypeId,
      status: { in: ['WAITING_PAYMENT', 'PENDING', 'CONFIRMED'] },
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    },
  });

  const availableRooms = roomType.rooms.length - overlappingBookings;
  if (availableRooms <= 0) throw new Error('No rooms available for the selected dates');

  // 3. Cek ketersediaan manual (tanggal yang di-block oleh tenant)
  const blockedDates = await prisma.roomAvailability.findMany({
    where: {
      roomTypeId: data.roomTypeId,
      isAvailable: false,
      date: { gte: checkIn, lt: checkOut },
    },
  });
  if (blockedDates.length > 0) {
    const blockedStr = blockedDates[0].date.toISOString().split('T')[0];
    throw new Error(`Room is not available on ${blockedStr}`);
  }

  // 4. Kalkulasi harga dan tenggat waktu pembayaran
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = calculateTotalPrice(roomType.basePrice, roomType.peakRates, checkIn, nights);
  const paymentDeadline = new Date(Date.now() + 60 * 60 * 1000); // 1 jam dari sekarang
  const paymentMethod = data.paymentMethod === 'PAYMENT_GATEWAY' ? 'PAYMENT_GATEWAY' : 'MANUAL_TRANSFER';

  // 5. Simpan ke database
  const booking = await prisma.booking.create({
    data: {
      userId,
      roomTypeId: data.roomTypeId,
      checkIn,
      checkOut,
      totalPrice,
      paymentDeadline,
      paymentMethod: paymentMethod as any,
      status: 'WAITING_PAYMENT',
      guestName: data.guestName, 
      guestNik: data.guestNik, 
      guestPhone: data.guestPhone,
      guestAddress: data.guestAddress
    },
    include: {
      roomType: {
        include: { property: { select: { id: true, name: true, city: true, ownerId: true } } },
      },
    },
  });

  // 6. Notifikasi kepada Tenant
  const ownerId = (booking.roomType.property as any).ownerId;
  await createNotification(
    ownerId,
    '🏨 New Booking Request',
    `New booking for ${booking.roomType.property.name} from ${checkIn.toLocaleDateString()} to ${checkOut.toLocaleDateString()}`,
    'BOOKING_NEW',
    booking.id
  );
  // 7. Notifikasi kepada User
  await createNotification(
    userId,
    '📝 Booking Created',
    `You have successfully booked ${booking.roomType.property.name}. Please complete your payment before the deadline.`,
    'BOOKING_NEW',
    booking.id
  );

  return booking;
};

/**
 * Upload bukti pembayaran
 */
export const uploadPaymentProof = async (
  bookingId: number,
  userId: number,
  file: Express.Multer.File
) => {
  const booking = await prisma.booking.findUnique({ 
    where: { id: bookingId },
    include: { roomType: { include: { property: true } } }
  });

  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (booking.status !== 'WAITING_PAYMENT') throw new Error('Booking is not waiting for payment');
  
  if (new Date() > booking.paymentDeadline) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledBy: 'SYSTEM' } });
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

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentProof: url, status: 'PENDING' },
    include: {
      roomType: {
        include: { property: { select: { id: true, name: true, city: true, ownerId: true } } },
      },
    },
  });

  // Notifikasi kepada Tenant
  const ownerId = (updated.roomType.property as any).ownerId;
  await createNotification(
    ownerId,
    '💳 Payment Proof Uploaded',
    `A guest has uploaded payment proof for ${updated.roomType.property.name}. Please verify.`,
    'PAYMENT_UPLOADED',
    updated.id
  );

  // 1b. Notifikasi kepada User
  await createNotification(
    userId,
    '💳 Payment Uploaded',
    `Your payment proof for ${updated.roomType.property.name} has been uploaded. Please wait for the tenant to verify.`,
    'PAYMENT_UPLOADED',
    updated.id
  );

  return updated;
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
  if (status === 'CONFIRMED' && booking.status !== 'PENDING') {
    throw new Error('Only pending bookings can be confirmed');
  }
  if (status === 'CANCELLED' && !['WAITING_PAYMENT', 'PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new Error('Booking cannot be cancelled in its current state');
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status, ...(status === 'CANCELLED' && { cancelledBy: 'TENANT' }) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      roomType: { include: { property: { select: { id: true, name: true } } } },
    },
  });

  const notifTitle = status === 'CONFIRMED' ? '✅ Booking Confirmed!' : '❌ Booking Cancelled';
  const notifMsg = status === 'CONFIRMED'
    ? `Your booking at ${updated.roomType.property.name} has been confirmed!`
    : `Your booking at ${updated.roomType.property.name} has been cancelled.`;

  await createNotification(updated.user.id, notifTitle, notifMsg, `BOOKING_${status}`, id);

  return updated;
};

export const cancelBooking = async (id: number, userId: number) => {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (!['WAITING_PAYMENT', 'PENDING'].includes(booking.status)) {
    throw new Error('Booking cannot be cancelled');
  }
  const updated = await prisma.booking.update({ 
    where: { id }, 
    data: { status: 'CANCELLED', cancelledBy: 'USER' },
    include: { roomType: { include: { property: true } } }
  });

  // Notifikasi kepada Tenant
  const ownerId = (updated.roomType.property as any).ownerId;
  await createNotification(
    ownerId,
    '❌ Booking Cancelled by Guest',
    `A guest has cancelled their booking for ${updated.roomType.property.name}.`,
    'BOOKING_CANCELLED',
    id
  );

  return updated;
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

export const cancelExpiredBookings = async () => {
  const result = await prisma.booking.updateMany({
    where: {
      status: 'WAITING_PAYMENT',
      paymentDeadline: { lt: new Date() },
    },
    data: { status: 'CANCELLED', cancelledBy: 'SYSTEM' },
  });
  if (result.count > 0) {
    console.log(`[CRON] Auto-cancelled ${result.count} expired booking(s)`);
  }
};

/**
 * Helper: Kalkulasi total harga dengan Peak Rates
 */
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
      else nightPrice *= (1 + Number(applicable.rateValue) / 100);
    }
    total += nightPrice;
  }
  return total;
};