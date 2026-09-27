import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getCityHeat } from '../engine/game';

export const AdrenalineVignette: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const crtMode = useGameStore((s) => s.crtMode);

  const isLowHealth = player.health > 0 && player.health <= 35 && !player.isGameOver;
  const currentCityHeat = getCityHeat(player, player.currentCityId);
  const isHighHeat = currentCityHeat >= 75 && !player.isGameOver;

  return (
    <>
      {/* 1. Low Health Adrenaline Crimson Vignette */}
      {isLowHealth && (
        <div className="fixed inset-0 pointer-events-none z-40 animate-adrenaline transition-opacity duration-300" />
      )}

      {/* 2. High Police Heat Alert Beacon Bar */}
      {isHighHeat && (
        <div className="fixed top-0 left-0 right-0 h-1.5 z-50 pointer-events-none animate-police-beacon shadow-lg shadow-rose-500/20" />
      )}

      {/* 3. CRT Retro Monitor Scanline Filter */}
      {crtMode && <div className="crt-overlay" />}
    </>
  );
};
