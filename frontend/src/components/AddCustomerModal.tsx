import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';
import { OtpVerificationModal } from './OtpVerificationModal';

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
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

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
                placeholder={language === 'mr' ? 'उदा. सचिन पाटील' : language === 'hi' ? 'उदा. सचिन पाटिल' : 'e.g. John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {t.phone} *
                </label>
                {isPhoneVerified ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-credit)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : phone.length >= 10 ? (
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                    onClick={() => setShowOtpModal(true)}
                  >
                    Verify with OTP
                  </button>
                ) : null}
              </div>
              <input
                type="tel"
                className="form-input"
                placeholder="9822014589"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setIsPhoneVerified(false);
                }}
                maxLength={13}
                required
              />
            </div>

            {/* Address / Landmark */}
            <div className="form-group">
              <label className="form-label">
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {t.landmarkLabel}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'mr' ? 'उदा. शिवाजी चौक, फ्लॅट २०२' : language === 'hi' ? 'उदा. शिवाजी चौक, फ्लैट २०२' : 'e.g. 123 Main Street'}
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

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <OtpVerificationModal
          type="PHONE"
          target={phone}
          onClose={() => setShowOtpModal(false)}
          onVerified={() => {
            setIsPhoneVerified(true);
            setShowOtpModal(false);
          }}
        />
      )}
    </div>
  );
};
