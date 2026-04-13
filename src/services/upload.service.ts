import cloudinary from '../lib/cloudinary.js';
import prisma from '../lib/prisma.js';

const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `rentapp/${folder}` }, (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      })
      .end(buffer);
  });
};

// ─── Property Images ──────────────────────────────────────────────────────────

export const uploadPropertyImages = async (
  propertyId: number,
  ownerId: number,
  files: Express.Multer.File[]
) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new Error('Property not found');
  if (property.ownerId !== ownerId) throw new Error('Forbidden');

  const urls = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'properties'))
  );

  const images = await prisma.propertyImage.createManyAndReturn({
    data: urls.map((url) => ({ url, propertyId })),
  });

  return images;
};

export const deletePropertyImage = async (id: number, ownerId: number) => {
  const image = await prisma.propertyImage.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!image) throw new Error('Image not found');
  if (image.property.ownerId !== ownerId) throw new Error('Forbidden');

  // Extract public_id from URL and delete from Cloudinary
  const publicId = extractPublicId(image.url);
  if (publicId) await cloudinary.uploader.destroy(publicId);

  await prisma.propertyImage.delete({ where: { id } });
};

// ─── Room Type Images ─────────────────────────────────────────────────────────

export const uploadRoomTypeImages = async (
  roomTypeId: number,
  ownerId: number,
  files: Express.Multer.File[]
) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { property: true },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  const urls = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'room-types'))
  );

  const images = await prisma.roomTypeImage.createManyAndReturn({
    data: urls.map((url) => ({ url, roomTypeId })),
  });

  return images;
};

export const deleteRoomTypeImage = async (id: number, ownerId: number) => {
  const image = await prisma.roomTypeImage.findUnique({
    where: { id },
    include: { roomType: { include: { property: true } } },
  });
  if (!image) throw new Error('Image not found');
  if (image.roomType.property.ownerId !== ownerId) throw new Error('Forbidden');

  const publicId = extractPublicId(image.url);
  if (publicId) await cloudinary.uploader.destroy(publicId);

  await prisma.roomTypeImage.delete({ where: { id } });
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

export const uploadAvatar = async (userId: number, file: Express.Multer.File) => {
  const url = await uploadToCloudinary(file.buffer, 'avatars');
  return prisma.user.update({
    where: { id: userId },
    data: { avatar: url },
    select: { id: true, name: true, email: true, avatar: true },
  });
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const extractPublicId = (url: string): string | null => {
  const match = url.match(/rentapp\/[^/]+\/([^.]+)/);
  return match ? `rentapp/${match[0].split('rentapp/')[1]}` : null;
};
