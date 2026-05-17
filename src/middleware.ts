// LendOS - Route Protection Middleware
// Chặn toàn bộ /dashboard/* nếu không có JWT session hợp lệ
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Token hợp lệ => cho đi tiếp
    return NextResponse.next();
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
