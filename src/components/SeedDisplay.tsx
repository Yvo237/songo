import { useMemo } from 'react';

const LOGICAL_SIZE = 70;

interface Props {
  count: number;
}

const BEAD_COLORS = [
  { base: '#C0392B', hi: '#E74C3C', lo: '#922B21' },
  { base: '#2E86C1', hi: '#5DADE2', lo: '#1B4F72' },
  { base: '#27AE60', hi: '#52BE80', lo: '#1E8449' },
  { base: '#F39C12', hi: '#F5B041', lo: '#B7950B' },
  { base: '#8E44AD', hi: '#AF7AC5', lo: '#6C3483' },
  { base: '#D35400', hi: '#E67E22', lo: '#A04000' },
  { base: '#16A085', hi: '#48C9B0', lo: '#0E6655' },
  { base: '#2C3E50', hi: '#5D6D7E', lo: '#1B2631' },
];

function makeSeeds(count: number) {
  const size = LOGICAL_SIZE;
  const out: { x: number; y: number; r: number; colorIdx: number; rot: number }[] = [];
  const cx = size / 2;
  const cy = size / 2;
  const spread = size * 0.34;
  const n = Math.min(count, 40);
  const beadR = n > 20 ? 3 : n > 12 ? 3.8 : n > 6 ? 4.5 : 5;

  for (let i = 0; i < n; i++) {
    const angle = i * 2.399963;
    const dist = spread * Math.sqrt((i + 0.5) / Math.max(n, 1)) * 0.92;
    out.push({
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      r: beadR + ((i * 3) % 3 - 1) * 0.3,
      colorIdx: (i * 3 + i) % BEAD_COLORS.length,
      rot: (i * 67) % 360,
    });
  }
  return out;
}

export default function SeedDisplay({ count }: Props) {
  const seeds = useMemo(() => makeSeeds(count), [count]);
  if (count === 0) return null;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${LOGICAL_SIZE} ${LOGICAL_SIZE}`}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        {BEAD_COLORS.map((c, i) => (
          <radialGradient key={i} id={`bead-${i}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={c.hi} />
            <stop offset="50%" stopColor={c.base} />
            <stop offset="100%" stopColor={c.lo} />
          </radialGradient>
        ))}
      </defs>
      {seeds.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={`url(#bead-${s.colorIdx})`}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={0.4}
        />
      ))}
    </svg>
  );
}
