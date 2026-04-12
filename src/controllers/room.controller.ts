import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as roomService from '../services/room.service.js';

export const createRoomType = async (req: AuthRequest, res: Response) => {
  try {
    const roomType = await roomService.createRoomType(Number(req.params.propertyId), req.userId!, req.body);
    res.status(201).json(roomType);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const updateRoomType = async (req: AuthRequest, res: Response) => {
  try {
    const roomType = await roomService.updateRoomType(Number(req.params.id), req.userId!, req.body);
    res.json(roomType);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deleteRoomType = async (req: AuthRequest, res: Response) => {
  try {
    await roomService.deleteRoomType(Number(req.params.id), req.userId!);
    res.json({ message: 'Room type deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};

export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await roomService.createRoom(Number(req.params.roomTypeId), req.userId!, req.body.number);
    res.status(201).json(room);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    await roomService.deleteRoom(Number(req.params.id), req.userId!);
    res.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};

export const createPeakRate = async (req: AuthRequest, res: Response) => {
  try {
    const peakRate = await roomService.createPeakRate(Number(req.params.roomTypeId), req.userId!, req.body);
    res.status(201).json(peakRate);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deletePeakRate = async (req: AuthRequest, res: Response) => {
  try {
    await roomService.deletePeakRate(Number(req.params.id), req.userId!);
    res.json({ message: 'Peak rate deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};

export const getPeakRates = async (req: AuthRequest, res: Response) => {
  try {
    const peakRates = await roomService.getPeakRates(Number(req.params.roomTypeId));
    res.json(peakRates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
