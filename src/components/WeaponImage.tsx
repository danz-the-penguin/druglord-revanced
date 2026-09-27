import React, { useState } from 'react';
import { Weapon } from '../engine/types';
import { Crosshair, Shield, Flame, Zap, Sparkles, Sword } from 'lucide-react';

interface WeaponImageProps {
  item: Weapon;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'showcase';
  isFiring?: boolean;
}

export const WeaponImage: React.FC<WeaponImageProps> = ({
  item,
  className = '',
  size = 'md',
  isFiring = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-36 h-36 sm:w-40 sm:h-40',
    hero: 'w-full h-52 sm:h-60',
    showcase: 'w-full h-64 sm:h-72 md:h-80',
  };

  const getCaliberSpec = () => {
    switch (item.id) {
      case 'knife':
        return '440C HIGH-CARBON STEEL';
      case 'pistol':
        return '9×19mm NATO • 15-RND MAG';
      case 'desert_eagle':
        return '.50 AE • 7-RND MAG • GAS-OPERATED';
      case 'shotgun':
        return '12-GAUGE 00 BUCK • PUMP-ACTION';
      case 'machine_gun':
        return '9×19mm FULL-AUTO • 32-RND';
      case 'dynamite':
        return 'NITROGLYCERIN CHARGE • TIMED FUSE';
      case 'hand_grenade':
        return 'M67 COMPOSITION B • FRAGMENTATION';
      case 'flame_thrower':
        return 'NAPALM-THICKENED HYDROCARBON';
      case 'rocket_launcher':
        return '85mm HIGH-EXPLOSIVE ANTI-TANK';
      case 'barrett_m82':
        return '.50 BMG (12.7×99mm) • SEMI-AUTO';
      case 'heavy_leather_coat':
        return 'REINFORCED LEATHER LINING • LEVEL I';
      case 'bullet_proof_vest':
        return 'KEVLAR ARAMID FIBER • LEVEL IIIA';
      case 'juggernaut_armor':
        return 'TITANIUM-BORON CERAMIC • LEVEL IV';
      case 'energy_globe':
        return 'EXPERIMENTAL DEFLECTOR FIELD';
      case 'no_scent':
        return 'ODOR-NEUTRALIZING AEROSOL';
      case 'flashbang':
        return 'M84 STUN • 170dB • 1.5M CANDELA';
      case 'smoke_grenade':
        return 'HEXACHLOROETHANE AEROSOL SCREEN';
      case 'emp_scrambler':
        return 'RF JAMMING BURST • DUAL-BAND';
      case 'combat_medkit':
        return 'HEMOSTATIC COMBAT GAUZE & ATROPINE';
      default:
        return 'MIL-SPEC TACTICAL GRADE';
    }
  };

  const getIcon = (iconSize = 'w-6 h-6') => {
    if (item.type === 'armor') return <Shield className={`${iconSize} text-cyan-400`} />;
    if (item.id === 'flame_thrower') return <Flame className={`${iconSize} text-amber-500`} />;
    if (item.id === 'energy_globe') return <Zap className={`${iconSize} text-purple-400`} />;
    if (item.id === 'no_scent' || item.id === 'emp_scrambler')
      return <Sparkles className={`${iconSize} text-emerald-400`} />;
    if (item.id === 'knife') return <Sword className={`${iconSize} text-slate-300`} />;
    return <Crosshair className={`${iconSize} text-rose-400`} />;
  };

  const imageSrc = `/assets/weapons/${item.id}.png`;

  // SHOWCASE & HERO MODES (Large tactical blueprint display for Armory cards & modals)
  if (size === 'showcase' || size === 'hero') {
    const isHero = size === 'hero';
    const containerHeight = isHero ? sizeClasses.hero : sizeClasses.showcase;

    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-4 font-mono select-none flex flex-col justify-between transition-all duration-150 ${containerHeight} ${
          isFiring
            ? 'ring-2 ring-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.75)] scale-[1.01]'
            : ''
        } ${className}`}
      >
        {/* Muzzle Flash Shockwave Overlay during Firing */}
        {isFiring && (
          <div className="absolute inset-0 bg-gradient-to-t from-rose-600/30 via-amber-500/20 to-transparent pointer-events-none animate-pulse z-20" />
        )}

        {/* Blueprint background grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Tactical Crosshair Watermark in Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-36 h-36 rounded-full border border-sky-400 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border border-dashed border-sky-400" />
          </div>
        </div>

        {/* Top telemetry row */}
        <div className="relative z-10 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isFiring ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="font-bold text-sky-400 tracking-wider uppercase">
              {item.type === 'armor' ? 'ARMOR SYSTEM' : item.type === 'utility' ? 'TACTICAL GEAR' : 'FIREARM SYSTEM'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[9px] font-black text-slate-300">
            {item.aoe ? 'AREA-OF-EFFECT' : item.consumable ? 'EXPENDABLE' : 'STANDARD ISSUE'}
          </span>
        </div>

        {/* Centerpiece Image or Tactical Icon */}
        <div className="relative z-10 my-auto flex items-center justify-center py-2">
          {!imgError ? (
            <img
              src={imageSrc}
              alt={item.name}
              onError={() => setImgError(true)}
              className={`max-h-48 sm:max-h-56 md:max-h-64 w-auto object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.95)] transition-transform duration-200 hover:scale-105 ${
                isFiring ? 'scale-105 brightness-125' : ''
              }`}
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl">
                {getIcon('w-16 h-16')}
              </div>
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                {item.name}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Specs Line */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
          <span className="truncate font-semibold text-slate-300">{getCaliberSpec()}</span>
          {item.damage ? (
            <span className="text-rose-400 font-bold shrink-0 ml-2">DMG {item.damage}</span>
          ) : item.defense ? (
            <span className="text-cyan-400 font-bold shrink-0 ml-2">DEF {Math.round(item.defense * 100)}%</span>
          ) : (
            <span className="text-emerald-400 font-bold shrink-0 ml-2">MAX {item.maxHold ?? 10}</span>
          )}
        </div>

        {/* Corner HUD Brackets */}
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-sky-500/60 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-sky-500/60 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-sky-500/60 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-sky-500/60 pointer-events-none" />
      </div>
    );
  }

  // STANDARD ICON MODES (sm, md, lg, xl)
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
