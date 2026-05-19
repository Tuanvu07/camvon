import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Giả lập hàm gọi API Zalo ZNS / SMS Gateway
async function sendZaloMessage(phone: string | null, customerName: string, amount: number, shopName: string, contractCode: string) {
  if (!phone) return { success: false, error: 'No phone number' };
  
  // Template tin nhắn
  const message = `Kính chào anh/chị ${customerName}, hệ thống ${shopName} xin thông báo hợp đồng ${contractCode} của quý khách đã đến kỳ thanh toán lãi. Vui lòng sắp xếp thanh toán để tránh phí phạt. Trân trọng!`;
  
  console.log(`[Zalo/SMS MOCK] Sending to ${phone}: ${message}`);
  
  // Trong thực tế sẽ dùng fetch() gọi Zalo API tại đây
  // await fetch('https://business.openapi.zalo.me/message/template', { ... })
  
  return { success: true };
}

export async function GET(request: Request) {
  try {
    // 1. Kiểm tra xác thực CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized: Invalid or missing CRON_SECRET', { status: 401 });
    }

    const now = new Date();

    // 2. Lấy danh sách hợp đồng trễ hạn và đã tới ngày nhắc nợ
    const contractsToRemind = await prisma.contract.findMany({
      where: {
        status: 'INTEREST_DUE',
        OR: [
          { nextRemindDate: null },
          { nextRemindDate: { lte: now } }
        ]
      },
      include: {
        customer: true,
        shop: true
      }
    });

    if (contractsToRemind.length === 0) {
      return NextResponse.json({ success: true, message: 'Không có hợp đồng nào cần nhắc nợ hôm nay.', count: 0 });
    }

    // 3. Gửi tin nhắn đồng loạt với Promise.allSettled để tránh đứt gãy
    const results = await Promise.allSettled(
      contractsToRemind.map(async (contract) => {
        // Gửi Zalo/SMS
        const sendResult = await sendZaloMessage(
          contract.customer.phone, 
          contract.customer.fullName, 
          contract.pawningAmount, // Hoặc số tiền lãi cần đóng
          contract.shop.name,
          contract.contractCode
        );

        if (sendResult.success) {
          // Cộng thêm 3 ngày cho lần nhắc nợ tiếp theo
          const nextRemind = new Date();
          nextRemind.setDate(nextRemind.getDate() + 3);

          await prisma.contract.update({
            where: { id: contract.id },
            data: { nextRemindDate: nextRemind }
          });
        }
        
        return { contractId: contract.id, status: sendResult.success ? 'Sent' : 'Failed' };
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'Sent').length;

    return NextResponse.json({
      success: true,
      message: 'Đã hoàn tất tiến trình nhắc nợ.',
      totalProcessed: contractsToRemind.length,
      successCount
    });

  } catch (error: any) {
    console.error('Lỗi khi chạy Cron Nhắc nợ:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi nội bộ hệ thống.' }, { status: 500 });
  }
}
