'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Invoice, Payment, Language, DashboardMetrics, InvoiceItem, ShopUser, ShopCategory, ThemeMode } from '../types';
import { KhataStore } from '../lib/storage';
import { getTranslation } from '../lib/translations';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Active Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [billModalCustomer, setBillModalCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState<Customer | null>(null);
  const [whatsappModalCustomer, setWhatsappModalCustomer] = useState<Customer | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Load from storage on mount & on shop switch
  const refreshData = () => {
    const user = KhataStore.getCurrentUser();
    const shops = KhataStore.getShops();
    setCurrentShop(user);
    setExistingShops(shops);
    setCustomers(KhataStore.getCustomers(user?.id));
    setInvoices(KhataStore.getInvoices(user?.id));
    setPayments(KhataStore.getPayments(user?.id));

    // Load theme from localStorage (Language fixed to English)
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('khata_theme_v1') as ThemeMode) || 'dark';
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);

      // Force English as the single primary language
      setLanguage('en');
      localStorage.setItem('khata_lang_v1', 'en');

      const savedSidebar = localStorage.getItem('khata_sidebar_collapsed');
      if (savedSidebar !== null) {
        setIsSidebarCollapsed(savedSidebar === 'true');
      } else {
        setIsSidebarCollapsed(false); // Open by default
      }
    }
    setIsInitialized(true);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_lang_v1', newLang);
    }
  };

  const handleToggleSidebar = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_sidebar_collapsed', String(nextVal));
    }
  };

  const handleThemeToggle = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_theme_v1', nextTheme);
      document.body.setAttribute('data-theme', nextTheme);
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('khata_theme_v1', newTheme);
      document.body.setAttribute('data-theme', newTheme);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const metrics: DashboardMetrics = useMemo(() => {
    return KhataStore.getDashboardMetrics(currentShop?.id);
  }, [currentShop, customers, invoices, payments]);

  const t = getTranslation(language);

  // Instant Sub-50ms Search Filtering (matches name or phone number)
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return [...customers].sort((a, b) => b.current_balance - a.current_balance);
    }
    const q = searchQuery.toLowerCase().trim().replace(/\D/g, ''); // Numbers only for phone
    const qText = searchQuery.toLowerCase().trim();

    return customers.filter((c) => {
      const matchPhone = q ? c.phone.includes(q) : false;
      const matchName = c.name.toLowerCase().includes(qText);
      const matchLandmark = c.address_landmark?.toLowerCase().includes(qText);
      return matchPhone || matchName || matchLandmark;
    });
  }, [customers, searchQuery]);

  // Auth Handlers
  const handleLoginShop = (shop: ShopUser) => {
    KhataStore.setCurrentUser(shop);
    refreshData();
    setIsAuthModalOpen(false);
    showToast(language === 'mr' ? `दुकान "${shop.shop_name}" मध्ये प्रवेश केला!` : language === 'hi' ? `दुकान "${shop.shop_name}" में प्रवेश किया!` : `Signed in to ${shop.shop_name}`);
  };

  const handleLoginWithEmail = (identifier: string, password?: string) => {
    const shop = KhataStore.loginWithEmailOrPhone(identifier, password);
    if (shop) {
      refreshData();
      setIsAuthModalOpen(false);
      showToast(language === 'mr' ? `दुकान "${shop.shop_name}" मध्ये प्रवेश केला!` : language === 'hi' ? `दुकान "${shop.shop_name}" में प्रवेश किया!` : `Signed in as ${shop.owner_name}`);
    }
  };

  const handleLoginWithGoogle = () => {
    const shop = KhataStore.loginWithGoogle({
      name: 'Vipul Kolapkar',
      email: 'vipul.kolapkar@gmail.com'
    });
    refreshData();
    setIsAuthModalOpen(false);
    showToast(t.googleLoginSuccess);
  };

  const handleRegisterShop = (shopData: {
    shop_name: string;
    owner_name: string;
    phone: string;
    email?: string;
    password?: string;
    shop_category: ShopCategory;
    address?: string;
  }) => {
    const newShop = KhataStore.registerShop(shopData);
    refreshData();
    setIsAuthModalOpen(false);
    showToast(language === 'mr' ? `नवीन दुकान "${newShop.shop_name}" नोंदवले!` : language === 'hi' ? `नई दुकान "${newShop.shop_name}" पंजीकृत की गई!` : `Registered ${newShop.shop_name}`);
  };

  const handleLogout = () => {
    KhataStore.logout();
    setCurrentShop(null);
    setCurrentView('DASHBOARD');
    refreshData();
    showToast(t.signOut);
  };

  // Shop Settings Update Handler
  const handleSaveShopSettings = (updatedData: Partial<ShopUser>) => {
    if (currentShop) {
      KhataStore.updateShopSettings(currentShop.id, updatedData);
      refreshData();
      showToast(t.settingsSavedSuccess);
    }
  };

  // Handle Bill Submission
  const handleCreateBill = (
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
    KhataStore.addInvoice(customerId, billData);
    refreshData();
    setBillModalCustomer(null);
    showToast(t.billCreatedSuccess);
  };

  // Handle Payment Submission
  const handleRecordPayment = (
    customerId: string,
    amount: number,
    paymentMode: Payment['payment_mode'],
    discountWaived: number,
    referenceNote?: string
  ) => {
    KhataStore.recordPayment(customerId, amount, paymentMode, discountWaived, referenceNote);
    refreshData();
    setPaymentModalCustomer(null);
    showToast(t.recordPaymentSuccess);
  };

  // Handle Add Customer
  const handleAddCustomer = (data: {
    name: string;
    phone: string;
    address_landmark?: string;
    credit_limit?: number;
  }) => {
    const newCust = KhataStore.addCustomer({
      ...data,
      credit_limit: data.credit_limit || 0,
      shop_id: currentShop?.id
    });
    refreshData();
    setIsAddCustomerOpen(false);
    showToast(language === 'mr' ? `ग्राहक ${newCust.name} जोडला!` : language === 'hi' ? `ग्राहक ${newCust.name} जोड़ा गया!` : `Added customer ${newCust.name}`);
  };

  // Handle Reset Data
  const handleResetData = () => {
    KhataStore.resetToDefault();
    refreshData();
    showToast(t.resetSuccess);
  };

  // Handle Voice Recognition Result
  const handleVoiceRecognized = (customer: Customer, amount: number, note: string) => {
    setIsVoiceModalOpen(false);
    setBillModalCustomer(customer);
  };

  // Don't render until client state is initialized
  if (!isInitialized) return null;

  // 1. Show Full Sign In / Register Landing Screen when logged out or visiting for the first time
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
      {/* 2. Adjustable Navigation Sidebar with Full Names & Icons */}
      <Sidebar
        isOpen={!isSidebarCollapsed}
        currentView={currentView}
        currentShop={currentShop}
        onToggle={handleToggleSidebar}
        onSelectView={setCurrentView}
        onLogout={handleLogout}
      />

      {/* 3. Main Page Layout (Parallel with Sidebar, fully interactive) */}
      <main className="app-main-layout">
        {currentView === 'DASHBOARD' ? (
          <>
            {/* Front Page Header with Large Udhari Branding, + Add Customer & Voice Entry */}
            <Header
              currentShop={currentShop}
              language={language}
              onVoiceBillClick={() => setIsVoiceModalOpen(true)}
              onAddCustomerClick={() => setIsAddCustomerOpen(true)}
            />

            {/* Dashboard KPI Stats */}
            <DashboardStats metrics={metrics} language={language} />

            {/* Search Input Bar (Cmd+K) with Voice Input trigger */}
            <CustomerSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              language={language}
              onVoiceClick={() => setIsVoiceModalOpen(true)}
            />

            {/* Customer Cards Section */}
            <section>
              <div className="customers-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span>{t.customerListTitle}</span>
                  <span className="customer-count-badge">{filteredCustomers.length}</span>
                </h2>

                {/* Additional Quick Add Customer Trigger on Front Page Section */}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddCustomerOpen(true)}
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '0.4rem 0.85rem'
                  }}
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
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.noCustomersFound}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {language === 'mr'
                      ? 'नवीन ग्राहक जोडण्यासाठी वरील बटणावर क्लिक करा.'
                      : language === 'hi'
                      ? 'नया ग्राहक जोड़ने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                      : 'Click the "+ Add Customer" button above to create an account.'}
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
          /* 4. Dedicated Business Profile & Analytics View */
          <ProfileView
            currentShop={currentShop}
            customers={customers}
            invoices={invoices}
            payments={payments}
            onBackToDashboard={() => setCurrentView('DASHBOARD')}
            onSaveShopSettings={handleSaveShopSettings}
          />
        ) : (
          /* 5. Dedicated Settings Page (Theme, Security, Data) */
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

      {/* Toast Notification Alert */}
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
