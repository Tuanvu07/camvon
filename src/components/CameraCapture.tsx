'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

export default function CameraCapture() {
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            
            // Giảm kích thước ảnh xuống tối đa 800px để chống tràn RAM/Payload
            const MAX_SIZE = 800;
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
            
            // Nén JPEG chất lượng 0.6 để lấy base64 siêu nhẹ
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
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
      const newImages = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (!file.type.startsWith('image/')) continue;
        const base64 = await processImage(file);
        newImages.push(base64);
      }
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xử lý ảnh. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Input ẩn chứa mảng base64 gửi lên Server Action */}
      <input type="hidden" name="assetImages" value={JSON.stringify(images)} />

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        multiple 
        className="hidden" 
        id="camera-input" 
        ref={fileInputRef}
        onChange={handleCapture}
      />
      
      <label 
        htmlFor="camera-input" 
        className={`flex flex-col items-center justify-center gap-2 w-full py-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isProcessing ? 'bg-slate-100 border-slate-300 text-slate-400 pointer-events-none' : 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100 hover:border-teal-400'}`}
      >
        {isProcessing ? <Loader2 size={36} className="animate-spin" /> : <Camera size={36} />}
        <span className="font-black text-xl">
          {isProcessing ? 'ĐANG XỬ LÝ ẢNH...' : '📷 BẤM ĐỂ CHỤP ẢNH TÀI SẢN'}
        </span>
        <span className="text-sm font-medium opacity-80">Lưu lại bằng chứng tình trạng xe/máy</span>
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {images.map((src, idx) => (
            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
              <img src={src} alt="Asset" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); removeImage(idx); }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
