import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(`[ERROR] ${error.message}`);

  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
  });
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
};
