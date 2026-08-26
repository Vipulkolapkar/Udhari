'use client';

import React from 'react';
import { Phone, MapPin, Plus, ArrowDownLeft, BookOpen } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Customer, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface CustomerCardProps {
  customer: Customer;
  language: Language;
  onGiveCreditClick: (customer: Customer) => void;
  onGotPaymentClick: (customer: Customer) => void;
  onWhatsAppClick: (customer: Customer) => void;
  onViewLedgerClick: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  language,
  onGiveCreditClick,
  onGotPaymentClick,
  onWhatsAppClick,
  onViewLedgerClick,
}) => {
  const t = getTranslation(language);

  return (
    <article className="customer-card">
      <div>
        <div className="customer-top">
          <div>
            <h3 className="customer-name">{customer.name}</h3>
            <p className="customer-phone">
              <Phone size={13} color="var(--text-muted)" />
              <span>{customer.phone}</span>
            </p>
            {customer.address_landmark && (
              <p className="customer-landmark">
                <MapPin size={12} color="var(--text-muted)" style={{ display: 'inline', marginRight: '3px' }} />
                {customer.address_landmark}
              </p>
            )}
          </div>

          <div className="balance-badge-box">
            <span className="balance-title">{t.balanceDue}</span>
            <div className={`balance-amount ${customer.current_balance > 0 ? 'owing' : 'clear'}`}>
              ₹{customer.current_balance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card-actions" style={{ marginTop: '1rem' }}>
        {/* + Credit (Bill) */}
        <button
          type="button"
          className="btn btn-credit"
          onClick={() => onGiveCreditClick(customer)}
          title={t.giveCredit}
        >
          <Plus size={15} />
          <span>{language === 'mr' ? 'उधारी द्या' : language === 'hi' ? 'उधार दें' : 'Give Credit'}</span>
        </button>

        {/* ₹ Payment */}
        <button
          type="button"
          className="btn btn-payment"
          onClick={() => onGotPaymentClick(customer)}
          title={t.gotPayment}
        >
          <ArrowDownLeft size={15} />
          <span>{language === 'mr' ? 'जमा घ्या' : language === 'hi' ? 'जमा लें' : 'Got Payment'}</span>
        </button>

        {/* WhatsApp Reminder */}
        <button
          type="button"
          className="icon-btn"
          onClick={() => onWhatsAppClick(customer)}
          title={t.whatsappReminder}
        >
          <WhatsAppIcon size={16} color="var(--text-secondary)" />
        </button>

        {/* View Ledger */}
        <button
          type="button"
          className="icon-btn"
          onClick={() => onViewLedgerClick(customer)}
          title={t.viewLedger}
        >
          <BookOpen size={16} color="var(--text-secondary)" />
        </button>
      </div>
    </article>
  );
};
