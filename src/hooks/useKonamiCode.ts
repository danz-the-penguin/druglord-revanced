import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

export function useKonamiCode() {
  const [index, setIndex] = useState(0);
  const applyKonamiCode = useGameStore((s) => s.applyKonamiCode);
  const toggleTerminal = useGameStore((s) => s.toggleTerminal);
  const checkMemoryUpdates = useGameStore((s) => s.checkMemoryUpdates);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  useEffect(() => {
    // Polling interval to check if Cheat Engine changed values directly in memory!
    const memoryInterval = setInterval(() => {
      checkMemoryUpdates();
    }, 250);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle terminal on `~` or Backquote or F12 / Ctrl+Shift+D
      if (e.code === 'Backquote' || e.key === '`' || e.key === '~' || (e.ctrlKey && e.shiftKey && e.code === 'KeyD')) {
        e.preventDefault();
        toggleTerminal();
        return;
      }

      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // 'M' toggles Tactical Smuggling Map
      if (e.code === 'KeyM' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const currentTab = useGameStore.getState().activeTab;
        setActiveTab(currentTab === 'travel' ? 'market' : 'travel');
        return;
      }

      // Check Konami Code
      if (e.code === KONAMI_CODE[index]) {
        const nextIndex = index + 1;
        if (nextIndex === KONAMI_CODE.length) {
          applyKonamiCode();
          setIndex(0);
        } else {
          setIndex(nextIndex);
        }
      } else {
        setIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(memoryInterval);
    };
  }, [index, applyKonamiCode, toggleTerminal, checkMemoryUpdates]);
}
