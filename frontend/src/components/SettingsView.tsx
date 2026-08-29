'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Shield,
  RotateCcw,
  Check,
  Building2,
  Lock,
  Download,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ShopUser, Language, ThemeMode, Customer, Invoice, Payment } from '../types';
import { getTranslation } from '../lib/translations';

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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMsg(null);

    try {
      onSaveShopSettings({ password: newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExportData = () => {
    const backupObj = {
      exportDate: new Date().toISOString(),
      shop: currentShop,
      customers,
      invoices,
      payments
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `udhari_backup_${currentShop?.shop_name || 'shop'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
                  Data Management & Backups
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Export offline copies of your customers, bills, and payment records
                </p>
              </div>

              {/* Export Backup Card */}
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
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                    Export Offline Backup (JSON)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Download complete snapshot of all customers ({customers.length}), invoices ({invoices.length}), and payments ({payments.length}).
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap', fontWeight: 700 }}
                  onClick={handleExportData}
                >
                  <Download size={15} />
                  <span>Download Backup</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
