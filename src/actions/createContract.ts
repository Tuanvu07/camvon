'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

import { isRedirectError } from 'next/dist/client/components/redirect-error';

export async function createContractAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error('Phiên đăng nhập hết hạn. Vui lòng tải lại trang.');
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const staffName = (session.user as any).name || 'Hệ thống';

    if (!shopId) throw new Error('Không tìm thấy thông tin Cửa hàng. Vui lòng đăng nhập lại.');

    // Trial Bouncer Check
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (shop && shop.plan === 'FREE' && shop.trialEndsAt && new Date() > shop.trialEndsAt) {
      throw new Error('Vui lòng nâng cấp gói cước để tiếp tục.');
    }

    const fullName = formData.get('fullName') as string;
    const cccd = formData.get('cccd') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    
    const assetName = formData.get('assetName') as string;
    const assetType = formData.get('assetType') as string || 'KHAC';
    
    // SỬA LỖI PARSE SỐ TIỀN: Bắt buộc loại bỏ dấu phẩy do người dùng nhập
    const pawningAmountStr = formData.get('pawningAmount') as string;
    const pawningAmount = Number(pawningAmountStr.replace(/[^0-9]/g, ''));
    if (isNaN(pawningAmount) || pawningAmount <= 0) {
      throw new Error('Số tiền giải ngân không hợp lệ. Vui lòng kiểm tra lại.');
    }

    const interestRateValueStr = formData.get('interestRateValue') as string;
    const interestRateValue = parseFloat(interestRateValueStr.replace(/,/g, '.'));
    if (isNaN(interestRateValue) || interestRateValue <= 0) {
      throw new Error('Mức lãi suất không hợp lệ.');
    }

    const interestRateType = formData.get('interestRateType') as string;
    const interestCycle = formData.get('interestCycle') as string;
    const assetImages = formData.get('assetImages') as string || '[]';
    const storageLocation = formData.get('storageLocation') as string || null;
    
    if (!fullName) throw new Error('Thiếu họ tên khách hàng.');

    let newContractId = '';

    await prisma.$transaction(async (tx) => {
      // 1. Find or create customer
      let customer = null;
      if (cccd) {
        customer = await tx.customer.findFirst({ where: { shopId, cccdNumber: cccd } });
      }
      if (!customer && phone) {
        customer = await tx.customer.findFirst({ where: { shopId, phone } });
      }
      
      if (!customer) {
        customer = await tx.customer.create({
          data: { shopId, fullName, cccdNumber: cccd, phone, address }
        });
      }

      // 2. Calculate dates
      const startDate = new Date();
      const nextDate = new Date();
      
      // Default cycle calculations
      if (interestCycle === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (interestCycle === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (interestCycle === 'BIWEEKLY') nextDate.setDate(nextDate.getDate() + 14);
      else if (interestCycle === 'MONTHLY') nextDate.setDate(nextDate.getDate() + 30);
      else nextDate.setDate(nextDate.getDate() + 30);

      // 3. Create Contract
      const contract = await tx.contract.create({
        data: {
          shopId,
          contractCode: `HD-${Date.now()}`,
          customerId: customer.id,
          assetType,
          assetName,
          assetModel: assetName,
          assetImages,
          storageLocation,
          pawningAmount,
          interestRateType,
          interestRateValue,
          interestCycle,
          startDate,
          interestDueDate: nextDate,
          createdByUserId: userId,
          status: 'ACTIVE'
        }
      });

      newContractId = contract.id;

      // 4. Create Transaction (Cash out)
      await tx.transaction.create({
        data: {
          shopId,
          contractId: contract.id,
          userId,
          type: 'PAWN_IN',
          amount: pawningAmount,
          description: 'Giải ngân hợp đồng mới',
          staffName,
          paymentMethod: 'CASH'
        }
      });

      // 5. Update Shop Balance
      await tx.shop.update({
        where: { id: shopId },
        data: { cashBalance: { decrement: pawningAmount } }
      });

      // 6. Ghi Audit Log (Immutable)
      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          contractId: contract.id,
          action: 'CREATE_CONTRACT',
          entity: 'Contract',
          entityId: contract.id,
          oldData: null,
          newData: JSON.stringify({ pawningAmount, interestRateValue, interestCycle })
        }
      });
    });

    return { success: true, contractId: newContractId };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('CREATE_CONTRACT_ERROR:', error);
    return { success: false, error: error.message, stack: error.stack };
  }
}
