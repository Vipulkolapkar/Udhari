'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LogIn,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Send,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { ShopUser, ShopCategory, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { UdhariLogo } from './UdhariLogo';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  language: Language;
  theme: ThemeMode;
  existingShops: ShopUser[];
  initialTab?: 'LOGIN' | 'REGISTER';
  initialEmail?: string;
  initialOwnerName?: string;
  initialEmailVerified?: boolean;
  infoBanner?: string | null;
  onLogin: (shop: ShopUser) => void;
  onLoginWithEmail: (identifier: string, password?: string, method?: 'EMAIL' | 'PHONE') => Promise<{ success: boolean; error?: string } | void> | void;
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
  initialTab = 'LOGIN',
  initialEmail = '',
  initialOwnerName = '',
  initialEmailVerified = false,
  infoBanner = null,
  onLoginWithEmail,
  onRegister
}) => {
  const t = getTranslation(language);
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);

  // ─── Sign In State ────────────────────────────────────────────────
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ─── Register State ───────────────────────────────────────────────
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [category, setCategory] = useState<ShopCategory>('KIRANA');
  const [customCategory, setCustomCategory] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Inline Email OTP State ───────────────────────────────────────
  const [isEmailVerified, setIsEmailVerified] = useState(initialEmailVerified);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
    if (initialEmail) setEmail(initialEmail);
    if (initialOwnerName) setOwnerName(initialOwnerName);
    if (initialEmailVerified !== undefined) setIsEmailVerified(initialEmailVerified);
  }, [initialTab, initialEmail, initialOwnerName, initialEmailVerified]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (otpTimer <= 0 || !otpSent) return;
    const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer, otpSent]);

  // Real-time listener for magic link / confirmation email click
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
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setOtpError('Please provide your email address first to receive the OTP.');
      emailInputRef.current?.focus();
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
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
        setOtpError('Invalid code. Enter 6 digits from email or click the link in email.');
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

  // ─── Google OAuth 2.0 Handler ──────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed.';
      setErrorMessage(msg);
      setIsGoogleLoading(false);
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
      const res = await onLoginWithEmail(identifier, loginPassword, loginMethod);
      if (res && !res.success && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shopName.trim()) {
      setErrorMessage('Please enter Business Name.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Please enter Owner / Proprietor Name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Mobile Number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide your Email Address.');
      emailInputRef.current?.focus();
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
      setErrorMessage('Please specify your business type.');
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
        {/* Brand Header with Logo on the side */}
        <div style={{
          padding: '2rem 2rem 1.4rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ flexShrink: 0 }}>
            <UdhariLogo size={48} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              {tab === 'LOGIN' ? 'Sign In to Udhari' : 'Register Your Business'}
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
              {tab === 'LOGIN' ? 'Access your customer credit ledger' : 'Create an account for your shop'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* Google Verified / Info Banner */}
          {infoBanner && (
            <div style={{
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1.5px solid rgba(37, 99, 235, 0.3)',
              color: 'var(--text-primary)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: 1.4,
              marginBottom: '1.25rem'
            }}>
              {infoBanner}
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && (
            <div style={{
              background: 'var(--color-debit-bg)',
              border: '1.5px solid var(--color-debit-border)',
              color: 'var(--color-debit)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
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
              
              {/* Google OAuth 2.0 Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Clean Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: '0.2rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  or sign in with password
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Compact Sleek Switcher between Email & Mobile */}
              <div style={{
                display: 'inline-flex',
                alignSelf: 'center',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '9999px',
                padding: '2px',
                gap: '2px'
              }}>
                <button
                  type="button"
                  style={{
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '9999px',
                    background: loginMethod === 'EMAIL' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: loginMethod === 'EMAIL' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => { setLoginMethod('EMAIL'); setErrorMessage(null); }}
                >
                  <Mail size={12} />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '9999px',
                    background: loginMethod === 'PHONE' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: loginMethod === 'PHONE' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => { setLoginMethod('PHONE'); setErrorMessage(null); }}
                >
                  <Phone size={12} />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Identifier Input */}
              {loginMethod === 'EMAIL' ? (
                <div className="form-group">
                  <label className="form-label">
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

              {/* 3. Mobile Number */}
              <div className="form-group">
                <label className="form-label">
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
                    Email Address *
                  </label>
                  {isEmailVerified ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle size={13} /> Verified
                    </span>
                  ) : null}
                </div>
                
                <input
                  ref={emailInputRef}
                  type="email"
                  className="form-input"
                  placeholder="e.g. rahul@business.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false);
                    setOtpSent(false);
                    setOtpError(null);
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
                          Verify email to activate account:
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', fontWeight: 700 }}
                          onClick={handleSendEmailOtp}
                          disabled={isSendingOtp}
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
                              <RefreshCw size={11} /> Resend OTP
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
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-debit)', textAlign: 'center', fontWeight: 600 }}>
                            {otpError}
                          </span>
                        )}
                      </div>
                    )}

                    {otpError && !otpSent && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--color-debit)', fontWeight: 600 }}>
                        {otpError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Password (Mandatory) */}
              <div className="form-group">
                <label className="form-label">
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
                <div className="form-group">
                  <label className="form-label">
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
