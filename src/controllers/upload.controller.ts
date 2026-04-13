import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as uploadService from '../services/upload.service.js';

export const uploadPropertyImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }
    const images = await uploadService.uploadPropertyImages(
      Number(req.params.propertyId),
      req.userId!,
      req.files
    );
    res.status(201).json(images);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deletePropertyImage = async (req: AuthRequest, res: Response) => {
  try {
    await uploadService.deletePropertyImage(Number(req.params.id), req.userId!);
    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};

export const uploadRoomTypeImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }
    const images = await uploadService.uploadRoomTypeImages(
      Number(req.params.roomTypeId),
      req.userId!,
      req.files
    );
    res.status(201).json(images);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deleteRoomTypeImage = async (req: AuthRequest, res: Response) => {
  try {
    await uploadService.deleteRoomTypeImage(Number(req.params.id), req.userId!);
    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
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
};
