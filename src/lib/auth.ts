import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne } from './db';

export type Role = 'admin' | 'doctor' | 'patient';

interface UserRow {
  user_id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;
        const user = await queryOne<UserRow>(
          'SELECT user_id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
          [email],
        );
        // Compare against a dummy hash when the user is unknown so response time
        // doesn't reveal which emails exist.
        const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
        if (!user || !ok || !user.is_active) return null;
        return { id: String(user.user_id), email: user.email, name: user.full_name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = Number(user.id);
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      return session;
    },
  },
};
