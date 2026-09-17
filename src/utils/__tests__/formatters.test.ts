import { describe, it, expect } from 'vitest';
import { formatCommodityTitle, sanitizeLogMessage } from '../formatters';

describe('formatters', () => {
  describe('formatCommodityTitle', () => {
    it('returns empty string for empty input', () => {
      expect(formatCommodityTitle('')).toBe('');
    });

    it('resolves standard DRUG_MAP keys to their official name', () => {
      expect(formatCommodityTitle('special_k')).toBe('Special K');
      expect(formatCommodityTitle('super_soldier_serum')).toBe('Compound-Z');
      expect(formatCommodityTitle('weed')).toBe('Weed');
      expect(formatCommodityTitle('cocaine')).toBe('Cocaine');
      expect(formatCommodityTitle('speed')).toBe('Speed');
      expect(formatCommodityTitle('heroin')).toBe('Heroin');
    });

    it('preserves uppercase for chemical acronyms', () => {
      expect(formatCommodityTitle('lsd')).toBe('LSD');
      expect(formatCommodityTitle('pcp')).toBe('PCP');
      expect(formatCommodityTitle('dmt')).toBe('DMT');
      expect(formatCommodityTitle('mda')).toBe('MDA');
    });

    it('falls back to title case for unknown snake_case and kebab-case keys', () => {
      expect(formatCommodityTitle('underworld_black_ice')).toBe('Underworld Black Ice');
      expect(formatCommodityTitle('synthetic-stimulant')).toBe('Synthetic Stimulant');
    });
  });

  describe('sanitizeLogMessage', () => {
    it('returns empty string for falsy input', () => {
      expect(sanitizeLogMessage('')).toBe('');
    });

    it('sanitizes drug identifier in transaction log messages', () => {
      expect(sanitizeLogMessage('Sold 76x special_k for $152,000 (+ $42,000 profit).')).toBe(
        'Sold 76x Special K for $152,000 (+ $42,000 profit).'
      );
      expect(sanitizeLogMessage('Bought 12x super_soldier_serum for $360,000 ($30,000/unit).')).toBe(
        'Bought 12x Compound-Z for $360,000 ($30,000/unit).'
      );
      expect(sanitizeLogMessage('Dumped 5x lsd into the sewer to free up space.')).toBe(
        'Dumped 5x LSD into the sewer to free up space.'
      );
    });

    it('leaves non-matching log messages untouched', () => {
      const normalMsg = 'Flight to Bogota completed. Bribed customs agent $1,500.';
      expect(sanitizeLogMessage(normalMsg)).toBe(normalMsg);
    });
  });
});
