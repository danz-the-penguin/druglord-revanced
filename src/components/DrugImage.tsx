import React, { useState } from 'react';
import { Drug } from '../engine/types';
import { Atom } from 'lucide-react';

interface DrugImageProps {
  drug: Drug;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DrugImage: React.FC<DrugImageProps> = ({
  drug,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeDimensions = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-24 h-24 text-base',
  };

  const imageSrc = drug.image || `/assets/drugs/${drug.id}.png`;

  // Format chemical formula into visual subscript e.g. C17H21NO4 -> C₁₇H₂₁NO₄
  const formatFormula = (formula?: string) => {
    if (!formula) return '';
    return formula.replace(/(\d+)/g, (match) => {
      const subMap: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      };
      return match.split('').map((c) => subMap[c] || c).join('');
    });
  };

  const formattedFormula = formatFormula(drug.chemicalFormula);

  if (imageError) {
    // SVG fallback with chemical formula and hover zoom expansion
    return (
      <div
        className={`${sizeDimensions[size]} rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-800/60 flex flex-col items-center justify-center p-1 relative overflow-hidden shadow-inner shrink-0 transition-all duration-300 transform group-hover:scale-125 hover:!scale-140 z-10 group-hover:z-30 group-hover:shadow-xl group-hover:shadow-emerald-950/80 group-hover:border-emerald-500/80 cursor-pointer ${className}`}
        title={`${drug.name} (${drug.scientificName || ''}) - ${drug.chemicalFormula || ''}`}
      >
        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/15 transition-colors" />
        <Atom className="w-5 h-5 text-emerald-400 opacity-70 group-hover:opacity-100 group-hover:scale-120 transition-all mb-0.5" />
        <span className="text-[9px] font-mono font-black text-emerald-300 tracking-tighter truncate max-w-full z-10 px-0.5 group-hover:scale-105 transition-transform">
          {formattedFormula || drug.id.toUpperCase().slice(0, 4)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeDimensions[size]} rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative shadow-md transition-all duration-300 transform group-hover:scale-125 hover:!scale-140 z-10 group-hover:z-30 group-hover:shadow-xl group-hover:shadow-emerald-950/80 group-hover:border-emerald-500/80 cursor-pointer ${className}`}
    >
      <img
        src={imageSrc}
        alt={drug.name}
        onError={() => setImageError(true)}
        className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
      />
      {drug.chemicalFormula && size === 'lg' && (
        <span className="absolute bottom-1 right-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-400 border border-slate-800">
          {formattedFormula}
        </span>
      )}
    </div>
  );
};
