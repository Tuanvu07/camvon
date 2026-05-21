import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ContractsClient from './ContractsClient';
import Search from '@/components/Search';
import Pagination from '@/components/Pagination';
import { Plus, Download, Zap } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ContractsPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const shopId = (session.user as any).shopId as string;
  
  // URL-driven Parameters
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 20; // Trải nghiệm vuốt 20 dòng là lý tưởng

  // Server-Side Search Engine Clause
  const whereClause: any = { shopId };
  
  if (query) {
    whereClause.OR = [
      { contractCode: { contains: query, mode: 'insensitive' } },
      { customer: { fullName: { contains: query, mode: 'insensitive' } } },
      { customer: { phone: { contains: query, mode: 'insensitive' } } },
      { customer: { cccdNumber: { contains: query, mode: 'insensitive' } } },
      { assetPlate: { contains: query, mode: 'insensitive' } },
      { storageLocation: { contains: query, mode: 'insensitive' } },
    ];
  }

  // O(1) Load Time - Parralel DB Queries
  const [totalCount, contracts] = await Promise.all([
    prisma.contract.count({ where: whereClause }),
    prisma.contract.findMany({
      where: whereClause,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    })
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Serialize dates for client boundaries
  const contractsData = contracts.map(c => ({
    ...c,
    startDate: c.startDate.toISOString(),
    dueDate: c.dueDate?.toISOString() ?? null,
    interestDueDate: c.interestDueDate?.toISOString() ?? null,
    lastPaymentDate: c.lastPaymentDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    customer: {
      ...c.customer,
      createdAt: c.customer.createdAt.toISOString(),
      updatedAt: c.customer.updatedAt.toISOString(),
    },
  }));

  const totalPawned = contracts.reduce((acc, curr) => acc + curr.pawningAmount, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Quản lý hợp đồng 
            <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1 shadow-sm">
              <Zap size={14} className="fill-blue-500" /> Siêu Tốc
            </span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Server-Side Search & Pagination v2.0</p>
        </div>
        <div className="flex gap-3">
          <button className="btn bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-black shadow-sm px-6 py-3 rounded-2xl flex items-center gap-2 transition-all">
            <Download size={20} className="text-blue-500" /> Xuất Excel
          </button>
          <Link href="/dashboard/contracts/creation" className="btn bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 text-white font-black shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] px-6 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95">
            <Plus size={24} /> Tạo Mới
          </Link>
        </div>
      </div>

      {/* URL-driven Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4">
        <Search placeholder="🔍 Nhập Tên KH, SĐT, CCCD, Mã HĐ, Biển Số Xe, hoặc Tên Tủ/Kệ để tìm tức thì..." />
        <div className="shrink-0 text-slate-400 font-bold px-4">
          Tìm thấy <span className="text-blue-600 text-xl">{totalCount}</span> kết quả
        </div>
      </div>

      {/* Render Data Table */}
      <ContractsClient 
        contracts={contractsData} 
        shopId={shopId} 
        totalCount={totalCount} 
        totalPawned={totalPawned} 
      />
      
      {/* URL-driven Pagination */}
      <Pagination totalPages={totalPages} />
    </div>
  );
}
