import React, { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

interface CityAtmosphereConfig {
  gradient: string;
  glowColor: string;
  weatherType: 'rain' | 'snow' | 'embers' | 'dust' | 'none';
  skylineType: 'metropolis' | 'tropical' | 'alpine' | 'desert' | 'oriental';
}

const CITY_ATMOSPHERES: Record<string, CityAtmosphereConfig> = {
  // Neo-Tokyo & Asian Metros
  tokyo: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 80%)',
    glowColor: '#a855f7',
    weatherType: 'rain',
    skylineType: 'oriental',
  },
  hong_kong: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(217, 70, 239, 0.14) 0%, rgba(14, 165, 233, 0.06) 50%, transparent 80%)',
    glowColor: '#d946ef',
    weatherType: 'rain',
    skylineType: 'oriental',
  },
  singapore: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.06) 50%, transparent 80%)',
    glowColor: '#10b981',
    weatherType: 'rain',
    skylineType: 'oriental',
  },
  bangkok: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.14) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 80%)',
    glowColor: '#f59e0b',
    weatherType: 'embers',
    skylineType: 'oriental',
  },

  // Synthwave & Ocean Fronts
  miami: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(236, 72, 153, 0.16) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)',
    glowColor: '#ec4899',
    weatherType: 'embers',
    skylineType: 'tropical',
  },
  los_angeles: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.14) 0%, rgba(168, 85, 247, 0.06) 50%, transparent 80%)',
    glowColor: '#f97316',
    weatherType: 'embers',
    skylineType: 'tropical',
  },
  ibiza: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.16) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 80%)',
    glowColor: '#a855f7',
    weatherType: 'embers',
    skylineType: 'tropical',
  },
  rio_de_janeiro: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.06) 50%, transparent 80%)',
    glowColor: '#10b981',
    weatherType: 'embers',
    skylineType: 'tropical',
  },

  // Cartel Mountain Corridors
  bogota: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(180, 83, 9, 0.16) 0%, rgba(5, 150, 105, 0.07) 50%, transparent 80%)',
    glowColor: '#d97706',
    weatherType: 'dust',
    skylineType: 'alpine',
  },
  medellin: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(217, 119, 6, 0.16) 0%, rgba(16, 185, 129, 0.07) 50%, transparent 80%)',
    glowColor: '#f59e0b',
    weatherType: 'dust',
    skylineType: 'alpine',
  },
  mexico_city: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(220, 38, 38, 0.14) 0%, rgba(217, 119, 6, 0.06) 50%, transparent 80%)',
    glowColor: '#ef4444',
    weatherType: 'dust',
    skylineType: 'alpine',
  },
  tijuana: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(234, 88, 12, 0.15) 0%, rgba(220, 38, 38, 0.06) 50%, transparent 80%)',
    glowColor: '#ea580c',
    weatherType: 'dust',
    skylineType: 'desert',
  },

  // Alpine Vaults & Northern Capitals
  zurich: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.16) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 80%)',
    glowColor: '#38bdf8',
    weatherType: 'snow',
    skylineType: 'alpine',
  },
  frankfurt: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.14) 0%, rgba(14, 165, 233, 0.06) 50%, transparent 80%)',
    glowColor: '#6366f1',
    weatherType: 'snow',
    skylineType: 'metropolis',
  },
  london: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(100, 116, 139, 0.18) 0%, rgba(14, 165, 233, 0.05) 50%, transparent 80%)',
    glowColor: '#94a3b8',
    weatherType: 'rain',
    skylineType: 'metropolis',
  },
  paris: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.13) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 80%)',
    glowColor: '#c084fc',
    weatherType: 'rain',
    skylineType: 'metropolis',
  },
  amsterdam: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.06) 50%, transparent 80%)',
    glowColor: '#10b981',
    weatherType: 'rain',
    skylineType: 'metropolis',
  },
  berlin: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(148, 163, 184, 0.14) 0%, rgba(239, 68, 68, 0.05) 50%, transparent 80%)',
    glowColor: '#cbd5e1',
    weatherType: 'rain',
    skylineType: 'metropolis',
  },

  // Desert Empires
  dubai: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(234, 179, 8, 0.18) 0%, rgba(249, 115, 22, 0.07) 50%, transparent 80%)',
    glowColor: '#eab308',
    weatherType: 'embers',
    skylineType: 'desert',
  },
  las_vegas: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(236, 72, 153, 0.18) 0%, rgba(234, 179, 8, 0.08) 50%, transparent 80%)',
    glowColor: '#f43f5e',
    weatherType: 'embers',
    skylineType: 'desert',
  },

  // Noir American Capitals
  new_york: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.14) 0%, rgba(14, 165, 233, 0.06) 50%, transparent 80%)',
    glowColor: '#f59e0b',
    weatherType: 'rain',
    skylineType: 'metropolis',
  },
  detroit: {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.13) 0%, rgba(100, 116, 139, 0.06) 50%, transparent 80%)',
    glowColor: '#ef4444',
    weatherType: 'snow',
    skylineType: 'metropolis',
  },
};

