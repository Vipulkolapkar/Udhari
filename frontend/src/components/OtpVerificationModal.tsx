'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, RefreshCw, CheckCircle, Mail, Smartphone, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OtpVerificationModalProps {
  type: 'PHONE' | 'EMAIL' | 'WHATSAPP';
  target: string;
  onClose: () => void;
  onVerified: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  type,
  target,
  onClose,
  onVerified
}) => {
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmail = type === 'EMAIL' || (!target.startsWith('+') && target.includes('@'));
  const displayTarget = target.length > 4
    ? target.slice(0, 3) + '****' + target.slice(-3)
    : target;

  // Send OTP or Magic Link via Supabase
  const sendOtp = async () => {
    setIsSending(true);
    setError(null);

    try {
      // Clear any previous stale session before requesting fresh OTP
      await supabase.auth.signOut().catch(() => {});

      if (isEmail) {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: target.trim().toLowerCase(),
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          }
        });
        if (authError) throw authError;
      } else {
        const phone = target.startsWith('+') ? target : `+91${target.replace(/\D/g, '')}`;
        const { error: phoneError } = await supabase.auth.signInWithOtp({ phone });
        if (phoneError) {
          setError('Phone OTP requires SMS gateway. Please verify using your email address instead.');
          setIsSending(false);
          return;
        }
      }

      setOtpSent(true);
      setTimer(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification email.';
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    sendOtp();
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time listener: ONLY trigger on new SIGNED_IN event (ignore INITIAL_SESSION)
  useEffect(() => {
    if (!otpSent) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // ONLY accept explicit SIGNED_IN or USER_UPDATED events, never INITIAL_SESSION
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

  // Verify OTP via code if entered
  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setError(null);
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
        setError('Invalid code. You can also simply click the link sent to your email.');
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
      setError('Verification failed. Please click the link in your email.');
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
        style={{ maxWidth: '440px', textAlign: 'center' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={18} color="var(--btn-primary-bg)" />
            <span>Verify {isEmail ? 'Email' : 'Phone'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.15rem' }}>
          {/* Icon */}
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            border: '2px solid var(--btn-primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isEmail
              ? <Mail size={24} color="var(--btn-primary-bg)" />
              : <Smartphone size={24} color="var(--btn-primary-bg)" />
            }
          </div>

          {/* Info */}
          {isSending ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Sending verification email...
            </p>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                Verification sent to
              </p>
              <p style={{ color: 'var(--btn-primary-bg)', fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
                {displayTarget}
              </p>
              
              {/* Highlight box for Link click */}
              <div style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginTop: '0.75rem',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                lineHeight: 1.45,
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--btn-primary-bg)', marginBottom: '0.25rem' }}>
                  <ExternalLink size={14} />
                  <span>Option 1: Instant Email Verification</span>
                </div>
                <span>Click the <strong>"Confirm email address"</strong> button inside the email you just received. This window will <strong>auto-confirm</strong> immediately!</span>
              </div>
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-credit)', fontWeight: 600, fontSize: '0.95rem' }}>
              <CheckCircle size={20} />
              <span>Email verified successfully! Setting up your business...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{
              color: 'var(--color-debit)',
              fontSize: '0.82rem',
              background: 'rgba(239, 68, 68, 0.08)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              textAlign: 'center'
            }}>
              {error}
            </p>
          )}

          {/* Resend */}
          {!isSending && !isSuccess && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {timer > 0 ? (
                <span>Resend email in <strong style={{ color: 'var(--text-primary)' }}>{timer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--btn-primary-bg)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem'
                  }}
                >
                  <RefreshCw size={13} />
                  Resend Verification Email
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
