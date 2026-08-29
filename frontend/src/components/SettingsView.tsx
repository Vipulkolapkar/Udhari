'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Moon,
  Sun,
  Shield,
  RotateCcw,
  Check,
  Lock,
  Download,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ShopUser, Language, ThemeMode, Customer, Invoice, Payment } from '../types';
import { getTranslation } from '../lib/translations';
import { sbGetCustomers, sbGetInvoices, sbGetPayments,
  sbWipeAllShopData } from '../lib/supabaseStore';

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
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verify Old Password
    if (currentShop?.password && oldPassword !== currentShop.password) {
      setPasswordMsg({ type: 'error', text: 'Incorrect old password. Please enter your valid current password.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword === oldPassword) {
      setPasswordMsg({ type: 'error', text: 'New password must be different from your old password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMsg(null);

    try {
      await onSaveShopSettings({ password: newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop) return;

    // Check password if set
    if (currentShop.password && deletePassword !== currentShop.password) {
      setDeleteError('Incorrect password. Please enter your valid account password.');
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
        alert('All customers, bills, and payment records have been deleted successfully.');
      } else {
        setDeleteError('Failed to wipe data. Please try again.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error wiping data.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // 1. Export Complete JSON Backup
  const handleExportJSON = async () => {
    if (!currentShop) return;
    setIsExportingJson(true);
    try {
      // Fetch freshest live data from Supabase Cloud
      const [liveCustomers, liveInvoices, livePayments] = await Promise.all([
        sbGetCustomers(currentShop.id),
        sbGetInvoices(currentShop.id),
        sbGetPayments(currentShop.id)
      ]);

      const backupObj = {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        shop: currentShop,
        summary: {
          totalCustomers: liveCustomers.length,
          totalInvoices: liveInvoices.length,
          totalPayments: livePayments.length,
          totalOutstandingDue: liveCustomers.reduce((sum, c) => sum + (c.current_balance || 0), 0)
        },
        customers: liveCustomers,
        invoices: liveInvoices,
        payments: livePayments
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `udhari_complete_backup_${(currentShop.shop_name || 'shop').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate backup. Please check your internet connection.');
    } finally {
      setIsExportingJson(false);
    }
  };

  // 2. Export Excel / CSV Customer Ledger Report
  const handleExportCSV = async () => {
    if (!currentShop) return;
    setIsExportingCsv(true);
    try {
      const [liveCustomers, liveInvoices, livePayments] = await Promise.all([
        sbGetCustomers(currentShop.id),
        sbGetInvoices(currentShop.id),
        sbGetPayments(currentShop.id)
      ]);

      let csvContent = 'Customer ID,Customer Name,Phone,Landmark/Address,Balance Due (INR),Total Bills,Total Payments Received,Account Created\n';

      liveCustomers.forEach((cust) => {
        const custInvoices = liveInvoices.filter((i) => i.customer_id === cust.id);
        const custPayments = livePayments.filter((p) => p.customer_id === cust.id);
        const totalCredit = custInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
        const totalPaid = custPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const row = [
          `"${cust.id}"`,
          `"${cust.name.replace(/"/g, '""')}"`,
          `"${cust.phone}"`,
          `"${(cust.address_landmark || '').replace(/"/g, '""')}"`,
          cust.current_balance || 0,
          totalCredit,
          totalPaid,
          `"${new Date(cust.created_at).toLocaleDateString('en-IN')}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `udhari_customer_ledger_${(currentShop.shop_name || 'shop').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Failed to generate CSV export.');
    } finally {
      setIsExportingCsv(false);
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
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Settings & Preferences
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Customize application appearance, security, and data backups
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
              onClick={() => setActiveTab('APPEARANCE')}
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
              onClick={() => setActiveTab('SECURITY')}
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
              onClick={() => setActiveTab('DATA')}
            >
              <RotateCcw size={16} />
              <span>Data & Backup</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* 1. Theme Appearance */}
          {activeTab === 'APPEARANCE' && (
            <div>
              <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                  Theme Appearance
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Choose your preferred visual theme for the application
                </p>
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
                      <span>Dark Theme (Recommended)</span>
                    </div>
                    {theme === 'dark' && <Check size={16} color="#ffffff" />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: 0 }}>
                    Modern, high-contrast dark theme with reduced eye fatigue.
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
                    Clean, bright aesthetic with high-contrast text tokens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Security */}
          {activeTab === 'SECURITY' && (
            <div>
              <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                  Account Security & Password
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Update your shop access password
                </p>
              </div>

              {passwordMsg && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  background: passwordMsg.type === 'success' ? 'var(--color-credit-bg)' : 'var(--color-debit-bg)',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'var(--color-credit-border)' : 'var(--color-debit-border)'}`,
                  color: passwordMsg.type === 'success' ? 'var(--color-credit)' : 'var(--color-debit)'
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Old / Current Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your current password"
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
                  style={{ alignSelf: 'flex-start', minHeight: '40px', fontWeight: 700 }}
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 3. Data & Backup */}
          {activeTab === 'DATA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                  Data Management & Export
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Download complete backups and spreadsheet ledger statements from your live database
                </p>
              </div>

              {/* 1. Complete JSON Database Backup */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileJson size={17} color="var(--text-primary)" />
                    <span>Complete JSON Database Backup</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    Full raw data export including all customer profiles, individual bills, purchased item details, payments, and FIFO clearance allocations.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap', fontWeight: 700, minWidth: '160px' }}
                  onClick={handleExportJSON}
                  disabled={isExportingJson}
                >
                  {isExportingJson ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Fetching Data...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Download JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. Customer Ledger CSV / Excel Spreadsheet */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileSpreadsheet size={17} color="var(--color-credit)" />
                    <span>Customer Ledger Spreadsheet (CSV / Excel)</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    Ready for Excel / Google Sheets: Customer names, phone numbers, addresses, total credit issued, total collected, and current outstanding balances.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap', fontWeight: 700, minWidth: '160px', borderColor: 'var(--color-credit-border)', color: 'var(--color-credit)' }}
                  onClick={handleExportCSV}
                  disabled={isExportingCsv}
                >
                  {isExportingCsv ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Generating CSV...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Download Excel / CSV</span>
                    </>
                  )}
                </button>
              </div>
              {/* 3. Danger Zone: Wipe All Shop Data */}
              <div style={{
                background: 'var(--color-debit-bg)',
                border: '1px solid var(--color-debit-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-debit)', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <AlertTriangle size={17} color="var(--color-debit)" />
                    <span>Danger Zone: Erase All Customers & Ledger History</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    Permanently delete all customer profiles, credit invoices, and payment records for this shop. Requires your account password.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                    minWidth: '160px',
                    background: 'var(--color-debit)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    padding: '0.65rem 1rem'
                  }}
                  onClick={() => {
                    setDeletePassword('');
                    setDeleteError(null);
                    setIsDeleteAllModalOpen(true);
                  }}
                >
                  <Trash2 size={15} />
                  <span>Wipe All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Password-Protected Wipe All Data Modal */}
      {isDeleteAllModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteAllModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}
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
              <AlertTriangle size={28} color="var(--color-debit)" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', margin: '0 0 0.5rem 0' }}>
              Confirm Complete Data Wipe?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4, margin: '0 0 1.25rem 0' }}>
              You are about to permanently erase all customers, bills, and transaction ledger history for <strong>{currentShop?.shop_name}</strong>.
            </p>

            {deleteError && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1rem',
                background: 'var(--color-debit-bg)',
                border: '1px solid var(--color-debit-border)',
                color: 'var(--color-debit)'
              }}>
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAllData}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Enter Account Password to Confirm *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.65rem 1rem', fontWeight: 600 }}
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
                    padding: '0.65rem 1rem',
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
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Wiping...</span>
                    </>
                  ) : (
                    <span>Confirm Wipe</span>
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
