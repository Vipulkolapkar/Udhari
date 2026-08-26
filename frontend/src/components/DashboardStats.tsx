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
      {/* Total Market Debt */}
      <div className="metric-card">
        <div className="metric-icon-box">
          <IndianRupee size={18} color="var(--color-debit)" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.totalMarketDebt}</span>
          <span className="metric-value" style={{ color: 'var(--color-debit)' }}>
            ₹{metrics.total_market_debt.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Today's Collected Payments */}
      <div className="metric-card">
        <div className="metric-icon-box">
          <ArrowDownRight size={18} color="var(--color-credit)" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.collectedToday}</span>
          <span className="metric-value" style={{ color: 'var(--color-credit)' }}>
            ₹{metrics.collected_today.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Today's Credit Issued */}
      <div className="metric-card">
        <div className="metric-icon-box">
          <ArrowUpRight size={18} color="#e4e4e7" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.creditGivenToday}</span>
          <span className="metric-value" style={{ color: '#ffffff' }}>
            ₹{metrics.credit_given_today.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Active Debtors Count */}
      <div className="metric-card">
        <div className="metric-icon-box">
          <Users size={18} color="#a1a1aa" />
        </div>
        <div className="metric-info">
          <span className="metric-label">{t.activeDebtors}</span>
          <span className="metric-value" style={{ color: '#ffffff' }}>
            {metrics.active_debtors_count}
          </span>
        </div>
      </div>
    </section>
  );
};
