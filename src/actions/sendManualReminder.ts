'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function sendManualReminder(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
    
    const shopId = (session.user as any).shopId;
    const contractId = formData.get('contractId') as string;
    
    if (!contractId) throw new Error('Không tìm thấy ID Hợp đồng');

    const contract = await prisma.contract.findUnique({
      where: { id: contractId, shopId },
      include: { customer: true, shop: true }
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại');
    if (!contract.customer.phone) throw new Error('Khách hàng chưa cung cấp số điện thoại');

    // Template tin nhắn
    const message = `Kính chào anh/chị ${contract.customer.fullName}, hệ thống ${contract.shop.name} xin thông báo hợp đồng ${contract.contractCode} của quý khách đã đến kỳ thanh toán lãi. Vui lòng sắp xếp thanh toán để tránh phí phạt. Trân trọng!`;
    
    console.log(`[MANUAL ZALO/SMS] Gửi tới ${contract.customer.phone}: ${message}`);
    // Thực tế: fetch gọi Zalo ZNS / SMS API ở đây

    // Cập nhật ngày nhắc nợ tiếp theo (+3 ngày)
    const nextRemind = new Date();
    nextRemind.setDate(nextRemind.getDate() + 3);

    await prisma.contract.update({
      where: { id: contractId },
      data: { nextRemindDate: nextRemind }
    });

    revalidatePath('/dashboard/contracts');
    revalidatePath('/dashboard/installments');
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
