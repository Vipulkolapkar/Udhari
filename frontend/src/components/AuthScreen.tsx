'use client';

import React, { useState } from 'react';
import {
  Store,
  UserPlus,
  LogIn,
  Sparkles,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  Lock,
  User,
  MapPin,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { ShopUser, ShopCategory, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { UdhariLogo } from './UdhariLogo';
import { OtpVerificationModal } from './OtpVerificationModal';

interface AuthScreenProps {
  language: Language;
  theme: ThemeMode;
  existingShops: ShopUser[];
  onLogin: (shop: ShopUser) => void;
  onLoginWithEmail: (identifier: string, password?: string) => void;
  onLoginWithGoogle: () => void;
  onRegister: (shopData: {
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
  }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  existingShops,
  onLogin,
  onLoginWithEmail,
  onLoginWithGoogle,
  onRegister
}) => {
  const t = getTranslation(language);
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register State
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [gstin, setGstin] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [category, setCategory] = useState<ShopCategory>('KIRANA');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OTP Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpModal, setOtpModal] = useState<{ type: 'PHONE' | 'EMAIL'; target: string } | null>(null);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setIsPhoneVerified(false);
    if (sameAsPhone) {
      setWhatsappPhone(val);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setIsEmailVerified(false);
  };

  const handleSameAsPhoneToggle = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) {
      setWhatsappPhone(phone);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) return;
    onLoginWithEmail(loginIdentifier.trim(), loginPassword);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shopName.trim() || !ownerName.trim() || !phone.trim()) {
      setErrorMessage('Please fill in the business name, owner name, and phone number.');
      return;
    }

    if (phone.trim().replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms & Conditions to proceed.');
      return;
    }

    // Enforce OTP verification before completing business registration
    if (!isPhoneVerified) {
      setOtpModal({ type: 'PHONE', target: phone.trim() });
      return;
    }

    // Complete registration once OTP is verified
    onRegister({
      shop_name: shopName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      whatsapp_phone: (sameAsPhone ? phone.trim() : whatsappPhone.trim()) || phone.trim(),
      email: email.trim() || undefined,
      password: registerPassword || undefined,
      gstin: gstin.trim() || undefined,
      shop_category: category,
      address: address.trim() || undefined,
      terms_accepted: termsAccepted
    });
  };

  const handleOtpVerified = () => {
    if (otpModal?.type === 'PHONE') {
      setIsPhoneVerified(true);
      // Auto complete registration right after OTP is successfully verified!
      onRegister({
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        whatsapp_phone: (sameAsPhone ? phone.trim() : whatsappPhone.trim()) || phone.trim(),
        email: email.trim() || undefined,
        password: registerPassword || undefined,
        gstin: gstin.trim() || undefined,
        shop_category: category,
        address: address.trim() || undefined,
        terms_accepted: termsAccepted
      });
    } else if (otpModal?.type === 'EMAIL') {
      setIsEmailVerified(true);
    }
    setOtpModal(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: tab === 'REGISTER' ? '580px' : '480px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        transition: 'max-width 0.2s ease'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '1.75rem 1.5rem 1.25rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0.65rem'
          }}>
            <UdhariLogo size={46} />
          </div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Udhari
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {t.defaultShopSubtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            style={{
              flex: 1,
              background: tab === 'LOGIN' ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
              border: 'none',
              borderBottom: tab === 'LOGIN' ? '2px solid var(--btn-primary-bg)' : 'none',
              color: tab === 'LOGIN' ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0.85rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
            onClick={() => {
              setTab('LOGIN');
              setErrorMessage(null);
            }}
          >
            <LogIn size={15} />
            {t.signIn}
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              background: tab === 'REGISTER' ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
              border: 'none',
              borderBottom: tab === 'REGISTER' ? '2px solid var(--btn-primary-bg)' : 'none',
              color: tab === 'REGISTER' ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0.85rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
            onClick={() => {
              setTab('REGISTER');
              setErrorMessage(null);
            }}
          >
            <UserPlus size={15} />
            {t.signUp}
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Error Message Alert */}
          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}



          {tab === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.emailOrPhone} *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="owner@example.com / 9822014589"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.password}
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {t.forgotPassword}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '40px', marginTop: '0.35rem' }}>
                <LogIn size={15} />
                <span>{t.signIn}</span>
              </button>

            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Shop Name & Owner Name */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <Store size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.shopName} *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sharma General Store"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.ownerName} *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Login Mobile & Dedicated WhatsApp Business Number */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {t.phone} *
                    </label>
                    {isPhoneVerified ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <CheckCircle size={12} /> Verified
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
                    placeholder="9822014589"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MessageSquare size={12} color="var(--color-credit)" style={{ display: 'inline', marginRight: '4px' }} />
                    {t.whatsappNumber} *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="9822014589"
                    value={sameAsPhone ? phone : whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    disabled={sameAsPhone}
                    required
                  />
                </div>
              </div>

              {/* Same as Phone Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                  style={{ accentColor: 'var(--btn-primary-bg)', width: '15px', height: '15px' }}
                />
                <span>✓ {t.sameAsPhone}</span>
              </label>

              {/* Email & GSTIN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {t.email}
                    </label>
                    {isEmailVerified ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <CheckCircle size={12} /> Verified
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
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
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

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.password} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Category & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.shopCategory} *
                  </label>
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
                  <label className="form-label">
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {t.address}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Main Market, Mumbai"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Terms & Conditions Agreement Box */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ accentColor: 'var(--btn-primary-bg)', width: '16px', height: '16px', marginTop: '2px' }}
                    required
                  />
                  <span>{t.termsAgreement}</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '1.5rem' }}>
                  <ShieldCheck size={13} color="var(--color-credit)" />
                  <span>{t.dataSecurityNote}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '42px', marginTop: '0.25rem', fontSize: '0.92rem' }}
              >
                <UserPlus size={16} />
                <span>{t.signUp}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* OTP Verification Modal */}
      {otpModal && (
        <OtpVerificationModal
          type={otpModal.type}
          target={otpModal.target}
          onClose={() => setOtpModal(null)}
          onVerified={handleOtpVerified}
        />
      )}
    </div>
  );
};
