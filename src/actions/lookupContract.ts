'use server';

import { prisma } from '@/lib/db';
import { calcAccruedInterest } from '@/lib/math';

export async function lookupContract(formData: FormData) {
  try {
    const phone = formData.get('phone') as string;
    const cccd = formData.get('cccd') as string;

    if (!phone || !cccd) {
      throw new Error('Vui lòng nhập đầy đủ Số điện thoại và CCCD.');
    }

    const customer = await prisma.customer.findFirst({
      where: {
        phone,
        cccdNumber: cccd,
      },
      include: {
        contracts: {
          where: {
            status: {
              in: ['ACTIVE', 'INTEREST_DUE']
            }
          }
        }
      }
    });

    if (!customer || customer.contracts.length === 0) {
      throw new Error('Không tìm thấy khoản vay nào đang hoạt động với thông tin này.');
    }

    // Bảo mật: Chỉ trả về thông tin tối thiểu cần thiết cho khách hàng
    const results = customer.contracts.map(contract => {
      const accrued = calcAccruedInterest(
        contract.pawningAmount,
        contract.interestRateType as any,
        contract.interestRateValue,
        contract.interestCycle as any,
        new Date(contract.startDate)
      );

      const interestAmount = Math.max(0, accrued - contract.totalInterestPaid);
      const totalAmount = contract.pawningAmount + interestAmount;

      return {
        id: contract.id,
        contractCode: contract.contractCode,
        assetName: [contract.assetBrand, contract.assetModel, contract.assetPlate].filter(Boolean).join(' ') || contract.assetType,
        pawningAmount: contract.pawningAmount,
        interestDueDate: contract.interestDueDate || contract.startDate,
        interestAmount: interestAmount,
        totalAmount: totalAmount,
        status: contract.status,
      };
    });

    return { success: true, contracts: results };
  } catch (error: any) {
    return { error: error.message };
  }
}
