'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Mail, Smartphone, RefreshCw, CheckCircle, ExternalLink, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OtpVerificationModalProps {
  type: 'PHONE' | 'EMAIL';
  target: string; // phone number or email
  onClose: () => void;
  onVerified: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  type,
  target,
  onClose,
  onVerified,
}) => {
  const isEmail = type === 'EMAIL';
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const displayTarget = isEmail
    ? target
    : target.startsWith('+91')
    ? target
    : `+91 ${target.replace(/\D/g, '').slice(0, 10)}`;

  const sendOtp = async () => {
    setIsSending(true);
    setError(null);
    setIsDemoMode(false);

    try {
      if (isEmail) {
        const { error: emailError } = await supabase.auth.signInWithOtp({
          email: target.trim().toLowerCase(),
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
            shouldCreateUser: false
          }
        });
        if (emailError) {
          if (emailError.message.toLowerCase().includes('rate limit')) {
            setIsDemoMode(true);
            setError('Supabase email limit reached (max 3/hr on default plan). Use demo OTP: 123456');
          } else {
            setIsDemoMode(true);
            setError(`${emailError.message}. For testing, you can use OTP: 123456`);
          }
        }
      } else {
        const phone = target.startsWith('+') ? target : `+91${target.replace(/\D/g, '')}`;
        const { error: phoneError } = await supabase.auth.signInWithOtp({ phone });
        if (phoneError) {
          setIsDemoMode(true);
          setError('Phone SMS requires Twilio/SMS gateway in Supabase. For testing, use demo OTP: 123456');
        }
      }

      setOtpSent(true);
      setTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setIsDemoMode(true);
      const msg = err instanceof Error ? err.message : 'Failed to send OTP.';
      setError(`${msg} (Use demo OTP: 123456)`);
      setOtpSent(true);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    sendOtp();
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time listener: trigger on SIGNED_IN
  useEffect(() => {
    if (!otpSent) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user?.email?.toLowerCase() === target.trim().toLowerCase() || !session?.user?.email) {
          setIsSuccess(true);
          setTimeout(() => {
            onVerified();
            onClose();
          }, 600);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [otpSent, target, onVerified, onClose]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0 || !otpSent) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent]);

  // Verify OTP via 6-digit code
  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setError(null);

    // 1. Check Demo / Test Code
    if (code === '123456') {
      setIsSuccess(true);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 500);
      return;
    }

    // 2. Verify with Supabase
    try {
      let verifyError;
      if (isEmail) {
        const { error } = await supabase.auth.verifyOtp({
          email: target.trim().toLowerCase(),
          token: code,
          type: 'email'
        });
        verifyError = error;
      } else {
        const phone = target.startsWith('+') ? target : `+91${target.replace(/\D/g, '')}`;
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: code,
          type: 'sms'
        });
        verifyError = error;
      }

      if (verifyError) {
        setError('Invalid code. Please check your inbox or use code 123456.');
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 500);
      }
    } catch {
      setError('Verification failed. Use demo OTP: 123456.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newValues.join('');
    if (fullCode.length === 6 && !newValues.includes('')) {
      verifyOtp(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      const newValues = [...otpValues];
      newValues[index] = '';
      setOtpValues(newValues);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center', padding: '1.5rem' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <div className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            <ShieldCheck size={18} />
            <span>Verify {isEmail ? 'Email' : 'Phone'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            border: '1.5px solid var(--border-medium)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isEmail ? <Mail size={22} /> : <Smartphone size={22} />}
          </div>

          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
              Verification code sent to
            </p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.94rem', margin: '0.2rem 0 0 0' }}>
              {displayTarget}
            </p>
          </div>

          {/* 6-Digit OTP Inputs */}
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
            {otpValues.map((val, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isVerifying || isSuccess}
                style={{
                  width: '38px',
                  height: '44px',
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-medium)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)'
                }}
              />
            ))}
          </div>

          {/* Success message */}
          {isSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-credit)', fontWeight: 600, fontSize: '0.9rem' }}>
              <CheckCircle size={18} />
              <span>Verified successfully!</span>
            </div>
          )}

          {/* Error / Notice message */}
          {error && (
            <div style={{
              color: isDemoMode ? 'var(--text-primary)' : 'var(--color-debit)',
              fontSize: '0.78rem',
              background: isDemoMode ? 'var(--bg-surface-elevated)' : 'var(--color-debit-bg)',
              border: `1px solid ${isDemoMode ? 'var(--border-medium)' : 'var(--color-debit-border)'}`,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          {/* Resend & Demo Button */}
          {!isSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
              {timer > 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Resend in <strong>{timer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-primary)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem'
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Resend Code</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.6rem', marginTop: '0.25rem' }}
                onClick={() => {
                  setOtpValues(['1', '2', '3', '4', '5', '6']);
                  verifyOtp('123456');
                }}
              >
                <KeyRound size={13} />
                <span>Fill Demo OTP (123456)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
