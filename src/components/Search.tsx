'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('query') || '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(searchParams?.get('query') || '');
  }, [searchParams]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('page', '1'); // Reset page on new search
      if (term) {
        params.set('query', term);
      } else {
        params.delete('query');
      }
      replace(`${pathname}?${params.toString()}`);
    }, 300);
  };

  return (
    <div className="relative flex-1 w-full max-w-xl">
      <input
        type="text"
        className="input pl-12 py-4 text-lg font-bold rounded-2xl border-2 border-slate-200 focus:border-blue-500 w-full shadow-sm placeholder:text-slate-400 placeholder:font-medium"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <SearchIcon size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
    </div>
  );
}
