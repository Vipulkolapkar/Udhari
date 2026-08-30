'use client';

import React from 'react';
import { Calendar, UserPlus } from 'lucide-react';
import { Language, ShopUser } from '../types';
import { getTranslation } from '../lib/translations';
import { UdhariLogo } from './UdhariLogo';

interface HeaderProps {
  currentShop: ShopUser | null;
  language: Language;
  onAddCustomerClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentShop,
  language,
  onAddCustomerClick,
}) => {
  const t = getTranslation(language);

  // Format today's date nicely
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header
      className="header-wrapper"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
    >
      {/* Front Page Top Left: Logo + "Udhari" Title + Shop Name below it */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <UdhariLogo size={46} />
        </div>

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              margin: 0,
              fontFamily: 'var(--font-primary)'
            }}
          >
            Udhari
          </h1>

          {currentShop && (
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                marginTop: '0.2rem',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              {currentShop.shop_name}
            </p>
          )}
        </div>
      </div>

      {/* Front Page Top Right: + Add Customer, Voice Entry & Live Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        {/* Prominent Add Customer Button */}
        {onAddCustomerClick && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddCustomerClick}
            style={{
              fontWeight: 700,
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <UserPlus size={16} />
            <span>{t.addCustomer}</span>
          </button>
        )}



        {/* Live Date Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <Calendar size={14} color="var(--text-muted)" />
          <span>{todayFormatted}</span>
        </div>
      </div>
    </header>
  );
};
