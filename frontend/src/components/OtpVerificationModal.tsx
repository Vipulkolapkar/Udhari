'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, RefreshCw, CheckCircle, Smartphone, Mail } from 'lucide-react';

interface OtpVerificationModalProps {
  type: 'PHONE' | 'EMAIL' | 'WHATSAPP';
  target: string; // Phone number or email address
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
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Generate a random 6-digit OTP code on mount
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTimer(30);
    setError(null);
    setOtpValues(['', '', '', '', '', '']);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  useEffect(() => {
    generateNewOtp();
  }, [target]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle single digit input
  const handleChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newValues = [...otpValues];
    newValues[index] = cleanDigit;
    setOtpValues(newValues);
    setError(null);

    // Auto advance to next input
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all 6 digits are entered
    const fullCode = newValues.join('');
    if (fullCode.length === 6) {
      if (fullCode === generatedOtp) {
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
      } else {
        setError('Invalid OTP code. Please enter the correct 6-digit code.');
      }
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newValues = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newValues[i] = pastedData[i];
    }
    setOtpValues(newValues);

    if (pastedData.length === 6) {
      if (pastedData === generatedOtp) {
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
      } else {
        setError('Invalid OTP code. Please enter the correct 6-digit code.');
      }
    }
  };

  const handleManualVerify = () => {
    const fullCode = otpValues.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }
    if (fullCode === generatedOtp) {
      setIsSuccess(true);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1000);
    } else {
      setError('Invalid OTP code. Please check the code and try again.');
    }
  };

  const isPhone = type === 'PHONE' || type === 'WHATSAPP';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            <ShieldCheck size={20} color="var(--text-primary)" />
            <span>Verify {isPhone ? 'Phone Number' : 'Email Address'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          {/* Target Icon & Notice */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)'
          }}>
            {isPhone ? <Smartphone size={24} /> : <Mail size={24} />}
          </div>

          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 0.35rem 0' }}>
              We have sent a 6-digit verification code to:
            </p>
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {isPhone && !target.startsWith('+') ? `+91 ${target}` : target}
            </strong>
          </div>

          {/* Realistic Simulated SMS / Email OTP Banner Notification */}
          <div style={{
            width: '100%',
            background: 'var(--bg-surface-elevated)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            textAlign: 'left',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                {isPhone ? 'Simulated SMS' : 'Simulated Email'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Just now</span>
            </div>
            <div>
              Your Udhari verification code is <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>{generatedOtp}</strong>. Valid for 10 minutes.
            </div>
          </div>

          {/* 6 Digit OTP Inputs */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                style={{
                  width: '46px',
                  height: '52px',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--bg-surface)',
                  border: isSuccess ? '2px solid var(--color-credit)' : error ? '2px solid var(--color-debit)' : '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ color: 'var(--color-debit)', fontSize: '0.82rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div style={{ color: 'var(--color-credit)', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={16} />
              <span>Verified Successfully!</span>
            </div>
          )}

          {/* Resend OTP Timer / Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.82rem' }}>
            {timer > 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>
                Resend code in <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{timer}s</strong>
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                onClick={generateNewOtp}
              >
                <RefreshCw size={13} />
                <span>Resend OTP</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '0.55rem 1.25rem' }}
              onClick={handleManualVerify}
              disabled={isSuccess}
            >
              Verify OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
