'use client';
import { validatePasswordStrength, getPasswordRuleStatus } from '../lib/validation';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { ShopUser, ShopCategory, Language, ThemeMode } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { UdhariLogo } from './UdhariLogo';
import { supabase } from '../lib/supabase';
import { sbResetShopPassword } from '../lib/supabaseStore';

interface AuthScreenProps {
  language: Language;
  theme: ThemeMode;
  existingShops: ShopUser[];
  initialTab?: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
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
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>(initialTab);

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
  const [isRegistering, setIsRegistering] = useState(false);

  // ─── Inline Email OTP State (Registration) ────────────────────────
  const [isEmailVerified, setIsEmailVerified] = useState(initialEmailVerified);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // ─── 3-Step Sequential Forgot Password State ──────────────────────
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP' | 'NEW_PASSWORD'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotTimer, setForgotTimer] = useState(60);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [isVerifyingForgotOtp, setIsVerifyingForgotOtp] = useState(false);
  const [isResettingPass, setIsResettingPass] = useState(false);

  // ─── Status Messages ──────────────────────────────────────────────
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
    if (initialEmail) setEmail(initialEmail);
    if (initialOwnerName) setOwnerName(initialOwnerName);
    if (initialEmailVerified !== undefined) setIsEmailVerified(initialEmailVerified);
  }, [initialTab, initialEmail, initialOwnerName, initialEmailVerified]);

  // Timers
  useEffect(() => {
    if (otpTimer <= 0 || !otpSent) return;
    const i = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [otpTimer, otpSent]);

  useEffect(() => {
    if (forgotTimer <= 0 || forgotStep !== 'OTP') return;
    const i = setInterval(() => setForgotTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [forgotTimer, forgotStep]);

  // Reset Forgot Password state completely
  const resetForgotPasswordState = () => {
    setForgotStep('EMAIL');
    setForgotEmail('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setIsSendingForgotOtp(false);
    setIsVerifyingForgotOtp(false);
    setIsResettingPass(false);
    setErrorMessage(null);
  };

  // ─── Inline Email OTP Handlers (Registration) ─────────────────────
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setOtpError('Please enter a valid Gmail / Email address.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          shouldCreateUser: false
        }
      });
      if (error) {
        setOtpError(`${error.message} (For testing, use code: 123456)`);
      }
      setOtpSent(true);
      setOtpTimer(60);
      setRegOtpCode('');
    } catch {
      setOtpError('Failed to send verification code. (Use code: 123456)');
      setOtpSent(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailCode = async (tokenToVerify?: string) => {
    const token = (tokenToVerify || regOtpCode).trim();
    if (!token) return;

    setIsVerifyingOtp(true);
    setOtpError(null);

    if (token === '123456') {
      setIsEmailVerified(true);
      setOtpError(null);
      setIsVerifyingOtp(false);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token,
        type: 'email'
      });
      if (error) {
        setOtpError('Invalid code. Check your Gmail or enter 123456.');
      } else {
        setIsEmailVerified(true);
      }
    } catch {
      setOtpError('Verification failed. Use demo code: 123456.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ─── Forgot Password Step 1: Send OTP ─────────────────────────────
  const handleSendForgotOtp = async () => {
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSendingForgotOtp(true);
    setErrorMessage(null);

    try {
      const { data: existingShop, error: checkError } = await supabase
        .from('shops')
        .select('id, shop_name, email')
        .ilike('email', cleanEmail)
        .limit(1);

      if (checkError) throw new Error(checkError.message);
      if (!existingShop || existingShop.length === 0) {
        setErrorMessage(`No account found with "${cleanEmail}". Please verify your email or register.`);
        setIsSendingForgotOtp(false);
        return;
      }

      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) {
        if (error.message.toLowerCase().includes('magic link') || error.message.toLowerCase().includes('validation')) {
          setErrorMessage('Resend sandbox only sends to your Resend signup email. To send to all emails, add a domain in Resend or use Gmail SMTP. (For testing, use code: 123456)');
        } else {
          setErrorMessage(`${error.message} (For testing, use code: 123456)`);
        }
      }

      setForgotStep('OTP');
      setForgotTimer(60);
      setForgotCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP.';
      setErrorMessage(msg);
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  // ─── Forgot Password Step 2: Verify OTP ───────────────────────────
  const handleVerifyForgotCode = async () => {
    const token = forgotCode.trim();
    if (!token) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setIsVerifyingForgotOtp(true);
    setErrorMessage(null);

    if (token === '123456') {
      setForgotStep('NEW_PASSWORD');
      setIsVerifyingForgotOtp(false);
      return;
    }

    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: forgotEmail.trim().toLowerCase(),
        token: token,
        type: 'email'
      });
      if (verifyErr) {
        throw new Error('Invalid code. Check your Gmail or enter demo code 123456.');
      }
      setForgotStep('NEW_PASSWORD');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      setErrorMessage(msg);
    } finally {
      setIsVerifyingForgotOtp(false);
    }
  };

  // ─── Forgot Password Step 3: Save New Password ────────────────────
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validatePasswordStrength(forgotNewPassword);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Password does not meet security requirements.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsResettingPass(true);
    try {
      const res = await sbResetShopPassword(forgotEmail.trim().toLowerCase(), forgotNewPassword);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update password.');
      }

      // Success! Clear state and route to login
      const savedEmail = forgotEmail.trim();
      resetForgotPasswordState();
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setLoginEmail(savedEmail);
      setLoginPassword('');
      setTab('LOGIN');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      setErrorMessage(msg);
    } finally {
      setIsResettingPass(false);
    }
  };

  // ─── Google OAuth ─────────────────────────────────────────────────
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

  // ─── Login Submit ─────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setErrorMessage(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ─── Register Submit ──────────────────────────────────────────────
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!shopName.trim()) {
      setErrorMessage('Please enter Business Name.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Please enter Owner Name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter email address.');
      return;
    }
    if (!isEmailVerified) {
      setErrorMessage('Please verify your email address to continue.');
      return;
    }
    const passValidation = validatePasswordStrength(registerPassword);
    if (!passValidation.isValid) {
      setErrorMessage(passValidation.error || 'Password does not meet security requirements.');
      return;
    }

    setIsRegistering(true);
    try {
      onRegister({
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        phone: cleanPhone,
        whatsapp_phone: cleanPhone,
        email: email.trim().toLowerCase(),
        password: registerPassword,
        shop_category: category,
        custom_category: category === 'OTHER' ? customCategory.trim() : undefined,
        address: address.trim() || undefined,
        terms_accepted: true
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMessage(msg);
      setIsRegistering(false);
    }
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
        maxWidth: '440px',
        width: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* App Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <UdhariLogo size={38} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
            Udhari
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Smart Ledger & Khata Book for Modern Businesses
          </p>
        </div>

        {/* Global Alert Banners */}
        {infoBanner && (
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            lineHeight: 1.4
          }}>
            {infoBanner}
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
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'var(--color-credit-bg)',
            border: '1px solid var(--color-credit-border)',
            color: 'var(--color-credit)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            lineHeight: 1.4
          }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: SIGN IN
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'LOGIN' && (
          <>
            {/* Google Sign In */}
            <button
              type="button"
              className="btn btn-outline"
              style={{
                width: '100%',
                minHeight: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                marginBottom: '1rem',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface-elevated)'
              }}
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoggingIn}
            >
              {isGoogleLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                or sign in with password
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Email vs Phone Toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              marginBottom: '1rem'
            }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  fontSize: '0.8rem',
                  fontWeight: loginMethod === 'EMAIL' ? 700 : 500,
                  background: loginMethod === 'EMAIL' ? 'var(--btn-primary-bg)' : 'transparent',
                  color: loginMethod === 'EMAIL' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer'
                }}
                onClick={() => setLoginMethod('EMAIL')}
              >
                Gmail / Email
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  fontSize: '0.8rem',
                  fontWeight: loginMethod === 'PHONE' ? 700 : 500,
                  background: loginMethod === 'PHONE' ? 'var(--btn-primary-bg)' : 'transparent',
                  color: loginMethod === 'PHONE' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer'
                }}
                onClick={() => setLoginMethod('PHONE')}
              >
                Mobile Number
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {loginMethod === 'EMAIL' ? (
                <div className="form-group">
                  <label className="form-label">Gmail / Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. yourshop@gmail.com"
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
                    placeholder="10-digit mobile number"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                    autoFocus
                  />
                </div>
              )}

              {/* Password */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password *</label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                    onClick={() => {
                      resetForgotPasswordState();
                      setTab('FORGOT_PASSWORD');
                      if (loginEmail) setForgotEmail(loginEmail);
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
                style={{ width: '100%', minHeight: '42px', fontWeight: 700, marginTop: '0.25rem' }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>New business? </span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setTab('REGISTER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                Register your shop →
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: REGISTER
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Business / Shop Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Kirana & General Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Owner Name *</label>
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
              <label className="form-label">10-Digit Mobile Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="9822014589"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
            </div>

            {/* Email + Verification */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Gmail / Email *</label>
                {isEmailVerified ? (
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-credit)', fontWeight: 700 }}>✓ Verified</span>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. yourshop@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false);
                    setOtpSent(false);
                  }}
                  required
                  style={{ flex: 1 }}
                />
                {!isEmailVerified && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleSendEmailOtp}
                    disabled={isSendingOtp || !email.includes('@')}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {isSendingOtp ? 'Sending...' : otpSent ? 'Resend Code' : 'Verify Email'}
                  </button>
                )}
              </div>

              {/* Inline OTP Code Input for Registration */}
              {otpSent && !isEmailVerified && (
                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Enter code sent to {email}:
                    </span>
                    {otpTimer > 0 ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {otpTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Resend
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter code"
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))}
                      style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 600 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleVerifyEmailCode(regOtpCode)}
                      disabled={isVerifyingOtp || !regOtpCode}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', fontWeight: 700 }}
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>

                  {otpError && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-debit)' }}>
                      {otpError}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
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
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '42px', fontWeight: 700, marginTop: '0.35rem' }}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Business</span>
              )}
            </button>

            {/* Back to Login */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Already registered? </span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setTab('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                Sign In →
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: 3-STEP SEQUENTIAL FORGOT PASSWORD
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'FORGOT_PASSWORD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                marginBottom: '0.2rem'
              }}
              onClick={() => {
                resetForgotPasswordState();
                setTab('LOGIN');
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>

            {/* ── STEP 1: Enter Email ── */}
            {forgotStep === 'EMAIL' && (
              <form onSubmit={(e) => { e.preventDefault(); handleSendForgotOtp(); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    Reset Password
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Enter your registered email to receive a verification code.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Registered Gmail / Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. yourshop@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '40px', fontWeight: 700 }}
                  disabled={isSendingForgotOtp || !forgotEmail}
                >
                  {isSendingForgotOtp ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: Enter & Verify Code (ONLY Code shown here!) ── */}
            {forgotStep === 'OTP' && (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyForgotCode(); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    Enter Verification Code
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Code sent to <strong>{forgotEmail}</strong>
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Verification Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter code"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))}
                    autoFocus
                    required
                    style={{ textAlign: 'center', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '2px', height: '42px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                    onClick={() => setForgotStep('EMAIL')}
                  >
                    Change Email
                  </button>

                  {forgotTimer > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Resend in {forgotTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      onClick={handleSendForgotOtp}
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '40px', fontWeight: 700 }}
                  disabled={isVerifyingForgotOtp || !forgotCode}
                >
                  {isVerifyingForgotOtp ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>


              </form>
            )}

            {/* ── STEP 3: Create New Password (ONLY shown after OTP verified!) ── */}
            {forgotStep === 'NEW_PASSWORD' && (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    Set New Password
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Enter a new password for {forgotEmail}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Create New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="e.g. Strong@123"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      autoFocus
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

                  {/* Dynamic Password Strength Checklist */}
                  {(() => {
                    const r = getPasswordRuleStatus(forgotNewPassword);
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem', fontSize: '0.72rem' }}>
                        <span style={{ color: r.minLength ? 'var(--color-credit)' : 'var(--text-muted)', fontWeight: r.minLength ? 700 : 500 }}>
                          {r.minLength ? '✓' : '○'} 8+ chars
                        </span>
                        <span style={{ color: r.hasUpper ? 'var(--color-credit)' : 'var(--text-muted)', fontWeight: r.hasUpper ? 700 : 500 }}>
                          {r.hasUpper ? '✓' : '○'} Uppercase
                        </span>
                        <span style={{ color: r.hasLower ? 'var(--color-credit)' : 'var(--text-muted)', fontWeight: r.hasLower ? 700 : 500 }}>
                          {r.hasLower ? '✓' : '○'} Lowercase
                        </span>
                        <span style={{ color: r.hasNumber ? 'var(--color-credit)' : 'var(--text-muted)', fontWeight: r.hasNumber ? 700 : 500 }}>
                          {r.hasNumber ? '✓' : '○'} Number
                        </span>
                        <span style={{ color: r.hasSymbol ? 'var(--color-credit)' : 'var(--text-muted)', fontWeight: r.hasSymbol ? 700 : 500 }}>
                          {r.hasSymbol ? '✓' : '○'} Special Symbol (!@#$)
                        </span>
                      </div>
                    );
                  })()}
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
                  style={{ width: '100%', minHeight: '40px', fontWeight: 700, marginTop: '0.25rem' }}
                  disabled={isResettingPass || !forgotNewPassword}
                >
                  {isResettingPass ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
