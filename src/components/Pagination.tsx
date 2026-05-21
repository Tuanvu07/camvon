'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const currentPage = Number(searchParams?.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    replace(createPageURL(page));
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-8">
      <button
        className="btn flex items-center justify-center gap-2 px-6 py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed font-black text-lg border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
        disabled={currentPage <= 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft size={24} className="text-blue-600" /> Trang trước
      </button>

      <div className="text-slate-800 font-black text-xl px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
        {currentPage} <span className="text-slate-400 mx-2">/</span> {totalPages}
      </div>

      <button
        className="btn flex items-center justify-center gap-2 px-6 py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed font-black text-lg border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        Trang sau <ChevronRight size={24} className="text-blue-600" />
      </button>
    </div>
  );
}
