import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundEngine } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import {
  Smartphone,
  X,
  Trash2,
  Skull,
  ShieldAlert,
  Building,
  Radio,
  Wifi,
  BatteryCharging,
} from 'lucide-react';

export const BurnerPhoneWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const player = useGameStore((s) => s.player);
  const markBurnerMessageRead = useGameStore((s) => s.markBurnerMessageRead);
  const dismissBurnerMessage = useGameStore((s) => s.dismissBurnerMessage);
  const clearReadBurnerMessages = useGameStore((s) => s.clearReadBurnerMessages);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const setPlacesSubTab = useGameStore((s) => s.setPlacesSubTab);
  const openSyndicateModal = useGameStore((s) => s.openSyndicateModal);

  const messages = player.burnerMessages || [];
  const unreadCount = messages.filter((m) => !m.read).length;

  const handleToggle = () => {
    soundEngine.play('pager');
    triggerHaptic('light');
    setIsOpen(!isOpen);
  };

  const handleAction = (msgId: string, actionType?: string) => {
    markBurnerMessageRead(msgId);
    triggerHaptic('medium');

    if (actionType === 'pay_shark') {
      setActiveTab('places');
      setPlacesSubTab('loans');
      setIsOpen(false);
    } else if (actionType === 'open_syndicate') {
      openSyndicateModal();
      setIsOpen(false);
    } else if (actionType === 'open_market') {
      setActiveTab('market');
      setIsOpen(false);
    } else if (actionType === 'dismiss') {
      dismissBurnerMessage(msgId);
    }
  };

  const getSenderBadge = (role: string) => {
    switch (role) {
      case 'shark':
        return { color: 'text-rose-400 bg-rose-950/80 border-rose-600', icon: Skull };
      case 'police':
        return { color: 'text-red-400 bg-red-950/80 border-red-500 animate-pulse', icon: ShieldAlert };
      case 'syndicate':
        return { color: 'text-amber-400 bg-amber-950/80 border-amber-600', icon: Radio };
      case 'front':
        return { color: 'text-emerald-400 bg-emerald-950/80 border-emerald-600', icon: Building };
      case 'banker':
        return { color: 'text-sky-400 bg-sky-950/80 border-sky-600', icon: Building };
      default:
        return { color: 'text-slate-300 bg-slate-800 border-slate-700', icon: Radio };
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={handleToggle}
          className={`relative p-3 rounded-2xl border-2 shadow-2xl transition-all cursor-pointer flex items-center justify-center group ${
            unreadCount > 0
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/40 animate-bounce'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700 shadow-black/80'
          }`}
          title="Encrypted Underworld Burner Phone"
        >
          <Smartphone className={`w-5 h-5 ${unreadCount > 0 ? 'text-slate-950' : 'text-emerald-400'}`} />

          {/* Unread Message Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] border-2 border-slate-950 shadow-md">
              {unreadCount}
            </span>
          )}

          {/* Blinking Antenna LED */}
          <span className={`absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full ${
            unreadCount > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
          }`} />
        </button>
      </div>

      {/* Expanded Burner Phone Modal Terminal */}
      {isOpen && (
        <div className="fixed bottom-28 md:bottom-20 right-3 sm:right-6 z-50 w-[92vw] sm:w-[380px] max-h-[520px] bg-slate-950/95 border-2 border-slate-700 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col font-mono overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Top Status Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200 uppercase tracking-widest text-[11px]">
                NOKIA 8110 // SECURE
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Active Cipher Channel */}
          <div className="bg-slate-900/50 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>CIPHER: 256-BIT PGP</span>
            <div className="flex items-center gap-2">
              <span>{messages.length} SMS Threads</span>
              {messages.some((m) => m.read) && (
                <button
                  type="button"
                  onClick={() => clearReadBurnerMessages()}
                  className="hover:text-rose-400 flex items-center gap-0.5 cursor-pointer"
                  title="Clear Read Messages"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Purge</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[380px]">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Radio className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
                <p className="text-xs">No intercepted transmissions.</p>
                <p className="text-[10px] text-slate-600">Underworld frequency is silent for now.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const badge = getSenderBadge(msg.role);
                const IconComponent = badge.icon;

                return (
                  <div
                    key={msg.id}
                    onClick={() => markBurnerMessageRead(msg.id)}
                    className={`p-3 rounded-2xl border transition-all ${
                      msg.read
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        : 'bg-slate-900 border-amber-500/70 text-slate-100 shadow-lg shadow-amber-950/30'
                    }`}
                  >
                    {/* Header: Sender & Tag */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 shrink-0 ${badge.color}`}>
                          <IconComponent className="w-2.5 h-2.5" />
                          <span className="uppercase">{msg.role}</span>
                        </span>
                        <span className="font-bold text-xs text-slate-200 truncate">
                          {msg.sender}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        Day {msg.day}
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-xs font-sans leading-relaxed text-slate-300">
                      {msg.text}
                    </p>

                    {/* Action Button */}
                    {msg.actionLabel && (
                      <div className="mt-2.5 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(msg.id, msg.actionType);
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all cursor-pointer shadow-md"
                        >
                          {msg.actionLabel}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissBurnerMessage(msg.id);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Reply Bar */}
          <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>DEVICE PIN: 4892-ALPHA</span>
            <span className="text-emerald-400">STATUS: ENCRYPTED</span>
          </div>
        </div>
      )}
    </>
  );
};
