'use client';

import { supabase } from './supabase';
import { Customer, Invoice, Payment, DashboardMetrics, ShopUser, ShopCategory, CustomerMessage } from '../types';
import { simulateFIFOPayment } from './fifo';

// ─────────────────────────────────────────────────
// CURRENT USER (still localStorage - just session)
// ─────────────────────────────────────────────────
const SESSION_KEY = 'udhari_current_shop_id';

function getCurrentShopId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}
function setCurrentShopId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

// ─────────────────────────────────────────────────
// SHOPS / AUTH
// ─────────────────────────────────────────────────
export async function sbGetShops(): Promise<ShopUser[]> {
  const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
  if (error) { console.error('sbGetShops:', error); return []; }
  return (data || []) as ShopUser[];
}

export async function sbGetCurrentUser(): Promise<ShopUser | null> {
  const id = getCurrentShopId();
  if (!id) return null;
  const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as ShopUser;
}

export function sbSetCurrentUser(user: ShopUser | null) {
  setCurrentShopId(user?.id ?? null);
}

export async function sbRegisterShop(shopData: {
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
}): Promise<ShopUser> {
  const newShop: ShopUser = {
    id: `shop_${Date.now()}`,
    shop_name: shopData.shop_name,
    owner_name: shopData.owner_name,
    phone: shopData.phone,
    whatsapp_phone: shopData.whatsapp_phone || shopData.phone,
    email: shopData.email,
    password: shopData.password,
    gstin: shopData.gstin,
    shop_category: shopData.shop_category,
    address: shopData.address,
    terms_accepted: shopData.terms_accepted ?? true,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('shops').insert([newShop]);
  if (error) throw new Error('Registration failed: ' + error.message);
  setCurrentShopId(newShop.id);
  return newShop;
}

export async function sbLoginWithPhone(identifier: string): Promise<ShopUser | null> {
  const clean = identifier.trim().toLowerCase();
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .or(`phone.eq.${clean},email.eq.${clean}`)
    .limit(1);
  if (error || !data || data.length === 0) return null;
  setCurrentShopId(data[0].id);
  return data[0] as ShopUser;
}

export async function sbUpdateShop(shopId: string, updates: Partial<ShopUser>): Promise<ShopUser | null> {
  const { data, error } = await supabase.from('shops').update(updates).eq('id', shopId).select().single();
  if (error) { console.error('sbUpdateShop:', error); return null; }
  return data as ShopUser;
}

// ─────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────
export async function sbGetCustomers(shopId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) { console.error('sbGetCustomers:', error); return []; }
  return (data || []) as Customer[];
}

export async function sbAddCustomer(
  shopId: string,
  customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'current_balance' | 'status' | 'shop_id'>
): Promise<Customer> {
  const customer: Customer = {
    ...customerData,
    id: `cust_${Date.now()}`,
    shop_id: shopId,
    current_balance: 0,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('customers').insert([customer]);
  if (error) throw new Error('Add customer failed: ' + error.message);
  return customer;
}

export async function sbUpdateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
  const { error } = await supabase.from('customers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', customerId);
  if (error) console.error('sbUpdateCustomer:', error);
}

export async function sbDeleteCustomer(customerId: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', customerId);
  if (error) console.error('sbDeleteCustomer:', error);
}

// ─────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────
export async function sbGetInvoices(shopId: string): Promise<Invoice[]> {
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (invError) { console.error('sbGetInvoices:', invError); return []; }

  const { data: items, error: itemError } = await supabase
    .from('invoice_items')
    .select('*')
    .in('invoice_id', (invoices || []).map((i) => i.id));
  if (itemError) console.error('sbGetInvoiceItems:', itemError);

  const itemMap = new Map<string, typeof items>();
  (items || []).forEach((item) => {
    if (!itemMap.has(item.invoice_id)) itemMap.set(item.invoice_id, []);
    itemMap.get(item.invoice_id)!.push(item);
  });

  return (invoices || []).map((inv) => ({
    ...inv,
    items: itemMap.get(inv.id) || []
  })) as Invoice[];
}

