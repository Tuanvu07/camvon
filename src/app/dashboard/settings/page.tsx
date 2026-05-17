import { Construction } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title text-3xl font-black text-slate-800">Cài đặt Hệ thống</h1>
      <div className="card p-16 flex flex-col items-center justify-center text-center space-y-6 mt-8 shadow-xl border-dashed border-2 border-slate-300">
        <div className="w-32 h-32 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
          <Construction size={64} />
        </div>
        <h2 className="text-3xl font-black text-slate-800">Tính năng đang được thiết lập</h2>
        <p className="text-xl text-slate-500 font-medium max-w-lg">Module <strong>Cài đặt Hệ thống</strong> đang trong quá trình phát triển. Vui lòng quay lại sau!</p>
      </div>
    </div>
  );
}
