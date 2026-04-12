import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware.js';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
