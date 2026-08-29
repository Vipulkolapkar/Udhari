'use client';

import React, { useState, useMemo } from 'react';
import { X, ArrowDownLeft, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer, Invoice, PaymentMode, Language } from '../types';
import { getTranslation } from '../lib/translations';
import { simulateFIFOPayment } from '../lib/fifo';

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
  customerInvoices,
  language,
  onClose,
  onSubmit
}) => {
  const t = getTranslation(language);

  const [amount, setAmount] = useState<number | ''>(customer.current_balance > 0 ? customer.current_balance : '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [discountWaived, setDiscountWaived] = useState<number | ''>('');
  const [referenceNote, setReferenceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live FIFO calculation preview
  const fifoPreview = useMemo(() => {
    const numAmount = Number(amount) || 0;
    const numDiscount = Number(discountWaived) || 0;
    return simulateFIFOPayment(customerInvoices, numAmount, numDiscount);
  }, [customerInvoices, amount, discountWaived]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    const numDiscount = Number(discountWaived) || 0;
    if (numAmount <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    if (numAmount + numDiscount >= customer.current_balance) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    try {
      await onSubmit(
        customer.id,
        numAmount,
        paymentMode,
        numDiscount,
        referenceNote.trim() || undefined
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
    setDiscountWaived('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '100%' }}>
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
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Balance Due</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-debit)', fontFamily: 'var(--font-primary)' }}>
                ₹{customer.current_balance.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Settle Entire Balance One-Click Option */}
            {customer.current_balance > 0 && (
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  borderColor: 'var(--color-credit-border)',
                  background: 'var(--color-credit-bg)',
                  color: 'var(--color-credit)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}
                onClick={handleFullSettle}
                disabled={isSubmitting}
              >
                <Sparkles size={15} />
                <span>Settle Entire Balance (₹{customer.current_balance.toLocaleString('en-IN')})</span>
              </button>
            )}

            {/* Amount input - High Visibility & No Trackpad Scroll Increment */}
            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)'
                }}
                placeholder="Enter amount (e.g. 500)"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                required
                autoFocus
                disabled={isSubmitting}
              />

              {/* Quick Denomination Chips */}
              <div className="denom-grid" style={{ marginTop: '0.5rem' }}>
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
                <option value="UPI_GPAY">Google Pay (GPay)</option>
                <option value="UPI_PHONEPE">PhonePe</option>
                <option value="UPI_PAYTM">Paytm</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="OTHER">Other Mode</option>
              </select>
            </div>

            {/* Chillar Round-off Waiver */}
            <div className="form-group">
              <label className="form-label">
                Discount / Waiver (₹)
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={discountWaived}
                onChange={(e) => setDiscountWaived(e.target.value === '' ? '' : Number(e.target.value))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                disabled={isSubmitting}
              />
            </div>

            {/* Reference Note */}
            <div className="form-group">
              <label className="form-label">Payment Reference / Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. UPI Ref # / Given by son"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Live FIFO Breakdown Preview */}
            {fifoPreview.allocations.length > 0 && (
              <div className="fifo-preview-box">
                <div className="fifo-title">
                  <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Bills Cleared by FIFO Order
                </div>
                {fifoPreview.allocations.map((alloc) => (
                  <div key={alloc.invoice_id} className="fifo-item">
                    <span>
                      <strong>{alloc.invoice_number}</strong> ({alloc.resulting_status === 'PAID' ? 'Fully Settled' : 'Partially Paid'})
                    </span>
                    <span style={{ color: 'var(--color-credit)', fontWeight: 700 }}>
                      - ₹{alloc.allocated_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-payment"
              disabled={!amount || Number(amount) <= 0 || isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft size={15} />
                  <span>Got Payment (₹{(Number(amount) || 0).toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
