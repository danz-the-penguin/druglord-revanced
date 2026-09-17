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

  // Calculate actual geometric path length so stroke-dasharray / stroke-dashoffset draws smoothly
  const approxPathLength = Math.ceil(
    points.reduce((len, pt, idx) => {
      if (idx === 0) return 0;
      const prev = points[idx - 1];
      return len + Math.hypot(pt.x - prev.x, pt.y - prev.y);
    }, 0)
  ) + 5;

  const firstVal = data[0];
  const lastVal = data[data.length - 1];
  const isUp = lastVal >= firstVal;
  const deltaPct = ((lastVal - firstVal) / (firstVal || 1)) * 100;
  const strokeColor = color || (isUp ? '#10b981' : '#f43f5e');

  const tooltipText = `14D Trend: $${firstVal.toLocaleString()} → $${lastVal.toLocaleString()} (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%)`;
  const dataKey = `${firstVal}-${lastVal}-${data.length}-${approxPathLength}`;

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
          key={`area-${dataKey}`}
          d={areaD}
          fill={`url(#${gradientId})`}
          className="transition-opacity duration-300 opacity-70 group-hover/sparkline:opacity-100"
        >
          {animated && (
            <animate
              attributeName="opacity"
              from="0"
              to="0.7"
              dur="1.2s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0; 1"
              keySplines="0.25 0.1 0.25 1"
            />
          )}
        </path>
      )}

      {/* Self-drawing Trendline via stroke-dasharray & stroke-dashoffset */}
      <path
        key={`path-${dataKey}`}
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={approxPathLength}
        strokeDashoffset={animated ? approxPathLength : 0}
        className="opacity-95"
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            from={approxPathLength}
            to="0"
            dur="1.2s"
            fill="freeze"
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.25 0.1 0.25 1"
          />
        )}
      </path>

      {/* Current day endpoint beacon (pops in as drawing reaches the finish) */}
      <g key={`dot-${dataKey}`} opacity={animated ? 0 : 1}>
        {animated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin="0.9s"
            dur="0.3s"
            fill="freeze"
          />
        )}
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
      </g>
    </svg>
  );
};

