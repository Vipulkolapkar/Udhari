'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, RefreshCw, CheckCircle, Mail, Smartphone } from 'lucide-react';
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

  const isEmail = type === 'EMAIL' || !target.startsWith('+') && target.includes('@');
  const displayTarget = target.length > 4
    ? target.slice(0, 3) + '****' + target.slice(-3)
    : target;

  // Send OTP via Supabase
  const sendOtp = async () => {
    setIsSending(true);
    setError(null);

    try {
      if (isEmail) {
        // Send email OTP via Supabase Auth
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: target,
          options: {
            shouldCreateUser: false, // just verify, don't sign in
          }
        });
        if (authError) {
          // Supabase may require user to exist; try with create
          const { error: createError } = await supabase.auth.signInWithOtp({ email: target });
          if (createError) throw createError;
        }
      } else {
        // Phone OTP — requires Twilio setup in Supabase
        const phone = target.startsWith('+') ? target : `+91${target.replace(/\D/g, '')}`;
        const { error: phoneError } = await supabase.auth.signInWithOtp({ phone });
        if (phoneError) {
          // Fallback: send to email if phone fails
          setError('Phone OTP requires SMS setup. Please verify using your email address instead.');
          setIsSending(false);
          return;
        }
      }

      setOtpSent(true);
      setTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP.';
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    sendOtp();
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (timer <= 0 || !otpSent) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent]);

  // Verify OTP via Supabase
  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      let verifyError;
      if (isEmail) {
        const { error } = await supabase.auth.verifyOtp({
          email: target,
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
        setError('Invalid or expired OTP. Please try again.');
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 800);
      }
    } catch {
      setError('Verification failed. Please try again.');
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

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newValues = pasted.split('');
      setOtpValues(newValues);
      verifyOtp(pasted);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={18} color="var(--btn-primary-bg)" />
            <span>Verify {isEmail ? 'Email' : 'Phone Number'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
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
              Sending verification code...
            </p>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                OTP sent to
              </p>
              <p style={{ color: 'var(--btn-primary-bg)', fontWeight: 700, fontSize: '1rem', marginTop: '0.25rem' }}>
                {displayTarget}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                {isEmail
                  ? 'Check your inbox (and spam folder) for the 6-digit code.'
                  : 'A 6-digit SMS code has been sent to your mobile number.'}
              </p>
            </div>
          )}

          {/* OTP Inputs */}
          {!isSending && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={isSuccess || isVerifying}
                  style={{
                    width: 44, height: 52,
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    border: `2px solid ${error ? 'var(--color-debit)' : val ? 'var(--btn-primary-bg)' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                />
              ))}
            </div>
          )}

          {/* Verifying indicator */}
          {isVerifying && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Verifying...
            </p>
          )}

          {/* Success */}
          {isSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-credit)', fontWeight: 600 }}>
              <CheckCircle size={18} />
              <span>Verified successfully!</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{
              color: 'var(--color-debit)',
              fontSize: '0.82rem',
              background: 'rgba(var(--color-debit-rgb, 239,68,68), 0.08)',
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
                <span>Resend code in <strong style={{ color: 'var(--text-primary)' }}>{timer}s</strong></span>
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
                  Resend OTP
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
