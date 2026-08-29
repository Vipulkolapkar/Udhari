'use client';

import React from 'react';
import { IndianRupee, ArrowDownRight, ArrowUpRight, Users } from 'lucide-react';
import { DashboardMetrics, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface DashboardStatsProps {
  metrics: DashboardMetrics;
  language: Language;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics, language }) => {
  const t = getTranslation(language);

  return (
    <section className="metrics-grid" aria-label="Shop Key Performance Indicators">
      {/* 1. Total Outstanding Receivables */}
      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'var(--color-debit-bg)', borderColor: 'var(--color-debit-border)' }}>
          <IndianRupee size={20} color="var(--color-debit)" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.totalMarketDebt}</span>
          <span className="metric-value" style={{ color: 'var(--color-debit)' }}>
            ₹{metrics.total_market_debt.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 2. Today's Collected Payments */}
      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'var(--color-credit-bg)', borderColor: 'var(--color-credit-border)' }}>
          <ArrowDownRight size={20} color="var(--color-credit)" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.collectedToday}</span>
          <span className="metric-value" style={{ color: 'var(--color-credit)' }}>
            ₹{metrics.collected_today.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 3. Today's Credit Issued */}
      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.3)' }}>
          <ArrowUpRight size={20} color="#fb923c" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.creditGivenToday}</span>
          <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
            ₹{metrics.credit_given_today.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 4. Active Debtors Count */}
      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <Users size={20} color="#3b82f6" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.activeDebtors}</span>
          <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
            {metrics.active_debtors_count}
          </span>
        </div>
      </div>
    </section>
  );
};
