import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber } from './lib/utils';

import authConfig from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email or Mobile Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = (credentials?.email as string)?.trim();
        const password = credentials?.password as string | undefined;

        if (!identifier) {
          throw new Error('Please provide your email or mobile number.');
        }

        await connectToDatabase();

        const isEmail = identifier.includes('@');
        let user;

        if (isEmail) {
          user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
        } else {
          const normalizedPhone = normalizePhoneNumber(identifier);
          if (!normalizedPhone || normalizedPhone.length < 10) {
            throw new Error('Please provide a valid mobile number (e.g. 01XXXXXXXXX).');
          }
          user = await User.findOne({
            $or: [
              { phone: normalizedPhone },
              { email: `${normalizedPhone}@swapnobaz.com` },
              { email: `${normalizedPhone}@store.com` }
            ]
          }).select('+password');
        }

        if (!user) {
          throw new Error('No account found with this ' + (isEmail ? 'email address' : 'mobile number') + '.');
        }

        // If user has a password set, require password validation
        if (user.password) {
          if (!password) {
            throw new Error('Password is required for this account.');
          }
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            throw new Error('Incorrect password. Please try again.');
          }
        }
        // If user has no password set (e.g. auto-created from order), allow direct login!

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // 1. First, apply base logic from authConfig
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
        token.image = user.image || token.picture;
      }

      // 2. Add DB-specific logic
      if (user && user.id) {
        try {
          await connectToDatabase();
          const mongoose = (await import('mongoose')).default;
          
          if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
            const dbUser = await User.findById(user.id);
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role ?? 'user';
              token.phone = dbUser.phone;
              token.image = dbUser.image || user.image || token.picture;
            }
          }
        } catch (error) {
          console.error("JWT DB Enhancement Error:", error);
        }
      }

      if (trigger === 'update') {
        if (session?.name !== undefined) token.name = session.name;
        if (session?.image !== undefined) token.image = session.image;
      }
      
      if (token.email === 'imranshuvo101@gmail.com') {
        token.role = 'super_admin';
      }
      
      return token;
    },
  },
});
