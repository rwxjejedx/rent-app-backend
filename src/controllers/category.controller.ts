import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as categoryService from '../services/category.service.js';

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.userId!, req.body.name);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await categoryService.getMyCategories(req.userId!);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await categoryService.updateCategory(
      Number(req.params.id),
      req.userId!,
      req.body.name
    );
    res.json(category);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    await categoryService.deleteCategory(Number(req.params.id), req.userId!);
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};
