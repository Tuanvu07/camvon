'use client';

import { Printer } from 'lucide-react';
import { setPrintDataEvent, type PrintReceiptData } from './PrintReceipt';

interface PrintButtonProps {
  data: PrintReceiptData;
  className?: string;
  showText?: boolean;
}

export default function PrintButton({ data, className, showText = false }: PrintButtonProps) {
  const handlePrint = () => {
    const event = new CustomEvent(setPrintDataEvent, { detail: data });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={handlePrint}
      title="In biên lai"
      className={className || "btn-icon text-slate-500 hover:bg-slate-100"}
    >
      <Printer size={showText ? 16 : 14} />
      {showText && <span className="ml-2 font-semibold">In Biên Lai</span>}
    </button>
  );
}
