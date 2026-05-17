// LendOS - Database Seed Script
// Khởi tạo dữ liệu ban đầu: Shop, Admin User, Asset Categories, Interest Packages
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding LendOS database...');

  // ─────────────────────────────────────────────────
  // 1. Tạo / cập nhật Shop "Cầm đồ Hoà Phát"
  // ─────────────────────────────────────────────────
  const SHOP_ID = 'shop_hoaphat_01';
  const shop = await prisma.shop.upsert({
    where:  { id: SHOP_ID },
    update: {},
    create: {
      id:             SHOP_ID,
      name:           'Cầm đồ Hoà Phát',
      phone:          '0333975969',
      address:        '745 Hà Huy Giáp, Thới An, TPHCM',
      ownerName:      'Hoà Phát',
      initialCapital: 2_000_000_000,   // 2 tỷ vốn đầu tư
      cashBalance:    1_429_028_617,   // Quỹ tiền mặt hiện tại
      printTemplate:  'K80',
      timezone:       'Asia/Ho_Chi_Minh',
      currency:       'VND',
    },
  });
  console.log(`✅ Shop: ${shop.name} (id: ${shop.id})`);

  // ─────────────────────────────────────────────────
  // 2. Tạo / cập nhật tài khoản Admin
  //    username: hoaphat745 | password: 123456
  // ─────────────────────────────────────────────────
  const passwordHash = bcrypt.hashSync('123456', 12);

  const user = await prisma.user.upsert({
    where:  { username: 'hoaphat745' },
    update: {},
    create: {
      email:        'admin@hoaphat.vn',
      username:     'hoaphat745',
      name:         'Admin Hoà Phát',
      phone:        '0333975969',
      passwordHash,
    },
  });
  console.log(`✅ User: ${user.username} (${user.email}) / pass: 123456`);

  // ─────────────────────────────────────────────────
  // 3. Gắn User vào Shop với quyền OWNER
  // ─────────────────────────────────────────────────
  await prisma.shopUser.upsert({
    where:  { shopId_userId: { shopId: shop.id, userId: user.id } },
    update: {},
    create: {
      shopId:   shop.id,
      userId:   user.id,
      role:     'OWNER',
      isActive: true,
    },
  });
  console.log('✅ ShopUser: OWNER gắn thành công');

  // ─────────────────────────────────────────────────
  // 4. Tạo danh mục tài sản mặc định
  // ─────────────────────────────────────────────────
  const categories = [
    { code: 'XM',   name: 'Xe máy',     interestRate: 3000,  interestCycle: 'WEEKLY',  liquidationAfter: 10 },
    { code: 'OTO',  name: 'Ô tô',        interestRate: 3000,  interestCycle: 'WEEKLY',  liquidationAfter: 10 },
    { code: 'DT',   name: 'Điện thoại',  interestRate: 3000,  interestCycle: 'WEEKLY',  liquidationAfter: 10 },
    { code: 'LT',   name: 'Laptop',      interestRate: 3000,  interestCycle: 'WEEKLY',  liquidationAfter: 10 },
    { code: 'VANG', name: 'Vàng',        interestRate: 3000,  interestCycle: 'WEEKLY',  liquidationAfter: 10 },
    { code: 'GT',   name: 'CC/DK/BL',   interestRate: 0,     interestCycle: 'WEEKLY',  liquidationAfter: 7  },
    { code: 'KHAC', name: 'Khác',        interestRate: 3000,  interestCycle: 'WEEKLY',  liquidationAfter: 10 },
  ];

  for (const cat of categories) {
    const catId = `cat_${cat.code.toLowerCase()}_${shop.id}`;
    await prisma.assetCategory.upsert({
      where:  { id: catId },
      update: {},
      create: { id: catId, shopId: shop.id, ...cat, isActive: true },
    });
  }
  console.log(`✅ Asset categories: ${categories.length} danh mục tạo/cập nhật`);

  // ─────────────────────────────────────────────────
  // 5. Tạo gói lãi suất mặc định
  // ─────────────────────────────────────────────────
  const packages = [
    { name: '8k/tuần (1tr)',     rateType: 'FIXED_PER_WEEK',      rateValue: 8000,   cycle: 'WEEKLY',  isDefault: false },
    { name: '15k/tuần',          rateType: 'FIXED_PER_WEEK',      rateValue: 15000,  cycle: 'WEEKLY',  isDefault: false },
    { name: '35k/tuần',          rateType: 'FIXED_PER_WEEK',      rateValue: 35000,  cycle: 'WEEKLY',  isDefault: false },
    { name: '50k/tuần',          rateType: 'FIXED_PER_WEEK',      rateValue: 50000,  cycle: 'WEEKLY',  isDefault: false },
    { name: '100k/tuần',         rateType: 'FIXED_PER_WEEK',      rateValue: 100000, cycle: 'WEEKLY',  isDefault: false },
    { name: '150k/tuần',         rateType: 'FIXED_PER_WEEK',      rateValue: 150000, cycle: 'WEEKLY',  isDefault: false },
    { name: '300k/tuần',         rateType: 'FIXED_PER_WEEK',      rateValue: 300000, cycle: 'WEEKLY',  isDefault: false },
    { name: '3k/triệu/ngày',    rateType: 'PER_MILLION_PER_DAY', rateValue: 3000,   cycle: 'DAILY',   isDefault: true  },
    { name: '6%/tháng',          rateType: 'PERCENT_PER_MONTH',   rateValue: 6,      cycle: 'MONTHLY', isDefault: false },
    { name: '7%/tháng',          rateType: 'PERCENT_PER_MONTH',   rateValue: 7,      cycle: 'MONTHLY', isDefault: false },
    { name: '2.5%/tháng',        rateType: 'PERCENT_PER_MONTH',   rateValue: 2.5,    cycle: 'MONTHLY', isDefault: false },
  ];

  for (const pkg of packages) {
    // Dùng findFirst để tránh duplicate
    const exists = await prisma.interestPackage.findFirst({
      where: { shopId: shop.id, name: pkg.name },
    });
    if (!exists) {
      await prisma.interestPackage.create({
        data: { shopId: shop.id, ...pkg, isActive: true },
      });
    }
  }
  console.log(`✅ Interest packages: ${packages.length} gói lãi suất tạo/bỏ qua trùng lặp`);

  // ─────────────────────────────────────────────────
  console.log('\n🎉 Seeding hoàn tất!');
  console.log(`   Login: hoaphat745 / 123456`);
  console.log(`   Hoặc:  admin@hoaphat.vn / 123456`);
  console.log(`   Shop ID: ${shop.id}`);
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
