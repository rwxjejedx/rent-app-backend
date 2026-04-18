import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware.js';
import * as notificationService from '../services/notification.service.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await notificationService.getNotifications(req.userId!);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/unread-count', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAsRead(Number(req.params.id), req.userId!);
    res.json({ message: 'Marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ message: 'All marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
