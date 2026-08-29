'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, Mic, User, Phone } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';

export type SearchMode = 'NAME' | 'PHONE';

interface CustomerSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  language: Language;
  onVoiceClick?: () => void;
}

export const CustomerSearchBar: React.FC<CustomerSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  searchMode,
  onSearchModeChange,
  language,
  onVoiceClick,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = getTranslation(language);

  // Global Keyboard Shortcut: Press Cmd+K or Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const placeholderText = searchMode === 'NAME'
    ? 'Search customer by full name...'
    : 'Search customer by 10-digit mobile number...';

  return (
    <div className="search-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Switcher: Search by Name vs Mobile Number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: '9999px',
          padding: '2px',
          gap: '3px'
        }}>
          <button
            type="button"
            style={{
              padding: '0.3rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              borderRadius: '9999px',
              background: searchMode === 'NAME' ? 'var(--btn-primary-bg)' : 'transparent',
              color: searchMode === 'NAME' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
            onClick={() => {
              onSearchModeChange('NAME');
              inputRef.current?.focus();
            }}
          >
            <User size={13} />
            <span>Search by Name</span>
          </button>

          <button
            type="button"
            style={{
              padding: '0.3rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              borderRadius: '9999px',
              background: searchMode === 'PHONE' ? 'var(--btn-primary-bg)' : 'transparent',
              color: searchMode === 'PHONE' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
            onClick={() => {
              onSearchModeChange('PHONE');
              inputRef.current?.focus();
            }}
          >
            <Phone size={13} />
            <span>Search by Mobile No.</span>
          </button>
        </div>
      </div>

      {/* Input Box */}
      <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={18} className="search-icon-left" />

        <input
          ref={inputRef}
          type={searchMode === 'PHONE' ? 'tel' : 'text'}
          className="search-input"
          placeholder={placeholderText}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
          style={{ paddingRight: '7rem', width: '100%' }}
        />

        <div style={{
          position: 'absolute',
          right: '0.65rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          zIndex: 2
        }}>
          {searchQuery && (
            <button
              type="button"
              className="icon-btn"
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
              onClick={() => onSearchChange('')}
              title={t.clearAll}
            >
              <X size={13} />
            </button>
          )}

          {/* Quick Mic trigger */}
          {onVoiceClick && (
            <button
              type="button"
              className="icon-btn"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
              onClick={onVoiceClick}
              title={t.voiceBilling}
            >
              <Mic size={14} />
            </button>
          )}

          <span className="search-shortcut-badge">⌘K</span>
        </div>
      </div>
    </div>
  );
};
