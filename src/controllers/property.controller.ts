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
    const { city, checkIn, checkOut, sort } = req.query;
    const properties = await propertyService.getAllProperties(
      city as string,
      checkIn as string,
      checkOut as string,
      sort as string
    );
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

export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await propertyService.updateProperty(Number(req.params.id), req.body, req.userId!);
    res.json(property);
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    await propertyService.deleteProperty(Number(req.params.id), req.userId!);
    res.json({ message: 'Property deleted successfully' });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : 404;
    res.status(status).json({ message: error.message });
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
