'use client';
import { supabase } from '../lib/supabase';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Customer, Invoice, Payment, Language, DashboardMetrics, InvoiceItem, ShopUser, ShopCategory, ThemeMode } from '../types';
import { getTranslation } from '../lib/translations';

// Supabase Store (async, real database)
import {
  sbGetCurrentUser,
  sbSetCurrentUser,
  sbGetShops,
  sbLoginWithPhone,
  sbLoginWithCredentials,
  sbRegisterShop,
  sbUpdateShop,
  sbGetCustomers,
  sbAddCustomer,
  sbGetInvoices,
  sbAddInvoice,
  sbGetPayments,
  sbRecordPayment,
  sbGetDashboardMetrics,
  sbSaveCustomerMessage,
} from '../lib/supabaseStore';

// LocalStorage fallback for offline metrics
import { KhataStore } from '../lib/storage';

// Components
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { AuthScreen } from '../components/AuthScreen';
import { SettingsView } from '../components/SettingsView';
import { DashboardStats } from '../components/DashboardStats';
import { CustomerSearchBar } from '../components/CustomerSearchBar';
import { CustomerCard } from '../components/CustomerCard';
import { CreateBillModal } from '../components/CreateBillModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { LedgerModal } from '../components/LedgerModal';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { VoiceBillModal } from '../components/VoiceBillModal';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { AuthModal } from '../components/AuthModal';
import { ProfileView } from '../components/ProfileView';

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'PROFILE' | 'SETTINGS'>('DASHBOARD');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentShop, setCurrentShop] = useState<ShopUser | null>(null);
  const [existingShops, setExistingShops] = useState<ShopUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_market_debt: 0,
    credit_given_today: 0,
    collected_today: 0,
    active_debtors: 0,
    active_debtors_count: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Active Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [billModalCustomer, setBillModalCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState<Customer | null>(null);
  const [whatsappModalCustomer, setWhatsappModalCustomer] = useState<Customer | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ─── Load all data from Supabase ─────────────────────────────────
  const refreshData = useCallback(async (shopId?: string) => {
    setIsLoading(true);
    try {
      const [user, shops] = await Promise.all([
        sbGetCurrentUser(),
        sbGetShops()
      ]);

      const activeShopId = shopId || user?.id;
      setCurrentShop(user);
      setExistingShops(shops);

      if (activeShopId) {
        const [custs, invs, pays, met] = await Promise.all([
          sbGetCustomers(activeShopId),
          sbGetInvoices(activeShopId),
          sbGetPayments(activeShopId),
          sbGetDashboardMetrics(activeShopId)
        ]);
        setCustomers(custs);
        setInvoices(invs);
        setPayments(pays);
        setMetrics(met);
      } else {
        setCustomers([]);
        setInvoices([]);
        setPayments([]);
        setMetrics({ total_market_debt: 0, credit_given_today: 0, collected_today: 0, active_debtors: 0, active_debtors_count: 0 });
      }
    } catch (err) {
      console.error('refreshData error:', err);
      showToast('Connection issue. Check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Init on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('khata_theme_v1') as ThemeMode) || 'dark';
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
      setLanguage('en');

      const savedSidebar = localStorage.getItem('khata_sidebar_collapsed');
      setIsSidebarCollapsed(savedSidebar === 'true' ? true : false);
    }
    refreshData().finally(() => setIsInitialized(true));

    // ─── Listen for Email Verification / Link Click Redirects Across Tabs ───
    const handleAuthEvent = async (session: any) => {
      if (!session?.user) return;

      if (typeof window !== 'undefined') {
        const pending = localStorage.getItem('udhari_pending_registration');
        if (pending) {
          try {
            const shopData = JSON.parse(pending);
            localStorage.removeItem('udhari_pending_registration');
            const newShop = await sbRegisterShop(shopData);
            sbSetCurrentUser(newShop);
            await refreshData(newShop.id);
            showToast(`Welcome! Business "${newShop.shop_name}" registered successfully!`);
            return;
          } catch (e) {
            console.error('Pending registration error:', e);
          }
        }

        // If no pending registration, check if user matches an existing shop
        try {
          const allShops = await sbGetShops();
          const userEmail = session.user.email?.toLowerCase();
          const matchedShop = allShops.find((s) => s.email?.toLowerCase() === userEmail);
          if (matchedShop) {
            sbSetCurrentUser(matchedShop);
            await refreshData(matchedShop.id);
            showToast(`Signed in to ${matchedShop.shop_name}`);
            return;
          }
        } catch (e) {
          console.error('Shop match error:', e);
        }
      }

      await refreshData();
    };

    // Check on mount if landed via email link hash / query
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthEvent(session);
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        await handleAuthEvent(session);
      }
    });

    return () => { authSub.subscription.unsubscribe(); };
  }, [refreshData]);

  const t = getTranslation(language);

  // ─── Filtered Customers ───────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return [...customers].sort((a, b) => b.current_balance - a.current_balance);
    }
    const q = searchQuery.toLowerCase().trim().replace(/\D/g, '');
    const qText = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const matchPhone = q ? c.phone?.includes(q) : false;
      const matchName = c.name.toLowerCase().includes(qText);
      const matchLandmark = c.address_landmark?.toLowerCase().includes(qText);
      return matchPhone || matchName || matchLandmark;
    });
  }, [customers, searchQuery]);

  // ─── Sidebar ──────────────────────────────────────────────────────
  const handleToggleSidebar = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_sidebar_collapsed', String(nextVal));
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_theme_v1', newTheme);
      document.body.setAttribute('data-theme', newTheme);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_lang_v1', newLang);
    }
  };

  // ─── Auth Handlers ────────────────────────────────────────────────
  const handleLoginShop = async (shop: ShopUser) => {
    sbSetCurrentUser(shop);
    await refreshData(shop.id);
    setIsAuthModalOpen(false);
    showToast(`Signed in to ${shop.shop_name}`);
  };

  const handleLoginWithEmail = async (
    identifier: string,
    password?: string,
    method: 'EMAIL' | 'PHONE' = 'EMAIL'
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await sbLoginWithCredentials(identifier, password, method);
    if (res.user) {
      sbSetCurrentUser(res.user);
      await refreshData(res.user.id);
      setIsAuthModalOpen(false);
      showToast(`Signed in to ${res.user.shop_name}`);
      return { success: true };
    } else {
      const errMsg = res.error || 'Account not found or incorrect credentials.';
      showToast(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleLoginWithGoogle = async () => {
    showToast('Google login coming soon!');
  };

  const handleRegisterShop = async (shopData: {
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
  }) => {
    try {
      const newShop = await sbRegisterShop(shopData);
      await refreshData(newShop.id);
      setIsAuthModalOpen(false);
      showToast(`Welcome! Business "${newShop.shop_name}" registered successfully!`);
    } catch (err) {
      showToast('Registration failed. Please try again.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    sbSetCurrentUser(null);
    setCurrentShop(null);
    setCurrentView('DASHBOARD');
    setCustomers([]);
    setInvoices([]);
    setPayments([]);
    setMetrics({ total_market_debt: 0, credit_given_today: 0, collected_today: 0, active_debtors: 0, active_debtors_count: 0 });
    showToast('Signed out successfully');
  };

  // ─── Shop Profile Update ──────────────────────────────────────────
  const handleSaveShopSettings = async (updatedData: Partial<ShopUser>) => {
    if (currentShop) {
      const updated = await sbUpdateShop(currentShop.id, updatedData);
      if (updated) {
        setCurrentShop(updated);
        showToast(t.settingsSavedSuccess);
      }
    }
  };

  // ─── Bill / Invoice Creation ──────────────────────────────────────
  const handleCreateBill = async (
    customerId: string,
    billData: {
      items: InvoiceItem[];
      total_amount: number;
      discount_amount: number;
      taken_by_name?: string;
      notes?: string;
      due_date?: string;
    }
  ) => {
    if (!currentShop) return;
    try {
      await sbAddInvoice(currentShop.id, customerId, billData);
      await refreshData(currentShop.id);
      setBillModalCustomer(null);
      showToast(t.billCreatedSuccess);
    } catch (err) {
      showToast('Failed to create bill. Try again.');
      console.error(err);
    }
  };

  // ─── Record Payment ───────────────────────────────────────────────
  const handleRecordPayment = async (
    customerId: string,
    amount: number,
    paymentMode: Payment['payment_mode'],
    discountWaived: number,
    referenceNote?: string
  ) => {
    if (!currentShop) return;
    const customerInvoices = invoices.filter((i) => i.customer_id === customerId);
    try {
      await sbRecordPayment(currentShop.id, customerId, customerInvoices, amount, paymentMode, discountWaived, referenceNote);
      await refreshData(currentShop.id);
      setPaymentModalCustomer(null);
      showToast(t.recordPaymentSuccess);
    } catch (err) {
      showToast('Failed to record payment. Try again.');
      console.error(err);
    }
  };

  // ─── Add Customer ─────────────────────────────────────────────────
  const handleAddCustomer = async (data: {
    name: string;
    phone: string;
    address_landmark?: string;
    credit_limit?: number;
  }) => {
    if (!currentShop) return;
    try {
      const newCust = await sbAddCustomer(currentShop.id, {
        name: data.name,
        phone: data.phone || '',
        address_landmark: data.address_landmark,
        credit_limit: data.credit_limit || 10000
      });
      await refreshData(currentShop.id);
      setIsAddCustomerOpen(false);
      showToast(`Added customer ${newCust.name}`);
    } catch (err) {
      showToast('Failed to add customer. Try again.');
      console.error(err);
    }
  };

  // ─── Reset Data ───────────────────────────────────────────────────
  const handleResetData = async () => {
    // For now just clears session & reloads
    handleLogout();
    showToast('Data reset. Please sign in again.');
  };

  // ─── Voice Recognition ────────────────────────────────────────────
  const handleVoiceRecognized = (customer: Customer, _amount: number, _note: string) => {
    setIsVoiceModalOpen(false);
    setBillModalCustomer(customer);
  };

  // ─── Loading / Init Guard ─────────────────────────────────────────
  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid var(--btn-primary-bg)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connecting to Udhari...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Auth Screen ──────────────────────────────────────────────────
  if (!currentShop) {
    return (
      <AuthScreen
        language={language}
        theme={theme}
        existingShops={existingShops}
        onLogin={handleLoginShop}
        onLoginWithEmail={handleLoginWithEmail}
        onLoginWithGoogle={handleLoginWithGoogle}
        onRegister={handleRegisterShop}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Adjustable Navigation Sidebar */}
      <Sidebar
        isOpen={!isSidebarCollapsed}
        currentView={currentView}
        currentShop={currentShop}
        onToggle={handleToggleSidebar}
        onSelectView={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Main Layout */}
      <main className="app-main-layout">
        {isLoading && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--btn-primary-bg), var(--color-credit))',
            zIndex: 9999,
            animation: 'pulse 1s ease-in-out infinite'
          }} />
        )}

        {currentView === 'DASHBOARD' ? (
          <>
            <Header
              currentShop={currentShop}
              language={language}
              onVoiceBillClick={() => setIsVoiceModalOpen(true)}
              onAddCustomerClick={() => setIsAddCustomerOpen(true)}
            />
            <DashboardStats metrics={metrics} language={language} />
            <CustomerSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              language={language}
              onVoiceClick={() => setIsVoiceModalOpen(true)}
            />

            <section>
              <div className="customers-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span>{t.customerListTitle}</span>
                  <span className="customer-count-badge">{filteredCustomers.length}</span>
                </h2>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddCustomerOpen(true)}
                  style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0.4rem 0.85rem' }}
                >
                  <span>+ {t.addCustomer}</span>
                </button>
              </div>

              {filteredCustomers.length === 0 ? (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {searchQuery ? t.noCustomersFound : 'No customers yet'}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {searchQuery
                      ? 'Try a different name or phone number.'
                      : 'Click "+ Add Customer" to create your first customer account.'}
                  </p>
                </div>
              ) : (
                <div className="customer-grid">
                  {filteredCustomers.map((cust) => (
                    <CustomerCard
                      key={cust.id}
                      customer={cust}
                      language={language}
                      onGiveCreditClick={setBillModalCustomer}
                      onGotPaymentClick={setPaymentModalCustomer}
                      onWhatsAppClick={setWhatsappModalCustomer}
                      onViewLedgerClick={setLedgerModalCustomer}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : currentView === 'PROFILE' ? (
          <ProfileView
            currentShop={currentShop}
            customers={customers}
            invoices={invoices}
            payments={payments}
            onBackToDashboard={() => setCurrentView('DASHBOARD')}
            onSaveShopSettings={handleSaveShopSettings}
          />
        ) : (
          <SettingsView
            currentShop={currentShop}
            language={language}
            theme={theme}
            onBackToDashboard={() => setCurrentView('DASHBOARD')}
            onLanguageChange={handleLanguageChange}
            onThemeChange={handleThemeChange}
            onSaveShopSettings={handleSaveShopSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Modals */}
      {isAuthModalOpen && (
        <AuthModal
          language={language}
          existingShops={existingShops}
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLoginShop}
          onLoginWithEmail={handleLoginWithEmail}
          onLoginWithGoogle={handleLoginWithGoogle}
          onRegister={handleRegisterShop}
        />
      )}

      {billModalCustomer && (
        <CreateBillModal
          customer={billModalCustomer}
          currentShop={currentShop}
          language={language}
          onClose={() => setBillModalCustomer(null)}
          onSubmit={handleCreateBill}
        />
      )}

      {paymentModalCustomer && (
        <RecordPaymentModal
          customer={paymentModalCustomer}
          customerInvoices={invoices.filter((i) => i.customer_id === paymentModalCustomer.id)}
          language={language}
          onClose={() => setPaymentModalCustomer(null)}
          onSubmit={handleRecordPayment}
        />
      )}

      {ledgerModalCustomer && (
        <LedgerModal
          customer={ledgerModalCustomer}
          invoices={invoices.filter((i) => i.customer_id === ledgerModalCustomer.id)}
          payments={payments.filter((p) => p.customer_id === ledgerModalCustomer.id)}
          language={language}
          onClose={() => setLedgerModalCustomer(null)}
          onGiveCreditClick={setBillModalCustomer}
          onGotPaymentClick={setPaymentModalCustomer}
        />
      )}

      {whatsappModalCustomer && (
        <WhatsAppModal
          customer={whatsappModalCustomer}
          currentShop={currentShop}
          language={language}
          onClose={() => setWhatsappModalCustomer(null)}
        />
      )}

      {isVoiceModalOpen && (
        <VoiceBillModal
          customers={customers}
          language={language}
          onClose={() => setIsVoiceModalOpen(false)}
          onRecognized={handleVoiceRecognized}
        />
      )}

      {isAddCustomerOpen && (
        <AddCustomerModal
          language={language}
          onClose={() => setIsAddCustomerOpen(false)}
          onSubmit={handleAddCustomer}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <span style={{ color: 'var(--color-credit)', fontWeight: 700 }}>✓</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
