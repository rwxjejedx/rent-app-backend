import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as availabilityService from '../services/availability.service.js';

export const setRoomAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { dates } = req.body;
    if (!Array.isArray(dates) || dates.length === 0) {
      res.status(400).json({ message: 'dates array is required' });
      return;
    }
    const result = await availabilityService.setRoomAvailability(
      Number(req.params.roomTypeId),
      req.userId!,
      dates
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const getRoomAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const result = await availabilityService.getRoomAvailability(
      Number(req.params.roomTypeId),
      year ? parseInt(year as string) : now.getFullYear(),
      month ? parseInt(month as string) : now.getMonth() + 1
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRoomAvailability = async (req: AuthRequest, res: Response) => {
  try {
    await availabilityService.deleteRoomAvailability(Number(req.params.id), req.userId!);
    res.json({ message: 'Availability deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};
