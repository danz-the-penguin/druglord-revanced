import React, { useState } from 'react';
import { Property } from '../engine/types';
import { Building, ShieldCheck, Home, Warehouse, Castle } from 'lucide-react';

interface PropertyImageProps {
  property: Property;
  className?: string;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({ property, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  // Property icon based on tier
  const getIcon = () => {
    switch (property.tier) {
      case 1:
        return <Home className="w-8 h-8 text-amber-400/80" />;
      case 2:
        return <Home className="w-8 h-8 text-cyan-400/80" />;
      case 3:
        return <Building className="w-8 h-8 text-purple-400/80" />;
      case 4:
        return <ShieldCheck className="w-8 h-8 text-emerald-400/80" />;
      case 5:
        return <Warehouse className="w-8 h-8 text-sky-400/80" />;
      case 6:
      default:
        return <Castle className="w-8 h-8 text-amber-300" />;
    }
  };

  if (!imgError && property.image) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 ${className}`}>
        <img
          src={property.image}
          alt={property.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700 text-[10px] font-bold text-amber-300 font-mono">
          Tier {property.tier}
        </div>
      </div>
    );
  }

  // Elegant Architectural / Blueprint Fallback
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 p-4 font-mono select-none overflow-hidden ${className}`}
    >
      {/* Blueprint grid lines overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
          {getIcon()}
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Tier {property.tier} Safehouse
        </span>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] text-slate-600 font-mono">
        /assets/properties/{property.id}.png
      </div>
    </div>
  );
};
