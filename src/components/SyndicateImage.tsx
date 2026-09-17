import React, { useState } from 'react';
import { Syndicate } from '../engine/types';

interface SyndicateImageProps {
  syndicate: Syndicate;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SyndicateImage: React.FC<SyndicateImageProps> = ({ syndicate, className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const imageSrc = `/assets/syndicates/${syndicate.id}.png`;

  if (!imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageSrc}
          alt={syndicate.name}
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
      title={syndicate.name}
    >
      <span>{syndicate.emblem}</span>
    </div>
  );
};
