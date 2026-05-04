import prisma from '../lib/prisma.js';

/**
 * --- PUBLIC SERVICES ---
 * Bisa diakses oleh siapa saja (Tanpa tenantId)
 */

// Mengambil semua kategori (untuk filter di halaman Home)
export const getAllCategories = async () => {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { properties: true }
      }
    },
    orderBy: { name: 'asc' },
  });
};

// Mengambil satu kategori berdasarkan ID
export const getCategoryById = async (id: number) => {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { properties: true }
      }
    },
  });
};

/**
 * --- TENANT SERVICES ---
 * Membutuhkan validasi tenantId (Private)
 */

export const createCategory = async (tenantId: number, name: string) => {
  const existing = await prisma.category.findUnique({
    where: { name_tenantId: { name, tenantId } },
  });

  if (existing) throw new Error('Category with this name already exists');

  return prisma.category.create({
    data: { name, tenantId },
  });
};

export const getMyCategories = async (tenantId: number) => {
  return prisma.category.findMany({
    where: { tenantId },
    include: { _count: { select: { properties: true } } },
    orderBy: { name: 'asc' },
  });
};

export const updateCategory = async (id: number, tenantId: number, name: string) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) throw new Error('Category not found');
  if (category.tenantId !== tenantId) throw new Error('Forbidden');

  const existing = await prisma.category.findUnique({
    where: { name_tenantId: { name, tenantId } },
  });

  if (existing && existing.id !== id) throw new Error('Category with this name already exists');

  return prisma.category.update({
    where: { id },
    data: { name }
  });
};

export const deleteCategory = async (id: number, tenantId: number) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { properties: true } } },
  });

  if (!category) throw new Error('Category not found');
  if (category.tenantId !== tenantId) throw new Error('Forbidden');

  if (category._count.properties > 0) {
    throw new Error('Cannot delete category that has properties. Remove properties first.');
  }

  return prisma.category.delete({ where: { id } });
};