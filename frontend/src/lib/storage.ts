import { Customer, Invoice, Payment, DashboardMetrics, ShopUser, ShopCategory, CustomerMessage } from '../types';
import { DEMO_SHOPS, INITIAL_CUSTOMERS, INITIAL_INVOICES, INITIAL_PAYMENTS } from './mockData';
import { simulateFIFOPayment } from './fifo';

const STORAGE_KEYS = {
  CURRENT_USER: 'khata_current_user_v3',
  SHOPS: 'khata_shops_v3',
  CUSTOMERS: 'khata_customers_v3',
  INVOICES: 'khata_invoices_v3',
  PAYMENTS: 'khata_payments_v3',
  MESSAGES: 'khata_messages_v3',
};

export class KhataStore {
  // --- AUTH & SHOP MANAGEMENT ---
  static getShops(): ShopUser[] {
    if (typeof window === 'undefined') return DEMO_SHOPS;
    const data = localStorage.getItem(STORAGE_KEYS.SHOPS);
    if (!data) {
      this.saveShops(DEMO_SHOPS);
      return DEMO_SHOPS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEMO_SHOPS;
    }
  }

  static saveShops(shops: ShopUser[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
    }
  }

  static getCurrentUser(): ShopUser | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: ShopUser | null) {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  }

  static registerShop(shopData: {
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
  }): ShopUser {
    const shops = this.getShops();
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
    shops.push(newShop);
    this.saveShops(shops);
    this.setCurrentUser(newShop);
    return newShop;
  }

  static loginWithEmailOrPhone(identifier: string, password?: string): ShopUser | null {
    const shops = this.getShops();
    const cleanId = identifier.trim().toLowerCase();
    const found = shops.find((s) => {
      const matchEmail = s.email?.toLowerCase() === cleanId;
      const matchPhone = s.phone === cleanId || s.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '');
      return matchEmail || matchPhone;
    });

    if (found) {
      this.setCurrentUser(found);
      return found;
    }

    // Auto-create or login with identifier
    const newShop = this.registerShop({
      shop_name: identifier.includes('@') ? identifier.split('@')[0].toUpperCase() + ' ENTERPRISES' : 'MY KHATA SHOP',
      owner_name: identifier.includes('@') ? identifier.split('@')[0] : 'Shop Owner',
      phone: identifier.includes('@') ? '9800000000' : identifier,
      email: identifier.includes('@') ? identifier : undefined,
      password: password,
      shop_category: 'GENERAL',
    });
    return newShop;
  }

  static loginWithGoogle(profile?: { name?: string; email?: string }): ShopUser {
    const shops = this.getShops();
    const email = profile?.email || 'google.user@example.com';
    const name = profile?.name || 'Google Business User';

    const existing = shops.find((s) => s.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    const newShop = this.registerShop({
      shop_name: `${name}'s Digital Shop`,
      owner_name: name,
      phone: '9811223344',
      email: email,
      shop_category: 'GENERAL',
      address: 'Connected via Google Account'
    });
    return newShop;
  }

  static updateShopSettings(shopId: string, updatedData: Partial<ShopUser>): ShopUser | null {
    const shops = this.getShops();
    const idx = shops.findIndex((s) => s.id === shopId);
    if (idx !== -1) {
      shops[idx] = { ...shops[idx], ...updatedData };
      this.saveShops(shops);
      const currentUser = this.getCurrentUser();
      if (currentUser?.id === shopId) {
        this.setCurrentUser(shops[idx]);
      }
      return shops[idx];
    }
    return null;
  }

  static switchShop(shopId: string): ShopUser | null {
    const shops = this.getShops();
    const found = shops.find((s) => s.id === shopId);
    if (found) {
      this.setCurrentUser(found);
      return found;
    }
    return null;
  }

  static logout() {
    this.setCurrentUser(null);
  }

  // --- MULTI-TENANT DATA ACCESS (Filtered by Shop ID) ---
  static getAllCustomers(): Customer[] {
    if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) {
      this.saveAllCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  static saveAllCustomers(customers: Customer[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  static getCustomers(shopId?: string): Customer[] {
    const targetShopId = shopId || this.getCurrentUser()?.id;
    const all = this.getAllCustomers();
    if (!targetShopId) return [];
    return all.filter((c) => c.shop_id === targetShopId);
  }

  static getAllInvoices(): Invoice[] {
    if (typeof window === 'undefined') return INITIAL_INVOICES;
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!data) {
      this.saveAllInvoices(INITIAL_INVOICES);
      return INITIAL_INVOICES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_INVOICES;
    }
  }

  static saveAllInvoices(invoices: Invoice[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    }
  }

  static getInvoices(shopId?: string): Invoice[] {
    const targetShopId = shopId || this.getCurrentUser()?.id;
    const all = this.getAllInvoices();
    if (!targetShopId) return [];
    return all.filter((i) => i.shop_id === targetShopId);
  }

  static getAllPayments(): Payment[] {
    if (typeof window === 'undefined') return INITIAL_PAYMENTS;
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!data) {
      this.saveAllPayments(INITIAL_PAYMENTS);
      return INITIAL_PAYMENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PAYMENTS;
    }
  }

  static saveAllPayments(payments: Payment[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    }
  }

  static getPayments(shopId?: string): Payment[] {
    const targetShopId = shopId || this.getCurrentUser()?.id;
    const all = this.getAllPayments();
    if (!targetShopId) return [];
    return all.filter((p) => p.shop_id === targetShopId);
  }

  static getDashboardMetrics(shopId?: string): DashboardMetrics {
    const customers = this.getCustomers(shopId);
    const invoices = this.getInvoices(shopId);
    const payments = this.getPayments(shopId);

    const todayStr = new Date().toISOString().split('T')[0];

    const totalMarketDebt = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
    
    const creditGivenToday = invoices
      .filter((inv) => inv.created_at.startsWith(todayStr) && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const collectedToday = payments
      .filter((pay) => pay.created_at.startsWith(todayStr))
      .reduce((sum, pay) => sum + pay.amount, 0);

    const activeDebtorsCount = customers.filter((c) => (c.current_balance || 0) > 0).length;

    return {
      total_market_debt: totalMarketDebt,
      credit_given_today: creditGivenToday,
      collected_today: collectedToday,
      active_debtors: activeDebtorsCount,
      active_debtors_count: activeDebtorsCount
    };
  }

  static addCustomer(
    newCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'current_balance' | 'status' | 'shop_id'> & {
      status?: Customer['status'];
      shop_id?: string;
    }
  ): Customer {
    const allCustomers = this.getAllCustomers();
    const currentShopId = newCustomer.shop_id || this.getCurrentUser()?.id;
    if (!currentShopId) throw new Error('No shop active');

    const customer: Customer = {
      ...newCustomer,
      id: `cust_${Date.now()}`,
      shop_id: currentShopId,
      current_balance: 0,
      status: newCustomer.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    allCustomers.unshift(customer);
    this.saveAllCustomers(allCustomers);
    return customer;
  }

  static addInvoice(
    customerId: string,
    invoiceData: Omit<Invoice, 'id' | 'customer_id' | 'invoice_number' | 'created_at' | 'paid_amount' | 'status' | 'shop_id'>
  ): Invoice {
    const allCustomers = this.getAllCustomers();
    const allInvoices = this.getAllInvoices();
    const currentShopId = this.getCurrentUser()?.id;
    if (!currentShopId) throw new Error('No shop active');

    const customerIndex = allCustomers.findIndex((c) => c.id === customerId);
    if (customerIndex === -1) throw new Error('Customer not found');

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(allInvoices.length + 1).padStart(3, '0')}`;
    const invoice: Invoice = {
      ...invoiceData,
      id: `inv_${Date.now()}`,
      shop_id: currentShopId,
      customer_id: customerId,
      invoice_number: invoiceNumber,
      paid_amount: 0,
      status: 'UNPAID',
      created_at: new Date().toISOString()
    };

    allInvoices.unshift(invoice);
    this.saveAllInvoices(allInvoices);

    // Update customer running balance
    allCustomers[customerIndex].current_balance += invoice.total_amount;
    allCustomers[customerIndex].updated_at = new Date().toISOString();
    this.saveAllCustomers(allCustomers);

    return invoice;
  }

  static recordPayment(
    customerId: string,
    amount: number,
    paymentMode: Payment['payment_mode'],
    discountWaived: number = 0,
    referenceNote?: string
  ): Payment {
    const allCustomers = this.getAllCustomers();
    const allInvoices = this.getAllInvoices();
    const allPayments = this.getAllPayments();
    const currentShopId = this.getCurrentUser()?.id;
    if (!currentShopId) throw new Error('No shop active');

    const customerIndex = allCustomers.findIndex((c) => c.id === customerId);
    if (customerIndex === -1) throw new Error('Customer not found');

    const customerInvoices = allInvoices.filter((inv) => inv.customer_id === customerId);
    const fifoResult = simulateFIFOPayment(customerInvoices, amount, discountWaived);

    const paymentId = `pay_${Date.now()}`;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(allPayments.length + 1).padStart(3, '0')}`;

    // Apply allocations to invoices
    const allocations = fifoResult.allocations.map((alloc) => {
      const invIdx = allInvoices.findIndex((i) => i.id === alloc.invoice_id);
      if (invIdx !== -1) {
        allInvoices[invIdx].paid_amount += alloc.allocated_amount;
        allInvoices[invIdx].status = alloc.resulting_status;
      }
      return {
        id: `alloc_${Date.now()}_${alloc.invoice_id}`,
        payment_id: paymentId,
        invoice_id: alloc.invoice_id,
        invoice_number: alloc.invoice_number,
        allocated_amount: alloc.allocated_amount,
        created_at: new Date().toISOString()
      };
    });

    const payment: Payment = {
      id: paymentId,
      shop_id: currentShopId,
      customer_id: customerId,
      receipt_number: receiptNumber,
      amount: amount,
      payment_mode: paymentMode,
      discount_waived: discountWaived,
      reference_note: referenceNote,
      allocations: allocations,
      created_at: new Date().toISOString()
    };

    allPayments.unshift(payment);
    this.saveAllPayments(allPayments);
    this.saveAllInvoices(allInvoices);

    // Update customer running balance
    const totalSettled = amount + discountWaived;
    allCustomers[customerIndex].current_balance = Math.max(0, allCustomers[customerIndex].current_balance - totalSettled);
    allCustomers[customerIndex].updated_at = new Date().toISOString();
    this.saveAllCustomers(allCustomers);

    return payment;
  }

  // --- CUSTOMER MESSAGES DB ---
  static getAllMessages(): CustomerMessage[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveAllMessages(messages: CustomerMessage[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    }
  }

  static getCustomerMessages(shopId: string, customerId: string): CustomerMessage[] {
    const all = this.getAllMessages();
    return all.filter((m) => m.shop_id === shopId && m.customer_id === customerId);
  }

  static saveCustomerMessage(
    shopId: string,
    customerId: string,
    messageText: string,
    tone: 'polite' | 'formal' | 'urgent' | 'custom' = 'custom'
  ): CustomerMessage {
    const all = this.getAllMessages();
    const newMsg: CustomerMessage = {
      id: `msg_${Date.now()}`,
      shop_id: shopId,
      customer_id: customerId,
      message_text: messageText,
      tone: tone,
      sent_via: 'WHATSAPP',
      created_at: new Date().toISOString()
    };
    all.unshift(newMsg);
    this.saveAllMessages(all);
    return newMsg;
  }

  static resetToDefault() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.SHOPS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.INVOICES);
      localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    }
  }
}
