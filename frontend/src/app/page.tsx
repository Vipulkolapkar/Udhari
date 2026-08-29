'use client';
import { LogOut } from 'lucide-react';
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
  const [searchMode, setSearchMode] = useState<'NAME' | 'PHONE'>('NAME');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthSuccessState, setOauthSuccessState] = useState<{ isSuccess: boolean; title: string; subtitle: string } | null>(null);
  const [prefilledAuth, setPrefilledAuth] = useState<{
    tab?: 'LOGIN' | 'REGISTER';
    email?: string;
    ownerName?: string;
    isEmailVerified?: boolean;
    message?: string;
  } | null>(null);

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

    // Check if the current page load was specifically caused by an OAuth/MagicLink callback redirect in URL
    const hasAuthHash = typeof window !== 'undefined' && (
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('type=signup') ||
      window.location.search.includes('code=')
    );
    const alreadyProcessed = typeof window !== 'undefined' && sessionStorage.getItem('udhari_oauth_processed') === 'true';
    const isAuthRedirectLanding = hasAuthHash && !alreadyProcessed;

    if (hasAuthHash && typeof window !== 'undefined') {
      sessionStorage.setItem('udhari_oauth_processed', 'true');
      // Clean the address bar immediately to prevent re-triggering on tab switches
      window.history.replaceState(null, '', window.location.pathname);
    }

    // ─── Listen for Email Verification / Link Click Redirects ───
    const handleAuthEvent = async (session: any, isFreshRedirect: boolean) => {
      if (!session?.user) return;

      // Only show the gamified tick mark overlay if this was an actual fresh OAuth/link redirect landing
      if (isFreshRedirect) {
        setOauthSuccessState({
          isSuccess: true,
          title: 'Success!',
          subtitle: 'Preparing your business workspace...'
        });
      }

      if (typeof window !== 'undefined') {
        const pending = localStorage.getItem('udhari_pending_registration');
        if (pending) {
          try {
            const shopData = JSON.parse(pending);
            localStorage.removeItem('udhari_pending_registration');
            const newShop = await sbRegisterShop(shopData);
            sbSetCurrentUser(newShop);
            await refreshData(newShop.id);
            if (isFreshRedirect) {
              setOauthSuccessState({
                isSuccess: true,
                title: 'Success!',
                subtitle: `Welcome, ${newShop.owner_name} (${newShop.shop_name})`
              });
              await new Promise((r) => setTimeout(r, 1500));
              setOauthSuccessState(null);
            }
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
            if (isFreshRedirect) {
              setOauthSuccessState({
                isSuccess: true,
                title: 'Success!',
                subtitle: `Welcome back, ${matchedShop.owner_name} (${matchedShop.shop_name})`
              });
              await new Promise((r) => setTimeout(r, 1500));
              setOauthSuccessState(null);
            }
            showToast(`Signed in to ${matchedShop.shop_name}`);
            return;
          } else if (userEmail) {
            // Account does NOT exist yet! Route to registration with prefilled verified email
            setOauthSuccessState(null);
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
            setPrefilledAuth({
              tab: 'REGISTER',
              email: userEmail,
              ownerName: fullName,
              isEmailVerified: true,
              message: `✅ Email verified (${userEmail}). No registered business found. Please enter your business details below to complete registration.`
            });
            showToast('No account found. Please complete business registration.');
            return;
          }
        } catch (e) {
          console.error('Shop match error:', e);
        }
      }

      await refreshData();
      if (isFreshRedirect) {
        setOauthSuccessState(null);
      }
    };

    // Only process redirect landing if URL explicitly contains auth token/code
    if (isAuthRedirectLanding) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleAuthEvent(session, true);
        }
      });
    }

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore background tab focus / token refresh events
      if (event === 'SIGNED_IN' && isAuthRedirectLanding) {
        await handleAuthEvent(session, true);
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

  // ─── Gamified OAuth / Verification Success Overlay ─────────────────
  if (oauthSuccessState) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Glow Background Pulse */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Gamified Tick Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--color-credit-bg)',
            border: '2.5px solid var(--color-credit)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 0 35px rgba(52, 211, 153, 0.35)',
            animation: 'popSuccess 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--color-credit)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Title & Subtitle */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 0.4rem 0'
            }}>
              {oauthSuccessState.title}
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.4
            }}>
              {oauthSuccessState.subtitle}
            </p>
          </div>

          {/* Gamified Progress Bar */}
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginTop: '0.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #34d399, #10b981)',
              borderRadius: '9999px',
              animation: 'fillProgress 1.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            }} />
          </div>



          <style>{`
            @keyframes popSuccess {
              0% { transform: scale(0.4); opacity: 0; }
              70% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fillProgress {
              0% { width: 5%; }
              50% { width: 65%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
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
              onVoiceBillClick={() => setIsVoiceModalOpen(true)}
              onAddCustomerClick={() => setIsAddCustomerOpen(true)}
            />
            <DashboardStats metrics={metrics} language={language} />
            <CustomerSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchMode={searchMode}
              onSearchModeChange={setSearchMode}
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
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  fontWeight: 700,
                  background: 'var(--color-debit)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
                onClick={handleLogout}
              >
                Sign Out
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
