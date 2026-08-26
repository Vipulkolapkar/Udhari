'use client';

import React, { useState, useMemo } from 'react';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  Search,
  Check,
  Edit3,
  Building2,
  DollarSign,
  PieChart,
  ShieldCheck,
  ArrowLeft,
  Users,
  Activity,
  Layers
} from 'lucide-react';
import { ShopUser, Customer, Invoice, Payment, ShopCategory } from '../types';
import { categoryLabels } from '../lib/translations';
import { OtpVerificationModal } from './OtpVerificationModal';

interface ProfileViewProps {
  currentShop: ShopUser | null;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  onBackToDashboard: () => void;
  onSaveShopSettings: (updatedShop: Partial<ShopUser>) => void;
}

type FilterType = 'ALL' | 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';
type DateRangeOption = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentShop,
  customers,
  invoices,
  payments,
  onBackToDashboard,
  onSaveShopSettings
}) => {
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState(currentShop?.shop_name || '');
  const [ownerName, setOwnerName] = useState(currentShop?.owner_name || '');
  const [phone, setPhone] = useState(currentShop?.phone || '');
  const [whatsappPhone, setWhatsappPhone] = useState(currentShop?.whatsapp_phone || currentShop?.phone || '');
  const [email, setEmail] = useState(currentShop?.email || '');
  const [gstin, setGstin] = useState(currentShop?.gstin || '');
  const [category, setCategory] = useState<ShopCategory>(currentShop?.shop_category || 'GENERAL');
  const [address, setAddress] = useState(currentShop?.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // OTP Verification
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [otpModal, setOtpModal] = useState<{ type: 'PHONE' | 'EMAIL'; target: string } | null>(null);

  // Activity Log Filters & Sorting
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DATE_DESC');
  const [dateRange, setDateRange] = useState<DateRangeOption>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Map Customer IDs to names
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [customers]);

  // Consolidated Business Transactions
  const unifiedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';
      customer_id: string;
      customer_name: string;
      amount: number;
      date: string;
      notes?: string;
      items_count?: number;
    }> = [];

    invoices.forEach((inv) => {
      list.push({
        id: `inv-${inv.id}`,
        type: 'CREDIT_GIVEN',
        customer_id: inv.customer_id,
        customer_name: customerMap.get(inv.customer_id) || 'Unknown Customer',
        amount: inv.total_amount,
        date: inv.created_at,
        notes: inv.notes,
        items_count: inv.items?.length || 1
      });
    });

    payments.forEach((pay) => {
      list.push({
        id: `pay-${pay.id}`,
        type: 'PAYMENT_RECEIVED',
        customer_id: pay.customer_id,
        customer_name: customerMap.get(pay.customer_id) || 'Unknown Customer',
        amount: pay.amount,
        date: pay.created_at,
        notes: pay.reference_note || `Receipt #${pay.receipt_number} (${pay.payment_mode})`
      });
    });

    return list;
  }, [invoices, payments, customerMap]);

  // Aggregate Business Metrics
  const totalCreditIssued = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => payments.reduce((sum, pay) => sum + pay.amount, 0),
    [payments]
  );
  const totalOutstanding = useMemo(
    () => customers.reduce((sum, c) => sum + (c.current_balance || 0), 0),
    [customers]
  );
  const recoveryRate = useMemo(() => {
    if (totalCreditIssued === 0) return 100;
    return Math.min(Math.round((totalCollected / totalCreditIssued) * 100), 100);
  }, [totalCollected, totalCreditIssued]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    let result = [...unifiedTransactions];

    // Filter by type
    if (filterType === 'CREDIT_GIVEN') {
      result = result.filter((t) => t.type === 'CREDIT_GIVEN');
    } else if (filterType === 'PAYMENT_RECEIVED') {
      result = result.filter((t) => t.type === 'PAYMENT_RECEIVED');
    }

    // Filter by Date Range
    if (dateRange !== 'ALL') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (dateRange === 'TODAY') {
        result = result.filter((t) => t.date.startsWith(todayStr));
      } else if (dateRange === 'THIS_WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((t) => new Date(t.date) >= weekAgo);
      } else if (dateRange === 'THIS_MONTH') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        result = result.filter((t) => new Date(t.date) >= monthAgo);
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.customer_name.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sorting by Priority / Date / Amount
    result.sort((a, b) => {
      if (sortBy === 'AMOUNT_DESC') {
        return b.amount - a.amount; // Priority Highest Amount
      } else if (sortBy === 'AMOUNT_ASC') {
        return a.amount - b.amount; // Priority Lowest Amount
      } else if (sortBy === 'DATE_ASC') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime(); // Default Newest
      }
    });

    return result;
  }, [unifiedTransactions, filterType, dateRange, sortBy, searchQuery]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveShopSettings({
      shop_name: shopName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      whatsapp_phone: whatsappPhone.trim() || phone.trim(),
      email: email.trim() || undefined,
      gstin: gstin.trim() || undefined,
      shop_category: category,
      address: address.trim() || undefined
    });
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', paddingBottom: '3rem' }}>
      {/* Top Header with Back Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onBackToDashboard}
            title="Back to Customer Accounts"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Business Profile & Analytics</span>
              <span style={{ fontSize: '0.72rem', background: 'var(--color-credit-bg)', color: 'var(--color-credit)', border: '1px solid var(--color-credit-border)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                Verified Merchant
              </span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comprehensive business identity, credit/debit transaction tracking, and recovery analytics
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
            style={{ fontWeight: 600 }}
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div style={{
          background: 'var(--color-credit-bg)',
          border: '1px solid var(--color-credit-border)',
          color: 'var(--color-credit)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem'
        }}>
          <CheckCircle size={16} />
          <span>Business profile details updated successfully!</span>
        </div>
      )}

      {/* 1. Main Business Identity Hero Card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Edit Business Information
              </h3>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Cancel
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Business / Shop Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Login Phone Number *</label>
                  {isPhoneVerified ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700 }}>✓ Verified</span>
                  ) : phone.length >= 10 ? (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => setOtpModal({ type: 'PHONE', target: phone })}
                    >
                      Verify OTP
                    </button>
                  ) : null}
                </div>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (e.target.value !== currentShop?.phone) setIsPhoneVerified(false);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Business Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Email Address</label>
                  {isEmailVerified ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700 }}>✓ Verified</span>
                  ) : email.includes('@') ? (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => setOtpModal({ type: 'EMAIL', target: email })}
                    >
                      Verify OTP
                    </button>
                  ) : null}
                </div>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value !== currentShop?.email) setIsEmailVerified(false);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GSTIN / Trade License</label>
                <input
                  type="text"
                  className="form-input"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Business Category *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShopCategory)}
                >
                  <option value="KIRANA">{categoryLabels.KIRANA.en}</option>
                  <option value="STATIONERY">{categoryLabels.STATIONERY.en}</option>
                  <option value="MEDICAL">{categoryLabels.MEDICAL.en}</option>
                  <option value="HARDWARE">{categoryLabels.HARDWARE.en}</option>
                  <option value="CLOTHING">{categoryLabels.CLOTHING.en}</option>
                  <option value="GENERAL">{categoryLabels.GENERAL.en}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Address & City</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Check size={14} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header Identity Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  flexShrink: 0
                }}>
                  <Store size={32} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {currentShop?.shop_name || 'Udhari Store'}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.2rem' }}>
                    <span><strong>Owner:</strong> {currentShop?.owner_name || 'Merchant'}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-muted)' }}>Category: {categoryLabels[currentShop?.shop_category || 'GENERAL']?.en || 'General'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Calendar size={14} color="var(--text-muted)" />
                  <span>Member since <strong>{currentShop?.created_at ? new Date(currentShop.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026'}</strong></span>
                </div>
              </div>
            </div>

            {/* Profile Info Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={12} /> Login Mobile
                </span>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  +91 {currentShop?.phone || 'N/A'} <span style={{ fontSize: '0.7rem', color: 'var(--color-credit)' }}>✓ Verified</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  💬 WhatsApp Number
                </span>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  +91 {currentShop?.whatsapp_phone || currentShop?.phone || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={12} /> Email Address
                </span>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {currentShop?.email || 'Not provided'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={12} /> GSTIN / License
                </span>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {currentShop?.gstin || 'Unregistered / Exempt'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={12} /> Business Address
                </span>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {currentShop?.address || 'Main Road, Market Yard, Pune, Maharashtra'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Business Performance & Financial Analytics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {/* Total Outstanding Receivables */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Outstanding Receivables
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={15} color="var(--color-debit)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Across {customers.filter((c) => (c.current_balance || 0) > 0).length} active debtors
          </span>
        </div>

        {/* Total Credit Issued (Lifetime) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Lifetime Credit Given (Debit)
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={15} color="var(--text-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            ₹{totalCreditIssued.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {invoices.length} total bills recorded
          </span>
        </div>

        {/* Total Payments Collected */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Payments Collected (Credit)
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color="var(--color-credit)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-credit)', fontFamily: 'var(--font-mono)' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {payments.length} total payments received
          </span>
        </div>

        {/* Recovery Rate & Cash Flow Health */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Collection Recovery Rate
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} color="var(--text-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {recoveryRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-credit)', fontWeight: 600 }}>
            ● Healthy Merchant Cashflow
          </span>
        </div>
      </div>

      {/* 3. Comprehensive Debit & Credit Activity Log with Priority & Date Filters */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Business Debit & Credit Ledger Stream
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Filter and analyze when credit is given or payments collected by amount priority and date
            </p>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            Showing <strong>{filteredTransactions.length}</strong> transactions
          </div>
        </div>

        {/* Interactive Controls Bar: Types, Date Range, Sort Priority, Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--bg-surface-elevated)',
          padding: '0.85rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Filter Type Chips (All, Credit Given, Payments Received) */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`denom-chip ${filterType === 'ALL' ? 'active' : ''}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                background: filterType === 'ALL' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                color: filterType === 'ALL' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                borderColor: filterType === 'ALL' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)'
              }}
              onClick={() => setFilterType('ALL')}
            >
              All Records
            </button>
            <button
              type="button"
              className={`denom-chip ${filterType === 'CREDIT_GIVEN' ? 'active' : ''}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                background: filterType === 'CREDIT_GIVEN' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                color: filterType === 'CREDIT_GIVEN' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                borderColor: filterType === 'CREDIT_GIVEN' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)'
              }}
              onClick={() => setFilterType('CREDIT_GIVEN')}
            >
              Credit Given (-)
            </button>
            <button
              type="button"
              className={`denom-chip ${filterType === 'PAYMENT_RECEIVED' ? 'active' : ''}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                background: filterType === 'PAYMENT_RECEIVED' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                color: filterType === 'PAYMENT_RECEIVED' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                borderColor: filterType === 'PAYMENT_RECEIVED' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)'
              }}
              onClick={() => setFilterType('PAYMENT_RECEIVED')}
            >
              Payments Collected (+)
            </button>
          </div>

          {/* Filter by Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-surface)' }}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today Only</option>
              <option value="THIS_WEEK">Past 7 Days</option>
              <option value="THIS_MONTH">Past 30 Days</option>
            </select>
          </div>

          {/* Priority Sort by Amount / Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort By:</span>
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-surface)' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="DATE_DESC">Date (Newest First)</option>
              <option value="DATE_ASC">Date (Oldest First)</option>
              <option value="AMOUNT_DESC">Priority: Highest Amount</option>
              <option value="AMOUNT_ASC">Priority: Lowest Amount</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', paddingRight: '0.5rem', paddingTop: '0.35rem', paddingBottom: '0.35rem', fontSize: '0.78rem', background: 'var(--bg-surface)' }}
              placeholder="Search customer or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Transactions Table / Stream */}
        {filteredTransactions.length === 0 ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-medium)'
          }}>
            No transactions match the selected filters or search criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Transaction</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Customer Name</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Date & Time</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Details / Note</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      {tx.type === 'CREDIT_GIVEN' ? (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'var(--bg-surface-elevated)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700
                        }}>
                          Credit Given
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'var(--color-credit-bg)',
                          color: 'var(--color-credit)',
                          border: '1px solid var(--color-credit-border)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700
                        }}>
                          Payment Collected
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.customer_name}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} • {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {tx.notes || (tx.type === 'CREDIT_GIVEN' ? `${tx.items_count} item(s) purchased` : 'Cash payment received')}
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      fontFamily: 'var(--font-mono)',
                      color: tx.type === 'PAYMENT_RECEIVED' ? 'var(--color-credit)' : 'var(--text-primary)'
                    }}>
                      {tx.type === 'PAYMENT_RECEIVED' ? `+ ₹${tx.amount.toLocaleString('en-IN')}` : `₹${tx.amount.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      {otpModal && (
        <OtpVerificationModal
          type={otpModal.type}
          target={otpModal.target}
          onClose={() => setOtpModal(null)}
          onVerified={() => {
            if (otpModal.type === 'PHONE') {
              setIsPhoneVerified(true);
            } else if (otpModal.type === 'EMAIL') {
              setIsEmailVerified(true);
            }
            setOtpModal(null);
          }}
        />
      )}
    </div>
  );
};
