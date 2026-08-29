'use client';

import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';

interface AddCustomerModalProps {
  language: Language;
  onClose: () => void;
  onSubmit: (customerData: {
    name: string;
    phone: string;
    address_landmark?: string;
    credit_limit?: number;
  }) => Promise<void> | void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  language,
  onClose,
  onSubmit
}) => {
  const t = getTranslation(language);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = (val: string) => {
    // Strictly allow ONLY numeric digits (0-9) and limit to max 10 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setPhoneError('Mobile number must be exactly 10 digits');
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
    if (!name.trim()) return;

    if (cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: cleanPhone,
        address_landmark: landmark.trim() || undefined,
        credit_limit: 9999999
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <UserPlus size={18} />
            <span>{t.addCustomer}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label">{t.customerNameLabel} *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label">{t.phone} *</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                className="form-input"
                placeholder="e.g. 9822014589"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={10}
                disabled={isSubmitting}
                required
              />
              {phoneError && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-debit)', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                  {phoneError}
                </span>
              )}
            </div>

            {/* Address / Landmark */}
            <div className="form-group">
              <label className="form-label">{t.landmarkLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Near Shivaji Chowk, Flat 202"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || (phone.length > 0 && phone.length < 10)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Adding Customer...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>{t.addCustomer}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
