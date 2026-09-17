import React, { useState } from 'react';
import { Rank } from '../engine/types';
import { Crown, Award } from 'lucide-react';

interface RankImageProps {
  rank: Rank;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RankImage: React.FC<RankImageProps> = ({ rank, className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const imageSrc = `/assets/ranks/${rank.id}.png`;

  if (!imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageSrc}
          alt={rank.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-amber-950/60 border border-amber-700/80 shrink-0 ${sizeClasses[size]} ${className}`}
      title={rank.name}
    >
      {rank.id === 'drug_lord' ? (
        <Crown className="w-6 h-6 text-amber-300" />
      ) : (
        <Award className="w-6 h-6 text-amber-400" />
      )}
    </div>
  );
};
