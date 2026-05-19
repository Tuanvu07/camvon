'use client';

import { formatCurrency } from '@/lib/utils';
import { formatVNDate } from '@/lib/timezone';
import { useEffect, useState } from 'react';

export interface PrintReceiptData {
  shopName: string;
  transactionId: string;
  date: Date;
  typeLabel: string;
  amount: number;
  contractCode?: string;
  customerName?: string;
  staffName: string;
  note?: string;
}

// Global state or event to trigger print data update
export const setPrintDataEvent = 'LENDOS_SET_PRINT_DATA';

export default function PrintReceipt() {
  const [data, setData] = useState<PrintReceiptData | null>(null);

  useEffect(() => {
    const handleSetData = (e: any) => {
      setData(e.detail);
      // Wait for React to render the component, then trigger print
      setTimeout(() => {
        window.print();
      }, 100);
    };

    window.addEventListener(setPrintDataEvent, handleSetData);
    return () => window.removeEventListener(setPrintDataEvent, handleSetData);
  }, []);

  if (!data) return null;

  // Determine receipt title
  let title = 'BIÊN LAI GIAO DỊCH';
  if (data.typeLabel.toLowerCase().includes('lãi')) {
    title = 'PHIẾU THU LÃI GIA HẠN';
  } else if (data.typeLabel.toLowerCase().includes('chuộc')) {
    title = 'PHIẾU CHUỘC ĐỒ (TẤT TOÁN)';
  } else if (data.typeLabel.toLowerCase().includes('giải ngân')) {
    title = 'PHIẾU GIẢI NGÂN';
  }

  return (
    <div className="hidden print:block print:w-[80mm] print:text-black print:bg-white text-sm font-mono mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <h1 className="text-xl font-bold uppercase">{data.shopName}</h1>
        <div className="text-sm font-bold uppercase">{title}</div>
        <div className="text-xs mt-1">Mã GD: {data.transactionId.slice(-8).toUpperCase()}</div>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-3 text-sm">
        <div className="flex justify-between">
          <span>Ngày:</span>
          <span className="font-bold">{formatVNDate(data.date)}</span>
        </div>
        <div className="flex justify-between">
          <span>Hợp đồng:</span>
          <span className="font-bold">{data.contractCode || '--'}</span>
        </div>
        <div className="flex justify-between">
          <span>Khách hàng:</span>
          <span className="font-bold">{data.customerName || '--'}</span>
        </div>
        <div className="flex justify-between">
          <span>Nhân viên:</span>
          <span className="font-bold">{data.staffName}</span>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="border-t border-black pt-2 mb-3">
        <div className="text-sm mb-1">{data.typeLabel}</div>
        <div className="text-xl font-bold text-right border-b border-black pb-2">
          {formatCurrency(data.amount)}
        </div>
        {data.note && (
          <div className="text-xs mt-2 italic">Ghi chú: {data.note}</div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm mt-4">
        <div>Khách hàng ký nhận</div>
        <div className="h-16"></div>
        <div className="text-xs italic font-bold">Cảm ơn quý khách đã sử dụng dịch vụ!</div>
      </div>
    </div>
  );
}
