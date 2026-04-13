import 'dotenv/config';
import express, { Request, Response } from 'express';
import './lib/passport.js'; // Pastikan Passport diinisialisasi
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import roomRoutes from './routes/room.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'RentApp API 🚀' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/properties', propertyRoutes);
app.use('/rooms', roomRoutes);
app.use('/bookings', bookingRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
