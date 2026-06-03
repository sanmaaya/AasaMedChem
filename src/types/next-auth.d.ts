import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'seller' | 'buyer';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'admin' | 'seller' | 'buyer';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'admin' | 'seller' | 'buyer';
  }
}
