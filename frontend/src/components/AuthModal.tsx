'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Send,
  RefreshCw,
  Mail,
  Phone,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { ShopUser, ShopCategory, Language } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { UdhariLogo } from './UdhariLogo';
import { supabase } from '../lib/supabase';
import { sbResetShopPassword } from '../lib/supabaseStore';

interface AuthModalProps {
  language: Language;
  existingShops: ShopUser[];
  onClose: () => void;
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

export const AuthModal: React.FC<AuthModalProps> = ({
  language,
  onClose,
  onLoginWithEmail,
  onRegister
}) => {
  const t = getTranslation(language);
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');

  // Sign In State
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Register State
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inline OTP State (Registration)
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpValues, setForgotOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [forgotTimer, setForgotTimer] = useState(60);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [isResettingPass, setIsResettingPass] = useState(false);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpTimer <= 0 || !otpSent) return;
    const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer, otpSent]);

  useEffect(() => {
    if (forgotTimer <= 0 || !forgotOtpSent) return;
    const interval = setInterval(() => setForgotTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [forgotTimer, forgotOtpSent]);

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
        options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
      });
      if (error) throw error;
      setOtpSent(true);
      setOtpTimer(60);
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

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
        setOtpError('Invalid code. Enter 6 digits or click link in email.');
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        setIsEmailVerified(true);
        setOtpError(null);
      }
    } catch {
      setOtpError('Verification failed.');
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

    if (digit && index < 5) otpInputRefs.current[index + 1]?.focus();
    const fullCode = newValues.join('');
    if (fullCode.length === 6 && !newValues.includes('')) handleVerifyCode(fullCode);
  };

  const handleSendForgotOtp = async () => {
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setIsSendingForgotOtp(true);
    setErrorMessage(null);
    try {
      // 1. Check if business exists in our database with this email
      const { data: existingShop, error: checkError } = await supabase
        .from('shops')
        .select('id, shop_name, email')
        .ilike('email', cleanEmail)
        .limit(1);

      if (checkError) throw new Error(checkError.message);
      if (!existingShop || existingShop.length === 0) {
        throw new Error(`No registered business found for "${cleanEmail}". Please check the spelling or register a new business.`);
      }

      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
      });
      if (error) throw error;
      setForgotOtpSent(true);
      setForgotTimer(60);
      setForgotOtpValues(['', '', '', '', '', '']);
      setTimeout(() => forgotOtpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send reset code.');
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const token = forgotOtpValues.join('');
    if (token.length < 6) {
      setErrorMessage('Please enter 6-digit code received on your Gmail.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsResettingPass(true);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: forgotEmail.trim().toLowerCase(),
        token: token,
        type: 'email'
      });
      if (verifyErr) throw new Error('Invalid verification code.');

      const res = await sbResetShopPassword(forgotEmail.trim().toLowerCase(), forgotNewPassword);
      if (!res.success) throw new Error(res.error || 'Failed to update password.');

      setSuccessMessage('Password reset successfully! You can now sign in.');
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(forgotNewPassword);
      setTab('LOGIN');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setIsResettingPass(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google authentication failed.');
      setIsGoogleLoading(false);
    }
  };

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
      setErrorMessage(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shopName.trim() || !ownerName.trim() || !phone.trim()) {
      setErrorMessage('Please fill in Business Name, Owner Name, and Mobile Number.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
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
      setErrorMessage('Please accept the Terms & Conditions.');
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <UdhariLogo size={28} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {tab === 'LOGIN' ? 'Sign In to Udhari' : tab === 'REGISTER' ? 'Register New Business' : 'Reset Password'}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {successMessage && (
            <div style={{
              background: 'var(--color-credit-bg)',
              border: '1px solid var(--color-credit-border)',
              color: 'var(--color-credit)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '1rem'
            }}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div style={{
              background: 'var(--color-debit-bg)',
              border: '1px solid var(--color-debit-border)',
              color: 'var(--color-debit)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              


              {/* Method Switcher */}
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
                    gap: '0.3rem'
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
                    gap: '0.3rem'
                  }}
                  onClick={() => { setLoginMethod('PHONE'); setErrorMessage(null); }}
                >
                  <Phone size={12} />
                  <span>Mobile</span>
                </button>
              </div>

              {loginMethod === 'EMAIL' ? (
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
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
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9822012345"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password *</label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setTab('FORGOT_PASSWORD');
                      setForgotEmail(loginEmail || email || '');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="Enter password"
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
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '42px', marginTop: '0.35rem', fontWeight: 700 }}
                disabled={isLoggingIn}
              >
                <LogIn size={15} />
                <span>{isLoggingIn ? 'Signing In...' : 'Sign In'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: '0.2rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  or continue with
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Google OAuth 2.0 Button (Below Sign In) */}
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
                  padding: '0.7rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.88rem',
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

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
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
                    padding: 0
                  }}
                  onClick={() => { setTab('REGISTER'); setErrorMessage(null); setSuccessMessage(null); }}
                >
                  Register business here →
                </button>
              </div>
            </form>
          ) : tab === 'REGISTER' ? (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma General Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner / Proprietor Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Sharma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9822012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>

              {/* Email with Inline Verification */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Email Address *</label>
                  {isEmailVerified && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
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

                {!isEmailVerified && (
                  <div style={{
                    marginTop: '0.5rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem'
                  }}>
                    {!otpSent ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Verify email to continue:
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}
                          onClick={handleSendEmailOtp}
                          disabled={isSendingOtp}
                        >
                          <Send size={11} />
                          <span>{isSendingOtp ? 'Sending...' : 'Send OTP'}</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Enter 6-digit code:
                          </span>
                          {otpTimer > 0 ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Resend in {otpTimer}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              style={{ background: 'none', border: 'none', color: 'var(--btn-primary-bg)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          {otpValues.map((val, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpInputRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={val}
                              onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otpValues[i] && i > 0) {
                                  otpInputRefs.current[i - 1]?.focus();
                                }
                              }}
                              disabled={isVerifyingOtp}
                              style={{
                                width: '34px',
                                height: '40px',
                                textAlign: 'center',
                                fontSize: '1.1rem',
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
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-debit)', textAlign: 'center', fontWeight: 600 }}>{otpError}</span>
                        )}
                      </div>
                    )}

                    {otpError && !otpSent && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-debit)', fontWeight: 600 }}>
                        {otpError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
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
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Business Category *</label>
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

              {category === 'OTHER' && (
                <div className="form-group">
                  <label className="form-label">Specify Business Type *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bakery, Cafe, Electronics..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Business Address & City (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Shop #12, Market Yard, Mumbai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>

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
                  style={{ accentColor: 'var(--btn-primary-bg)', width: '15px', height: '15px', marginTop: '2px' }}
                  required
                />
                <span>I agree to the Terms of Service & Privacy Policy of Udhari.</span>
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '42px', marginTop: '0.25rem', fontWeight: 700 }}
              >
                <UserPlus size={15} />
                <span>Create Business Account</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Already registered? </span>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--btn-primary-bg)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                  onClick={() => { setTab('LOGIN'); setErrorMessage(null); setSuccessMessage(null); }}
                >
                  Sign in here →
                </button>
              </div>
            </form>
          ) : (
            /* ═══════════════════ 3. FORGOT PASSWORD FORM ═══════════════════ */
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => { setTab('LOGIN'); setErrorMessage(null); setSuccessMessage(null); }}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </button>

              <div className="form-group">
                <label className="form-label">Registered Gmail / Email Address *</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. yourshop@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotOtpSent}
                    style={{ flex: 1 }}
                  />
                  {!forgotOtpSent && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendForgotOtp}
                      disabled={isSendingForgotOtp}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      {isSendingForgotOtp ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {forgotOtpSent && (
                <>
                  <div style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Enter 6-digit code:
                      </span>
                      {forgotTimer > 0 ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Resend in {forgotTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendForgotOtp}
                          style={{ background: 'none', border: 'none', color: 'var(--btn-primary-bg)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                      {forgotOtpValues.map((val, i) => (
                        <input
                          key={i}
                          ref={(el) => { forgotOtpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => {
                            const digit = e.target.value.replace(/\D/g, '').slice(-1);
                            const newVals = [...forgotOtpValues];
                            newVals[i] = digit;
                            setForgotOtpValues(newVals);
                            if (digit && i < 5) forgotOtpRefs.current[i + 1]?.focus();
                          }}
                          style={{
                            width: '34px',
                            height: '40px',
                            textAlign: 'center',
                            fontSize: '1.1rem',
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
                  </div>

                  <div className="form-group">
                    <label className="form-label">Create New Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showForgotPass ? 'text' : 'password'}
                        className="form-input"
                        placeholder="At least 6 characters"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                        style={{ width: '100%', paddingRight: '2.5rem' }}
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
                        onClick={() => setShowForgotPass(!showForgotPass)}
                      >
                        {showForgotPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password *</label>
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Repeat new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', minHeight: '42px', marginTop: '0.25rem', fontWeight: 700 }}
                    disabled={isResettingPass}
                  >
                    <KeyRound size={15} />
                    <span>{isResettingPass ? 'Saving...' : 'Save New Password & Sign In'}</span>
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
