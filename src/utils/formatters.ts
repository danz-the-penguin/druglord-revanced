import { DRUG_MAP } from '../engine/constants';

const KNOWN_ACRONYMS = new Set(['pcp', 'lsd', 'dmt', 'mda', 'dea', 'swat', 'cpa', 'fbo', 'hp', 'pnl', 'fincen', 'mdma']);

/**
 * Resolves any commodity identifier (e.g. 'special_k', 'super_soldier_serum', 'lsd')
 * into its formal display name (e.g. 'Special K', 'Compound-Z', 'LSD').
 */
export function formatCommodityTitle(rawKey: string): string {
  if (!rawKey) return '';
  const trimmed = rawKey.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct match in DRUG_MAP
  const match = DRUG_MAP.get(lower);
  if (match?.name) return match.name;

  // 2. Acronym check
  if (KNOWN_ACRONYMS.has(lower)) return lower.toUpperCase();

  // 3. Fallback: split by underscore/hyphen and Title-Case words
  return trimmed
    .split(/[_-]/)
    .map((word) => {
      const wLower = word.toLowerCase();
      if (KNOWN_ACRONYMS.has(wLower)) return wLower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Sanitizes legacy or existing log message strings so any raw snake_case commodity
 * keys (e.g. "Sold 76x special_k", "Bought 10x super_soldier_serum") render with
 * their proper formatted display name.
 */
export function sanitizeLogMessage(message: string): string {
  if (!message) return '';

  // Matches pattern: (Sold|Bought|Dumped|Stashed|Withdrew) <qty>x <drug_key>
  return message.replace(
    /\b(Sold|Bought|Dumped|Stashed|Withdrew|Trade)\s+(\d+x?\s+)([a-zA-Z0-9_]+)\b/gi,
    (_match, verb, qty, key) => {
      const formatted = formatCommodityTitle(key);
      return `${verb} ${qty}${formatted}`;
    }
  );
}
