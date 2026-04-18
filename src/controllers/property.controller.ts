import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as propertyService from '../services/property.service.js';

export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await propertyService.createProperty(req.body, req.userId!);
    res.status(201).json(property);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllProperties = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await propertyService.getAllProperties(req.query as any);
    res.json(properties);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPropertyById = async (req: AuthRequest, res: Response) => {
  try {
    const { checkIn, checkOut } = req.query;
    const property = await propertyService.getPropertyById(
      Number(req.params.id),
      checkIn as string,
      checkOut as string
    );
    res.json(property);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getPropertyCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const calendar = await propertyService.getPropertyCalendar(
      Number(req.params.id),
      year ? parseInt(year as string) : now.getFullYear(),
      month ? parseInt(month as string) : now.getMonth() + 1
    );
    res.json(calendar);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await propertyService.updateProperty(Number(req.params.id), req.body, req.userId!);
    res.json(property);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    await propertyService.deleteProperty(Number(req.params.id), req.userId!);
    res.json({ message: 'Property deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 404).json({ message: error.message });
  }
};

export const getMyProperties = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await propertyService.getMyProperties(req.userId!);
    res.json(properties);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const calculateBookingPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { roomTypeId, checkIn, checkOut } = req.query;
    if (!roomTypeId || !checkIn || !checkOut) {
      res.status(400).json({ message: 'roomTypeId, checkIn, checkOut are required' });
      return;
    }
    const result = await propertyService.calculateBookingPrice(
      Number(roomTypeId),
      checkIn as string,
      checkOut as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
