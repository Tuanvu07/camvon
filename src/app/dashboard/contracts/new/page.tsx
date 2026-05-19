'use client';

import { useState } from 'react';
import { createContractAction } from '@/actions/createContract';
import CCCDScanner from '@/components/CCCDScanner';
import { User, FileText, Landmark, Banknote } from 'lucide-react';
import SubmitButton from '@/components/SubmitButton';
import CameraCapture from '@/components/CameraCapture';

export default function NewContractPage() {
  const [kycData, setKycData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScan = (data: any) => {
    setKycData({
      fullName: data.fullName,
      cccd: data.cccd,
      address: data.address
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Form action is handled natively by Next.js Server Actions
    // So we just let the form submit normally, but we keep track of loading state
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="page-title flex items-center gap-3"><FileText className="text-blue-600" /> Tạo Hợp Đồng Cầm Đồ Mới</h1>
        <p className="page-subtitle">Sử dụng tính năng quét CCCD để điền thông tin tự động</p>
      </div>

      <form action={createContractAction} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card">
            <div className="card-header bg-slate-50 border-b-2 border-slate-200">
              <h2 className="card-title flex items-center gap-2"><User /> Thông Tin Khách Hàng</h2>
            </div>
            <div className="card-body space-y-5">
              <CCCDScanner onScan={handleScan} />

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="input-group">
                  <label className="input-label">Họ và Tên Khách Hàng *</label>
                  <input required name="fullName" type="text" className="input font-bold text-lg" defaultValue={kycData.fullName || ''} placeholder="NGUYỄN VĂN A" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Số CCCD *</label>
                    <input required name="cccd" type="text" className="input font-mono" defaultValue={kycData.cccd || ''} placeholder="079012345678" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Số Điện Thoại *</label>
                    <input required name="phone" type="tel" className="input font-mono font-bold" placeholder="0901234567" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Địa Chỉ</label>
                  <input name="address" type="text" className="input" defaultValue={kycData.address || ''} placeholder="Số nhà, Tên đường, Xã/Phường..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN CẦM CỐ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card">
            <div className="card-header bg-blue-50 border-b-2 border-blue-200">
              <h2 className="card-title text-blue-800 flex items-center gap-2"><Landmark /> Thông Tin Tài Sản & Khoản Vay</h2>
            </div>
            <div className="card-body space-y-6">
              
              {/* Tài Sản */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 input-group">
                    <label className="input-label">Loại Tài Sản</label>
                    <select name="assetType" className="select font-bold">
                      <option value="XM">Xe Máy</option>
                      <option value="DT">Điện Thoại</option>
                      <option value="LT">Laptop</option>
                      <option value="VANG">Vàng/Trang sức</option>
                      <option value="OTO">Ô Tô</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 input-group">
                    <label className="input-label">Tên / Mô Tả Tài Sản *</label>
                    <input required name="assetName" type="text" className="input" placeholder="VD: Xe AirBlade Đỏ Đen 2022" />
                  </div>
                </div>

                <div className="pt-2">
                  <CameraCapture />
                </div>
              </div>

              {/* Tài Chính */}
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-4">
                <div className="input-group">
                  <label className="input-label text-emerald-800 text-lg">SỐ TIỀN CẦM (GIẢI NGÂN) *</label>
                  <div className="relative">
                    <input required name="pawningAmount" type="number" className="input font-black text-3xl text-emerald-700 py-6" placeholder="10000000" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">VNĐ</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">Loại Lãi Suất</label>
                    <select name="interestRateType" className="select font-bold">
                      <option value="PER_MILLION_PER_DAY">k/Triệu/Ngày</option>
                      <option value="FIXED_PER_WEEK">k/Tuần (Cố định)</option>
                      <option value="FIXED_PER_MONTH">k/Tháng (Cố định)</option>
                      <option value="PERCENT_PER_MONTH">% / Tháng</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Mức Lãi</label>
                    <input required name="interestRateValue" type="number" step="0.01" className="input font-bold" defaultValue="3000" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Kỳ Đóng Lãi</label>
                    <select name="interestCycle" className="select font-bold">
                      <option value="MONTHLY">Hàng Tháng (30 ngày)</option>
                      <option value="WEEKLY">Hàng Tuần (7 ngày)</option>
                      <option value="BIWEEKLY">Nửa Tháng (14 ngày)</option>
                      <option value="DAILY">Hàng Ngày</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <SubmitButton 
                  text="TẠO HỢP ĐỒNG & GIẢI NGÂN"
                  className="w-full btn btn-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl py-8 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                />
              </div>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
