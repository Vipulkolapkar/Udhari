'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Sliders,
  GripVertical,
  UserCheck,
  Edit3
} from 'lucide-react';
import { ShopUser } from '../types';

interface SidebarProps {
  isOpen: boolean;
  currentView: 'DASHBOARD' | 'PROFILE' | 'SETTINGS';
  currentShop: ShopUser | null;
  onToggle: () => void;
  onSelectView: (view: 'DASHBOARD' | 'PROFILE' | 'SETTINGS') => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  currentView,
  currentShop,
  onToggle,
  onSelectView,
  onLogout
}) => {
  // Adjustable width state (default 290px, min 240px, max 480px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(290);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Load persisted width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('udhari_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 500) {
          setSidebarWidth(parsed);
        }
      }
    }
  }, []);

  // Handle Drag Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 220), 480);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('udhari_sidebar_width', sidebarWidth.toString());
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  return (
    <aside
      ref={sidebarRef}
      className={`app-slideable-sidebar ${isOpen ? 'open' : 'closed'}`}
      style={{
        width: isOpen ? `${sidebarWidth}px` : '72px',
        transition: isResizing ? 'none' : 'width 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 90
      }}
      aria-label="Navigation Menu"
    >
      {/* Sidebar Header with Slide Toggle */}
      <div className="sidebar-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Sliders size={16} color="var(--text-primary)" />
          </div>
          {isOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Navigation
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Control Panel
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-btn slide-toggle-btn"
          onClick={onToggle}
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Main Sidebar Menu Body */}
      <div className="sidebar-menu-body">
        {/* Interactive Shop Profile Card (Opens Business Profile & Analytics View) */}
        {isOpen && currentShop && (
          <div
            className={`sidebar-store-profile ${currentView === 'PROFILE' ? 'active-profile-card' : ''}`}
            onClick={() => onSelectView('PROFILE')}
            style={{
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: currentView === 'PROFILE' ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
              background: currentView === 'PROFILE' ? 'var(--bg-surface-hover)' : 'var(--bg-surface-elevated)'
            }}
            title="View Business Profile & Analytics"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Store size={18} color="var(--text-primary)" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentShop.shop_name}
                  </span>
                  <Edit3 size={13} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentShop.owner_name} • View Profile
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Primary Navigation */}
        <div className="sidebar-nav-list">
          {isOpen && (
            <div className="sidebar-group-title">
              Main Menu
            </div>
          )}

          {/* 1. Dashboard Tab */}
          <button
            type="button"
            className={`sidebar-link-btn ${currentView === 'DASHBOARD' ? 'active' : ''}`}
            onClick={() => onSelectView('DASHBOARD')}
            title="Customer Accounts"
          >
            <LayoutDashboard size={18} className="sidebar-link-icon" />
            <div className="sidebar-link-text">
              <span className="sidebar-link-title">Customer Accounts</span>
              {isOpen && (
                <span className="sidebar-link-sub">
                  Ledger & Credit Tracking
                </span>
              )}
            </div>
          </button>

          {/* 2. Settings Tab (Kept pure for Theme, Security, Data) */}
          <button
            type="button"
            className={`sidebar-link-btn ${currentView === 'SETTINGS' ? 'active' : ''}`}
            onClick={() => onSelectView('SETTINGS')}
            title="Settings"
          >
            <Settings size={18} className="sidebar-link-icon" />
            <div className="sidebar-link-text">
              <span className="sidebar-link-title">Settings</span>
              {isOpen && (
                <span className="sidebar-link-sub">
                  Theme, Security & Preferences
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Sidebar Footer with Sign Out */}
      <div className="sidebar-bottom-action">
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut size={17} />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>

      {/* Drag Resizer Handle on the Right Border */}
      {isOpen && (
        <div
          className="sidebar-resizer-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          title="Drag to resize sidebar"
        >
          <div className="sidebar-resizer-line" />
          <GripVertical size={12} className="sidebar-resizer-grip" />
        </div>
      )}
    </aside>
  );
};
