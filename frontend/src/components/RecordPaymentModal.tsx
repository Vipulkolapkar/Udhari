'use client';

import React, { useState } from 'react';
import { X, ArrowDownLeft, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer, Invoice, PaymentMode, Language } from '../types';

interface RecordPaymentModalProps {
  customer: Customer;
  customerInvoices: Invoice[];
  language: Language;
  onClose: () => void;
  onSubmit: (
    customerId: string,
    amount: number,
    paymentMode: PaymentMode,
    discountWaived: number,
    referenceNote?: string
  ) => Promise<void> | void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  customer,
  language,
  onClose,
  onSubmit
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [amount, setAmount] = useState<number | ''>(customer.current_balance > 0 ? customer.current_balance : '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [receivedBy, setReceivedBy] = useState('Self');
  const [referenceNote, setReferenceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0 || !receivedBy.trim() || !paymentDate || isSubmitting) return;

    setIsSubmitting(true);
    if (numAmount >= customer.current_balance) {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 }
      });
    }

    const fullNote = [
      `Date: ${paymentDate}`,
      `Taken By: ${receivedBy.trim()}`,
      referenceNote.trim() ? `Note: ${referenceNote.trim()}` : ''
    ].filter(Boolean).join(' • ');

    try {
      await onSubmit(
        customer.id,
        numAmount,
        paymentMode,
        0,
        fullNote
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleFullSettle = () => {
    setAmount(customer.current_balance);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%' }}>
        <div className="modal-header">
          <div className="modal-title">
            <ArrowDownLeft size={18} color="var(--color-credit)" />
            <span>Got Payment — {customer.name}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Outstanding Balance Banner */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.4rem'
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Current Balance</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-debit)' }}>
                ₹{customer.current_balance.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Settle Entire Balance Option */}
            {customer.current_balance > 0 && (
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  borderColor: 'var(--color-credit-border)',
                  background: 'var(--color-credit-bg)',
                  color: 'var(--color-credit)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  marginBottom: '0.4rem'
                }}
                onClick={handleFullSettle}
                disabled={isSubmitting}
              >
                <Sparkles size={14} />
                <span>Settle Full (₹{customer.current_balance.toLocaleString('en-IN')})</span>
              </button>
            )}

            {/* Amount input */}
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
                }}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                required
                autoFocus
                disabled={isSubmitting}
              />

              {/* Quick Denominations */}
              <div className="denom-grid" style={{ marginTop: '0.35rem' }}>
                {[50, 100, 200, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="denom-chip"
                    onClick={() => setQuickAmount(val)}
                    disabled={isSubmitting}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory: Payment Date & Taken By */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Taken By *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Self / Staff"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                className="form-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                disabled={isSubmitting}
              >
                <option value="CASH">Cash</option>
                <option value="UPI_GPAY">Google Pay</option>
                <option value="UPI_PHONEPE">PhonePe</option>
                <option value="UPI_PAYTM">Paytm</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Reference Note */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Note (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="UPI ref / Cash detail"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-payment"
              disabled={!amount || Number(amount) <= 0 || !receivedBy.trim() || !paymentDate || isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Payment (₹{(Number(amount) || 0).toLocaleString('en-IN')})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
