import React, { useState } from 'react';
import { ShellBusiness } from '../engine/types';

interface ShellImageProps {
  business: ShellBusiness;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ShellImage: React.FC<ShellImageProps> = ({ business, className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const imageSrc = `/assets/shells/${business.id}.png`;

  if (!imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageSrc}
          alt={business.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 shrink-0 select-none ${sizeClasses[size]} ${className}`}
      title={business.name}
    >
      <span>{business.icon}</span>
    </div>
  );
};