export async function sbAddInvoice(
  shopId: string,
  customerId: string,
  invoiceData: Omit<Invoice, 'id' | 'customer_id' | 'invoice_number' | 'created_at' | 'paid_amount' | 'status' | 'shop_id'>
): Promise<Invoice> {
  // Get count for invoice number
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

  const invoiceId = `inv_${Date.now()}`;
  const invoice: Invoice = {
    ...invoiceData,
    id: invoiceId,
    shop_id: shopId,
    customer_id: customerId,
    invoice_number: invoiceNumber,
    paid_amount: 0,
    status: 'UNPAID',
    created_at: new Date().toISOString()
  };

  const { error: invError } = await supabase.from('invoices').insert([{
    id: invoice.id,
    shop_id: invoice.shop_id,
    customer_id: invoice.customer_id,
    invoice_number: invoice.invoice_number,
    total_amount: invoice.total_amount,
    paid_amount: invoice.paid_amount,
    discount_amount: invoice.discount_amount,
    status: invoice.status,
    taken_by_name: invoice.taken_by_name,
    notes: invoice.notes,
    due_date: invoice.due_date,
    created_at: invoice.created_at
  }]);
  if (invError) throw new Error('Add invoice failed: ' + invError.message);

  // Insert items
  if (invoiceData.items && invoiceData.items.length > 0) {
    const itemRows = invoiceData.items.map((item) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      invoice_id: invoiceId,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    }));
    const { error: itemError } = await supabase.from('invoice_items').insert(itemRows);
    if (itemError) console.error('Add invoice items failed:', itemError);
  }

  // Update customer balance
  await supabase.rpc('increment_customer_balance', {
    p_customer_id: customerId,
    p_amount: invoice.total_amount
  }).then(({ error }) => {
    if (error) {
      // Fallback if RPC doesn't exist
      supabase
        .from('customers')
        .select('current_balance')
        .eq('id', customerId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase.from('customers').update({
              current_balance: (data.current_balance || 0) + invoice.total_amount,
              updated_at: new Date().toISOString()
            }).eq('id', customerId);
          }
        });
    }
  });

  return invoice;
}

// ─────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────
export async function sbGetPayments(shopId: string): Promise<Payment[]> {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) { console.error('sbGetPayments:', error); return []; }

  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('*')
    .in('payment_id', (payments || []).map((p) => p.id));

  const allocMap = new Map<string, typeof allocations>();
  (allocations || []).forEach((a) => {
    if (!allocMap.has(a.payment_id)) allocMap.set(a.payment_id, []);
    allocMap.get(a.payment_id)!.push(a);
  });

  return (payments || []).map((p) => ({
    ...p,
    allocations: allocMap.get(p.id) || []
  })) as Payment[];
}

