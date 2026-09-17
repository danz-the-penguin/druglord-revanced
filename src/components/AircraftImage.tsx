import React, { useState } from 'react';
import { Aircraft } from '../engine/types';
import { Plane, Compass, Zap, Crown } from 'lucide-react';

interface AircraftImageProps {
  aircraft: Aircraft;
  className?: string;
}

export const AircraftImage: React.FC<AircraftImageProps> = ({ aircraft, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const getIcon = () => {
    switch (aircraft.id) {
      case 'gulfstream_g650':
        return <Crown className="w-8 h-8 text-amber-300 animate-pulse" />;
      case 'learjet_narco':
        return <Zap className="w-8 h-8 text-cyan-400" />;
      case 'king_air_runner':
        return <Plane className="w-8 h-8 text-emerald-400" />;
      case 'cessna_smuggler':
      default:
        return <Compass className="w-8 h-8 text-sky-400" />;
    }
  };

  if (!imgError && aircraft.image) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 ${className}`}>
        <img
          src={aircraft.image}
          alt={aircraft.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700 text-[10px] font-bold text-sky-300 font-mono">
          {aircraft.icon} {aircraft.model.split(' ')[0]}
        </div>
      </div>
    );
  }

  // Architectural / Avionics Blueprint Fallback
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 p-4 font-mono select-none overflow-hidden ${className}`}
    >
      {/* Avionics HUD grid overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-inner">
          {getIcon()}
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider text-center max-w-[160px] truncate">
          {aircraft.name}
        </span>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] text-slate-600 font-mono">
        /assets/aircraft/{aircraft.id}.png
      </div>
    </div>
  );
};
