import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

export default NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        // Return a minimal object; NextAuth will sign a JWT
        return { id: user.id.toString(), email: user.email, name: user.name ?? undefined };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) session.user = { ...session.user, id: token.sub };
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
});