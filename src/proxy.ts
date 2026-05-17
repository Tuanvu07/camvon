// LendOS - Route Protection Middleware (Proxy)
// Di chuyển từ middleware.ts sang proxy.ts để giải quyết xung đột build trên Vercel
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    try {
      // Token hợp lệ => cho đi tiếp
      return NextResponse.next();
    } catch (error) {
      console.error('[Proxy Middleware Error]', error);
      // Fallback: tiếp tục request để tránh sập toàn hệ thống
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized({ token }) {
        // Trả về true nếu token tồn tại (đã đăng nhập)
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Áp dụng middleware cho tất cả routes bắt đầu với /dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
};
