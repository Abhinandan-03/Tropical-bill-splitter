import React from 'react';

export function Card({ children, className = '', noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={`glass-card ${noPadding ? '!p-0 overflow-hidden' : ''} ${className}`}>
      {children}
    </div>
  );
}
