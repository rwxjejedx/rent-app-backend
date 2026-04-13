import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, verifySchema } from '../validations/auth.validation.js';

const router = Router();

// Email auth
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify', validate(verifySchema), authController.verifyAndSetPassword);
router.post('/resend-verification', authController.resendVerification);
router.post('/login', validate(loginSchema), authController.login);

// Google OAuth — state param menentukan role (user/tenant)
router.get('/google', (req, res, next) => {
  const role = req.query.role ?? 'user';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role as string,
  })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
  authController.googleCallback
);

export default router;
