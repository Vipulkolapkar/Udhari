'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Mail, Smartphone, RefreshCw, CheckCircle, KeyRound, Loader2, ArrowRight } from 'lucide-react';
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
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => inputRef.current?.focus(), 100);
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

  // Countdown timer
  useEffect(() => {
    if (timer <= 0 || !otpSent) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent]);

  // Verify OTP via token (supports 6 to 8 digits)
  const handleVerify = async (codeToVerify: string) => {
    const cleanToken = codeToVerify.trim();
    if (!cleanToken) return;

    setIsVerifying(true);
    setError(null);

    // 1. Check Demo / Test Code
    if (cleanToken === '123456') {
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
          token: cleanToken,
          type: 'email'
        });
        verifyError = error;
      } else {
        const phone = target.startsWith('+') ? target : `+91${target.replace(/\D/g, '')}`;
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: cleanToken,
          type: 'sms'
        });
        verifyError = error;
      }

      if (verifyError) {
        setError('Invalid verification code. Please check your email or enter 123456.');
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

  const handleInputChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    setCode(clean);
    setError(null);

    if (clean.length === 6 || clean.length === 8) {
      handleVerify(clean);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px', textAlign: 'center', padding: '1.5rem' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '0.75rem' }}>
          <div className="modal-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>Verify {isEmail ? 'Email' : 'Phone'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 42, height: 42,
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isEmail ? <Mail size={18} /> : <Smartphone size={18} />}
          </div>

          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Verification code sent to
            </p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', margin: '0.15rem 0 0 0' }}>
              {displayTarget}
            </p>
          </div>

          {/* Normal Standard Code Input */}
          <div style={{ width: '100%', maxWidth: '240px' }}>
            <input
              ref={inputRef}
              type="text"
              className="form-input"
              placeholder="Enter code"
              value={code}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerify(code);
                }
              }}
              disabled={isVerifying || isSuccess}
              autoFocus
              style={{
                textAlign: 'center',
                fontSize: '1.05rem',
                fontWeight: 600,
                letterSpacing: '2px',
                height: '40px'
              }}
            />
          </div>

          {/* Verify Button */}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!code || isVerifying || isSuccess}
            onClick={() => handleVerify(code)}
            style={{ width: '100%', maxWidth: '240px', fontWeight: 600, padding: '0.55rem 0.85rem', fontSize: '0.84rem' }}
          >
            {isVerifying ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Code</span>
            )}
          </button>

          {/* Success message */}
          {isSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-credit)', fontWeight: 600, fontSize: '0.85rem' }}>
              <CheckCircle size={16} />
              <span>Verified successfully!</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              color: 'var(--color-debit)',
              fontSize: '0.78rem',
              background: 'var(--color-debit-bg)',
              border: '1px solid var(--color-debit-border)',
              padding: '0.45rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Resend & Demo Button */}
          {!isSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center', width: '100%' }}>
              {timer > 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Resend in <strong>{timer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-primary)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem'
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Resend Code</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', maxWidth: '240px', fontSize: '0.75rem', padding: '0.35rem 0.55rem', marginTop: '0.2rem' }}
                onClick={() => {
                  setCode('123456');
                  handleVerify('123456');
                }}
              >
                <KeyRound size={12} />
                <span>Fill Demo OTP (123456)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
