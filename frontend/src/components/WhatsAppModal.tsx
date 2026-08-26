'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, History, Edit3, Sparkles, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Customer, Language, ShopUser, CustomerMessage } from '../types';
import { getTranslation } from '../lib/translations';
import { KhataStore } from '../lib/storage';

interface WhatsAppModalProps {
  customer: Customer;
  currentShop: ShopUser | null;
  language: Language;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  customer,
  currentShop,
  language: defaultLang,
  onClose
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>(defaultLang);
  const [tone, setTone] = useState<'polite' | 'formal' | 'urgent' | 'custom'>('polite');
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  const [messageHistory, setMessageHistory] = useState<CustomerMessage[]>([]);

  const t = getTranslation(selectedLang);
  const shopName = currentShop?.shop_name || t.appBrand;

  // Clean phone number
  const cleanPhone = customer.phone.replace(/\D/g, '');
  const internationalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Load message history for this customer on mount
  useEffect(() => {
    if (currentShop) {
      const history = KhataStore.getCustomerMessages(currentShop.id, customer.id);
      setMessageHistory(history);
    }
  }, [currentShop, customer.id]);

  // Generate template text based on tone and language
  const getPresetTemplate = (targetTone: 'polite' | 'formal' | 'urgent') => {
    const name = customer.name.split('(')[0].trim();
    const balance = customer.current_balance.toLocaleString('en-IN');

    if (selectedLang === 'mr') {
      if (targetTone === 'urgent') {
        return `  ${name} ,\n\n ${shopName}    ${balance}    .\n          .\n\n,\n${shopName}`;
      }
      if (targetTone === 'formal') {
        return ` ${name} ,\n\n ${shopName}    ${balance}  .\n       . \n\n,\n${shopName}`;
      }
      return ` ${name} ,\n\n    .  ${shopName}    ${balance}  .      .   . \n\n,\n${shopName}`;
    }

    if (selectedLang === 'hi') {
      if (targetTone === 'urgent') {
        return ` ${name} ,\n\n ${shopName}    ${balance}     \n         \n\n,\n${shopName}`;
      }
      if (targetTone === 'formal') {
        return ` ${name} ,\n\n ${shopName}    ${balance} \n         \n\n,\n${shopName}`;
      }
      return ` ${name} ,\n\n       ${shopName}   ${balance}     ,     \n\n,\n${shopName}`;
    }

    // English
    if (targetTone === 'urgent') {
      return `Dear ${name},\n\nYour pending balance of ₹${balance} at ${shopName} is significantly overdue.\nKindly settle the account as soon as possible.\n\nThank you,\n${shopName}`;
    }
    if (targetTone === 'formal') {
      return `Dear ${name},\n\nThis is a friendly reminder that your pending balance at ${shopName} is ₹${balance}.\nKindly clear the bill at your earliest convenience. 🙏\n\nThank you,\n${shopName}`;
    }
    return `Hello ${name},\n\nHope you're having a good day! Just a gentle reminder that your running balance at ${shopName} is ₹${balance}. Whenever you visit next, you can settle it. 🙏\n\nThank you,\n${shopName}`;
  };

  // Sync customText when tone or language changes
  useEffect(() => {
    if (tone !== 'custom') {
      setCustomText(getPresetTemplate(tone));
    }
  }, [tone, selectedLang, customer.current_balance]);

