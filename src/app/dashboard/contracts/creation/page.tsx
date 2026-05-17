'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Camera, ChevronRight, ChevronLeft, User, Package, DollarSign, Printer } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { calcAccruedInterest, calcNextDueDate } from '@/lib/math';
import type { ContractWizardData, RateType, InterestCycle } from '@/types';

const STEPS = [
  { id: 1, label: 'Khách hàng', icon: <User size={18} /> },
  { id: 2, label: 'Tài sản',    icon: <Package size={18} /> },
  { id: 3, label: 'Lãi & In',  icon: <DollarSign size={18} /> },
];

const INTEREST_PACKAGES = [
  { id: 'pkg1', name: '8k/tuần (1tr)', rateType: 'FIXED_PER_WEEK' as RateType, rateValue: 8000, cycle: 'WEEKLY' as InterestCycle },
  { id: 'pkg2', name: '35k/tuần (2.5tr)', rateType: 'FIXED_PER_WEEK' as RateType, rateValue: 35000, cycle: 'WEEKLY' as InterestCycle },
  { id: 'pkg3', name: '100k/tuần (12tr)', rateType: 'FIXED_PER_WEEK' as RateType, rateValue: 100000, cycle: 'WEEKLY' as InterestCycle },
  { id: 'pkg4', name: '300k/tuần (20tr)', rateType: 'FIXED_PER_WEEK' as RateType, rateValue: 300000, cycle: 'WEEKLY' as InterestCycle },
  { id: 'pkg5', name: '3k/triệu/ngày', rateType: 'PER_MILLION_PER_DAY' as RateType, rateValue: 3000, cycle: 'DAILY' as InterestCycle },
  { id: 'pkg6', name: '6%/tháng', rateType: 'PERCENT_PER_MONTH' as RateType, rateValue: 6, cycle: 'MONTHLY' as InterestCycle },
];

const ASSET_TYPES = ['XM', 'OTO', 'DT', 'LT', 'VANG', 'KHAC'];
const ASSET_LABELS: Record<string, string> = { XM: 'Xe máy', OTO: 'Ô tô', DT: 'Điện thoại', LT: 'Laptop', VANG: 'Vàng', KHAC: 'Khác' };

const DEFAULT_DATA: ContractWizardData = {
  customerName: '', customerPhone: '', customerAddress: '', isNewCustomer: true,
  assetType: 'XM', assetImages: [],
  pawningAmount: 0, interestRateType: 'FIXED_PER_WEEK', interestRateValue: 8000,
  interestCycle: 'WEEKLY', startDate: new Date(),
};

