// ============================================================
// LendOS - Core TypeScript Definitions
// ============================================================

export type ShopRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER';
export type ContractStatus = 'ACTIVE' | 'INTEREST_DUE' | 'PENDING_LIQUIDATION' | 'LIQUIDATED' | 'REDEEMED' | 'OLD_DEBT' | 'BAD_DEBT' | 'CLOSED';
export type TransactionType = 'PAWN_IN' | 'INTEREST_COLLECT' | 'REDEEM_OUT' | 'LIQUIDATION' | 'EXPENSE' | 'INCOME' | 'FUND_TRANSFER' | 'PAID_INTEREST' | 'REPAY_PRINCIPAL' | 'CLOSE_CONTRACT';
export type InterestCycle = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type RateType = 'PERCENT_PER_MONTH' | 'PER_MILLION_PER_DAY' | 'FIXED_PER_WEEK' | 'FIXED_PER_MONTH';
export type CustomerStatus = 'NORMAL' | 'VIP' | 'BLACKLIST';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'ZALO_PAY';

export interface Shop {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  taxCode?: string;
  ownerName?: string;
  initialCapital: number;
  cashBalance: number;
  zaloOaToken?: string;
  printTemplate: string;
  timezone: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface ShopUser {
  id: string;
  shopId: string;
  userId: string;
  role: ShopRole;
  isActive: boolean;
  shop?: Shop;
  user?: User;
}

export interface Customer {
  id: string;
  shopId: string;
  cccdNumber?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  cccdFront?: string;
  cccdBack?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  status: CustomerStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetCategory {
  id: string;
  shopId: string;
  name: string;
  code: string;
  interestRate: number;
  interestCycle: InterestCycle;
  liquidationAfter: number;
  isActive: boolean;
}

export interface InterestPackage {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  rateType: RateType;
  rateValue: number;
  cycle: InterestCycle;
  isDefault: boolean;
  isActive: boolean;
}

export interface Contract {
  id: string;
  shopId: string;
  contractCode: string;
  customerId: string;
  categoryId?: string;
  interestPackageId?: string;
  
  // Asset
  assetType: string;
  assetName?: string; // Tên tài sản đầy đủ
  assetBrand?: string;
  assetModel?: string;
  assetPlate?: string;
  assetImei?: string;
  assetColor?: string;
  assetCondition?: string;
  assetImages: string;
  assetNote?: string;
  
  // Finance
  pawningAmount: number;
  interestRateType: RateType;
  interestRateValue: number;
  interestCycle: InterestCycle;
  
  // Dates
  startDate: Date;
  dueDate?: Date;
  interestDueDate?: Date;
  
  status: ContractStatus;
  totalInterestPaid: number;
  lastPaymentDate?: Date;
  note?: string;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  customer?: Customer;
  category?: AssetCategory;
  interestPackage?: InterestPackage;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  shopId: string;
  contractId?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  note?: string;
  staffName?: string;
  referenceCode?: string;
  paymentMethod: PaymentMethod;
  transactionDate: Date;
  createdAt: Date;
  contract?: Contract;
}

export interface AuditLog {
  id: string;
  shopId: string;
  userId?: string;
  contractId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: string;
  newData?: string;
  ipAddress?: string;
  createdAt: Date;
  user?: User;
}

// ============================================================
// Dashboard Stats
// ============================================================
export interface DashboardStats {
  activeContracts: number;
  activeAmount: number;
  interestDue: number;
  pendingLiquidation: number;
  oldDebt: number;
  badDebt: number;
  todayInterestCollected: number;
  cashBalance: number;
}

// ============================================================
// CCCD QR Data (Vietnam National ID)
// ============================================================
export interface CCCDData {
  id: string;        // Số CCCD
  name: string;      // Họ tên
  dob: string;       // Ngày sinh
  gender: string;    // Giới tính
  address: string;   // Địa chỉ thường trú
}

// ============================================================
// Interest Calculation
// ============================================================
export interface InterestCalculation {
  principal: number;
  rateType: RateType;
  rateValue: number;
  cycle: InterestCycle;
  startDate: Date;
  toDate: Date;
  totalDays: number;
  totalCycles: number;
  accruedInterest: number;
  nextDueDate: Date;
}

// ============================================================
// Navigation
// ============================================================
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

// ============================================================
// Contract creation wizard
// ============================================================
export interface ContractWizardData {
  // Step 1: Customer
  customerId?: string;
  cccdNumber?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  isNewCustomer: boolean;
  
  // Step 2: Asset
  assetType: string;
  assetBrand?: string;
  assetModel?: string;
  assetPlate?: string;
  assetImei?: string;
  assetColor?: string;
  assetCondition?: string;
  assetImages: string[];
  assetNote?: string;
  
  // Step 3: Finance
  pawningAmount: number;
  interestPackageId?: string;
  interestRateType: RateType;
  interestRateValue: number;
  interestCycle: InterestCycle;
  startDate: Date;
  note?: string;
}
