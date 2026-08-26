'use client';

import React, { useState } from 'react';
import { X, Settings, Building2, User, Phone, Mail, Lock, Globe, Shield, RotateCcw, Check, Moon, Sun, AlertCircle, MapPin } from 'lucide-react';
import { ShopUser, ShopCategory, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';

interface SettingsModalProps {
  currentShop: ShopUser | null;
  language: Language;
  theme: ThemeMode;
  onClose: () => void;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onSaveShopSettings: (updatedShop: Partial<ShopUser>) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentShop,
  language,
  theme,
  onClose,
  onLanguageChange,
  onThemeChange,
  onSaveShopSettings,
  onResetData
}) => {
  const t = getTranslation(language);

  // Profile Form State
  const [shopName, setShopName] = useState(currentShop?.shop_name || '');
  const [ownerName, setOwnerName] = useState(currentShop?.owner_name || '');
  const [phone, setPhone] = useState(currentShop?.phone || '');
  const [email, setEmail] = useState(currentShop?.email || '');
  const [category, setCategory] = useState<ShopCategory>(currentShop?.shop_category || 'GENERAL');
  const [address, setAddress] = useState(currentShop?.address || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Password Security Form State
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
      email: email.trim() || undefined,
      shop_category: category,
      address: address.trim() || undefined
    });
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 1500);
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

    // Save password
    onSaveShopSettings({
      password: newPassword
    });

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={18} />
            <span>{t.settings}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. Theme & Language Preferences Section */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <Globe size={15} color="var(--text-secondary)" />
              <span>{t.preferences}</span>
            </div>

            {/* Theme Mode Selector */}
            <div className="form-group">
              <label className="form-label">{t.theme}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  style={{
                    background: theme === 'dark' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                    color: theme === 'dark' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: theme === 'dark' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onThemeChange('dark')}
                >
                  <Moon size={15} />
                  {t.darkMode}
                </button>

                <button
                  type="button"
                  style={{
                    background: theme === 'light' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                    color: theme === 'light' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: theme === 'light' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onThemeChange('light')}
                >
                  <Sun size={15} />
                  {t.lightMode}
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="form-group">
              <label className="form-label">{t.selectLanguage}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  style={{
                    background: language === 'mr' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                    color: language === 'mr' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: language === 'mr' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onLanguageChange('mr')}
                >
                  मराठी
                </button>
                <button
                  type="button"
                  style={{
                    background: language === 'hi' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                    color: language === 'hi' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: language === 'hi' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onLanguageChange('hi')}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  style={{
                    background: language === 'en' ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                    color: language === 'en' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: language === 'en' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onLanguageChange('en')}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* 2. Shop Profile & Contact Details Form */}
          <form onSubmit={handleSaveProfile} style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Building2 size={15} color="var(--text-secondary)" />
                <span>{t.shopSettings}</span>
              </div>
              {savedFeedback && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-credit)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={13} /> {t.settingsSavedSuccess}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">{t.shopName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.ownerName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.phone}
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.email}
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">{t.shopCategory}</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShopCategory)}
                >
                  <option value="KIRANA">{categoryLabels.KIRANA.icon} {categoryLabels.KIRANA.en}</option>
                  <option value="STATIONERY">{categoryLabels.STATIONERY.icon} {categoryLabels.STATIONERY.en}</option>
                  <option value="MEDICAL">{categoryLabels.MEDICAL.icon} {categoryLabels.MEDICAL.en}</option>
                  <option value="HARDWARE">{categoryLabels.HARDWARE.icon} {categoryLabels.HARDWARE.en}</option>
                  <option value="CLOTHING">{categoryLabels.CLOTHING.icon} {categoryLabels.CLOTHING.en}</option>
                  <option value="GENERAL">{categoryLabels.GENERAL.icon} {categoryLabels.GENERAL.en}</option>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button type="submit" className="btn btn-primary" style={{ minHeight: '34px', fontSize: '0.8rem' }}>
                <Check size={13} /> {t.updateProfile}
              </button>
            </div>
          </form>

          {/* 3. Account Security & Change Password Section */}
          <form onSubmit={handleChangePassword} style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Lock size={15} color="var(--text-secondary)" />
                <span>{t.security}</span>
              </div>
              {passwordSuccess && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-credit)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={13} /> {t.passwordChangedSuccess}
                </span>
              )}
            </div>

            {passwordError && (
              <div style={{
                background: 'var(--color-debit-bg)',
                border: '1px solid var(--color-debit-border)',
                color: 'var(--color-debit)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={14} />
                {passwordError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button type="submit" className="btn btn-outline" style={{ minHeight: '34px', fontSize: '0.8rem' }}>
                <Lock size={13} /> {t.changePassword}
              </button>
            </div>
          </form>

          {/* 4. Data Reset Section */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.resetData}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.resetConfirm}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ borderColor: 'var(--color-debit-border)', color: 'var(--color-debit)', minHeight: '34px', fontSize: '0.78rem' }}
              onClick={() => {
                if (window.confirm(t.resetConfirm)) {
                  onResetData();
                  onClose();
                }
              }}
            >
              <RotateCcw size={13} />
              {t.resetData}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
