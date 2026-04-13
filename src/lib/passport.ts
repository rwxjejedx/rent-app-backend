import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../lib/prisma.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/v1/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;
        const googleId = profile.id;

        // Determine role from query param passed via state
        const role = (req.query.state as string) === 'tenant' ? 'TENANT' : 'USER';

        if (!email) return done(new Error('No email from Google'), false as any);

        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId }, { email }] },
        });

        if (user) {
          // Update googleId jika login via Google pertama kali
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId, avatar, isVerified: true },
            });
          }
        } else {
          // Register baru via Google
          user = await prisma.user.create({
            data: { email, name, avatar, googleId, role: role as any, isVerified: true },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false as any);
      }
    }
  )
);

export default passport;