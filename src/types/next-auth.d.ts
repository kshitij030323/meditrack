import type { DefaultSession } from 'next-auth';

type Role = 'admin' | 'doctor' | 'patient';

declare module 'next-auth' {
  interface User {
    role: Role;
  }
  interface Session {
    user: DefaultSession['user'] & { id: number; role: Role; name: string; email: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: number;
    role: Role;
  }
}
