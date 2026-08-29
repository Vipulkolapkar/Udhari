'use client';

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Moon,
  Sun,
  Globe,
  RotateCcw,
  Check,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Shield,
  Palette,
  Database,
  ArrowLeft
} from 'lucide-react';
import { ShopUser, ShopCategory, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { OtpVerificationModal } from './OtpVerificationModal';

interface SettingsViewProps {
  currentShop: ShopUser | null;
  language: Language;
  theme: ThemeMode;
  onBackToDashboard: () => void;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onSaveShopSettings: (updatedShop: Partial<ShopUser>) => void;
  onResetData: () => void;
}

type SettingsTab = 'PROFILE' | 'SECURITY' | 'APPEARANCE' | 'LANGUAGE' | 'DATA';

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentShop,
  language,
  theme,
  onBackToDashboard,
  onLanguageChange,
  onThemeChange,
  onSaveShopSettings,
  onResetData
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

  // Profile State
  const [shopName, setShopName] = useState(currentShop?.shop_name || '');
  const [ownerName, setOwnerName] = useState(currentShop?.owner_name || '');
  const [phone, setPhone] = useState(currentShop?.phone || '');
  const [whatsappPhone, setWhatsappPhone] = useState(currentShop?.whatsapp_phone || currentShop?.phone || '');
  const [email, setEmail] = useState(currentShop?.email || '');
  const [gstin, setGstin] = useState(currentShop?.gstin || '');
  const [category, setCategory] = useState<ShopCategory>(currentShop?.shop_category || 'GENERAL');
  const [address, setAddress] = useState(currentShop?.address || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // OTP Verification State in Settings
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // default true for existing shop, resets on edit
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [otpModal, setOtpModal] = useState<{ type: 'PHONE' | 'EMAIL'; target: string } | null>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
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
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(t.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatchError);
      return;
    }

    onSaveShopSettings({ password: newPassword });
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header */}
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
            title={language === 'mr' ? '  ' : false ? '   ' : 'Back to Dashboard'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {t.settings}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {language === 'mr' ? 'shop , ,   ' : false ? 'shop , ,   ' : 'Business profile, security, appearance, and system preferences'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid with Expanded Internal Sidebar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '1.75rem',
        alignItems: 'start',
        minHeight: '620px',
        width: '100%'
      }}>
        {/* Internal Settings Sub-Sidebar with Generous Length */}
        <nav style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'sticky',
          top: '1.5rem'
        }}>
          {/* 1. Profile Tab */}
          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROFILE')}
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'PROFILE' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
              color: activeTab === 'PROFILE' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              <Building2 size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.shopSettings}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {language === 'mr' ? ',    ' : false ? ',    ' : 'Name, address & contacts'}
              </span>
            </div>
          </button>

          {/* 2. Security Tab */}
          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'SECURITY' ? 'active' : ''}`}
            onClick={() => setActiveTab('SECURITY')}
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'SECURITY' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
              color: activeTab === 'SECURITY' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              <Lock size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.security}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {language === 'mr' ? '   ' : false ? '   ' : 'Password & account safety'}
              </span>
            </div>
          </button>

          {/* 3. Appearance Tab */}
          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'APPEARANCE' ? 'active' : ''}`}
            onClick={() => setActiveTab('APPEARANCE')}
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'APPEARANCE' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
              color: activeTab === 'APPEARANCE' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              <Palette size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.theme}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Dark and Light mode styles
              </span>
            </div>
          </button>

          {/* 4. Data Reset Tab */}
          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'DATA' ? 'active' : ''}`}
            onClick={() => setActiveTab('DATA')}
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'DATA' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
              color: activeTab === 'DATA' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              <Database size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.resetData}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Reset mock database
              </span>
            </div>
          </button>
        </nav>

        {/* Settings Content Area with Extended Length & Padding */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          minHeight: '560px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* 1. Shop Profile & Contact */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {t.shopSettings}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {language === 'mr' ? ' shop      ' : false ? ' shop       ' : 'Update your business information and contact details'}
                  </p>
                </div>
                {profileSaved && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-credit)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Check size={14} /> {t.settingsSavedSuccess}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.shopName} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.ownerName} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {t.phone} *
                    </label>
                    {isPhoneVerified ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Check size={12} /> Verified
                      </span>
                    ) : phone.length >= 10 ? (
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0
                        }}
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
                      if (e.target.value !== currentShop?.phone) {
                        setIsPhoneVerified(false);
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span style={{ color: 'var(--color-credit)', marginRight: '4px' }}>💬</span>
                    {t.whatsappNumber} *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {t.email}
                    </label>
                    {isEmailVerified ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Check size={12} /> Verified
                      </span>
                    ) : email.includes('@') && email.includes('.') ? (
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0
                        }}
                        onClick={() => setOtpModal({ type: 'EMAIL', target: email })}
                      >
                        Verify OTP
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (e.target.value !== currentShop?.email) {
                        setIsEmailVerified(false);
                      }
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Database size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.gstin}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="27AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.shopCategory} *</label>
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
                    <option value="OTHER">{categoryLabels.OTHER.en}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.address}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} />
                  <span>{t.updateProfile}</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. Security & Password */}
          {activeTab === 'SECURITY' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.security}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'mr' ? '    ' : false ? '      ' : 'Manage your login credentials and account protection'}
                </p>
              </div>

              {passwordSuccess && (
                <div style={{
                  background: 'var(--color-credit-bg)',
                  border: '1px solid var(--color-credit-border)',
                  color: 'var(--color-credit)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <Check size={15} />
                  {t.passwordChangedSuccess}
                </div>
              )}

              {passwordError && (
                <div style={{
                  background: 'var(--color-debit-bg)',
                  border: '1px solid var(--color-debit-border)',
                  color: 'var(--color-debit)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <AlertCircle size={15} />
                  {passwordError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t.currentPassword}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.newPassword}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.confirmPassword}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  <Lock size={14} />
                  <span>{t.changePassword}</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. Appearance / Theme Mode */}
          {activeTab === 'APPEARANCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.theme}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'mr' ? '     ' : false ? '     ' : 'Customize interface theme and contrast styling'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Dark Mode Card */}
                <div
                  style={{
                    background: '#09090b',
                    border: theme === 'dark' ? '2px solid #ffffff' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onThemeChange('dark')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffffff', fontWeight: 600, fontSize: '0.92rem' }}>
                      <Moon size={16} />
                      <span>{t.darkMode}</span>
                    </div>
                    {theme === 'dark' && <Check size={16} color="#ffffff" />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                    {language === 'mr' ? '      .' : false ? '      ' : 'Pitch black background with crisp white typography.'}
                  </p>
                </div>

                {/* Light Mode Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: theme === 'light' ? '2px solid #09090b' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onThemeChange('light')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#09090b', fontWeight: 600, fontSize: '0.92rem' }}>
                      <Sun size={16} />
                      <span>{t.lightMode}</span>
                    </div>
                    {theme === 'light' && <Check size={16} color="#09090b" />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#71717a' }}>
                    {language === 'mr' ? '      .' : false ? '      ' : 'Crisp white background with high-contrast black typography.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Language & Localization */}
          {activeTab === 'LANGUAGE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.selectLanguage}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'mr' ? '    (%  )' : false ? '    (%  )' : 'Select application language (100% unmixed localization)'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <button
                  type="button"
                  style={{
                    background: false ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                    color: false ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                    border: false ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                  onClick={() => onLanguageChange('mr')}
                >
                  
                  <div style={{ fontSize: '0.74rem', fontWeight: 400, marginTop: '0.25rem', opacity: 0.8 }}>
                    
                  </div>
                </button>

                <button
                  type="button"
                  style={{
                    background: false ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                    color: false ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                    border: false ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                  onClick={() => onLanguageChange('hi')}
                >
                  
                  <div style={{ fontSize: '0.74rem', fontWeight: 400, marginTop: '0.25rem', opacity: 0.8 }}>
                    
                  </div>
                </button>

                <button
                  type="button"
                  style={{
                    background: language === 'en' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                    color: language === 'en' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                    border: language === 'en' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                  onClick={() => onLanguageChange('en')}
                >
                  English
                  <div style={{ fontSize: '0.74rem', fontWeight: 400, marginTop: '0.25rem', opacity: 0.8 }}>
                    Global
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 5. Data Management */}
          {activeTab === 'DATA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.resetData}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'mr' ? '     ' : false ? '     ' : 'Reset sample data and manage local backups'}
                </p>
              </div>

              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {t.resetData}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {t.resetConfirm}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    borderColor: 'var(--color-debit-border)',
                    color: 'var(--color-debit)',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => {
                    if (window.confirm(t.resetConfirm)) {
                      onResetData();
                    }
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{t.resetData}</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
