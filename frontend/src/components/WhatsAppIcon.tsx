'use client';

import React from 'react';

interface WhatsAppIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const WhatsAppIcon: React.FC<WhatsAppIconProps> = ({
  size = 18,
  className,
  color = 'currentColor'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      role="img"
      aria-label="WhatsApp"
    >
      {/* Speech bubble outline */}
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      {/* Phone receiver handset inside the bubble */}
      <path d="M9.5 9.5c.3.6.8 1.4 1.4 2 .6.6 1.4 1.1 2 1.4.3.1.6 0 .8-.2l.8-.8c.3-.3.8-.3 1.1-.1l1.8.9c.4.2.5.7.3 1.1l-.6 1.2c-.3.5-.8.8-1.4.8-2.6 0-5.1-1.3-6.8-3-1.7-1.7-3-4.2-3-6.8 0-.6.3-1.1.8-1.4l1.2-.6c.4-.2.9-.1 1.1.3l.9 1.8c.2.3.2.8-.1 1.1l-.8.8c-.2.2-.3.5-.2.8z" />
    </svg>
  );
};
