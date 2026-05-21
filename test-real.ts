import { prisma } from './src/lib/db';

async function run() {
  console.log('--- STARTING REAL E2E TEST ---');
  try {
    const shop = await prisma.shop.create({
      data: {
        name: 'Tiệm Test Real 01',
        ownerName: 'Real Owner',
        cashBalance: 100000000,
        initialCapital: 100000000,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('✅ Created Shop:', shop.id);

    const user = await prisma.user.create({
      data: {
        email: `real.owner.${Date.now()}@test.com`,
        username: `real.owner.${Date.now()}@test.com`,
        name: 'Real Owner',
        passwordHash: 'dummyhash'
      }
    });
    console.log('✅ Created User:', user.id);

    await prisma.shopUser.create({
      data: {
        shopId: shop.id,
        userId: user.id,
        role: 'OWNER',
        isActive: true
      }
    });

    const pawningAmountStr = '5,000,000';
    const pawningAmount = Number(pawningAmountStr.replace(/[^0-9]/g, ''));
    
    const interestRateValueStr = '3,000';
    const interestRateValue = parseFloat(interestRateValueStr.replace(/,/g, '.'));

    const customer = await prisma.customer.create({
      data: { shopId: shop.id, fullName: 'Real Customer', cccdNumber: `079${Date.now()}`, phone: `090${Date.now().toString().slice(-7)}` }
    });

    const contract = await prisma.contract.create({
      data: {
        shopId: shop.id,
        contractCode: 'HD-REAL-' + Date.now(),
        customerId: customer.id,
        assetType: 'XM',
        assetName: 'Xe SH 150i',
        pawningAmount,
        interestRateType: 'PER_MILLION_PER_DAY',
        interestRateValue,
        interestCycle: 'MONTHLY',
        startDate: new Date(),
        interestDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdByUserId: user.id,
        status: 'ACTIVE'
      }
    });
    console.log('✅ Successfully created Real Contract:', contract.contractCode, 'Amount:', contract.pawningAmount);

    console.log('--- TEST PASSED ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
