'use client';
import { validatePasswordStrength } from './validation';

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
  custom_category?: string;
  address?: string;
  terms_accepted?: boolean;
}): Promise<ShopUser> {
  if (shopData.email) {
    const cleanEmail = shopData.email.trim().toLowerCase();
    const { data: existingEmail } = await supabase
      .from('shops')
      .select('id, shop_name, email')
      .ilike('email', cleanEmail)
      .limit(1);

    if (existingEmail && existingEmail.length > 0) {
      throw new Error(`The email "${cleanEmail}" is already registered. Please sign in instead.`);
    }
  }

  const categoryToSave = (shopData.shop_category === 'OTHER' && shopData.custom_category)
    ? shopData.custom_category
    : shopData.shop_category;

  const newShop: ShopUser = {
    id: `shop_${Date.now()}`,
    shop_name: shopData.shop_name,
    owner_name: shopData.owner_name,
    phone: shopData.phone,
    whatsapp_phone: shopData.phone,
    email: shopData.email,
    password: shopData.password,
    gstin: shopData.gstin,
    shop_category: categoryToSave as ShopCategory,
    custom_category: shopData.custom_category,
    address: shopData.address,
    terms_accepted: shopData.terms_accepted ?? true,
    created_at: new Date().toISOString(),
  };
  
  // Try inserting full object
  const { error } = await supabase.from('shops').insert([newShop]);
  if (error) {
    // If custom_category column doesn't exist yet, insert without it
    const fallbackObj = { ...newShop };
    delete fallbackObj.custom_category;
    const { error: fbErr } = await supabase.from('shops').insert([fallbackObj]);
    if (fbErr) throw new Error('Registration failed: ' + fbErr.message);
  }
  
  setCurrentShopId(newShop.id);
  return newShop;
}

export async function sbLoginWithCredentials(
  identifier: string,
  password?: string,
  method: 'EMAIL' | 'PHONE' = 'EMAIL'
): Promise<{ user: ShopUser | null; error?: string }> {
  const clean = identifier.trim().toLowerCase();
  const cleanDigits = identifier.replace(/\D/g, '');
  
  // Find shop by email or phone
  let { data, error } = await supabase
    .from('shops')
    .select('*')
    .or(`email.ilike.${clean},phone.eq.${clean},phone.eq.${cleanDigits}`)
    .limit(1);
  
  if (error || !data || data.length === 0) {
    return {
      user: null,
      error: `No business account found with this ${method === 'EMAIL' ? 'email address' : 'mobile number'}. Please check your entry or create an account.`
    };
  }

  const shop = data[0] as ShopUser;

  // Verify password
  if (password) {
    if (shop.password && shop.password !== password) {
      return {
        user: null,
        error: 'Incorrect password for this account. Please check your password and try again.'
      };
    }
  }

  setCurrentShopId(shop.id);
  return { user: shop };
}

export async function sbLoginWithPhone(identifier: string): Promise<ShopUser | null> {
  const res = await sbLoginWithCredentials(identifier);
  return res.user;
}

export async function sbResetShopPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data: shops, error: findError } = await supabase
      .from('shops')
      .select('id, email')
      .ilike('email', cleanEmail)
      .limit(1);

    if (findError) return { success: false, error: findError.message };
    if (!shops || shops.length === 0) {
      return { success: false, error: `No business account found with email ${cleanEmail}.` };
    }

    const { error: updateError } = await supabase
      .from('shops')
      .update({ password: newPassword })
      .eq('id', shops[0].id);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update password.' };
  }
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
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) { console.error('sbGetCustomers:', error); return []; }
  if (!customers || customers.length === 0) return [];

  // Query all invoices to guarantee accurate balance calculation
  const { data: invoices } = await supabase
    .from('invoices')
    .select('customer_id, total_amount, paid_amount, status')
    .eq('shop_id', shopId)
    .neq('status', 'CANCELLED');

  const balanceMap = new Map<string, number>();
  (invoices || []).forEach((inv) => {
    const remaining = Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0));
    balanceMap.set(inv.customer_id, (balanceMap.get(inv.customer_id) || 0) + remaining);
  });

  return customers.map((c) => {
    const liveBal = balanceMap.has(c.id) ? balanceMap.get(c.id)! : (c.current_balance || 0);
    return {
      ...c,
      current_balance: liveBal
    };
  }) as Customer[];
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

