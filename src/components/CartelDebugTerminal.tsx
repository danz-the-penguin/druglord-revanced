import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Terminal, X, Zap, Shield, DollarSign, Calendar, RefreshCw, Cpu, Download, Radio, Package, Truck, Volume2 } from 'lucide-react';
import { memoryMirror } from '../engine/memoryBuffer';

export const CartelDebugTerminal: React.FC = () => {
  const { isTerminalOpen, toggleTerminal, runCheat } = useGameStore();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Array<{ cmd: string; res: string; ok: boolean }>>([
    {
      cmd: 'init',
      res: 'CARTEL MEMORY INTERCEPTOR READY. Memory buffer mapped at 0x0000. Type "help" for commands.',
      ok: true,
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTerminalOpen) {
      inputRef.current?.focus();
    }
  }, [isTerminalOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isTerminalOpen) return null;

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const res = runCheat(command);
    setHistory((prev) => [...prev, { cmd: command, res: res.message, ok: res.success }]);
    setCommand('');
  };

  const handleQuick = (cmd: string) => {
    const res = runCheat(cmd);
    setHistory((prev) => [...prev, { cmd, res: res.message, ok: res.success }]);
  };

  const handleDownloadCheatTable = () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<CheatTable CheatEngineTableVersion="45">
  <CheatEntries>
    <CheatEntry>
      <ID>0</ID>
      <Description>"Drug Lord: ReVanced: Cash on Hand [Offset 0x00]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+00</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>1</ID>
      <Description>"Drug Lord: ReVanced: Offshore Bank [Offset 0x04]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+04</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>2</ID>
      <Description>"Drug Lord: ReVanced: Shark Debt [Offset 0x08]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+08</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>3</ID>
      <Description>"Drug Lord: ReVanced: Player HP [Offset 0x0C]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+0C</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>4</ID>
      <Description>"Drug Lord: ReVanced: Current Day [Offset 0x10]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+10</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>5</ID>
      <Description>"Drug Lord: ReVanced: Max Days [Offset 0x14]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+14</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>6</ID>
      <Description>"Drug Lord: ReVanced: God Mode (1=On, 0=Off) [Offset 0x18]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+18</Address>
    </CheatEntry>
    <CheatEntry>
      <ID>7</ID>
      <Description>"Drug Lord: ReVanced: Extra Stash Capacity [Offset 0x1C]"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"druglord2_mem"+1C</Address>
    </CheatEntry>
  </CheatEntries>
  <UserdefinedSymbols/>
</CheatTable>`;

    const blob = new Blob([xml], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DrugLord2_Fintech.CT';
    a.click();
    URL.revokeObjectURL(url);
    setHistory((prev) => [
      ...prev,
      {
        cmd: 'export_ct',
        res: 'Exported DrugLord2_Fintech.CT with all 8 static 4-byte memory offsets mapped.',
        ok: true,
      },
    ]);
  };

  const currentMem = memoryMirror.readMemory();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 font-mono">
      <div className="bg-slate-950 border-2 border-emerald-500/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-top-6 duration-200">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-emerald-400 text-sm tracking-wider uppercase">
              Cartel Debug Terminal & Memory Scanner Interface
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCheatTable}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition-colors font-bold"
              title="Download official Cheat Engine .CT table file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Get .CT File</span>
            </button>
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hidden sm:inline">
              CheatEngine Buffer: ONLINE
            </span>
            <button
              onClick={toggleTerminal}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cheat Engine Memory Inspection Bar */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-slate-500">[0x00 Cash]:</span>{' '}
            <strong className="text-emerald-400">${currentMem.cash.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-slate-500">[0x04 Bank]:</span>{' '}
            <strong className="text-cyan-400">${currentMem.bank.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-slate-500">[0x08 Debt]:</span>{' '}
            <strong className="text-rose-400">${currentMem.debt.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-slate-500">[0x0C HP]:</span>{' '}
            <strong className="text-amber-400">{currentMem.health}%</strong>
          </div>
          <div>
            <span className="text-slate-500">[0x10 Day]:</span>{' '}
            <strong className="text-slate-200">{currentMem.currentDay} / {currentMem.maxDays}</strong>
          </div>
          <div>
            <span className="text-slate-500">[0x18 God]:</span>{' '}
            <strong className={currentMem.godMode ? 'text-emerald-400' : 'text-slate-600'}>
              {currentMem.godMode ? 'ACTIVE' : 'OFF'}
            </strong>
          </div>
          <div className="col-span-2 text-slate-500 text-[10px] flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Search 4-Byte Exact Value in Cheat Engine to lock/edit live</span>
          </div>
        </div>

        {/* Quick Click Hacks */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
          <button
            onClick={() => handleQuick('cash +1000000')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 hover:text-emerald-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <DollarSign className="w-3 h-3" /> +$1M Cash
          </button>
          <button
            onClick={() => handleQuick('bank +5000000')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:border-cyan-700 hover:text-cyan-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <DollarSign className="w-3 h-3" /> +$5M Bank
          </button>
          <button
            onClick={() => handleQuick('clear_debt')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:border-rose-700 hover:text-rose-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Clear Debt
          </button>
          <button
            onClick={() => handleQuick('days +30')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-950 hover:border-amber-700 hover:text-amber-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" /> +30 Days
          </button>
          <button
            onClick={() => handleQuick('god')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-purple-950 hover:border-purple-700 hover:text-purple-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Shield className="w-3 h-3" /> Toggle God Mode
          </button>
          <button
            onClick={() => handleQuick('capacity 5000')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-950 hover:border-indigo-700 hover:text-indigo-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Zap className="w-3 h-3" /> +5,000 Capacity
          </button>
          <button
            onClick={() => handleQuick('heal')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:border-rose-700 hover:text-rose-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            Full Heal (100 HP)
          </button>
          <button
            onClick={() => handleQuick('wire')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-orange-950 hover:border-orange-700 hover:text-orange-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Radio className="w-3 h-3 text-orange-400" /> Informant Wire
          </button>
          <button
            onClick={() => handleQuick('vault')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-teal-950 hover:border-teal-700 hover:text-teal-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Package className="w-3 h-3 text-teal-400" /> Safehouse Vaults
          </button>
          <button
            onClick={() => handleQuick('shipments')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-teal-950 hover:border-teal-700 hover:text-teal-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Truck className="w-3 h-3 text-teal-400" /> Courier Radar
          </button>
          <button
            onClick={() => handleQuick('sfx pager')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-950 hover:border-sky-700 hover:text-sky-300 border border-slate-700 transition-colors font-bold text-slate-300 flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3 text-sky-400" /> Test SFX
          </button>
        </div>

        {/* Terminal Log Output */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs bg-slate-950 font-mono">
          {history.map((h, i) => (
            <div key={i} className="space-y-0.5">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="text-slate-600">&gt;</span> {h.cmd}
              </div>
              <pre
                className={`pl-4 whitespace-pre-wrap ${
                  h.ok ? 'text-slate-300' : 'text-rose-400'
                }`}
              >
                {h.res}
              </pre>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input prompt */}
        <form
          onSubmit={handleExecute}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-black text-sm">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type command (e.g. 'cash +500000', 'days 100', 'god', 'help')..."
            className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-600 text-xs font-mono focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
};
