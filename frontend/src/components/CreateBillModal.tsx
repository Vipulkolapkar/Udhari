'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2, ShoppingBag, ArrowDownLeft } from 'lucide-react';
import { Customer, InvoiceItem, Language, ShopUser, PaymentMode } from '../types';
import { getTranslation } from '../lib/translations';

interface CreateBillModalProps {
  customer: Customer;
  currentShop: ShopUser | null;
  language: Language;
  onClose: () => void;
  onSubmit: (
    customerId: string,
    billData: {
      items: InvoiceItem[];
      total_amount: number;
      discount_amount: number;
      taken_by_name?: string;
      notes?: string;
      due_date?: string;
      advance_paid?: number;
      advance_payment_mode?: PaymentMode;
    }
  ) => Promise<void> | void;
}

export const CreateBillModal: React.FC<CreateBillModalProps> = ({
  customer,
  currentShop,
  language,
  onClose,
  onSubmit
}) => {
  const t = getTranslation(language);

  const [items, setItems] = useState<{ id: string; name: string; quantity: number; price: number }[]>([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);
  const [takenBy, setTakenBy] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number | ''>('');
  const [advancePaymentMode, setAdvancePaymentMode] = useState<PaymentMode>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItemRow = (name = '', price = 0, quantity = 1) => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), name, quantity, price }
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: 'name' | 'quantity' | 'price', value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const netTotal = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const numAdvance = typeof advancePaid === 'number' ? advancePaid : 0;
  const remainingDueAdded = Math.max(0, netTotal - numAdvance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (netTotal <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    const formattedItems: InvoiceItem[] = items.map((item) => ({
      id: `item_${Date.now()}_${Math.random()}`,
      invoice_id: '',
      item_name: item.name.trim() || 'Item',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      subtotal: (Number(item.quantity) || 1) * (Number(item.price) || 0)
    }));

    try {
      await onSubmit(customer.id, {
        items: formattedItems,
        total_amount: netTotal,
        discount_amount: Number(discountAmount) || 0,
        taken_by_name: takenBy.trim() || undefined,
        notes: notes.trim() || undefined,
        due_date: dueDate || undefined,
        advance_paid: numAdvance > 0 ? numAdvance : undefined,
        advance_payment_mode: numAdvance > 0 ? advancePaymentMode : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
        <div className="modal-header">
          <div className="modal-title">
            <ShoppingBag size={18} color="var(--text-primary)" />
            <span>Give Credit — {customer.name}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Items Table */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Items / Products *</label>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ minHeight: '28px', padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600 }}
                  onClick={() => addItemRow('', 0, 1)}
                  disabled={isSubmitting}
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>

              {/* Table Column Headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 75px 85px 36px',
                gap: '0.4rem',
                padding: '0.3rem 0.2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-secondary)'
              }}>
                <span>Item Name</span>
                <span>Qty</span>
                <span>Rate (₹)</span>
                <span></span>
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 75px 85px 36px',
                      gap: '0.4rem',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rice 5kg / Sugar"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                      disabled={isSubmitting}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-input"
                      placeholder="0"
                      value={item.price || ''}
                      onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-debit)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                      onClick={() => removeItemRow(item.id)}
                      disabled={items.length <= 1 || isSubmitting}
                      title="Remove Item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Partial Payment On Spot */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.9rem 1rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowDownLeft size={15} color="var(--color-credit)" />
                <span>Immediate Payment on Spot (Optional)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: numAdvance > 0 ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Amount Paid on Spot (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={netTotal}
                    className="form-input"
                    placeholder="e.g. 500 (if paid partially now)"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value === '' ? '' : Math.min(netTotal, Number(e.target.value)))}
                    disabled={isSubmitting}
                  />
                </div>

                {numAdvance > 0 && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Payment Mode</label>
                    <select
                      className="form-select"
                      value={advancePaymentMode}
                      onChange={(e) => setAdvancePaymentMode(e.target.value as PaymentMode)}
                      disabled={isSubmitting}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI_GPAY">Google Pay (GPay)</option>
                      <option value="UPI_PHONEPE">PhonePe</option>
                      <option value="UPI_PAYTM">Paytm</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Extra Metadata: Taken By & Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Taken By (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Self, Brother, Staff..."
                  value={takenBy}
                  onChange={(e) => setTakenBy(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Promised Due Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Bill Summary & Net Credit Added */}
            <div style={{
              marginTop: '0.65rem',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Total Bill: <strong>₹{netTotal.toLocaleString('en-IN')}</strong>
                  {numAdvance > 0 && <span> • Paid: <strong style={{ color: 'var(--color-credit)' }}>- ₹{numAdvance.toLocaleString('en-IN')}</strong></span>}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  Remaining Credit to Add (Udhari):
                </div>
              </div>

              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-debit)', fontFamily: 'var(--font-primary)' }}>
                ₹{remainingDueAdded.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={netTotal <= 0 || isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Saving Bill...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>
                    Save Bill {numAdvance > 0 ? `(₹${numAdvance} Paid, ₹${remainingDueAdded} Due)` : `(₹${netTotal.toLocaleString('en-IN')})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
