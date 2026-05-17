import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calcAccruedInterest } from '@/lib/math';
import ContractsClient from './ContractsClient';
import type { Contract, Customer } from '@/types';

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const shopId = (session.user as any).shopId as string;

  const contracts = await prisma.contract.findMany({
    where: { shopId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize dates for client component
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

  return <ContractsClient contracts={contractsData} shopId={shopId} />;
}