/* ───── STEP 1: Customer ───── */
function Step1({ data, onChange }: { data: ContractWizardData; onChange: (d: Partial<ContractWizardData>) => void }) {
  const [scanning, setScanning] = useState(false);

  const handleScanCCCD = () => {
    setScanning(true);
    setTimeout(() => {
      onChange({
        cccdNumber: '079123456789',
        customerName: 'NGUYEN VAN AN',
        customerAddress: '123 Lê Văn Việt, Q.9, TPHCM',
        isNewCustomer: true,
      });
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-center">
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-all',
          scanning ? 'bg-blue-500 animate-pulse-ring' : 'bg-blue-100'
        )}>
          <Camera size={32} className={scanning ? 'text-white' : 'text-blue-500'} />
        </div>
        <p className="text-slate-600 text-sm mb-4">
          {scanning ? 'Đang quét CCCD...' : 'Quét CCCD/Hộ chiếu để tự động điền thông tin'}
        </p>
        <button onClick={handleScanCCCD} disabled={scanning} className="btn-primary btn-lg">
          {scanning ? 'Đang quét...' : '📷 Quét CCCD'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="input-label">Mã CCCD</label>
          <input id="cccd-number" value={data.cccdNumber || ''} onChange={e => onChange({ cccdNumber: e.target.value })} className="input" placeholder="Số CCCD/CMND" />
        </div>
        <div className="input-group">
          <label className="input-label">Họ tên KH <span className="text-red-500">*</span></label>
          <input id="customer-name" value={data.customerName} onChange={e => onChange({ customerName: e.target.value })} className="input" placeholder="NGUYEN VAN AN" />
        </div>
        <div className="input-group">
          <label className="input-label">Số điện thoại <span className="text-red-500">*</span></label>
          <input id="customer-phone" value={data.customerPhone} onChange={e => onChange({ customerPhone: e.target.value })} className="input" placeholder="0912345678" type="tel" />
        </div>
        <div className="input-group md:col-span-2">
          <label className="input-label">Địa chỉ</label>
          <input id="customer-address" value={data.customerAddress || ''} onChange={e => onChange({ customerAddress: e.target.value })} className="input" placeholder="Địa chỉ thường trú" />
        </div>
      </div>
    </div>
  );
}

/* ───── STEP 2: Asset ───── */
function Step2({ data, onChange }: { data: ContractWizardData; onChange: (d: Partial<ContractWizardData>) => void }) {
  return (
    <div className="space-y-5">
      {/* Asset type selector */}
      <div className="input-group">
        <label className="input-label">Loại tài sản <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {ASSET_TYPES.map(t => (
            <button key={t} onClick={() => onChange({ assetType: t })}
              className={cn('p-3 rounded-xl border-2 text-sm font-bold transition-all',
                data.assetType === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600')}>
              {ASSET_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="input-label">Hãng / Hiệu</label>
          <input id="asset-brand" value={data.assetBrand || ''} onChange={e => onChange({ assetBrand: e.target.value })} className="input" placeholder="Honda, Samsung, Apple..." />
        </div>
        <div className="input-group">
          <label className="input-label">Dòng máy</label>
          <input id="asset-model" value={data.assetModel || ''} onChange={e => onChange({ assetModel: e.target.value })} className="input" placeholder="Wave Alpha, iPhone 15..." />
        </div>
        {(data.assetType === 'XM' || data.assetType === 'OTO') && (
          <div className="input-group">
            <label className="input-label">Biển số xe</label>
            <input id="asset-plate" value={data.assetPlate || ''} onChange={e => onChange({ assetPlate: e.target.value })} className="input font-mono" placeholder="51A-12345" />
          </div>
        )}
        {data.assetType === 'DT' && (
          <div className="input-group">
            <label className="input-label">IMEI</label>
            <input id="asset-imei" value={data.assetImei || ''} onChange={e => onChange({ assetImei: e.target.value })} className="input font-mono" placeholder="356938035643809" />
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Màu sắc</label>
          <input id="asset-color" value={data.assetColor || ''} onChange={e => onChange({ assetColor: e.target.value })} className="input" placeholder="Đen, Trắng, Đỏ..." />
        </div>
        <div className="input-group">
          <label className="input-label">Tình trạng</label>
          <select id="asset-condition" value={data.assetCondition || ''} onChange={e => onChange({ assetCondition: e.target.value })} className="select">
            <option value="">Chọn tình trạng</option>
            <option value="new">Mới (90-100%)</option>
            <option value="good">Tốt (70-90%)</option>
            <option value="medium">Trung bình (50-70%)</option>
            <option value="poor">Kém (&lt;50%)</option>
          </select>
        </div>
        <div className="input-group md:col-span-2">
          <label className="input-label">Ghi chú tài sản</label>
          <input id="asset-note" value={data.assetNote || ''} onChange={e => onChange({ assetNote: e.target.value })} className="input" placeholder="Vết xước, phụ kiện đi kèm..." />
        </div>
      </div>

      {/* Photo upload */}
      <div className="input-group">
        <label className="input-label">Ảnh tài sản</label>
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <Camera size={28} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Chụp ảnh hoặc tải lên ảnh tài sản</p>
          <p className="text-xs text-slate-400 mt-1">Tối đa 5 ảnh, mỗi ảnh &lt;5MB</p>
        </div>
      </div>
    </div>
  );
}

/* ───── STEP 3: Finance + Print ───── */
function Step3({ data, onChange }: { data: ContractWizardData; onChange: (d: Partial<ContractWizardData>) => void }) {
  const selectedPkg = INTEREST_PACKAGES.find(p => p.rateValue === data.interestRateValue && p.rateType === data.interestRateType);
  const estInterest = calcAccruedInterest(data.pawningAmount, data.interestRateType, data.interestRateValue, data.interestCycle, data.startDate, (() => { const d = new Date(data.startDate); d.setDate(d.getDate() + 7); return d; })());
  const nextDue = calcNextDueDate(data.startDate, data.interestCycle);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="input-label">Số tiền cầm (VNĐ) <span className="text-red-500">*</span></label>
          <input
            id="pawning-amount"
            type="number"
            value={data.pawningAmount || ''}
            onChange={e => onChange({ pawningAmount: Number(e.target.value) })}
            className="input font-bold text-lg"
            placeholder="1000000"
            min="0"
            step="100000"
          />
          {data.pawningAmount > 0 && (
            <div className="text-xs text-blue-600 mt-1 font-medium">{formatCurrency(data.pawningAmount)}</div>
          )}
        </div>
        <div className="input-group">
          <label className="input-label">Ngày cầm</label>
          <input
            id="start-date"
            type="date"
            value={data.startDate.toISOString().split('T')[0]}
            onChange={e => onChange({ startDate: new Date(e.target.value) })}
            className="input"
          />
        </div>
      </div>

      {/* Interest package selector - Zero Typing */}
      <div className="input-group">
        <label className="input-label">Chọn gói lãi suất</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INTEREST_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => onChange({ interestRateType: pkg.rateType, interestRateValue: pkg.rateValue, interestCycle: pkg.cycle })}
              className={cn(
                'p-3 rounded-xl border-2 text-sm font-bold text-left transition-all',
                selectedPkg?.id === pkg.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300 text-slate-700'
              )}
            >
              {pkg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {data.pawningAmount > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
          <div className="text-sm font-bold text-slate-400 mb-3">📋 PREVIEW HỢP ĐỒNG</div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-slate-400">Khách hàng:</div>
            <div className="font-bold">{data.customerName || '--'}</div>
            <div className="text-slate-400">Tài sản:</div>
            <div className="font-bold">{[data.assetType, data.assetBrand, data.assetModel].filter(Boolean).join(' ')}</div>
            {data.assetPlate && <><div className="text-slate-400">Biển số:</div><div className="font-bold font-mono">{data.assetPlate}</div></>}
            <div className="text-slate-400">Tiền cầm:</div>
            <div className="font-black text-xl text-blue-300">{formatCurrency(data.pawningAmount)}</div>
            <div className="text-slate-400">Lãi 1 kỳ:</div>
            <div className="font-bold text-amber-300">{formatCurrency(estInterest)}</div>
            <div className="text-slate-400">Đóng lãi tiếp:</div>
            <div className="font-bold text-green-300">{formatDate(nextDue)}</div>
          </div>
        </div>
      )}

      <div className="input-group">
        <label className="input-label">Ghi chú</label>
        <input id="contract-note" value={data.note || ''} onChange={e => onChange({ note: e.target.value })} className="input" placeholder="Ghi chú thêm..." />
      </div>
    </div>
  );
}

/* ───── MAIN WIZARD ───── */
export default function ContractCreationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ContractWizardData>(DEFAULT_DATA);

  const update = (partial: Partial<ContractWizardData>) => setData(d => ({ ...d, ...partial }));

  const canNext = () => {
    if (step === 1) return data.customerName.trim().length > 0;
    if (step === 2) return data.assetType.length > 0;
    if (step === 3) return data.pawningAmount > 0;
    return true;
  };

  const handleSubmit = () => {
    alert('✅ Hợp đồng đã được tạo thành công!\n\nMã HĐ: CĐ-147\nIn bill: Nhấn nút In bên dưới');
    router.push('/dashboard/contracts');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Tạo hợp đồng cầm đồ</h1>
        <p className="page-subtitle">Quy trình 3 bước nhanh gọn</p>
      </div>

      {/* Step indicator */}
      <div className="card">
        <div className="card-body py-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn('wizard-step-circle', step > s.id ? 'done' : step === s.id ? 'current' : 'upcoming')}>
                    {step > s.id ? <CheckCircle size={18} /> : s.icon}
                  </div>
                  <span className={cn('text-xs mt-1 font-medium', step >= s.id ? 'text-blue-600' : 'text-slate-400')}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('wizard-step-line', step > s.id ? 'done' : 'upcoming')} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Bước {step}: {STEPS[step - 1].label}</h2>
          <span className="text-sm text-slate-400">{step}/3</span>
        </div>
        <div className="card-body">
          {step === 1 && <Step1 data={data} onChange={update} />}
          {step === 2 && <Step2 data={data} onChange={update} />}
          {step === 3 && <Step3 data={data} onChange={update} />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard/contracts')}
          className="btn-outline"
        >
          <ChevronLeft size={18} /> {step > 1 ? 'Quay lại' : 'Hủy'}
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary btn-lg">
            Tiếp theo <ChevronRight size={18} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => window.print()}>
              <Printer size={18} /> In bill
            </button>
            <button onClick={handleSubmit} disabled={!canNext()} className="btn-success btn-lg">
              <CheckCircle size={18} /> Xác nhận tạo HĐ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
