'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  UserPlus,
  LogIn,
  Building2,
  Phone,
  Mail,
  Lock,
  User,
  MapPin,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Send,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { ShopUser, ShopCategory, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { UdhariLogo } from './UdhariLogo';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  language: Language;
  theme: ThemeMode;
  existingShops: ShopUser[];
  onLogin: (shop: ShopUser) => void;
  onLoginWithEmail: (identifier: string, password?: string, method?: 'EMAIL' | 'PHONE') => void;
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
    custom_category?: string;
    address?: string;
    terms_accepted?: boolean;
  }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onLoginWithEmail,
  onRegister
}) => {
  const t = getTranslation(language);
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // ─── Sign In State ────────────────────────────────────────────────
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ─── Register State ───────────────────────────────────────────────
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [category, setCategory] = useState<ShopCategory>('KIRANA');
  const [customCategory, setCustomCategory] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Inline Email OTP State ───────────────────────────────────────
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (otpTimer <= 0 || !otpSent) return;
    const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer, otpSent]);

  // Real-time listener for magic link / confirmation email click in background
  useEffect(() => {
    if (!otpSent || isEmailVerified) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user?.email?.toLowerCase() === email.trim().toLowerCase() || !session?.user?.email) {
          setIsEmailVerified(true);
          setOtpError(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [otpSent, email, isEmailVerified]);

  // Send Email Verification Code
  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setOtpError('Please enter a valid email address first.');
      return;
    }
    setIsSendingOtp(true);
    setOtpError(null);

    try {
      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        }
      });
      if (error) throw error;

      setOtpSent(true);
      setOtpTimer(60);
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification email.';
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify 6-digit Code
  const handleVerifyCode = async (code: string) => {
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email'
      });
      if (error) {
        setOtpError('Invalid code. Enter the 6-digit code from email or click the link.');
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        setIsEmailVerified(true);
        setOtpError(null);
      }
    } catch {
      setOtpError('Verification failed. Try clicking the link in your email.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);
    setOtpError(null);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const fullCode = newValues.join('');
    if (fullCode.length === 6 && !newValues.includes('')) {
      handleVerifyCode(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
      const newValues = [...otpValues];
      newValues[index] = '';
      setOtpValues(newValues);
    }
  };

  // ─── Submit Handlers ──────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const identifier = loginMethod === 'EMAIL' ? loginEmail.trim() : loginPhone.trim();
    if (!identifier) {
      setErrorMessage(`Please enter your ${loginMethod === 'EMAIL' ? 'email address' : 'mobile number'}.`);
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await onLoginWithEmail(identifier, loginPassword, loginMethod);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shopName.trim()) {
      setErrorMessage('Please enter your Business Name.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Please enter Owner / Proprietor Name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Email Address.');
      return;
    }
    if (!isEmailVerified) {
      setErrorMessage('Please verify your email address to proceed.');
      handleSendEmailOtp();
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (category === 'OTHER' && !customCategory.trim()) {
      setErrorMessage('Please specify your business category.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy to create your account.');
      return;
    }

    onRegister({
      shop_name: shopName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      whatsapp_phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: registerPassword,
      gstin: gstin.trim() || undefined,
      shop_category: category,
      custom_category: category === 'OTHER' ? customCategory.trim() : undefined,
      address: address.trim() || undefined,
      terms_accepted: termsAccepted
    });
  };

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
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '2rem 1.75rem 1.25rem 1.75rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <UdhariLogo size={48} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Udhari
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {tab === 'LOGIN' ? 'Sign in to manage your credit ledger' : 'Create your business account'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
          <button
            type="button"
            style={{
              flex: 1,
              background: tab === 'LOGIN' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              borderBottom: tab === 'LOGIN' ? '2.5px solid var(--btn-primary-bg)' : '2.5px solid transparent',
              color: tab === 'LOGIN' ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0.9rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
            onClick={() => {
              setTab('LOGIN');
              setErrorMessage(null);
            }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              background: tab === 'REGISTER' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              borderBottom: tab === 'REGISTER' ? '2.5px solid var(--btn-primary-bg)' : '2.5px solid transparent',
              color: tab === 'REGISTER' ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0.9rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
            onClick={() => {
              setTab('REGISTER');
              setErrorMessage(null);
            }}
          >
            <UserPlus size={16} />
            <span>Register Business</span>
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* Error Message */}
          {errorMessage && (
            <div style={{
              background: 'var(--color-debit-bg)',
              border: '1px solid var(--color-debit-border)',
              color: 'var(--color-debit)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ═══════════════════ SIGN IN FORM ═══════════════════ */}
          {tab === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Method Toggle: Email vs Mobile */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>
                  Sign in using
                </label>
                <div style={{
                  display: 'flex',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px',
                  gap: '4px'
                }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      background: loginMethod === 'EMAIL' ? 'var(--btn-primary-bg)' : 'transparent',
                      color: loginMethod === 'EMAIL' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => { setLoginMethod('EMAIL'); setErrorMessage(null); }}
                  >
                    <Mail size={14} />
                    <span>Email Address</span>
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      background: loginMethod === 'PHONE' ? 'var(--btn-primary-bg)' : 'transparent',
                      color: loginMethod === 'PHONE' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => { setLoginMethod('PHONE'); setErrorMessage(null); }}
                  >
                    <Phone size={14} />
                    <span>Mobile Number</span>
                  </button>
                </div>
              </div>

              {/* Identifier Input */}
              {loginMethod === 'EMAIL' ? (
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={13} style={{ display: 'inline', marginRight: '5px' }} />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rahul@business.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">
                    <Phone size={13} style={{ display: 'inline', marginRight: '5px' }} />
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9822012345"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              {/* Password Input (Mandatory) */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Sign In CTA */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '44px', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.35rem' }}
                disabled={isLoggingIn}
              >
                <LogIn size={16} />
                <span>{isLoggingIn ? 'Signing In...' : 'Sign In'}</span>
              </button>

              {/* Link to Registration */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>New customer? </span>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--btn-primary-bg)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontSize: '0.85rem'
                  }}
                  onClick={() => {
                    setTab('REGISTER');
                    setErrorMessage(null);
                  }}
                >
                  Register your business here →
                </button>
              </div>
            </form>
          ) : (
            /* ═══════════════════ REGISTRATION FORM (SINGLE COLUMN) ═══════════════════ */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* 1. Business Name */}
              <div className="form-group">
                <label className="form-label">
                  <Store size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Business / Shop Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma Kirana & General Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* 2. Owner Name */}
              <div className="form-group">
                <label className="form-label">
                  <User size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Owner / Proprietor Name *
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

              {/* 3. Mobile Number (Single field, no separate whatsapp) */}
              <div className="form-group">
                <label className="form-label">
                  <Phone size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9822012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* 4. Email Address with IN-LINE Verification */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <Mail size={13} style={{ display: 'inline', marginRight: '5px' }} />
                    Email Address *
                  </label>
                  {isEmailVerified ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle size={13} /> Verified
                    </span>
                  ) : null}
                </div>
                
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. rahul@business.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false);
                    setOtpSent(false);
                  }}
                  disabled={isEmailVerified}
                  required
                />

                {/* Inline OTP Section */}
                {!isEmailVerified && (
                  <div style={{
                    marginTop: '0.65rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem'
                  }}>
                    {!otpSent ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Verify your email to create account:
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', fontWeight: 700 }}
                          onClick={handleSendEmailOtp}
                          disabled={isSendingOtp || !email.includes('@')}
                        >
                          <Send size={12} />
                          <span>{isSendingOtp ? 'Sending...' : 'Send Verification OTP'}</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Enter 6-digit code (or click link in email):
                          </span>
                          {otpTimer > 0 ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Resend in <strong>{otpTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--btn-primary-bg)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <RefreshCw size={11} /> Resend
                            </button>
                          )}
                        </div>

                        {/* 6 Digit Inputs */}
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          {otpValues.map((val, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpInputRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={val}
                              onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              disabled={isVerifyingOtp}
                              style={{
                                width: '38px',
                                height: '44px',
                                textAlign: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                border: '1.5px solid var(--border-medium)',
                                borderRadius: 'var(--radius-xs)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                              }}
                            />
                          ))}
                        </div>

                        {otpError && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-debit)', textAlign: 'center' }}>
                            {otpError}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Password (Mandatory) */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Create Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="At least 6 characters"
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
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 6. Business Category */}
              <div className="form-group">
                <label className="form-label">
                  <Building2 size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Business Category *
                </label>
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
                  <option value="OTHER">{categoryLabels.OTHER.icon} {categoryLabels.OTHER.en}</option>
                </select>
              </div>

              {/* 7. Custom Category Input (Appears if OTHER selected) */}
              {category === 'OTHER' && (
                <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                  <label className="form-label">
                    <Sparkles size={13} style={{ display: 'inline', marginRight: '5px' }} />
                    Specify Business Type *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bakery, Cafe, Electronics, Automobile..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              {/* 8. Address & City (Optional) */}
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Business Address & City (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Shop #12, Market Yard, Mumbai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* 9. GSTIN (Optional) */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  GSTIN / Trade License No. (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>

              {/* 10. Terms Agreement */}
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
                  gap: '0.55rem',
                  fontSize: '0.82rem',
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
                  <span>I agree to the Terms of Service & Privacy Policy of Udhari.</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '1.55rem' }}>
                  <ShieldCheck size={13} color="var(--color-credit)" />
                  <span>All customer ledgers and financial data are securely encrypted.</span>
                </div>
              </div>

              {/* Create Account CTA */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginTop: '0.35rem'
                }}
              >
                <UserPlus size={16} />
                <span>Create Business Account</span>
              </button>

              {/* Link to Sign In */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Already have a business account? </span>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--btn-primary-bg)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontSize: '0.85rem'
                  }}
                  onClick={() => {
                    setTab('LOGIN');
                    setErrorMessage(null);
                  }}
                >
                  Sign in here →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
