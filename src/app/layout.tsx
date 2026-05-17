import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LendOS - Hệ Điều Hành Tài Chính Vi Mô',
    template: '%s | LendOS',
  },
  description: 'Nền tảng SaaS quản lý cầm đồ và cho vay vi mô hàng đầu Việt Nam. Tối ưu cho người lớn tuổi, tích hợp quét CCCD, in bill K80.',
  keywords: ['cầm đồ', 'cho vay', 'quản lý cầm đồ', 'LendOS', 'phần mềm cầm đồ'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
