/**
 * Drug Lord: ReVanced — Haptic Feedback Engine
 * Zero-dependency native Web Vibration API integration.
 * Provides subtle tactile feedback on mobile devices (iOS Safari with vibration support, Android Chrome, PWAs).
 */

export type HapticType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Triggers a device vibration pattern if supported by the browser/hardware.
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!navigator.vibrate) return;

  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate([35, 20, 35]);
        break;
      case 'success':
        navigator.vibrate([15, 35, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 40, 30, 40]);
        break;
      case 'error':
        navigator.vibrate([50, 40, 50, 40, 70]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Non-fatal if device denies permission or lacks vibration hardware
  }
}
