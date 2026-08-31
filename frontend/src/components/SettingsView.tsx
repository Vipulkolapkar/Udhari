'use client';
import { validatePasswordStrength, getPasswordRuleStatus } from '../lib/validation';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Shield,
  RotateCcw,
  Check,
  Lock,
  Download,
  FileSpreadsheet,
  Trash2,
  Loader2
} from 'lucide-react';
import { ShopUser, Language, ThemeMode, Customer, Invoice, Payment } from '../types';
import { getTranslation } from '../lib/translations';
import { sbGetCustomers, sbGetInvoices, sbGetPayments, sbWipeAllShopData } from '../lib/supabaseStore';

interface SettingsViewProps {
  currentShop: ShopUser | null;
  language: Language;
  theme: ThemeMode;
  customers?: Customer[];
  invoices?: Invoice[];
  payments?: Payment[];
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onResetData: () => void;
  onSaveShopSettings: (updatedShop: Partial<ShopUser>) => void;
  onBackToDashboard: () => void;
}

type SettingsTab = 'APPEARANCE' | 'SECURITY' | 'DATA';

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentShop,
  language,
  theme,
  customers = [],
  invoices = [],
  payments = [],
  onThemeChange,
  onResetData,
  onSaveShopSettings,
  onBackToDashboard
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<SettingsTab>('APPEARANCE');

  // Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Export State
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Delete All Data State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentShop?.password && oldPassword !== currentShop.password) {
      setPasswordMsg({ type: 'error', text: 'Incorrect current password.' });
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setPasswordMsg({ type: 'error', text: validation.error || 'Password does not meet security requirements.' });
      return;
    }

    if (newPassword === oldPassword) {
      setPasswordMsg({ type: 'error', text: 'New password must be different.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMsg(null);

    try {
      await onSaveShopSettings({ password: newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setTimeout(() => setPasswordMsg(null), 3000);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Export Formatted Master Customer Ledger Report (Excel Compatible)
  const handleExportCSV = async () => {
    if (!currentShop) return;
    setIsExportingCsv(true);
    try {
      const [liveCustomers, liveInvoices, livePayments] = await Promise.all([
        sbGetCustomers(currentShop.id),
        sbGetInvoices(currentShop.id),
        sbGetPayments(currentShop.id)
      ]);

      const totalMarketOutstanding = liveCustomers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
      const totalAllCredit = liveInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const totalAllCollected = livePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // UTF-8 BOM so Microsoft Excel opens with correct fonts and numbers
      let csvContent = '\uFEFF';
      csvContent += `========================================================\n`;
      csvContent += `MASTER CUSTOMER CREDIT LEDGER REPORT\n`;
      csvContent += `========================================================\n\n`;

      csvContent += `BUSINESS INFORMATION\n`;
      csvContent += `Business Name,"${(currentShop.shop_name || '').replace(/"/g, '""')}"\n`;
      if (currentShop.owner_name) csvContent += `Owner Name,"${currentShop.owner_name.replace(/"/g, '""')}"\n`;
      if (currentShop.phone) csvContent += `Phone Number,"${currentShop.phone}"\n`;
      if (currentShop.address) csvContent += `Address,"${(currentShop.address || '').replace(/"/g, '""')}"\n`;
      csvContent += `Export Date,"${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}"\n\n`;

      csvContent += `FINANCIAL OVERVIEW\n`;
      csvContent += `Total Active Customers,${liveCustomers.length}\n`;
      csvContent += `Total Market Debt Outstanding (Rs.),${totalMarketOutstanding}\n`;
      csvContent += `Total Lifetime Credit Issued (Rs.),${totalAllCredit}\n`;
      csvContent += `Total Lifetime Collections (Rs.),${totalAllCollected}\n\n`;

      csvContent += `========================================================\n`;
      csvContent += `CUSTOMER-WISE BALANCE SUMMARY\n`;
      csvContent += `========================================================\n`;
      csvContent += `Customer Name,Mobile Number,Landmark / Address,Total Credit Taken (Rs.),Total Paid (Rs.),Current Balance Due (Rs.),Account Status\n`;

      liveCustomers.forEach((cust) => {
        const custInvoices = liveInvoices.filter((i) => i.customer_id === cust.id);
        const custPayments = livePayments.filter((p) => p.customer_id === cust.id);
        const totalCredit = custInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
        const totalPaid = custPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const bal = cust.current_balance || 0;
        const status = bal > 0 ? 'Pending Payment' : 'Settled';

        const row = [
          `"${cust.name.replace(/"/g, '""')}"`,
          `"${cust.phone}"`,
          `"${(cust.address_landmark || '-').replace(/"/g, '""')}"`,
          totalCredit,
          totalPaid,
          bal,
          `"${status}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      csvContent += `\n*** End of Ledger Report - Generated by Udhari ***\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Master_Ledger_${(currentShop.shop_name || 'shop').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Failed to export CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Delete All Data Handler
  const handleDeleteAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop) return;

    if (currentShop.password && deletePassword !== currentShop.password) {
      setDeleteError('Incorrect password.');
      return;
    }

    setIsDeletingAll(true);
    setDeleteError(null);

    try {
      const ok = await sbWipeAllShopData(currentShop.id);
      if (ok) {
        setIsDeleteAllModalOpen(false);
        setDeletePassword('');
        onResetData();
              } else {
        setDeleteError('Failed to delete. Try again.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting data.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-medium)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onBackToDashboard}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Settings
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Manage appearance, security, and data export
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: '1.5rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden'
      }}>
        {/* Navigation Sidebar */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          borderRight: '1px solid var(--border-medium)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'APPEARANCE' ? 'var(--btn-primary-bg)' : 'transparent',
                color: activeTab === 'APPEARANCE' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                fontWeight: activeTab === 'APPEARANCE' ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => { setPasswordMsg(null); setActiveTab('APPEARANCE'); }}
            >
              <Moon size={16} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'SECURITY' ? 'var(--btn-primary-bg)' : 'transparent',
                color: activeTab === 'SECURITY' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                fontWeight: activeTab === 'SECURITY' ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => { setPasswordMsg(null); setActiveTab('SECURITY'); }}
            >
              <Shield size={16} />
              <span>Security</span>
            </button>

            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'DATA' ? 'var(--btn-primary-bg)' : 'transparent',
                color: activeTab === 'DATA' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                fontWeight: activeTab === 'DATA' ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => { setPasswordMsg(null); setActiveTab('DATA'); }}
            >
              <RotateCcw size={16} />
              <span>Data</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* 1. Theme Appearance */}
          {activeTab === 'APPEARANCE' && (
            <div>
              <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                  Theme Appearance
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Dark Mode Card */}
                <div
                  style={{
                    background: '#09090b',
                    border: theme === 'dark' ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onThemeChange('dark')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                      <Moon size={16} />
                      <span>Dark Theme</span>
                    </div>
                    {theme === 'dark' && <Check size={16} color="#ffffff" />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: 0 }}>
                    High-contrast dark mode.
                  </p>
                </div>

                {/* Light Mode Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: theme === 'light' ? '2px solid #09090b' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onThemeChange('light')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#09090b', fontWeight: 700, fontSize: '0.92rem' }}>
                      <Sun size={16} />
                      <span>Light Theme</span>
                    </div>
                    {theme === 'light' && <Check size={16} color="#09090b" />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#71717a', margin: 0 }}>
                    Clean bright mode.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Security */}
          {activeTab === 'SECURITY' && (
            <div>
              <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                  Change Password
                </h3>
              </div>

              {passwordMsg && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  background: passwordMsg.type === 'success' ? 'var(--color-credit-bg)' : 'var(--color-debit-bg)',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'var(--color-credit-border)' : 'var(--color-debit-border)'}`,
                  color: passwordMsg.type === 'success' ? 'var(--color-credit)' : 'var(--color-debit)'
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingPassword || !newPassword}
                  style={{ alignSelf: 'flex-start', minHeight: '38px', fontWeight: 700 }}
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 3. Data */}
          {activeTab === 'DATA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Data Management
                </h3>
              </div>

              {/* 1. Customer Ledger CSV / Excel Spreadsheet */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileSpreadsheet size={16} color="var(--color-credit)" />
                    <span>Download Ledger (Excel / CSV)</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Export customer list, phone numbers, and balances to spreadsheet.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap', fontWeight: 700, minWidth: '150px' }}
                  onClick={handleExportCSV}
                  disabled={isExportingCsv}
                >
                  {isExportingCsv ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download CSV</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. Delete All Data Card */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Trash2 size={16} color="var(--text-secondary)" />
                    <span>Delete All Data</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Permanently delete all customers, bills, and payments.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                    minWidth: '150px',
                    borderColor: 'var(--border-medium)',
                    color: 'var(--color-debit)'
                  }}
                  onClick={() => {
                    setDeletePassword('');
                    setDeleteError(null);
                    setIsDeleteAllModalOpen(true);
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clean Password Verification Delete Modal */}
      {isDeleteAllModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteAllModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '100%', padding: '1.5rem' }}
          >
            <div className="modal-header" style={{ marginBottom: '0.75rem' }}>
              <div className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>Delete All Data</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsDeleteAllModalOpen(false)} disabled={isDeletingAll}>
                <ArrowLeft size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
              Enter password to delete all records for <strong>{currentShop?.shop_name}</strong>.
            </p>

            {deleteError && (
              <div style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '0.85rem',
                background: 'var(--color-debit-bg)',
                border: '1px solid var(--color-debit-border)',
                color: 'var(--color-debit)'
              }}>
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAllData}>
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.6rem 0.85rem', fontWeight: 600 }}
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  disabled={isDeletingAll}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isDeletingAll || !deletePassword}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    fontWeight: 700,
                    background: 'var(--color-debit)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: isDeletingAll ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                >
                  {isDeletingAll ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
