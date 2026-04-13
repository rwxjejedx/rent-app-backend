import multer from 'multer';

const storage = multer.memoryStorage();

// General image upload (5MB, jpg/png/webp)
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
};

export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Payment proof (1MB, jpg/png only)
const paymentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG and PNG images are allowed for payment proof'));
};

export const uploadPayment = multer({
  storage,
  fileFilter: paymentFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});
