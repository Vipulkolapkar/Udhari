'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, CheckCircle2, MessageSquare, Edit3 } from 'lucide-react';
import { Customer, Language, ShopUser } from '../types';
import { WhatsAppIcon } from './WhatsAppIcon';

interface WhatsAppModalProps {
  customer: Customer;
  currentShop: ShopUser | null;
  language: Language;
  onClose: () => void;
  onSendLogged?: (customerId: string, text: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  customer,
  currentShop,
  language,
  onClose,
  onSendLogged
}) => {
  const [tone, setTone] = useState<'polite' | 'formal' | 'urgent' | 'custom'>('polite');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const shopTitle = currentShop?.shop_name || 'Our Store';
  const balanceStr = customer.current_balance.toLocaleString('en-IN');

  // Generate dynamic message based on selected tone
  const generatedTemplate = React.useMemo(() => {
    switch (tone) {
      case 'formal':
        return `Dear ${customer.name},\n\nThis is an official payment reminder from ${shopTitle}.\nYour current outstanding balance is ₹${balanceStr}.\n\nKindly arrange the payment at your earliest convenience. Thank you.`;
      case 'urgent':
        return `Urgent Reminder for ${customer.name}:\nYour payment of ₹${balanceStr} is overdue at ${shopTitle}.\nPlease settle this pending amount today via Cash or UPI to keep your credit account active.`;
      case 'polite':
      default:
        return `Namaste ${customer.name} ji,\n\nA gentle reminder from ${shopTitle} regarding your pending balance of ₹${balanceStr}.\nPlease clear it whenever convenient. Have a great day!`;
    }
  }, [shopTitle, customer.name, balanceStr, tone]);

  const [customText, setCustomText] = useState(generatedTemplate);

  React.useEffect(() => {
    if (tone !== 'custom') {
      setCustomText(generatedTemplate);
    }
  }, [tone, generatedTemplate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      setSavedSuccess(true);
      if (onSendLogged) {
        onSendLogged(customer.id, customText);
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenWhatsApp = () => {
    if (onSendLogged) {
      onSendLogged(customer.id, customText);
    }
    setSavedSuccess(true);

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(customText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <WhatsAppIcon size={18} />
            <span>Send Payment Reminder — {customer.name}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Outstanding Balance Banner */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Balance Due</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-debit)', fontFamily: 'var(--font-primary)' }}>
              ₹{balanceStr}
            </span>
          </div>

          {/* Tone Selection */}
          <div className="form-group">
            <label className="form-label">Choose Message Tone</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="denom-chip"
                style={{
                  background: tone === 'polite' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                  color: tone === 'polite' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                  fontWeight: tone === 'polite' ? 700 : 500
                }}
                onClick={() => setTone('polite')}
              >
                <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Polite
              </button>

              <button
                type="button"
                className="denom-chip"
                style={{
                  background: tone === 'formal' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                  color: tone === 'formal' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                  fontWeight: tone === 'formal' ? 700 : 500
                }}
                onClick={() => setTone('formal')}
              >
                Formal
              </button>

              <button
                type="button"
                className="denom-chip"
                style={{
                  background: tone === 'urgent' ? 'var(--color-debit-bg)' : 'var(--bg-surface-elevated)',
                  color: tone === 'urgent' ? 'var(--color-debit)' : 'var(--text-primary)',
                  fontWeight: tone === 'urgent' ? 700 : 500
                }}
                onClick={() => setTone('urgent')}
              >
                Urgent
              </button>

              <button
                type="button"
                className="denom-chip"
                style={{
                  background: tone === 'custom' ? 'var(--btn-primary-bg)' : 'var(--bg-surface-elevated)',
                  color: tone === 'custom' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                  fontWeight: tone === 'custom' ? 700 : 500
                }}
                onClick={() => setTone('custom')}
              >
                <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Custom
              </button>
            </div>
          </div>

          {/* Editable Message Textarea */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Message Preview (Fully Editable)</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {customText.length} chars
              </span>
            </div>

            <textarea
              className="form-input"
              style={{
                minHeight: '130px',
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
                if (tone !== 'custom') setTone('custom');
              }}
              placeholder="Type reminder message here..."
            />
          </div>

          {/* Target Phone notice */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Target: <strong>+91 {customer.phone}</strong>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={handleCopy}>
            {copied ? <Check size={14} color="var(--color-credit)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenWhatsApp}
            style={{ fontWeight: 700 }}
          >
            <WhatsAppIcon size={16} />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
