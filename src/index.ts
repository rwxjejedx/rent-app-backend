import 'dotenv/config';
import express, { Request, Response } from 'express';
import './lib/passport.js';
import { startCronJobs } from './lib/cron.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import roomRoutes from './routes/room.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import categoryRoutes from './routes/category.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
const API_PREFIX = '/api/v1';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'RentApp API 🚀', version: 'v1' });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/properties`, propertyRoutes);
app.use(`${API_PREFIX}/rooms`, roomRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/availability`, availabilityRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}${API_PREFIX}`);
  startCronJobs();
});

export default app;