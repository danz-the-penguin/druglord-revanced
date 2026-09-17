import React, { useState } from 'react';
import { Weapon } from '../engine/types';
import { Crosshair, Shield, Flame, Zap, Sparkles, Sword } from 'lucide-react';

interface WeaponImageProps {
  item: Weapon;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WeaponImage: React.FC<WeaponImageProps> = ({ item, className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const getIcon = () => {
    if (item.type === 'armor') return <Shield className="w-6 h-6 text-cyan-400" />;
    if (item.id === 'flame_thrower') return <Flame className="w-6 h-6 text-amber-500" />;
    if (item.id === 'energy_globe') return <Zap className="w-6 h-6 text-purple-400" />;
    if (item.id === 'no_scent') return <Sparkles className="w-6 h-6 text-emerald-400" />;
    if (item.id === 'knife') return <Sword className="w-6 h-6 text-slate-300" />;
    return <Crosshair className="w-6 h-6 text-rose-400" />;
  };

  const imageSrc = `/assets/weapons/${item.id}.png`;

  if (!imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageSrc}
          alt={item.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-1.5"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback icon badge
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800/80 shrink-0 ${sizeClasses[size]} ${className}`}
      title={item.name}
    >
      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
        {getIcon()}
      </div>
    </div>
  );
};
