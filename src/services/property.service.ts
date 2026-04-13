import prisma from '../lib/prisma.js';

interface PropertyInput {
  name: string;
  description: string;
  location: string;
  city: string;
  categoryId?: number;
  images?: string[];
}

interface PropertyQuery {
  city?: string;
  name?: string;
  categoryId?: string;
  checkIn?: string;
  checkOut?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export const createProperty = async (data: PropertyInput, ownerId: number) => {
  const { images, ...propertyData } = data;
  return prisma.property.create({
    data: {
      ...propertyData,
      ownerId,
      images: images ? { create: images.map((url) => ({ url })) } : undefined,
    },
    include: {
      images: true,
      category: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getAllProperties = async (query: PropertyQuery) => {
  const { city, name, categoryId, checkIn, checkOut, sort, page = '1', limit = '10' } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (name) where.name = { contains: name, mode: 'insensitive' };
  if (categoryId) where.categoryId = parseInt(categoryId);

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        images: true,
        category: true,
        owner: { select: { id: true, name: true } },
        roomTypes: {
          include: { rooms: true, peakRates: true },
        },
        reviews: { select: { rating: true } },
      },
      skip,
      take: limitNum,
    }),
    prisma.property.count({ where }),
  ]);

  const result = properties.map((property) => {
    const roomTypesWithPrice = property.roomTypes.map((rt) => {
      const effectivePrice = getEffectivePrice(rt.basePrice, rt.peakRates, checkIn);
      return { ...rt, effectivePrice };
    });

    const minPrice = roomTypesWithPrice.length
      ? Math.min(...roomTypesWithPrice.map((rt) => Number(rt.effectivePrice)))
      : null;

    const avgRating = property.reviews.length
      ? property.reviews.reduce((sum, r) => sum + r.rating, 0) / property.reviews.length
      : null;

    return { ...property, roomTypes: roomTypesWithPrice, minPrice, avgRating };
  });

  // Sort
  if (sort === 'price_asc') result.sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));
  if (sort === 'price_desc') result.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
  if (sort === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'name_desc') result.sort((a, b) => b.name.localeCompare(a.name));

  return {
    data: result,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getPropertyById = async (id: number, checkIn?: string, checkOut?: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: true,
      category: true,
      owner: { select: { id: true, name: true, email: true } },
      roomTypes: {
        include: {
          images: true,
          rooms: true,
          peakRates: true,
          bookings: {
            where: {
              status: { in: ['WAITING_PAYMENT', 'PENDING', 'CONFIRMED'] },
              ...(checkIn && checkOut && {
                AND: [
                  { checkIn: { lt: new Date(checkOut) } },
                  { checkOut: { gt: new Date(checkIn) } },
                ],
              }),
            },
            select: { id: true },
          },
        },
      },
      reviews: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!property) throw new Error('Property not found');

  const roomTypesWithAvailability = property.roomTypes.map((rt) => {
    const bookedCount = rt.bookings.length;
    const totalRooms = rt.rooms.length;
    const availableRooms = totalRooms - bookedCount;
    const effectivePrice = getEffectivePrice(rt.basePrice, rt.peakRates, checkIn);
    return { ...rt, effectivePrice, availableRooms, isAvailable: availableRooms > 0 };
  });

  const avgRating = property.reviews.length
    ? property.reviews.reduce((sum, r) => sum + r.rating, 0) / property.reviews.length
    : null;

  return { ...property, roomTypes: roomTypesWithAvailability, avgRating };
};

export const getPropertyCalendar = async (id: number, year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      roomTypes: {
        include: {
          peakRates: {
            where: {
              OR: [
                { startDate: { lte: endDate }, endDate: { gte: startDate } },
              ],
            },
          },
        },
      },
    },
  });

  if (!property) throw new Error('Property not found');

  // Generate price per day untuk setiap room type
  const calendar: Record<string, any> = {};
  const days = endDate.getDate();

  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];

    const roomPrices = property.roomTypes.map((rt) => {
      const price = getEffectivePrice(rt.basePrice, rt.peakRates, date.toISOString());
      return { roomTypeId: rt.id, name: rt.name, price };
    });

    const minPrice = roomPrices.length
      ? Math.min(...roomPrices.map((r) => r.price))
      : null;

    calendar[dateStr] = { date: dateStr, roomPrices, minPrice };
  }

  return calendar;
};

export const updateProperty = async (id: number, data: Partial<PropertyInput>, ownerId: number) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new Error('Property not found');
  if (property.ownerId !== ownerId) throw new Error('Forbidden');

  const { images, ...propertyData } = data;
  return prisma.property.update({
    where: { id },
    data: propertyData,
    include: { images: true, category: true },
  });
};

export const deleteProperty = async (id: number, ownerId: number) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new Error('Property not found');
  if (property.ownerId !== ownerId) throw new Error('Forbidden');
  await prisma.property.delete({ where: { id } });
};

export const getMyProperties = async (ownerId: number) => {
  return prisma.property.findMany({
    where: { ownerId },
    include: {
      images: true,
      category: true,
      roomTypes: {
        include: { rooms: true, _count: { select: { bookings: true } } },
      },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getEffectivePrice = (basePrice: any, peakRates: any[], date?: string) => {
  if (!date) return Number(basePrice);
  const d = new Date(date);
  const applicable = peakRates.find(
    (pr) => new Date(pr.startDate) <= d && new Date(pr.endDate) >= d
  );
  if (!applicable) return Number(basePrice);
  if (applicable.rateType === 'NOMINAL') return Number(basePrice) + Number(applicable.rateValue);
  return Number(basePrice) * (1 + Number(applicable.rateValue) / 100);
};
