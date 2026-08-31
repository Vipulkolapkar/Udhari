'use client';
import { LogOut, Trash2, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Customer, Invoice, Payment, PaymentMode, Language, DashboardMetrics, InvoiceItem, ShopUser, ShopCategory, ThemeMode } from '../types';
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
  sbDeleteCustomer,
  sbGetInvoices,
  sbAddInvoice,
  sbGetPayments,
  sbRecordPayment,
  sbDeletePayment,
  sbGetDashboardMetrics,
  sbSaveCustomerMessage,
} from '../lib/supabaseStore';

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
import { AddCustomerModal } from '../components/AddCustomerModal';
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
  const [searchMode, setSearchMode] = useState<'NAME' | 'PHONE'>('NAME');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  const [prefilledAuth, setPrefilledAuth] = useState<{
    tab?: 'LOGIN' | 'REGISTER';
    email?: string;
    ownerName?: string;
    isEmailVerified?: boolean;
    message?: string;
  } | null>(null);

  // Active Modals State
  const [billModalCustomer, setBillModalCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState<Customer | null>(null);
  const [whatsappModalCustomer, setWhatsappModalCustomer] = useState<Customer | null>(null);
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

      const isOAuthLanding = window.location.hash.includes('access_token') ||
        window.location.hash.includes('type=signup') ||
        window.location.search.includes('code=');
      if (isOAuthLanding) {
        setIsOAuthRedirecting(true);
      }
    }
    refreshData().finally(() => setIsInitialized(true));

    // ─── Listen for Google OAuth / Auth Events ───
    const handleAuthEvent = async (session: any) => {
      if (!session?.user?.email) return;
      const userEmail = session.user.email.toLowerCase();

      try {
        const allShops = await sbGetShops();
        const matchedShop = allShops.find((s) => s.email?.toLowerCase() === userEmail);

        if (matchedShop) {
          sbSetCurrentUser(matchedShop);
          await refreshData(matchedShop.id);
          showToast(`Welcome back, ${matchedShop.owner_name || matchedShop.shop_name}!`);
        } else {
          // If no account exists for this Google email, display corresponding message and guide to register
          await supabase.auth.signOut().catch(() => {});
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          setPrefilledAuth({
            tab: 'REGISTER',
            email: userEmail,
            ownerName: fullName,
            isEmailVerified: true,
            message: `No registered business found for "${userEmail}". Please complete registration below to create your account.`
          });
          showToast(`No registered account found for ${userEmail}. Please register.`);
        }
      } catch (e) {
        console.error('Google Auth event error:', e);
        await refreshData();
      } finally {
        setIsOAuthRedirecting(false);
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthEvent(session);
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
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
    const qText = searchQuery.toLowerCase().trim();
    const qDigits = searchQuery.trim().replace(/\D/g, '');

    return customers.filter((c) => {
      if (searchMode === 'PHONE') {
        return qDigits ? c.phone?.includes(qDigits) : c.phone?.toLowerCase().includes(qText);
      } else {
        const matchName = c.name.toLowerCase().includes(qText);
        const matchLandmark = c.address_landmark?.toLowerCase().includes(qText);
        return matchName || matchLandmark;
      }
    });
  }, [customers, searchQuery, searchMode]);

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
        showToast(`Welcome back, ${res.user.owner_name || res.user.shop_name}!`);
      return { success: true };
    } else {
      const errMsg = res.error || 'Account not found or incorrect credentials.';
      showToast(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed.';
      showToast(msg);
    }
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
        showToast(`Welcome! Business "${newShop.shop_name}" registered successfully!`);
    } catch (err) {
      showToast('Registration failed. Please try again.');
      console.error(err);
    }
  };

  const handleLogout = async () => {
    setIsSignOutConfirmOpen(false);
    try {
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('khata_current_shop_id_v1');
      sessionStorage.clear();
    }
    sbSetCurrentUser(null);
    setCurrentShop(null);
    setPrefilledAuth(null);
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
      advance_paid?: number;
      advance_payment_mode?: PaymentMode;
    }
  ) => {
    if (!currentShop) return;
    try {
      await sbAddInvoice(currentShop.id, customerId, billData);
      await refreshData(currentShop.id);
      setBillModalCustomer(null);
      const remaining = billData.total_amount - (billData.advance_paid || 0);
      if (billData.advance_paid && billData.advance_paid > 0) {
        showToast(`Bill created: ₹${billData.advance_paid} paid on spot, ₹${remaining} added to credit.`);
      } else {
        showToast(t.billCreatedSuccess);
      }
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

  // ─── Delete Payment ───────────────────────────────────────────────
  const handleDeletePayment = async (paymentId: string) => {
    if (!currentShop || !ledgerModalCustomer) return;
    try {
      const ok = await sbDeletePayment(paymentId, ledgerModalCustomer.id, currentShop.id);
      if (ok) {
        await refreshData(currentShop.id);
        showToast('Payment record deleted and balance restored.');
      } else {
        showToast('Failed to delete payment.');
      }
    } catch (err) {
      console.error('Delete payment error:', err);
      showToast('Error deleting payment.');
    }
  };

  // ─── Delete Customer & All History ───────────────────────────────
  const handleDeleteCustomer = async (customer: Customer) => {
    if (!currentShop || isDeletingCustomer) return;
    setIsDeletingCustomer(true);
    try {
      const ok = await sbDeleteCustomer(customer.id);
      if (ok) {
        setCustomerToDelete(null);
        setLedgerModalCustomer(null);
        await refreshData(currentShop.id);
        showToast(`Deleted "${customer.name}" and all history.`);
      } else {
        showToast('Failed to delete customer. Try again.');
      }
    } catch (err) {
      console.error('Delete customer error:', err);
      showToast('Error deleting customer.');
    } finally {
      setIsDeletingCustomer(false);
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
    if (currentShop) {
      await refreshData(currentShop.id);
    }
    setCurrentView('DASHBOARD');
    showToast('All customer and ledger data deleted.');
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

  // ─── Gamified OAuth / Verification Success Overlay ─────────────────
  if (isOAuthRedirecting) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-app, #0f141f)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999999
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '2px solid var(--color-credit, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.25)'
        }}>
          <Check size={38} color="var(--color-credit, #22c55e)" strokeWidth={3} />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
          Signed in with Google!
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
          Loading your business dashboard...
        </p>
      </div>
    );
  }

  if (!currentShop) {
    return (
      <div style={{ position: 'relative' }}>
        <AuthScreen
          language={language}
          theme={theme}
          existingShops={existingShops}
          initialTab={prefilledAuth?.tab || 'LOGIN'}
          initialEmail={prefilledAuth?.email || ''}
          initialOwnerName={prefilledAuth?.ownerName || ''}
          initialEmailVerified={prefilledAuth?.isEmailVerified || false}
          infoBanner={prefilledAuth?.message || null}
          onLogin={handleLoginShop}
          onLoginWithEmail={handleLoginWithEmail}
          onLoginWithGoogle={handleLoginWithGoogle}
          onRegister={handleRegisterShop}
        />
        {/* Global Toast on Auth Screen */}
        {toastMessage && (
          <div className="toast-container" style={{ zIndex: 999999 }}>
            <div className="toast">
              <span style={{ color: 'var(--color-credit)', fontWeight: 700 }}>✓</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
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
        onSelectView={(view) => { setToastMessage(null); setCurrentView(view); }}
        onLogout={() => setIsSignOutConfirmOpen(true)}
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
              onAddCustomerClick={() => setIsAddCustomerOpen(true)}
            />
            <DashboardStats metrics={metrics} language={language} />
            <CustomerSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchMode={searchMode}
              onSearchModeChange={setSearchMode}
              language={language}
            />

            <section>
              <div className="customers-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span>{t.customerListTitle}</span>
                  <span className="customer-count-badge">{filteredCustomers.length}</span>
                </h2>
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
                      onDeleteCustomerClick={setCustomerToDelete}
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
            onBackToDashboard={() => { setToastMessage(null); setCurrentView('DASHBOARD'); }}
            onSaveShopSettings={handleSaveShopSettings}
          />
        ) : (
          <SettingsView
            currentShop={currentShop}
            language={language}
            theme={theme}
            customers={customers}
            invoices={invoices}
            payments={payments}
            onBackToDashboard={() => { setToastMessage(null); setCurrentView('DASHBOARD'); }}
            onLanguageChange={handleLanguageChange}
            onThemeChange={handleThemeChange}
            onSaveShopSettings={handleSaveShopSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Modals */}

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
          onDeletePaymentClick={handleDeletePayment}
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



      {isAddCustomerOpen && (
        <AddCustomerModal
          language={language}
          onClose={() => setIsAddCustomerOpen(false)}
          onSubmit={handleAddCustomer}
        />
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsSignOutConfirmOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', width: '100%', padding: '1.75rem', textAlign: 'center' }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-debit-bg)',
              border: '1.5px solid var(--color-debit-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <LogOut size={26} color="var(--color-debit)" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Sign Out Confirmation
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to sign out of <strong>{currentShop?.shop_name || 'your business account'}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.65rem 1rem', fontWeight: 600 }}
                onClick={() => setIsSignOutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                disabled={isSigningOut}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  fontWeight: 700,
                  background: 'var(--color-debit)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isSigningOut ? 'not-allowed' : 'pointer',
                  opacity: isSigningOut ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem'
                }}
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await handleLogout();
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <span>Sign Out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="modal-overlay" onClick={() => setCustomerToDelete(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', textAlign: 'center' }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-debit-bg)',
              border: '1.5px solid var(--color-debit-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Trash2 size={26} color="var(--color-debit)" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Delete Customer Account?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
              Are you sure you want to permanently delete <strong>{customerToDelete.name}</strong>?
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}>
              ⚠️ This will permanently erase:
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0 }}>
                <li>All credit bills & invoice items</li>
                <li>All payment history & receipts</li>
                <li>All ledger records and balance dues</li>
              </ul>
              {customerToDelete.current_balance > 0 && (
                <div style={{ marginTop: '0.5rem', color: 'var(--color-debit)', fontWeight: 700 }}>
                  Current Outstanding Due: ₹{customerToDelete.current_balance.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.65rem 1rem', fontWeight: 600 }}
                onClick={() => setCustomerToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                disabled={isDeletingCustomer}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  fontWeight: 700,
                  background: 'var(--color-debit)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isDeletingCustomer ? 'not-allowed' : 'pointer',
                  opacity: isDeletingCustomer ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem'
                }}
                onClick={() => handleDeleteCustomer(customerToDelete)}
              >
                {isDeletingCustomer ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Everything</span>
                )}
              </button>
            </div>
          </div>
        </div>
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
