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
  contractId?: string;
  contractCode?: string;
  customerName?: string;
  staffName: string;
  note?: string;
  assetName?: string;
  storageLocation?: string | null;
}

export const setPrintDataEvent = 'LENDOS_SET_PRINT_DATA';

export default function PrintReceipt() {
  const [data, setData] = useState<PrintReceiptData | null>(null);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);
    const handleSetData = (e: any) => {
      setData(e.detail);
      // Wait for React to render the component and images to load, then trigger print
      setTimeout(() => {
        window.print();
      }, 500);
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
  } else if (data.typeLabel.toLowerCase().includes('bớt gốc')) {
    title = 'PHIẾU THU BỚT GỐC';
  }

  return (
    <div className="hidden print:block print:w-[80mm] print:text-black print:bg-white text-sm font-mono mx-auto pb-4">
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
        
        {title === 'PHIẾU THU BỚT GỐC' && data.note ? (
          <div className="mt-2 pt-2 border-t border-dashed border-black">
            <div className="text-xs italic font-bold">Chi tiết hợp đồng:</div>
            <div className="text-xs mt-1">{data.note}</div>
          </div>
        ) : (
          data.note && <div className="text-xs mt-2 italic">Ghi chú: {data.note}</div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm mt-4">
        <div>Khách hàng ký nhận</div>
        <div className="h-16"></div>
        <div className="text-xs italic font-bold">Cảm ơn quý khách đã sử dụng dịch vụ!</div>
      </div>

      {/* K80 Mini QR Tag (Smart Asset Tag) */}
      {(data.contractId || data.storageLocation) && (
        <div className="mt-8 border-t-[3px] border-dashed border-black pt-6 text-center" style={{ pageBreakInside: 'avoid' }}>
          <div className="text-[10px] font-bold uppercase mb-2 tracking-widest border border-black inline-block px-2 py-0.5 rounded-full">
            ✂️ Tem Nhãn Tài Sản ✂️
          </div>
          
          <div className="mt-2 text-3xl font-black uppercase leading-tight border-4 border-black py-3 rounded-lg text-black bg-white print:color-adjust-exact">
            {data.storageLocation || 'CHƯA LƯU KHO'}
          </div>

          <div className="mt-3 text-sm font-bold truncate">
            {data.assetName || 'Tài sản cầm cố'}
          </div>
          <div className="text-xs font-bold mb-3">{data.contractCode}</div>

          {data.contractId && (
            <div className="flex justify-center">
              {/* Force image loading without Next Image for pure print compatibility */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${appUrl}/dashboard/contracts/${data.contractId}`)}&margin=10`} 
                alt="QR Code" 
                className="w-40 h-40 object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}
          
          <div className="text-[10px] mt-2 italic font-bold">Quét mã QR để xem chi tiết hợp đồng</div>
        </div>
      )}
    </div>
  );
}
