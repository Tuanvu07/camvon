'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Lock, LogOut } from 'lucide-react';

export default function IdleTimeout() {
  const [isLocked, setIsLocked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mốc thời gian timeout: 10 phút (600,000 ms)
  const TIMEOUT_MS = 600000;

  const handleIdle = useCallback(() => {
    setIsLocked(true);
  }, []);

  const resetTimer = useCallback(() => {
    // Nếu màn hình đã bị khóa thì không cần reset timer nữa
    if (isLocked) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(handleIdle, TIMEOUT_MS);
  }, [handleIdle, isLocked]);

  useEffect(() => {
    // Các sự kiện người dùng tương tác chứng tỏ họ đang ở máy
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // Khởi tạo timer lần đầu tiên
    resetTimer();

    // Gắn listener
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Hàm dọn dẹp chống rò rỉ bộ nhớ (Memory Leak)
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[999] backdrop-blur-2xl bg-slate-900/80 flex flex-col items-center justify-center p-6 animate-fade-in print:hidden">
      <div className="bg-white/10 p-12 rounded-[3rem] border border-white/20 backdrop-blur-md shadow-2xl flex flex-col items-center max-w-2xl text-center">
        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-slate-700">
          <Lock size={64} className="text-slate-300" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          MÀN HÌNH ĐÃ BỊ KHÓA
        </h2>
        
        <p className="text-xl text-slate-300 font-medium mb-12 leading-relaxed">
          Màn hình đã được khóa tự động do không có tương tác trong 10 phút, nhằm bảo vệ tuyệt đối thông tin sổ sách và dòng tiền của cửa hàng.
        </p>

        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full sm:w-auto px-12 py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl uppercase tracking-wider flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-600/30 active:scale-95 border-2 border-blue-500 hover:border-blue-400"
        >
          <LogOut size={32} />
          ĐĂNG NHẬP LẠI
        </button>
      </div>
    </div>
  );
}
