import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  showArea?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 26,
  color,
  strokeWidth = 1.75,
  animated = true,
  showArea = true,
}) => {
  const rawId = React.useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const gradientId = `spark-grad-${safeId}`;

  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-[10px] text-slate-600 font-mono"
      >
        --
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // 4px padding left/right so beads don't clip
  const padX = 4;
  const padY = 3;
  const drawWidth = width - padX * 2;
  const drawHeight = height - padY * 2;

  const points = data.map((val, i) => {
    const x = padX + (i / (data.length - 1)) * drawWidth;
    const y = padY + drawHeight - ((val - min) / range) * drawHeight;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  const firstPt = points[0];
  const lastPt = points[points.length - 1];

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${lastPt.x},${height} L ${firstPt.x},${height} Z`;

  const firstVal = data[0];
  const lastVal = data[data.length - 1];
  const isUp = lastVal >= firstVal;
  const deltaPct = ((lastVal - firstVal) / (firstVal || 1)) * 100;
  const strokeColor = color || (isUp ? '#10b981' : '#f43f5e');
  const scanColor = isUp ? '#6ee7b7' : '#fda4af';

  const tooltipText = `14D Trend: $${firstVal.toLocaleString()} → $${lastVal.toLocaleString()} (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%)`;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible inline-block shrink-0 select-none group/sparkline"
    >
      <title>{tooltipText}</title>
      <defs>
        {/* Subtle glow underneath the curve */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Area gradient under trendline */}
      {showArea && (
        <path
          d={areaD}
          fill={`url(#${gradientId})`}
          className="transition-opacity duration-300 opacity-70 group-hover/sparkline:opacity-100"
        />
      )}

      {/* Base Trendline */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />

      {/* Animated Traveling Laser Beam Pulse */}
      {animated && (
        <path
          d={pathD}
          fill="none"
          stroke={scanColor}
          strokeWidth={strokeWidth + 0.6}
          strokeDasharray="14 42"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-95"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="56"
            to="-56"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* Animated Motion Comet Bead traversing 14-Day line */}
      {animated && (
        <g>
          {/* Glowing aura around tracer bead */}
          <circle r="4" fill={strokeColor} opacity="0.35">
            <animateMotion
              path={pathD}
              dur="2.8s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          {/* Core bright comet bead */}
          <circle r="2" fill="#ffffff">
            <animateMotion
              path={pathD}
              dur="2.8s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
      )}

      {/* Current day endpoint beacon (pulsing radar ping + core node) */}
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="4.5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        className="animate-ping opacity-60"
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="2.5"
        fill={strokeColor}
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="1"
        fill="#ffffff"
      />
    </svg>
  );
};

