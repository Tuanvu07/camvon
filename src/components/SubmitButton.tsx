'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  text: string;
  className?: string;
}

export default function SubmitButton({ text, className = "btn-primary w-full text-2xl py-6" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={`${className} flex items-center justify-center gap-3 transition-all ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {pending ? '⏳ Đang xử lý an toàn...' : text}
    </button>
  );
}
