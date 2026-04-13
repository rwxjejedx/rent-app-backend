import cron from 'node-cron';
import { cancelExpiredBookings } from '../services/booking.service.js';

// Jalankan setiap 5 menit
export const startCronJobs = () => {
  cron.schedule('*/5 * * * *', async () => {
    await cancelExpiredBookings();
  });

  console.log('[CRON] Auto-cancel job started (every 5 minutes)');
};
