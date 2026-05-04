import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as categoryService from '../services/category.service.js';

/**
 * --- PUBLIC CONTROLLERS ---
 */

// Mengambil SEMUA kategori untuk halaman publik (Home/Index)
export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    // Pastikan Anda membuat fungsi getAllCategories di categoryService
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mengambil detail kategori berdasarkan ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(Number(req.params.id));
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * --- PRIVATE CONTROLLERS (TENANT) ---
 */

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