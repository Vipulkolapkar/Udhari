'use client';

import React, { useState, useMemo } from 'react';
import { X, ArrowDownLeft, CheckCircle2, Sparkles } from 'lucide-react';
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
  ) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  customer,
  customerInvoices,
  language,
  onClose,
  onSubmit
}) => {
  const t = getTranslation(language);

  const [amount, setAmount] = useState<number | ''>(customer.current_balance > 0 ? customer.current_balance : 100);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [discountWaived, setDiscountWaived] = useState<number | ''>('');
  const [referenceNote, setReferenceNote] = useState('');

  // Live FIFO calculation preview
  const fifoPreview = useMemo(() => {
    const numAmount = Number(amount) || 0;
    const numDiscount = Number(discountWaived) || 0;
    return simulateFIFOPayment(customerInvoices, numAmount, numDiscount);
  }, [customerInvoices, amount, discountWaived]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    const numDiscount = Number(discountWaived) || 0;
    if (numAmount <= 0) return;

    if (numAmount + numDiscount >= customer.current_balance) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    onSubmit(
      customer.id,
      numAmount,
      paymentMode,
      numDiscount,
      referenceNote.trim() || undefined
    );
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ArrowDownLeft size={18} color="var(--color-credit)" />
            <span>{t.gotPayment} — {customer.name}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Balance banner */}
            <div style={{
              background: '#18181b',
              border: '1px solid var(--border-subtle)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.balanceDue}</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-debit)', fontFamily: 'var(--font-mono)' }}>
                ₹{customer.current_balance.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Amount input */}
            <div className="form-group">
              <label className="form-label">{t.amount} (₹)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                autoFocus
              />

              {/* Quick Denomination Chips */}
              <div className="denom-grid">
                {[50, 100, 200, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="denom-chip"
                    onClick={() => setQuickAmount(val)}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {customer.current_balance > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: '0.4rem', width: '100%', borderColor: 'var(--border-medium)', color: '#ffffff' }}
                  onClick={handleFullSettle}
                >
                  <Sparkles size={14} />
                  {t.fullSettle} (₹{customer.current_balance})
                </button>
              )}
            </div>

            {/* Payment Mode Selection */}
            <div className="form-group">
              <label className="form-label">{t.paymentMode}</label>
              <select
                className="form-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              >
                <option value="CASH">{t.cash}</option>
                <option value="UPI_GPAY">{t.gpay}</option>
                <option value="UPI_PHONEPE">{t.phonepe}</option>
                <option value="UPI_PAYTM">{t.paytm}</option>
                <option value="BANK_TRANSFER">{t.bank}</option>
                <option value="OTHER">{t.other}</option>
              </select>
            </div>

            {/* Chillar Round-off Waiver */}
            <div className="form-group">
              <label className="form-label">
                {t.discountWaived} (₹)
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={discountWaived}
                onChange={(e) => setDiscountWaived(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            {/* Reference Note */}
            <div className="form-group">
              <label className="form-label">{t.notes}</label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'mr' ? 'उदा. रोख किंवा युपीआय संदर्भ' : language === 'hi' ? 'उदा. नकद या यूपीआई संदर्भ' : 'e.g. Cash or UPI ref number'}
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
              />
            </div>

            {/* Live FIFO Breakdown Preview */}
            {fifoPreview.allocations.length > 0 && (
              <div className="fifo-preview-box">
                <div className="fifo-title">
                  <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.fifoPreviewTitle}
                </div>
                {fifoPreview.allocations.map((alloc) => (
                  <div key={alloc.invoice_id} className="fifo-item">
                    <span>
                      <strong>{alloc.invoice_number}</strong> ({alloc.resulting_status === 'PAID' ? t.settled : alloc.resulting_status})
                    </span>
                    <span style={{ color: 'var(--color-credit)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      - ₹{alloc.allocated_amount}
                    </span>
                  </div>
                ))}
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  {t.fifoExplanation}
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              ✓ {t.confirm} (₹{amount || 0})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
