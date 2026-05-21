'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function createContractAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  
  const shopId = (session.user as any).shopId;
  const userId = (session.user as any).id;
  const staffName = (session.user as any).name;

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
  const pawningAmount = parseFloat(formData.get('pawningAmount') as string);
  const interestRateValue = parseFloat(formData.get('interestRateValue') as string);
  const interestRateType = formData.get('interestRateType') as string;
  const interestCycle = formData.get('interestCycle') as string;
  const assetImages = formData.get('assetImages') as string || '[]';
  const storageLocation = formData.get('storageLocation') as string || null;
  
  if (!fullName || !pawningAmount) throw new Error('Thiếu thông tin quan trọng');

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
  });

  redirect(`/dashboard/contracts/${newContractId}`);
}
