import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatFn?: (val: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  durationMs = 450,
  prefix = '',
  suffix = '',
  className = '',
  formatFn,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const startValueRef = useRef<number>(value);
  const targetValueRef = useRef<number>(value);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === targetValueRef.current) return;

    startValueRef.current = displayValue;
    targetValueRef.current = value;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Ease-out cubic formula
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(
        startValueRef.current + (targetValueRef.current - startValueRef.current) * easeProgress
      );

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValueRef.current);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, durationMs]);

  const formatted = formatFn ? formatFn(displayValue) : displayValue.toLocaleString();

  return (
    <span className={`inline-block tabular-nums transition-transform ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
