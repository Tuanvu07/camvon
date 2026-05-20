'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, ScanFace } from 'lucide-react';

export default function CCCDScanner({ onScan }: { onScan: (data: any) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // OCR processing (Canvas Compression Engine)
  const processImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Giảm kích thước ảnh xuống tối đa 1024px để gửi API siêu tốc
            const MAX_SIZE = 1024;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Nén JPEG chất lượng 70% để đảm bảo < 1MB
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessing(true);
    try {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn ảnh định dạng hợp lệ');
      
      const base64 = await processImage(file);
      
      const res = await fetch('/api/ocr/cccd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
      
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      
      onScan({
        fullName: json.data.name,
        cccd: json.data.cccd,
        address: json.data.address,
        phone: json.data.phone
      });
      
    } catch (err) {
      console.error(err);
      alert('AI bóc tách lỗi. Vui lòng quét lại hoặc nhập tay.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        id="cccd-camera-input" 
        ref={fileInputRef}
        onChange={handleCapture}
      />
      
      <label 
        htmlFor="cccd-camera-input" 
        className="flex flex-col items-center justify-center gap-2 w-full py-8 rounded-2xl border-2 border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all cursor-pointer animate-pulse"
      >
        <ScanFace size={48} className="text-emerald-500 mb-1" />
        <span className="font-black text-2xl text-emerald-800 tracking-tight">
          📸 QUÉT CCCD (AI Tự Động Điền)
        </span>
        <span className="text-sm font-bold opacity-80 text-emerald-600">
          Chỉ 2 giây, không cần gõ phím!
        </span>
      </label>

      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative mb-6">
            <ScanFace size={80} className="text-emerald-400 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent w-full h-1/2 animate-[scan_1.5s_ease-in-out_infinite]" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-wide">🤖 AI Đang Bóc Tách...</h2>
          <p className="text-emerald-300 mt-2 text-lg font-medium">Phân tích đặc điểm CCCD, vui lòng đợi</p>
        </div>
      )}
    </div>
  );
}
