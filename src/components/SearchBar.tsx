'use client';

import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// Custom hook cho việc debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBar({ placeholder = "Tìm kiếm..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams?.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    // Khi giá trị debounced thay đổi, đẩy lên URL params
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    } else {
      params.delete('q');
    }
    
    // Sử dụng router.replace để không tạo ra đống lịch sử back phiền phức
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedQuery, pathname, router, searchParams]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="input pl-12 py-3 md:py-4 text-lg font-medium shadow-sm w-full"
        autoComplete="off"
      />
      <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
