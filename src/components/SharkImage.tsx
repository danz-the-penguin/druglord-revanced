import React, { useState } from 'react';
import { LoanShark } from '../engine/types';
import { Skull } from 'lucide-react';

interface SharkImageProps {
  shark: LoanShark;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SharkImage: React.FC<SharkImageProps> = ({ shark, className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const imageSrc = `/assets/sharks/${shark.id}.png`;

  if (!imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageSrc}
          alt={shark.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-rose-950/40 border border-rose-900/60 shrink-0 ${sizeClasses[size]} ${className}`}
      title={shark.name}
    >
      <Skull className="w-6 h-6 text-rose-400" />
    </div>
  );
};
