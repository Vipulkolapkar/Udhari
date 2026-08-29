'use client';

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
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
  }) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      address_landmark: landmark.trim() || undefined,
      credit_limit: 9999999
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <UserPlus size={18} />
            <span>{t.addCustomer}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
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
                autoFocus
              />
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label">{t.phone} *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 9822014589"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={13}
                required
              />
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
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={15} />
              <span>{t.addCustomer}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
