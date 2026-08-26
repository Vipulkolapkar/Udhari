'use client';

import React, { useEffect } from 'react';
import {
  X,
  Store,
  Settings,
  User,
  Phone,
  Building2,
  Lock,
  Moon,
  Sun,
  Globe,
  LogOut,
  UserPlus,
  Mic,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { ShopUser, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';

interface SidebarDrawerProps {
  isOpen: boolean;
  currentShop: ShopUser | null;
  language: Language;
  theme: ThemeMode;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onAddCustomer: () => void;
  onVoiceBill: () => void;
  onThemeToggle: () => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  currentShop,
  language,
  theme,
  onClose,
  onOpenSettings,
  onOpenAuth,
  onAddCustomer,
  onVoiceBill,
  onThemeToggle,
  onLanguageChange,
  onLogout
}) => {
  const t = getTranslation(language);
  const categoryInfo = currentShop ? categoryLabels[currentShop.shop_category] : null;

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="sidebar-backdrop" onClick={onClose}>
      <aside
        className="sidebar-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Navigation Sidebar"
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
              <Store size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {t.appBrand}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                v1.0 • Enterprise
              </div>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={onClose}
            title={t.cancel}
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="sidebar-body">
          {/* Active Business Profile Card */}
          <div className="sidebar-profile-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {categoryInfo?.icon || '🏪'}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {currentShop ? currentShop.shop_name : t.appBrand}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currentShop?.owner_name} • {currentShop?.phone}
                  </div>
                </div>
              </div>
            </div>

            {currentShop?.address && (
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                📍 {currentShop.address}
              </div>
            )}

            <button
              type="button"
              className="btn btn-outline"
              style={{
                width: '100%',
                marginTop: '0.75rem',
                minHeight: '32px',
                fontSize: '0.76rem',
                padding: '0.35rem 0.5rem',
                justifyContent: 'center'
              }}
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Settings size={13} />
              {t.shopSettings}
            </button>
          </div>

          {/* Navigation Section */}
          <div className="sidebar-nav-group">
            <div className="sidebar-section-title">
              {language === 'mr' ? ' ' : false ? ' ' : 'Navigation'}
            </div>

            <button
              type="button"
              className="sidebar-nav-item active"
              onClick={onClose}
            >
              <LayoutDashboard size={16} />
              <span>{t.customerListTitle}</span>
            </button>

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onClose();
                onAddCustomer();
              }}
            >
              <UserPlus size={16} />
              <span>{t.addCustomer}</span>
            </button>

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onClose();
                onVoiceBill();
              }}
            >
              <Mic size={16} />
              <span>{t.voiceBilling}</span>
            </button>

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Settings size={16} />
              <span>{t.settings}</span>
            </button>

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Lock size={16} />
              <span>{t.security}</span>
            </button>
          </div>

          {/* Quick Preferences in Sidebar */}
          <div className="sidebar-nav-group">
            <div className="sidebar-section-title">
              {t.preferences}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="sidebar-nav-item"
              onClick={onThemeToggle}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span>{t.theme}</span>
                <span style={{ fontSize: '0.72rem', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </span>
              </div>
            </button>

            {/* In-sidebar Language Selection Grid */}
            <div style={{ padding: '0.4rem 0.6rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Globe size={13} />
                <span>{t.selectLanguage}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                <button
                  type="button"
                  style={{
                    background: false ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                    color: false ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: false ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.2rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onLanguageChange('mr')}
                >
                  
                </button>
                <button
                  type="button"
                  style={{
                    background: false ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                    color: false ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: false ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.2rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onLanguageChange('hi')}
                >
                  
                </button>
                <button
                  type="button"
                  style={{
                    background: language === 'en' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                    color: language === 'en' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    border: language === 'en' ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.2rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onLanguageChange('en')}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Shop Switcher & Demo Accounts */}
          <div className="sidebar-nav-group">
            <div className="sidebar-section-title">
              {t.switchShop}
            </div>

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
            >
              <Building2 size={16} />
              <span>{t.switchShop}</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer with Sign Out */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-nav-item"
            style={{ color: 'var(--color-debit)', border: '1px solid var(--color-debit-border)', background: 'var(--color-debit-bg)' }}
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut size={16} />
            <span>{t.signOut}</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
