import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body;
    const result = await authService.register(email, name, role ?? 'USER');
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const handleEmailClick = (req: Request, res: Response) => {
  const { token, role } = req.query;
  // Redirect ke halaman Set Password di React kamu (Vite port 5173)
  res.redirect(`${process.env.FRONTEND_URL}/set-password?token=${token}&role=${role}`);
};

export const verifyAndSetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ message: 'Token and password are required' });
      return;
    }
    const result = await authService.verifyAndSetPassword(token, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerification(email);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { token } = authService.generateJwtForUser(user);
    // Redirect ke frontend dengan token
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&role=${user.role}`);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
