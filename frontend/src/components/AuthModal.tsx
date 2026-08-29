'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
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
  RefreshCw
} from 'lucide-react';
import { ShopUser, ShopCategory, Language } from '../types';
import { getTranslation, categoryLabels } from '../lib/translations';
import { supabase } from '../lib/supabase';

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
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Sign In State
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  // Inline OTP State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpTimer <= 0 || !otpSent) return;
    const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer, otpSent]);

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
    return () => { authListener.subscription.unsubscribe(); };
  }, [otpSent, email, isEmailVerified]);

  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setOtpError('Please enter a valid email address first.');
      return;
    }
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
      const newValues = [...otpValues];
      newValues[index] = '';
      setOtpValues(newValues);
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
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shopName.trim() || !ownerName.trim() || !phone.trim()) {
      setErrorMessage('Please fill in business name, owner name, and phone number.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
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
        <div className="modal-header">
          <div className="modal-title">
            <Store size={18} color="var(--btn-primary-bg)" />
            <span>{tab === 'LOGIN' ? 'Sign In to Udhari' : 'Register New Business'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>



        <div style={{ padding: '1.5rem' }}>
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
              gap: '0.45rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Compact Sleek Switcher between Email & Mobile */}
              <div style={{
                display: 'inline-flex',
                alignSelf: 'center',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '9999px',
                padding: '2px',
                gap: '2px',
                marginBottom: '0.15rem'
              }}>
                <button
                  type="button"
                  style={{
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '9999px',
                    background: loginMethod === 'EMAIL' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: loginMethod === 'EMAIL' ? '#ffffff' : 'var(--text-secondary)',
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
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '9999px',
                    background: loginMethod === 'PHONE' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: loginMethod === 'PHONE' ? '#ffffff' : 'var(--text-secondary)',
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
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password *</label>
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
                  onClick={() => { setTab('REGISTER'); setErrorMessage(null); }}
                >
                  Register business here →
                </button>
              </div>
            </form>
          ) : (
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
                  onChange={(e) => setPhone(e.target.value)}
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
                          disabled={isSendingOtp || !email.includes('@')}
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
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
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
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-debit)', textAlign: 'center' }}>{otpError}</span>
                        )}
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
                <label className="form-label">Address & City (Optional)</label>
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
                  onClick={() => { setTab('LOGIN'); setErrorMessage(null); }}
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
