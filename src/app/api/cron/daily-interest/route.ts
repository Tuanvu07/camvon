import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Kiểm tra xác thực (Chỉ Vercel Cron mới được gọi hàm này)
    const authHeader = request.headers.get('authorization');
    
    // Nếu biến CRON_SECRET chưa được set, hoặc header không khớp, chặn lại ngay.
    if (
      !process.env.CRON_SECRET || 
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized: Invalid or missing CRON_SECRET', { status: 401 });
    }

    // 2. Thực thi Business Logic: Chuyển trạng thái các hợp đồng đến/qua ngày đóng lãi
    const now = new Date();
    
    const result = await prisma.contract.updateMany({
      where: {
        status: 'ACTIVE',
        interestDueDate: {
          lte: now
        }
      },
      data: {
        status: 'INTEREST_DUE'
      }
    });

    // 3. Trả về báo cáo số lượng hợp đồng bị quá hạn
    return NextResponse.json({
      success: true,
      message: 'Quét tự động thành công.',
      updatedContractsCount: result.count,
      timestamp: now.toISOString()
    });
    
  } catch (error: any) {
    console.error('Lỗi khi chạy Cron Job hàng ngày:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi nội bộ hệ thống.' },
      { status: 500 }
    );
  }
}