export async function sbRecordPayment(
  shopId: string,
  customerId: string,
  invoices: Invoice[],
  amount: number,
  paymentMode: Payment['payment_mode'],
  discountWaived: number = 0,
  referenceNote?: string
): Promise<Payment> {
  const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
  const receiptNumber = `REC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

  const fifoResult = simulateFIFOPayment(invoices, amount, discountWaived);
  const paymentId = `pay_${Date.now()}`;

  const payment: Payment = {
    id: paymentId,
    shop_id: shopId,
    customer_id: customerId,
    receipt_number: receiptNumber,
    amount,
    payment_mode: paymentMode,
    discount_waived: discountWaived,
    reference_note: referenceNote,
    allocations: [],
    created_at: new Date().toISOString()
  };

  const { error: payError } = await supabase.from('payments').insert([{
    id: payment.id,
    shop_id: payment.shop_id,
    customer_id: payment.customer_id,
    receipt_number: payment.receipt_number,
    amount: payment.amount,
    payment_mode: payment.payment_mode,
    discount_waived: payment.discount_waived,
    reference_note: payment.reference_note,
    created_at: payment.created_at
  }]);
  if (payError) throw new Error('Record payment failed: ' + payError.message);

  // Save allocations & update invoices
  const allocRows = [];
  for (const alloc of fifoResult.allocations) {
    allocRows.push({
      id: `alloc_${Date.now()}_${alloc.invoice_id}`,
      payment_id: paymentId,
      invoice_id: alloc.invoice_id,
      invoice_number: alloc.invoice_number,
      allocated_amount: alloc.allocated_amount,
      created_at: new Date().toISOString()
    });
    await supabase.from('invoices').update({
      paid_amount: supabase.rpc as unknown as number, // will use select+update below
      status: alloc.resulting_status
    });
    // Proper update
    const { data: inv } = await supabase.from('invoices').select('paid_amount').eq('id', alloc.invoice_id).single();
    if (inv) {
      await supabase.from('invoices').update({
        paid_amount: (inv.paid_amount || 0) + alloc.allocated_amount,
        status: alloc.resulting_status
      }).eq('id', alloc.invoice_id);
    }
  }
  if (allocRows.length > 0) {
    await supabase.from('payment_allocations').insert(allocRows);
  }

  // Update customer balance
  const { data: cust } = await supabase.from('customers').select('current_balance').eq('id', customerId).single();
  if (cust) {
    const totalSettled = amount + discountWaived;
    await supabase.from('customers').update({
      current_balance: Math.max(0, (cust.current_balance || 0) - totalSettled),
      updated_at: new Date().toISOString()
    }).eq('id', customerId);
  }

  return { ...payment, allocations: allocRows };
}

// ─────────────────────────────────────────────────
// DASHBOARD METRICS
// ─────────────────────────────────────────────────
export async function sbGetDashboardMetrics(shopId: string): Promise<DashboardMetrics> {
  const todayStr = new Date().toISOString().split('T')[0];

  const [customers, invoices, payments] = await Promise.all([
    sbGetCustomers(shopId),
    sbGetInvoices(shopId),
    sbGetPayments(shopId)
  ]);

  const totalMarketDebt = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const creditGivenToday = invoices
    .filter((i) => i.created_at.startsWith(todayStr) && i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.total_amount, 0);
  const collectedToday = payments
    .filter((p) => p.created_at.startsWith(todayStr))
    .reduce((sum, p) => sum + p.amount, 0);
  const activeDebtorsCount = customers.filter((c) => (c.current_balance || 0) > 0).length;

  return {
    total_market_debt: totalMarketDebt,
    credit_given_today: creditGivenToday,
    collected_today: collectedToday,
    active_debtors: activeDebtorsCount,
    active_debtors_count: activeDebtorsCount
  };
}

// ─────────────────────────────────────────────────
// CUSTOMER MESSAGES
// ─────────────────────────────────────────────────
export async function sbGetCustomerMessages(shopId: string, customerId: string): Promise<CustomerMessage[]> {
  const { data, error } = await supabase
    .from('customer_messages')
    .select('*')
    .eq('shop_id', shopId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('sbGetCustomerMessages:', error); return []; }
  return (data || []) as CustomerMessage[];
}

export async function sbSaveCustomerMessage(
  shopId: string,
  customerId: string,
  messageText: string,
  tone: 'polite' | 'formal' | 'urgent' | 'custom' = 'custom'
): Promise<CustomerMessage> {
  const msg: CustomerMessage = {
    id: `msg_${Date.now()}`,
    shop_id: shopId,
    customer_id: customerId,
    message_text: messageText,
    tone,
    sent_via: 'WHATSAPP',
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from('customer_messages').insert([msg]);
  if (error) console.error('sbSaveCustomerMessage:', error);
  return msg;
}

// ─────────────────────────────────────────────────
// SEED DEMO DATA (run once for a new shop)
// ─────────────────────────────────────────────────
export async function sbSeedDemoData(shopId: string) {
  const { INITIAL_CUSTOMERS, INITIAL_INVOICES, INITIAL_PAYMENTS } = await import('./mockData');

  const shopCustomers = INITIAL_CUSTOMERS
    .filter((c) => c.shop_id === 'shop_stationery')
    .map((c) => ({ ...c, id: c.id.replace('cust_', `cust_${shopId}_`), shop_id: shopId }));

  await supabase.from('customers').insert(shopCustomers).then(({ error }) => {
    if (error) console.error('Seed customers:', error);
  });

  const customerIdMap = new Map(
    INITIAL_CUSTOMERS.filter((c) => c.shop_id === 'shop_stationery').map((c) => [c.id, c.id.replace('cust_', `cust_${shopId}_`)])
  );

  for (const inv of INITIAL_INVOICES.filter((i) => i.shop_id === 'shop_stationery')) {
    const newCustomerId = customerIdMap.get(inv.customer_id) || inv.customer_id;
    const newInvId = inv.id + `_${shopId}`;
    await supabase.from('invoices').insert([{
      id: newInvId,
      shop_id: shopId,
      customer_id: newCustomerId,
      invoice_number: inv.invoice_number,
      total_amount: inv.total_amount,
      paid_amount: inv.paid_amount,
      discount_amount: inv.discount_amount,
      status: inv.status,
      taken_by_name: inv.taken_by_name,
      notes: inv.notes,
      due_date: inv.due_date,
      created_at: inv.created_at
    }]);
    if (inv.items?.length) {
      await supabase.from('invoice_items').insert(
        inv.items.map((item) => ({ ...item, invoice_id: newInvId }))
      );
    }
  }

  for (const pay of INITIAL_PAYMENTS.filter((p) => p.shop_id === 'shop_stationery')) {
    const newCustomerId = customerIdMap.get(pay.customer_id) || pay.customer_id;
    await supabase.from('payments').insert([{
      id: pay.id + `_${shopId}`,
      shop_id: shopId,
      customer_id: newCustomerId,
      receipt_number: pay.receipt_number,
      amount: pay.amount,
      payment_mode: pay.payment_mode,
      discount_waived: pay.discount_waived || 0,
      reference_note: pay.reference_note,
      created_at: pay.created_at
    }]);
  }
}
