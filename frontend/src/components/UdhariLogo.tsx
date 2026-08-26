'use client';

import React from 'react';

interface UdhariLogoProps {
  size?: number;
  className?: string;
}

export const UdhariLogo: React.FC<UdhariLogoProps> = ({ size = 36, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      role="img"
      aria-label="Udhari Ledger Logo"
    >
      {/* Outer rounded brand badge with smooth border */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="var(--text-primary)"
      />

      {/* Traditional Indian Bahi-Khata Ledger Book Icon */}
      {/* Ledger Book Cover */}
      <path
        d="M12 11C12 9.89543 12.8954 9 14 9H34C35.1046 9 36 9.89543 36 11V37C36 38.1046 35.1046 39 34 39H14C12.8954 39 12 38.1046 12 37V11Z"
        fill="var(--bg-app)"
      />

      {/* Ledger Spine Stitching / Binding */}
      <line
        x1="18"
        y1="9"
        x2="18"
        y2="39"
        stroke="var(--text-primary)"
        strokeWidth="2"
        strokeDasharray="2 2"
      />

      {/* Prominent Indian Rupee Symbol (₹) inside the Ledger Book */}
      {/* Top bar */}
      <path
        d="M22 17H30"
        stroke="var(--text-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Second bar */}
      <path
        d="M22 21H28.5"
        stroke="var(--text-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Curved loop of Rupee */}
      <path
        d="M22 17V24C23.8 24 26 23.5 26 21C26 18.5 24 17 22 17Z"
        stroke="var(--text-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Downward leg of Rupee */}
      <path
        d="M24 24L29.5 32"
        stroke="var(--text-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};
