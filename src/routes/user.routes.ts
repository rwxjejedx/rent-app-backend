import { Router, Response } from 'express';
import { authenticateToken,authorizeRole, AuthRequest } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/user.validation.js';
import * as userService from '../services/user.service.js';
import * as uploadService from '../services/upload.service.js';

const router = Router();

// Get profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getProfile(req.userId!);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

// Update profile
router.put('/me', authenticateToken, validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.updateProfile(req.userId!, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Change password
router.put('/me/password', authenticateToken, validate(changePasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.userId!, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Upload avatar
router.post('/me/avatar', authenticateToken, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const user = await uploadService.uploadAvatar(req.userId!, req.file);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete avatar
router.delete('/me/avatar', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.deleteAvatar(req.userId!);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update tenant profile
router.put('/me/tenant-profile', authenticateToken, authorizeRole('TENANT'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.updateTenantProfile(req.userId!, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
