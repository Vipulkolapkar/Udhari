'use client';

import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronUp, Calendar, User, ShoppingBag, ArrowDownLeft, Trash2, Plus } from 'lucide-react';
import { Customer, Invoice, Payment, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface LedgerModalProps {
  customer: Customer;
  invoices: Invoice[];
  payments: Payment[];
  language: Language;
  onClose: () => void;
  onGiveCreditClick?: (customer: Customer) => void;
  onGotPaymentClick?: (customer: Customer) => void;
  onDeletePaymentClick?: (paymentId: string) => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  customer,
  invoices,
  payments,
  language,
  onClose,
  onGiveCreditClick,
  onGotPaymentClick,
  onDeletePaymentClick
}) => {
  const t = getTranslation(language);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Combine invoices (DEBIT) and payments (CREDIT) into a single chronological timeline
  const timeline = React.useMemo(() => {
    const events: { type: 'INVOICE' | 'PAYMENT'; date: string; data: Invoice | Payment }[] = [];
    invoices.forEach((inv) => events.push({ type: 'INVOICE', date: inv.created_at, data: inv }));
    payments.forEach((pay) => events.push({ type: 'PAYMENT', date: pay.created_at, data: pay }));
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }, [invoices, payments]);

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  const totalCreditGiven = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaymentReceived = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BookOpen size={20} color="var(--text-primary)" />
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {customer.name}’s Ledger
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {customer.phone} {customer.address_landmark ? `• ${customer.address_landmark}` : ''}
              </div>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Ledger Balance Summary Card */}
        <div style={{
          padding: '1.15rem 1.5rem',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          textAlign: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Credit
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-debit)', marginTop: '2px' }}>
              ₹{totalCreditGiven.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Received
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-credit)', marginTop: '2px' }}>
              ₹{totalPaymentReceived.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Balance Due
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: customer.current_balance > 0 ? 'var(--color-debit)' : 'var(--color-credit)', marginTop: '2px' }}>
              ₹{customer.current_balance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons inside Ledger */}
        <div style={{ display: 'flex', gap: '0.65rem', padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {onGiveCreditClick && (
            <button
              type="button"
              className="btn btn-credit"
              style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.84rem', fontWeight: 700 }}
              onClick={() => onGiveCreditClick(customer)}
            >
              <Plus size={14} />
              <span>Give Credit</span>
            </button>
          )}

          {onGotPaymentClick && (
            <button
              type="button"
              className="btn btn-payment"
              style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.84rem', fontWeight: 700 }}
              onClick={() => onGotPaymentClick(customer)}
            >
              <ArrowDownLeft size={14} />
              <span>Got Payment</span>
            </button>
          )}
        </div>

        {/* Scrollable Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Transaction History ({timeline.length} records)
          </div>

          <div className="ledger-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No transactions recorded yet for this customer.
              </div>
            ) : (
              timeline.map((entry) => {
                if (entry.type === 'INVOICE') {
                  const inv = entry.data as Invoice;
                  const isExpanded = expandedInvoiceId === inv.id;
                  const formattedDate = new Date(inv.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={inv.id} className="timeline-card debit" style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.9rem 1rem'
                    }}>
                      <div className="timeline-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'var(--color-debit-bg)',
                            color: 'var(--color-debit)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ShoppingBag size={11} />
                            CREDIT BILL
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {inv.invoice_number}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-debit)' }}>
                          + ₹{inv.total_amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>
                          <Calendar size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {formattedDate}
                        </span>
                        {inv.taken_by_name && (
                          <span>
                            <User size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            {inv.taken_by_name}
                          </span>
                        )}
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: inv.status === 'PAID' ? 'var(--color-credit-bg)' : 'var(--color-debit-bg)',
                          color: inv.status === 'PAID' ? 'var(--color-credit)' : 'var(--color-debit)'
                        }}>
                          {inv.status === 'PAID' ? 'SETTLED' : inv.status === 'PARTIAL' ? 'PARTIAL' : 'UNPAID'}
                        </span>
                      </div>

                      {/* Items List */}
                      {inv.items && inv.items.length > 0 && (
                        <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem' }}>
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: 0
                            }}
                            onClick={() => toggleExpand(inv.id)}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            <span>{inv.items.length} {inv.items.length === 1 ? 'Item' : 'Items'} Listed</span>
                          </button>

                          {isExpanded && (
                            <table className="item-table" style={{ width: '100%', marginTop: '0.4rem', fontSize: '0.78rem' }}>
                              <thead>
                                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
                                  <th>Item</th>
                                  <th>Qty</th>
                                  <th>Rate</th>
                                  <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.item_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>₹{item.unit_price}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.subtotal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const pay = entry.data as Payment;
                  const formattedDate = new Date(pay.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={pay.id} className="timeline-card credit" style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.9rem 1rem'
                    }}>
                      <div className="timeline-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'var(--color-credit-bg)',
                            color: 'var(--color-credit)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ArrowDownLeft size={11} />
                            PAYMENT RECEIVED
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {pay.receipt_number} ({pay.payment_mode})
                          </span>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-credit)' }}>
                          - ₹{pay.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>
                          <Calendar size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {formattedDate}
                        </span>
                        {pay.reference_note && <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Note: {pay.reference_note}</span>}
                        {onDeletePaymentClick && (
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.72rem'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-debit)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            onClick={() => onDeletePaymentClick(pay.id)}
                            title="Delete Payment Entry"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {pay.allocations && pay.allocations.length > 0 && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--color-credit)', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.35rem' }}>
                          Settled Bills: {pay.allocations.map((a) => `${a.invoice_number} (₹${a.allocated_amount})`).join(', ')}
                        </div>
                      )}
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
