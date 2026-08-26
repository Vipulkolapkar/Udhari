'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, Mic } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';

interface CustomerSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  language: Language;
  onVoiceClick?: () => void;
}

export const CustomerSearchBar: React.FC<CustomerSearchBarProps> = ({
  searchQuery,
  onSearchChange,
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

  return (
    <div className="search-section">
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon-left" />

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
          style={{ paddingRight: '6.5rem' }}
        />

        <div style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {searchQuery && (
            <button
              type="button"
              className="icon-btn"
              style={{ width: '28px', height: '28px' }}
              onClick={() => onSearchChange('')}
              title={t.clearAll}
            >
              <X size={13} />
            </button>
          )}

          {/* Quick Mic trigger in search bar */}
          {onVoiceClick && (
            <button
              type="button"
              className="icon-btn"
              style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }}
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
