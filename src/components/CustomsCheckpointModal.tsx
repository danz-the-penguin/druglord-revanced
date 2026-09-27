import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUG_MAP, CITY_MAP } from '../engine/constants';
import { soundEngine } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import {
  ShieldAlert,
  Dog,
  Briefcase,
  DollarSign,
  Award,
  Trash2,
  Crosshair,
  Scan,
  Luggage,
  Sparkles,
} from 'lucide-react';

interface CustomsCheckpointModalProps {
  onEngageFirefight?: () => void;
}

export const CustomsCheckpointModal: React.FC<CustomsCheckpointModalProps> = ({
  onEngageFirefight,
}) => {
  const player = useGameStore((s) => s.player);
  const resolveEncounterAction = useGameStore((s) => s.resolveEncounterAction);
  const triggerScreenShake = useGameStore((s) => s.triggerScreenShake);

  const [checkpointStatus, setCheckpointStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const encounter = player.activeEncounter;
  const isCustomsEncounter =
    encounter &&
    (encounter.enemyId === 'federal_customs' || encounter.enemyId === 'airport_security');

  if (!isCustomsEncounter) return null;

  const currentCity = CITY_MAP.get(player.currentCityId)?.name ?? 'Airport';
  const hasDiplomaticPass = Boolean(player.consularImmunity && player.consularImmunity !== 'none');

  // Calculate unmasked cargo in luggage
  const totalCargoUnits = Object.values(player.inventory || {}).reduce(
    (sum, item) => sum + (item?.units || 0),
    0
  );
  const maskedUnits = (player.noScentCans || 0) * 100;
  const unmaskedUnits = Math.max(0, totalCargoUnits - maskedUnits);

  // Approximate value of contraband
  let cargoValue = 0;
  Object.values(player.inventory || {}).forEach((item) => {
    if (!item || item.units <= 0) return;
    const drug = DRUG_MAP.get(item.drugId);
    if (drug) {
      cargoValue += (drug.basePrice || 100) * item.units;
    }
  });

  // Action: Bluff / Walk Cool
  const handleBluff = () => {
    setIsProcessing(true);
    soundEngine.play('click');
    triggerHaptic('medium');

    setTimeout(() => {
      // Chance influenced by player health, heat, and random roll
      const heat = player.cityHeat?.[player.currentCityId] ?? 0;
      const passRoll = Math.random();
      const passThreshold = Math.max(0.2, 0.65 - (heat / 200));

      if (passRoll < passThreshold || player.cheats?.godMode) {
        soundEngine.play('victory');
        triggerHaptic('heavy');
        setCheckpointStatus('The K9 was momentarily distracted! The inspector signaled you through the green corridor.');
        setTimeout(() => {
          resolveEncounterAction('flee');
          setIsProcessing(false);
          setCheckpointStatus(null);
        }, 1500);
      } else {
        soundEngine.play('police');
        triggerScreenShake('heavy');
        triggerHaptic('heavy');
        setCheckpointStatus('BLUFF FAILED! Drug dog alerted violently! Federal officers draw service weapons!');
        setTimeout(() => {
          setIsProcessing(false);
          setCheckpointStatus(null);
          if (onEngageFirefight) {
            onEngageFirefight();
          } else {
            resolveEncounterAction('fight');
          }
        }, 1500);
      }
    }, 600);
  };

  // Action: Bribe Agent
  const handleBribe = () => {
    if (player.cash < encounter.bribeCost && !player.cheats?.godMode) return;
    setIsProcessing(true);
    soundEngine.play('bribe');
    triggerHaptic('medium');

    setTimeout(() => {
      resolveEncounterAction('bribe');
      setIsProcessing(false);
    }, 400);
  };

  // Action: Diplomatic Immunity
  const handleDiplomaticPass = () => {
    if (!hasDiplomaticPass) return;
    setIsProcessing(true);
    soundEngine.play('victory');
    triggerHaptic('heavy');

    setTimeout(() => {
      resolveEncounterAction('flee');
      setIsProcessing(false);
    }, 500);
  };

  // Action: Ditch Cargo in Trash
  const handleDitchCargo = () => {
    setIsProcessing(true);
    soundEngine.play('defeat');
    triggerHaptic('medium');

    setTimeout(() => {
      // Dump street inventory to evade arrest cleanly
      resolveEncounterAction('surrender');
      setIsProcessing(false);
    }, 500);
  };

  // Action: Draw Weapon / Fight
  const handleDrawWeapon = () => {
    soundEngine.play('gunshot');
    triggerScreenShake('medium');
    triggerHaptic('heavy');
    if (onEngageFirefight) {
      onEngageFirefight();
    } else {
      resolveEncounterAction('fight');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 font-mono overflow-y-auto">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl shadow-red-950/60 animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/60 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 border border-red-600/70 text-red-300">
                  INTERDICTION CHECKPOINT
                </span>
                <span className="text-xs text-slate-400 font-bold">{currentCity} Int'l</span>
              </div>
              <h3 className="font-black text-white text-base tracking-wide mt-0.5">
                {encounter.enemyName}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs font-black uppercase">
              Danger {encounter.danger}/10
            </span>
          </div>
        </div>

        {/* Checkpoint Conveyor & K9 Alert Graphic */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Animated X-Ray Conveyor Scanner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <Scan className="w-4 h-4 text-cyan-400 animate-pulse" />
                Luggage X-Ray Conveyor Belt
              </span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <Dog className="w-3.5 h-3.5" />
                K-9 SNIFFER ALERT: 94%
              </span>
            </div>

            {/* Simulated X-Ray Luggage Chamber */}
            <div className="h-20 bg-emerald-950/20 border-2 border-dashed border-emerald-500/40 rounded-xl relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-pulse pointer-events-none" />

              <div className="flex items-center gap-6 z-10">
                <div className="flex flex-col items-center">
                  <Luggage className="w-8 h-8 text-amber-400 opacity-90" />
                  <span className="text-[10px] text-slate-400 mt-1">Passenger Bags</span>
                </div>

                <div className="h-8 w-px bg-slate-700" />

                <div className="flex flex-col items-center">
                  <Briefcase className="w-8 h-8 text-rose-500 animate-bounce" />
                  <span className="text-[10px] text-rose-400 font-bold mt-1">
                    {unmaskedUnits} Unmasked Units
                  </span>
                </div>
              </div>
            </div>

            {/* Dialogue Box */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Lead Customs Inspector:</div>
              <p className="text-slate-200 italic font-sans">
                "Step out of line, sir. The Belgian Malinois tagged your duffel bag. We need you to open the internal lining for secondary chemical swabs."
              </p>
            </div>

            {/* Checkpoint Status Toast */}
            {checkpointStatus && (
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-300 text-xs font-bold text-center animate-in zoom-in-95">
                {checkpointStatus}
              </div>
            )}
          </div>

          {/* Smuggled Cargo Manifest */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Contraband at Risk:</span>
              <span className="text-emerald-400 font-bold font-mono">
                ~${cargoValue.toLocaleString()} Value
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.values(player.inventory || {}).map((item) => {
                if (!item || item.units <= 0) return null;
                const drug = DRUG_MAP.get(item.drugId);
                return (
                  <span
                    key={item.drugId}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono"
                  >
                    {drug?.name ?? item.drugId}: <strong className="text-amber-300">{item.units}x</strong>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Tactical Customs Choices */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Smuggler Decision Protocol:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 1. Bluff & Walk Cool */}
              <button
                type="button"
                onClick={handleBluff}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-200 text-left transition-all active:scale-98 cursor-pointer flex items-start gap-2.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Walk Cool & Bluff</div>
                  <div className="text-[10px] text-amber-300/70 font-sans mt-0.5">
                    Act like an ordinary business traveler. Chance depends on city heat.
                  </div>
                </div>
              </button>

              {/* 2. Bribe Officer */}
              <button
                type="button"
                onClick={handleBribe}
                disabled={isProcessing || (player.cash < encounter.bribeCost && !player.cheats?.godMode)}
                className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 disabled:opacity-40 text-emerald-200 text-left transition-all active:scale-98 cursor-pointer flex items-start gap-2.5"
              >
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Bribe Inspector</div>
                  <div className="text-[10px] text-emerald-300/70 font-sans mt-0.5">
                    Discreet envelope: ${encounter.bribeCost.toLocaleString()}
                  </div>
                </div>
              </button>

              {/* 3. Diplomatic Immunity */}
              {hasDiplomaticPass && (
                <button
                  type="button"
                  onClick={handleDiplomaticPass}
                  disabled={isProcessing}
                  className="p-3 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-200 text-left transition-all active:scale-98 cursor-pointer flex items-start gap-2.5"
                >
                  <Award className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs">Diplomatic Passport</div>
                    <div className="text-[10px] text-cyan-300/70 font-sans mt-0.5">
                      Flash consular red credentials. Guaranteed immunity pass.
                    </div>
                  </div>
                </button>
              )}

              {/* 4. Ditch Cargo in Trash */}
              <button
                type="button"
                onClick={handleDitchCargo}
                disabled={isProcessing}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-left transition-all active:scale-98 cursor-pointer flex items-start gap-2.5"
              >
                <Trash2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Drop Baggage in Trash</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Abandon cargo in airport washroom. Evade arrest cleanly.
                  </div>
                </div>
              </button>
            </div>

            {/* 5. Draw Firearm */}
            <button
              type="button"
              onClick={handleDrawWeapon}
              disabled={isProcessing}
              className="w-full mt-2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-all active:scale-98 cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              <span>Draw Firearm & Shoot Way Through Terminal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