  const activeMessageText = customText.trim();
  const whatsappUrl = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(activeMessageText)}`;

  // Save to DB and refresh history
  const persistMessage = () => {
    if (!currentShop || !activeMessageText) return;
    const saved = KhataStore.saveCustomerMessage(currentShop.id, customer.id, activeMessageText, tone);
    setMessageHistory((prev) => [saved, ...prev]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopy = () => {
    if (!activeMessageText) return;
    navigator.clipboard.writeText(activeMessageText);
    setCopied(true);
    persistMessage();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!activeMessageText) return;
    persistMessage();
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <WhatsAppIcon size={20} color="var(--text-primary)" />
            <span>
              {selectedLang === 'mr' ? '‍ ' : selectedLang === 'hi' ? ' ' : 'WhatsApp Message'} — {customer.name}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Top Bar: Recipient & History Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              WhatsApp Recipient: <strong>+91 {customer.phone}</strong>
            </div>

            {/* History Toggle Button */}
            <button
              type="button"
              className={`denom-chip ${viewHistory ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: viewHistory ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                color: viewHistory ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                borderColor: viewHistory ? 'var(--btn-primary-bg)' : 'var(--border-subtle)',
                padding: '0.4rem 0.75rem'
              }}
              onClick={() => setViewHistory(!viewHistory)}
            >
              <History size={14} />
              <span>
                Message History
                {messageHistory.length > 0 ? ` (${messageHistory.length})` : ''}
              </span>
            </button>
          </div>

          {/* VIEW: Message History vs Message Composer */}
          {viewHistory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedLang === 'mr' ? ' Customer   ' : selectedLang === 'hi' ? ' Customer     ' : 'Past Messages Sent to Customer'}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {selectedLang === 'mr' ? '  ' : selectedLang === 'hi' ? '   ' : 'Saved in Database'}
                </span>
              </div>

              {messageHistory.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  {selectedLang === 'mr' ? '    .' : selectedLang === 'hi' ? '       ' : 'No messages sent yet.'}
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {messageHistory.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 600,
                          background: msg.tone === 'urgent' ? 'var(--color-debit-bg)' : 'var(--bg-subtle)',
                          color: msg.tone === 'urgent' ? 'var(--color-debit)' : 'var(--text-secondary)'
                        }}>
                          {msg.tone === 'urgent'
                            ? (selectedLang === 'mr' ? '' : selectedLang === 'hi' ? ' ' : 'Urgent')
                            : msg.tone === 'formal'
                            ? (selectedLang === 'mr' ? '' : selectedLang === 'hi' ? '' : 'Formal')
                            : msg.tone === 'custom'
                            ? (selectedLang === 'mr' ? ' ' : selectedLang === 'hi' ? ' ' : 'Custom')
                            : (selectedLang === 'mr' ? '' : selectedLang === 'hi' ? '' : 'Polite')
                          }
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(msg.created_at).toLocaleDateString(
                            selectedLang === 'mr' ? 'mr-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN',
                            { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                          )}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                        {msg.message_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tone Selection Chips (Polite, Formal, Urgent, Custom) */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>
                  {selectedLang === 'mr' ? '    ' : selectedLang === 'hi' ? '     ' : 'Choose Message Tone or Custom'}
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {/* Polite */}
                  <button
                    type="button"
                    className="denom-chip"
                    style={{
                      background: tone === 'polite' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                      color: tone === 'polite' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                      borderColor: tone === 'polite' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)',
                      fontWeight: tone === 'polite' ? 700 : 500
                    }}
                    onClick={() => setTone('polite')}
                  >
                    <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {selectedLang === 'mr' ? '' : selectedLang === 'hi' ? '' : 'Polite'}
                  </button>

                  {/* Formal */}
                  <button
                    type="button"
                    className="denom-chip"
                    style={{
                      background: tone === 'formal' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                      color: tone === 'formal' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                      borderColor: tone === 'formal' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)',
                      fontWeight: tone === 'formal' ? 700 : 500
                    }}
                    onClick={() => setTone('formal')}
                  >
                    {selectedLang === 'mr' ? '' : selectedLang === 'hi' ? '' : 'Formal'}
                  </button>

                  {/* Urgent */}
                  <button
                    type="button"
                    className="denom-chip"
                    style={{
                      background: tone === 'urgent' ? 'var(--color-debit-bg)' : 'var(--bg-surface-elevated)',
                      color: tone === 'urgent' ? 'var(--color-debit)' : 'var(--text-primary)',
                      borderColor: tone === 'urgent' ? 'var(--color-debit)' : 'var(--border-subtle)',
                      fontWeight: tone === 'urgent' ? 700 : 500
                    }}
                    onClick={() => setTone('urgent')}
                  >
                    {selectedLang === 'mr' ? '' : selectedLang === 'hi' ? ' ' : 'Urgent'}
                  </button>

                  {/* Custom Written Message Option */}
                  <button
                    type="button"
                    className="denom-chip"
                    style={{
                      background: tone === 'custom' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                      color: tone === 'custom' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                      borderColor: tone === 'custom' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)',
                      fontWeight: tone === 'custom' ? 700 : 500
                    }}
                    onClick={() => {
                      setTone('custom');
                    }}
                  >
                    <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {selectedLang === 'mr' ? '  ' : selectedLang === 'hi' ? '  ' : 'Custom Message'}
                  </button>
                </div>
              </div>

              {/* Editable Message Composer / Textarea */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    {selectedLang === 'mr' ? '  ( )' : selectedLang === 'hi' ? '  ( )' : 'Message Content (Fully Editable)'}
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {customText.length} {selectedLang === 'mr' ? '' : selectedLang === 'hi' ? '' : 'chars'}
                  </span>
                </div>

                <textarea
                  className="form-input"
                  style={{
                    minHeight: '140px',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '0.88rem',
                    lineHeight: '1.6',
                    padding: '0.85rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    resize: 'vertical'
                  }}
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    if (tone !== 'custom') {
                      setTone('custom');
                    }
                  }}
                  placeholder={
                    selectedLang === 'mr'
                      ? ' Customer     ...'
                      : selectedLang === 'hi'
                      ? ' Customer        ...'
                      : 'Type your custom message for the customer here...'
                  }
                />
              </div>

              {/* Saved to DB Badge Notification */}
              {savedSuccess && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'var(--color-credit-bg)',
                  border: '1px solid var(--color-credit-border)',
                  color: 'var(--color-credit)',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={15} />
                  <span>
                    {selectedLang === 'mr'
                      ? ' Customer     !'
                      : selectedLang === 'hi'
                      ? ' Customer        !'
                      : 'Message saved to customer database record successfully!'}
                  </span>
                </div>
              )}

              {/* Target Phone notice */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {selectedLang === 'mr'
                  ? <span> <strong>+91 {customer.phone}</strong>       .</span>
                  : selectedLang === 'hi'
                  ? <span> <strong>+91 {customer.phone}</strong>        </span>
                  : <span>Will be sent directly to <strong>+91 {customer.phone}</strong> and recorded in database.</span>
                }
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={handleCopy}>
            {copied ? <Check size={14} color="var(--color-credit)" /> : <Copy size={14} />}
            {copied
              ? (selectedLang === 'mr' ? '   !' : selectedLang === 'hi' ? '   !' : 'Copied & Saved!')
              : (selectedLang === 'mr' ? '    ' : selectedLang === 'hi' ? '    ' : 'Copy & Save')
            }
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenWhatsApp}
          >
            <WhatsAppIcon size={16} />
            <span>
              {selectedLang === 'mr' ? '‍    ' : selectedLang === 'hi' ? '     ' : 'Send & Save to DB'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