const DEFAULT_ATMOSPHERE: CityAtmosphereConfig = {
  gradient: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.05) 50%, transparent 80%)',
  glowColor: '#10b981',
  weatherType: 'none',
  skylineType: 'metropolis',
};

export const CityAtmosphere: React.FC = () => {
  const currentCityId = useGameStore((s) => s.player.currentCityId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const config = CITY_ATMOSPHERES[currentCityId] || DEFAULT_ATMOSPHERE;

  // Particle weather system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || config.weatherType === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = config.weatherType === 'rain' ? 45 : config.weatherType === 'snow' ? 35 : 25;

    interface Particle {
      x: number;
      y: number;
      length: number;
      speedY: number;
      speedX: number;
      opacity: number;
      size: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: config.weatherType === 'rain' ? 8 + Math.random() * 12 : 2,
      speedY:
        config.weatherType === 'rain'
          ? 6 + Math.random() * 8
          : config.weatherType === 'snow'
          ? 0.8 + Math.random() * 1.4
          : -(0.5 + Math.random() * 1.2), // embers float up
      speedX:
        config.weatherType === 'rain'
          ? -1.5 + Math.random() * 0.5
          : (Math.random() - 0.5) * 0.8,
      opacity: 0.15 + Math.random() * 0.35,
      size: config.weatherType === 'snow' ? 1.5 + Math.random() * 2 : 1.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (config.weatherType === 'rain') {
          ctx.strokeStyle = `rgba(147, 197, 253, ${p.opacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
          ctx.stroke();

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        } else if (config.weatherType === 'snow') {
          ctx.fillStyle = `rgba(224, 242, 254, ${p.opacity * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        } else if (config.weatherType === 'embers' || config.weatherType === 'dust') {
          ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [config.weatherType]);

  // Skyline SVG vectors based on theme
  const skylineSvg = useMemo(() => {
    switch (config.skylineType) {
      case 'oriental':
        return (
          <svg className="w-full h-32 md:h-44 text-slate-800/25" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,200 L0,150 L30,150 L35,120 L40,150 L70,150 L85,80 L95,80 L110,150 L160,150 L180,90 L195,90 L210,150 L270,150 L290,60 L310,60 L330,150 L400,150 L420,110 L440,150 L480,150 L510,40 L530,40 L560,150 L630,150 L650,70 L670,70 L700,150 L770,150 L790,100 L810,150 L870,150 L900,50 L920,50 L950,150 L1020,150 L1050,90 L1070,90 L1100,150 L1160,150 L1200,120 L1200,200 Z" />
          </svg>
        );
      case 'tropical':
        return (
          <svg className="w-full h-32 md:h-44 text-slate-800/25" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,200 L0,165 L50,165 L60,140 L70,165 L120,165 L140,110 L160,110 L180,165 L260,165 L280,125 L300,125 L320,165 L400,165 L415,80 L435,80 L455,165 L560,165 L580,100 L600,100 L630,165 L720,165 L740,70 L760,70 L785,165 L890,165 L910,120 L930,120 L960,165 L1060,165 L1080,95 L1100,95 L1125,165 L1200,165 L1200,200 Z" />
          </svg>
        );
      case 'alpine':
        return (
          <svg className="w-full h-32 md:h-44 text-slate-800/25" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,200 L0,170 L80,140 L160,175 L250,110 L340,180 L450,95 L550,165 L680,80 L790,160 L890,105 L990,170 L1110,120 L1200,155 L1200,200 Z" />
          </svg>
        );
      case 'desert':
        return (
          <svg className="w-full h-32 md:h-44 text-slate-800/25" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,200 L0,160 L40,160 L50,120 L60,160 L140,160 L160,60 L170,30 L180,60 L200,160 L290,160 L310,90 L330,160 L420,160 L450,50 L470,20 L490,50 L520,160 L620,160 L640,100 L660,160 L750,160 L780,45 L800,15 L820,45 L850,160 L940,160 L960,85 L980,160 L1080,160 L1110,65 L1140,160 L1200,160 L1200,200 Z" />
          </svg>
        );
      case 'metropolis':
      default:
        return (
          <svg className="w-full h-32 md:h-44 text-slate-800/25" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,200 L0,160 L30,160 L30,120 L60,120 L60,160 L100,160 L100,80 L140,80 L140,160 L180,160 L180,95 L220,95 L220,160 L280,160 L280,60 L320,60 L320,160 L380,160 L380,110 L410,110 L410,160 L460,160 L460,40 L500,40 L500,160 L560,160 L560,75 L600,75 L600,160 L660,160 L660,105 L700,105 L700,160 L760,160 L760,50 L810,50 L810,160 L870,160 L870,85 L910,85 L910,160 L980,160 L980,65 L1020,65 L1020,160 L1080,160 L1080,115 L1120,115 L1120,160 L1200,160 L1200,200 Z" />
          </svg>
        );
    }
  }, [config.skylineType]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-1000">
      {/* 1. Atmospheric Ambient Gradient Dome */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: config.gradient }}
      />

      {/* 2. City Skyline Silhouette along bottom */}
      <div className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none">
        {skylineSvg}
      </div>

      {/* 3. Subtle Particle Weather Canvas */}
      {config.weatherType !== 'none' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        />
      )}
    </div>
  );
};
