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

  // Palette and thematic styling based on tier
  const getTierTheme = () => {
    switch (business.tier) {
      case 1:
        return 'from-amber-950/60 to-slate-950 border-amber-800/60 text-amber-300';
      case 2:
        return 'from-cyan-950/60 to-slate-950 border-cyan-800/60 text-cyan-300';
      case 3:
        return 'from-fuchsia-950/60 to-slate-950 border-fuchsia-800/60 text-fuchsia-300';
      case 4:
        return 'from-purple-950/60 to-slate-950 border-purple-800/60 text-purple-300';
      case 5:
        return 'from-sky-950/60 to-slate-950 border-sky-800/60 text-sky-300';
      case 6:
        return 'from-emerald-950/60 to-slate-950 border-emerald-800/60 text-emerald-300';
      case 7:
        return 'from-indigo-950/60 to-slate-950 border-indigo-800/60 text-indigo-300';
      case 8:
      default:
        return 'from-yellow-950/70 to-slate-950 border-yellow-600/70 text-yellow-300 shadow-lg shadow-yellow-950/30';
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br border shrink-0 select-none ${getTierTheme()} ${sizeClasses[size]} ${className}`}
      title={business.name}
    >
      <span className="drop-shadow-md">{business.icon}</span>
      {size === 'lg' && (
        <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-80">
          T{business.tier}
        </span>
      )}
    </div>
  );
};