export async function sbDeleteCustomer(customerId: string): Promise<boolean> {
  try {
    // 1. Find all customer invoices
    const { data: custInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('customer_id', customerId);

    const invoiceIds = (custInvoices || []).map((i) => i.id);

    // 2. Find all customer payments
    const { data: custPayments } = await supabase
      .from('payments')
      .select('id')
      .eq('customer_id', customerId);

    const paymentIds = (custPayments || []).map((p) => p.id);

    // 3. Delete allocations linked to this customer's invoices or payments
    if (invoiceIds.length > 0) {
      await supabase.from('payment_allocations').delete().in('invoice_id', invoiceIds);
    }
    if (paymentIds.length > 0) {
      await supabase.from('payment_allocations').delete().in('payment_id', paymentIds);
    }

    // 4. Delete invoice items
    if (invoiceIds.length > 0) {
      await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
    }

    // 5. Delete invoices
    await supabase.from('invoices').delete().eq('customer_id', customerId);

    // 6. Delete payments
    await supabase.from('payments').delete().eq('customer_id', customerId);

    // 7. Delete customer messages/reminders
    await supabase.from('customer_messages').delete().eq('customer_id', customerId);

    // 8. Delete the customer record
    const { error: delErr } = await supabase.from('customers').delete().eq('id', customerId);
    if (delErr) {
      console.error('sbDeleteCustomer error:', delErr);
      return false;
    }

    return true;
  } catch (err) {
    console.error('sbDeleteCustomer exception:', err);
    return false;
  }
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
  invoiceData: Omit<Invoice, 'id' | 'customer_id' | 'invoice_number' | 'created_at' | 'paid_amount' | 'status' | 'shop_id'> & {
    advance_paid?: number;
    advance_payment_mode?: Payment['payment_mode'];
  }
): Promise<Invoice> {
  const advanceAmount = Math.min(invoiceData.total_amount, Math.max(0, invoiceData.advance_paid || 0));
  const isFullyPaid = advanceAmount >= invoiceData.total_amount;
  const isPartiallyPaid = advanceAmount > 0;

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
    paid_amount: advanceAmount,
    status: isFullyPaid ? 'PAID' : isPartiallyPaid ? 'PARTIAL' : 'UNPAID',
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

  // If immediate partial/full payment was made on spot, record payment and allocation
  if (advanceAmount > 0) {
    const { count: payCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
    const receiptNumber = `REC-${new Date().getFullYear()}-${String((payCount || 0) + 1).padStart(3, '0')}`;
    const paymentId = `pay_${Date.now()}`;

    await supabase.from('payments').insert([{
      id: paymentId,
      shop_id: shopId,
      customer_id: customerId,
      receipt_number: receiptNumber,
      amount: advanceAmount,
      payment_mode: invoiceData.advance_payment_mode || 'CASH',
      discount_waived: 0,
      reference_note: `Down payment for ${invoiceNumber}`,
      created_at: new Date().toISOString()
    }]);

    await supabase.from('payment_allocations').insert([{
      id: `alloc_${Date.now()}`,
      payment_id: paymentId,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      allocated_amount: advanceAmount,
      created_at: new Date().toISOString()
    }]);
  }

  // Update customer balance directly with await (only adds the unpaid remaining debt)
  try {
    const remainingDue = invoice.total_amount - advanceAmount;
    const { data: cust } = await supabase
      .from('customers')
      .select('current_balance')
      .eq('id', customerId)
      .single();

    const newBal = (cust?.current_balance || 0) + remainingDue;
    await supabase
      .from('customers')
      .update({
        current_balance: newBal,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);
  } catch (err) {
    console.error('Failed to update customer balance in DB:', err);
  }

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
export async function sbDeletePayment(paymentId: string, customerId: string, shopId: string): Promise<boolean> {
  try {
    // 1. Delete allocations for this payment
    await supabase.from('payment_allocations').delete().eq('payment_id', paymentId);

    // 2. Delete payment
    await supabase.from('payments').delete().eq('id', paymentId);

    // 3. Recalculate customer balance and invoice paid amounts
    const { data: customerInvoices } = await supabase
      .from('invoices')
      .select('id, total_amount, paid_amount')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    const { data: remainingPayments } = await supabase
      .from('payments')
      .select('id, amount, discount_waived')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    let availableCredit = (remainingPayments || []).reduce((sum, p) => sum + (p.amount || 0) + (p.discount_waived || 0), 0);

    for (const inv of (customerInvoices || [])) {
      if (availableCredit >= inv.total_amount) {
        await supabase.from('invoices').update({ paid_amount: inv.total_amount, status: 'PAID' }).eq('id', inv.id);
        availableCredit -= inv.total_amount;
      } else if (availableCredit > 0) {
        await supabase.from('invoices').update({ paid_amount: availableCredit, status: 'PARTIAL' }).eq('id', inv.id);
        availableCredit = 0;
      } else {
        await supabase.from('invoices').update({ paid_amount: 0, status: 'UNPAID' }).eq('id', inv.id);
      }
    }

    return true;
  } catch (err) {
    console.error('sbDeletePayment error:', err);
    return false;
  }
}

export async function sbWipeAllShopData(shopId: string): Promise<boolean> {
  try {
    // 1. Get all customer and invoice IDs for this shop
    const { data: shopInvoices } = await supabase.from('invoices').select('id').eq('shop_id', shopId);
    const invoiceIds = (shopInvoices || []).map((i) => i.id);

    const { data: shopPayments } = await supabase.from('payments').select('id').eq('shop_id', shopId);
    const paymentIds = (shopPayments || []).map((p) => p.id);

    // 2. Delete payment allocations
    if (invoiceIds.length > 0) {
      await supabase.from('payment_allocations').delete().in('invoice_id', invoiceIds);
    }
    if (paymentIds.length > 0) {
      await supabase.from('payment_allocations').delete().in('payment_id', paymentIds);
    }

    // 3. Delete invoice items
    if (invoiceIds.length > 0) {
      await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
    }

    // 4. Delete invoices
    await supabase.from('invoices').delete().eq('shop_id', shopId);

    // 5. Delete payments
    await supabase.from('payments').delete().eq('shop_id', shopId);

    // 6. Delete customer messages
    await supabase.from('customer_messages').delete().eq('shop_id', shopId);

    // 7. Delete customers
    await supabase.from('customers').delete().eq('shop_id', shopId);

    return true;
  } catch (err) {
    console.error('sbWipeAllShopData error:', err);
    return false;
  }
}

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
