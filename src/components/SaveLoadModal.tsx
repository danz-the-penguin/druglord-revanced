import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  SaveSlotId,
  AVAILABLE_SAVE_SLOTS,
  listLocalSaveSlots,
  SaveSlotMetadata,
  exportSaveToSyndicateCode,
  parseAndValidateSave,
  downloadSaveJsonFile,
} from '../engine/persistence';
import {
  Save,
  Download,
  Upload,
  Copy,
  Check,
  Trash2,
  X,
  FileJson,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  FolderOpen,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';

export const SaveLoadModal: React.FC = () => {
  const {
    isSaveModalOpen,
    toggleSaveModal,
    saveGame,
    loadGame,
    deleteSave,
    exportCurrentSave,
    clearAllSaves,
    player,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'slots' | 'export' | 'import'>('slots');
  const [slotsData, setSlotsData] = useState<(SaveSlotMetadata | null)[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>('');
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  // Reload slots metadata whenever modal opens or saves change
  const refreshSlots = () => {
    setSlotsData(listLocalSaveSlots());
  };

  useEffect(() => {
    if (isSaveModalOpen) {
      refreshSlots();
      setFeedback(null);
    }
  }, [isSaveModalOpen]);

  // Live validator for pasted import code or JSON
  useEffect(() => {
    if (!importInput.trim()) {
      setImportPreview(null);
      setImportError(null);
      return;
    }
    const res = parseAndValidateSave(importInput);
    if (res.success) {
      setImportPreview(res.data);
      setImportError(null);
    } else {
      setImportPreview(null);
      setImportError(res.error);
    }
  }, [importInput]);

  if (!isSaveModalOpen) return null;

  const handleSaveToSlot = (slotId: SaveSlotId) => {
    setFeedback(null);
    const res = saveGame(slotId);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    refreshSlots();
  };

  const handleLoadSlot = (slotId: SaveSlotId) => {
    setFeedback(null);
    const saveFile = parseAndValidateSave(window.localStorage.getItem(`druglord2_save_${slotId}`) || '');
    if (saveFile.success) {
      const res = loadGame(saveFile.data);
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
      if (res.success) {
        setTimeout(() => toggleSaveModal(false), 800);
      }
    } else {
      setFeedback({ type: 'error', message: 'Failed to read slot from storage.' });
    }
  };

  const handleDeleteSlot = (slotId: SaveSlotId) => {
    if (window.confirm(`Are you sure you want to delete ${slotId.toUpperCase()}?`)) {
      deleteSave(slotId);
      refreshSlots();
      setFeedback({ type: 'success', message: `Deleted ${slotId} save data.` });
    }
  };

  const handleDownloadFile = (slotId?: SaveSlotId) => {
    let saveFile;
    if (slotId) {
      const raw = window.localStorage.getItem(`druglord2_save_${slotId}`);
      const res = parseAndValidateSave(raw || '');
      if (res.success) saveFile = res.data;
    }
    if (!saveFile) {
      saveFile = exportCurrentSave(slotId || 'autosave');
    }
    downloadSaveJsonFile(saveFile);
    setFeedback({ type: 'success', message: 'Save file (.json) downloaded!' });
  };

  const currentSave = exportCurrentSave('autosave');
  const syndicateCode = exportSaveToSyndicateCode(currentSave);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syndicateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setFeedback({ type: 'success', message: 'Syndicate Code copied to clipboard!' });
  };

  const handleFileDropOrSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportInput(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!importPreview) return;
    const res = loadGame(importPreview);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      setTimeout(() => toggleSaveModal(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] font-mono">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-700 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>Underworld Data Vault</span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                  PERSISTENCE v2.1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage local slots, export portable JSON backups, or load Syndicate Codes.
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleSaveModal(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-bold uppercase">
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3 px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'slots'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Save Slots (Local)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export & Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-400 bg-amber-950/30 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import & Restore</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`m-4 p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/80 border-rose-700 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: SLOTS */}
          {activeTab === 'slots' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Four isolated browser storage slots. Auto-save triggers after every key transaction.</span>
                <button
                  onClick={refreshSlots}
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_SAVE_SLOTS.map((slot, idx) => {
                  const meta = slotsData[idx];
                  const isPopulated = !!meta;

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        slot.isAuto
                          ? 'border-cyan-800/80 bg-cyan-950/20'
                          : isPopulated
                          ? 'border-slate-700 bg-slate-950/60'
                          : 'border-slate-800 bg-slate-950/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              slot.isAuto
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-600/50'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {slot.label}
                          </span>
                          {isPopulated && (
                            <span className="text-[10px] text-slate-500">
                              {new Date(meta.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                              {new Date(meta.savedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {isPopulated ? (
                          <div className="mt-3 space-y-1.5">
                            <h4 className="text-sm font-black text-slate-100 truncate">{meta.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1 text-cyan-300">
                                <Calendar className="w-3 h-3" /> Day {meta.playerDay}/{meta.isEndless ? '∞' : meta.maxDays}
                              </span>
                              {meta.isEndless && (
                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  ENDLESS
                                </span>
                              )}
                              {(meta.daysInsolvent ?? 0) > 0 && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 animate-pulse">
                                  DEMOTION RISK ({meta.daysInsolvent}/3)
                                </span>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1 text-emerald-400">
                                <MapPin className="w-3 h-3" /> {meta.currentCityName}
                              </span>
                              <span>•</span>
                              <span className="text-amber-400 font-bold">{meta.rankName}</span>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase block">Cash & Bank</span>
                                <span className="text-emerald-400 font-bold">
                                  ${(meta.cash + meta.bank).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase block">Net Worth</span>
                                <span className="text-cyan-400 font-black">
                                  ${meta.netWorth.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="my-6 text-center text-xs text-slate-600 italic">
                            Empty Slot — Ready for snapshot
                          </div>
                        )}
                      </div>

                      {/* Slot Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        {isPopulated ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleLoadSlot(slot.id)}
                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-lg text-xs transition-all"
                              >
                                Load Run
                              </button>
                              {!slot.isAuto && (
                                <button
                                  onClick={() => handleSaveToSlot(slot.id)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                  title="Overwrite with current state"
                                >
                                  Overwrite
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownloadFile(slot.id)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded-lg transition-colors"
                                title="Download JSON file for this slot"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {!slot.isAuto && (
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="p-1.5 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                                  title="Clear slot"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSaveToSlot(slot.id)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Save Current Run Here</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Current Empire Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Active Session</div>
                  <div className="text-base font-black text-slate-100">
                    Day {player.currentDay} • ${player.cash.toLocaleString()} Liquid Cash
                  </div>
                  <div className="text-xs text-emerald-400 mt-0.5">
                    Net Worth: ${(player.cash + player.bank - player.debt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadFile()}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .JSON File</span>
                </button>
              </div>

              {/* Syndicate Clipboard String */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Syndicate Clipboard Code (Base64 URL Safe)</span>
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={syndicateCode}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer selection:bg-cyan-900 selection:text-cyan-100"
                />
                <p className="text-[11px] text-slate-500">
                  Click to select all and copy. You can paste this code on any device or browser to restore your exact progress.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* File Dropzone */}
              <div className="p-6 border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl bg-slate-950/40 text-center transition-colors">
                <FileJson className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-200">Drag & drop save JSON file here</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3">or browse from your local device</p>
                <label className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer border border-slate-600 transition-colors">
                  <span>Browse .JSON Save</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileDropOrSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste Syndicate Code or JSON */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Or Paste Syndicate Code / Raw JSON Payload:
                </label>
                <textarea
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Paste DL2-... syndicate string or JSON here..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Live Preview Card */}
              {importPreview && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Verified Save File
                    </span>
                    <span>
                      Day {importPreview.metadata.playerDay}/{importPreview.metadata.isEndless ? '∞' : importPreview.metadata.maxDays} • {importPreview.metadata.rankName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Location</span>
                      <span className="font-bold text-slate-200">{importPreview.metadata.currentCityName}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Cash</span>
                      <span className="font-bold text-emerald-400">${importPreview.metadata.cash.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Debt</span>
                      <span className="font-bold text-rose-400">${importPreview.metadata.debt.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Confirm Overwrite & Load Empire</span>
                  </button>
                </div>
              )}

              {importError && (
                <div className="p-3.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (window.confirm('WARNING: This will purge all 4 local save slots and auto-saves from this browser. Are you sure?')) {
                clearAllSaves();
                refreshSlots();
                setFeedback({ type: 'success', message: 'All local save slots have been cleared.' });
              }
            }}
            className="text-rose-500 hover:text-rose-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <Trash2 className="w-3 h-3" /> Purge All Local Saves
          </button>

          <button
            onClick={() => toggleSaveModal(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
