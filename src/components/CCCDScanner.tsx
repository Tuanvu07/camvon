'use client';

import { useState } from 'react';
import { Camera, QrCode } from 'lucide-react';
import Script from 'next/script';

export default function CCCDScanner({ onScan }: { onScan: (data: any) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerHtml5, setScannerHtml5] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');

  const parseCCCD = (text: string) => {
    // Định dạng CCCD: Số CCCD|CMND cũ|Họ Tên|Ngày Sinh|Giới Tính|Địa Chỉ|Ngày Cấp
    const parts = text.split('|');
    if (parts.length >= 6) {
      onScan({
        cccd: parts[0],
        oldId: parts[1],
        fullName: parts[2],
        dob: parts[3],
        gender: parts[4],
        address: parts[5]
      });
      setIsScanning(false);
      setInputValue('');
      if (scannerHtml5) {
        scannerHtml5.stop().catch(console.error);
      }
    }
  };

  const startCamera = () => {
    if (!(window as any).Html5QrcodeScanner) {
      alert("Thư viện quét mã đang tải, vui lòng thử lại sau vài giây.");
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      const scanner = new (window as any).Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      setScannerHtml5(scanner);
      scanner.render(
        (text: string) => parseCCCD(text),
        (err: any) => { /* ignore normal errors */ }
      );
    }, 100);
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <Script src="https://unpkg.com/html5-qrcode" strategy="lazyOnload" />
      
      {!isScanning ? (
        <div className="flex flex-col gap-4">
          <button 
            onClick={startCamera} 
            type="button" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl flex items-center justify-center gap-3 text-xl font-black shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            <Camera size={32} />
            BẬT CAMERA QUÉT QR
          </button>
          
          <div className="relative mt-2">
            <input 
              type="text"
              autoFocus
              placeholder="Hoặc trỏ chuột vào đây và bấm máy quét mã vạch USB..."
              className="w-full p-4 text-center rounded-xl border-2 border-slate-300 bg-white font-medium focus:border-blue-500 focus:outline-none"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.includes('|')) parseCCCD(e.target.value);
              }}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <QrCode size={20} />
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div id="reader" className="w-full bg-black rounded-xl overflow-hidden shadow-inner"></div>
          <button 
            type="button" 
            onClick={() => {
              if (scannerHtml5) scannerHtml5.clear();
              setIsScanning(false);
            }} 
            className="w-full btn btn-outline mt-4 font-bold text-lg"
          >
            Hủy quét
          </button>
        </div>
      )}
    </div>
  );
}
