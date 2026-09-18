import React, { useState } from 'react';
import { LoanShark } from '../engine/types';

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

  // Thematic procedural crest for each shark
  const getSharkTheme = () => {
    switch (shark.id) {
      case 'buddles':
        return {
          bg: 'from-amber-950/70 to-slate-950 border-amber-800/80 text-amber-400',
          icon: '🎲',
          ring: 'ring-amber-500/20',
        };
      case 'strange_ear_leonard':
        return {
          bg: 'from-teal-950/70 to-slate-950 border-teal-800/80 text-teal-400',
          icon: '⚓',
          ring: 'ring-teal-500/20',
        };
      case 'one_eyed_wilbur':
        return {
          bg: 'from-rose-950/70 to-slate-950 border-rose-800/80 text-rose-400',
          icon: '👁️',
          ring: 'ring-rose-500/20',
        };
      case 'odd_lenny':
        return {
          bg: 'from-orange-950/70 to-slate-950 border-orange-800/80 text-orange-400',
          icon: '🦂',
          ring: 'ring-orange-500/20',
        };
      case 'laughing_max':
        return {
          bg: 'from-purple-950/70 to-slate-950 border-purple-800/80 text-purple-400',
          icon: '🤡',
          ring: 'ring-purple-500/20',
        };
      case 'don_salvatore':
        return {
          bg: 'from-emerald-950/80 to-slate-950 border-emerald-700/80 text-emerald-400',
          icon: '🎩',
          ring: 'ring-emerald-500/30',
        };
      case 'sergei_the_butcher':
        return {
          bg: 'from-red-950/80 to-slate-950 border-red-700/80 text-red-400',
          icon: '🐻',
          ring: 'ring-red-500/30',
        };
      case 'dragon_head_chen':
        return {
          bg: 'from-yellow-950/80 to-slate-950 border-yellow-600/80 text-yellow-400',
          icon: '🐉',
          ring: 'ring-yellow-500/30',
        };
      default:
        return {
          bg: 'from-slate-950 to-slate-900 border-slate-800 text-rose-400',
          icon: '💀',
          ring: 'ring-slate-700/20',
        };
    }
  };

  const theme = getSharkTheme();

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br border shrink-0 select-none shadow-md ${theme.bg} ${theme.ring} ${sizeClasses[size]} ${className}`}
      title={`${shark.name} (${shark.title || 'Underworld Loan Shark'})`}
    >
      <span className="text-2xl drop-shadow-md select-none">{theme.icon}</span>
      {shark.dangerRating && size === 'lg' && (
        <span className="absolute bottom-1 right-1 text-[8px] font-black px-1 rounded bg-black/60 text-amber-300 border border-amber-500/40">
          ★{shark.dangerRating}
        </span>
      )}
    </div>
  );
};
