export type Language = 'mr' | 'hi' | 'en';

export type ThemeMode = 'dark' | 'light';

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export type PaymentMode = 'CASH' | 'UPI_GPAY' | 'UPI_PHONEPE' | 'UPI_PAYTM' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export type ShopCategory = 
  | 'STATIONERY'
  | 'KIRANA'
  | 'MEDICAL'
  | 'HARDWARE'
  | 'CLOTHING'
  | 'GENERAL';

export interface ShopUser {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  whatsapp_phone?: string;
  email?: string;
  password?: string;
  gstin?: string;
  shop_category: ShopCategory;
  address?: string;
  terms_accepted?: boolean;
  created_at: string;
}

export interface PresetItem {
  name: string;
  price: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  shop_id: string;
  customer_id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number; // Chillar / Round-off
  status: InvoiceStatus;
  taken_by_name?: string;
  notes?: string;
  due_date?: string;
  items: InvoiceItem[];
  created_at: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  invoice_number: string;
  allocated_amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  shop_id: string;
  customer_id: string;
  receipt_number: string;
  amount: number;
  payment_mode: PaymentMode;
  discount_waived: number;
  reference_note?: string;
  allocations: PaymentAllocation[];
  created_at: string;
}

export interface CustomerMessage {
  id: string;
  shop_id: string;
  customer_id: string;
  message_text: string;
  tone: 'polite' | 'formal' | 'urgent' | 'custom';
  sent_via: 'WHATSAPP' | 'SMS';
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  address_landmark?: string;
  credit_limit: number;
  current_balance: number;
  status: 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_market_debt: number;
  credit_given_today: number;
  collected_today: number;
  active_debtors: number;
  active_debtors_count: number;
}
