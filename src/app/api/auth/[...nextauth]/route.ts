// LendOS - NextAuth Configuration
// Sử dụng CredentialsProvider, xác thực bằng username hoặc email + bcrypt
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        // Hỗ trợ login bằng email HOẶC username
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Tìm user theo username hoặc email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username },
              { email: credentials.username },
            ],
          },
          include: {
            shops: {
              where: { isActive: true },
              include: { shop: true },
              orderBy: { shop: { createdAt: 'asc' } },
              take: 1,
            },
          },
        });

        if (!user) return null;

        // So sánh mật khẩu bằng bcrypt
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        const shopUser = user.shops[0];
        if (!shopUser) return null;

        return {
          id:       user.id,
          email:    user.email,
          name:     user.name ?? user.username,
          shopId:   shopUser.shopId,
          shopName: shopUser.shop.name,
          role:     shopUser.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.shopId   = (user as any).shopId;
        token.shopName = (user as any).shopName;
        token.role     = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id       = token.id;
        (session.user as any).shopId   = token.shopId;
        (session.user as any).shopName = token.shopName;
        (session.user as any).role     = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
