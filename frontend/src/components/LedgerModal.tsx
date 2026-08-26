'use client';

import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronUp, Calendar, User, ShoppingBag, ArrowDownLeft } from 'lucide-react';
import { Customer, Invoice, Payment, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface LedgerModalProps {
  customer: Customer;
  invoices: Invoice[];
  payments: Payment[];
  language: Language;
  onClose: () => void;
  onGiveCreditClick: (customer: Customer) => void;
  onGotPaymentClick: (customer: Customer) => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  customer,
  invoices,
  payments,
  language,
  onClose,
  onGiveCreditClick,
  onGotPaymentClick
}) => {
  const t = getTranslation(language);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const stream = [
    ...invoices.map((inv) => ({ type: 'INVOICE' as const, date: inv.created_at, data: inv })),
    ...payments.map((pay) => ({ type: 'PAYMENT' as const, date: pay.created_at, data: pay }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={18} color="#ffffff" />
            <span>{customer.name} — {t.viewLedger}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            background: '#18181b',
            border: '1px solid var(--border-subtle)',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {language === 'mr' ? 'मोबाईल क्रमांक' : language === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}
              </span>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{customer.phone}</p>
              {customer.address_landmark && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{customer.address_landmark}</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.balanceDue}</span>
              <div style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: customer.current_balance > 0 ? 'var(--color-debit)' : 'var(--color-credit)',
                fontFamily: 'var(--font-mono)'
              }}>
                ₹{customer.current_balance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Quick Action Bar inside Ledger */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-credit"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                onGiveCreditClick(customer);
              }}
            >
              + {t.giveCredit}
            </button>
            <button
              type="button"
              className="btn btn-payment"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                onGotPaymentClick(customer);
              }}
            >
              ✓ {t.gotPayment}
            </button>
          </div>

          {/* Timeline Stream */}
          <div className="ledger-timeline">
            {stream.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                {t.noTransactionsYet}
              </p>
            ) : (
              stream.map((entry) => {
                if (entry.type === 'INVOICE') {
                  const inv = entry.data as Invoice;
                  const isExpanded = expandedInvoiceId === inv.id;
                  const formattedDate = new Date(inv.created_at).toLocaleDateString(
                    language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  );

                  return (
                    <div key={inv.id} className="timeline-card debit">
                      <div className="timeline-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="timeline-type-tag debit">
                            <ShoppingBag size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            {t.creditGivenTag}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {inv.invoice_number}
                          </span>
                        </div>
                        <div className="timeline-amount debit">
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
                          padding: '2px 5px',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          background: inv.status === 'PAID' ? 'var(--color-credit-bg)' : 'var(--color-debit-bg)',
                          color: inv.status === 'PAID' ? 'var(--color-credit)' : 'var(--color-debit)'
                        }}>
                          {inv.status === 'PAID' ? t.settled : (language === 'mr' ? 'बाकी' : language === 'hi' ? 'बकाया' : 'PENDING')}
                        </span>
                      </div>

                      {/* Expandable Items List */}
                      {inv.items && inv.items.length > 0 && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: 0
                            }}
                            onClick={() => toggleExpand(inv.id)}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {inv.items.length} {t.viewItemsList}
                          </button>

                          {isExpanded && (
                            <table className="item-table">
                              <thead>
                                <tr>
                                  <th>{t.itemName}</th>
                                  <th>{t.qty}</th>
                                  <th>{t.rate}</th>
                                  <th style={{ textAlign: 'right' }}>{t.subtotal}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.item_name}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.quantity}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{item.unit_price}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹{item.subtotal}</td>
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
                  const formattedDate = new Date(pay.created_at).toLocaleDateString(
                    language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  );

                  return (
                    <div key={pay.id} className="timeline-card credit">
                      <div className="timeline-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="timeline-type-tag credit">
                            <ArrowDownLeft size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            {t.paymentReceivedTag}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {pay.receipt_number} ({pay.payment_mode})
                          </span>
                        </div>
                        <div className="timeline-amount credit">
                          - ₹{pay.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>
                          <Calendar size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {formattedDate}
                        </span>
                        {pay.discount_waived > 0 && (
                          <span style={{ color: '#fbbf24' }}>
                            {t.discountWaived}: ₹{pay.discount_waived}
                          </span>
                        )}
                        {pay.reference_note && <span>{pay.reference_note}</span>}
                      </div>

                      {pay.allocations && pay.allocations.length > 0 && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--color-credit)', fontFamily: 'var(--font-mono)' }}>
                          {language === 'mr' ? 'स्वयंचलित जुने बिल जमा:' : language === 'hi' ? 'पुराने बिल चुकता हुए:' : 'Settled Invoices:'} {pay.allocations.map((a) => `${a.invoice_number} (₹${a.allocated_amount})`).join(', ')}
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
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
