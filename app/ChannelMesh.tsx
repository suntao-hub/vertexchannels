"use client";
// Abstract "one brand → many channels" mesh, for dark (navy) sections.
import { useId } from "react";

const orange = "#F97316";
const navy = "#0A2333";

const NODES: [number, number, number][] = [
  // x, y, kind: 0 dim · 1 bright · 2 orange accent
  [40, 220, 1], [150, 120, 0], [150, 320, 0],
  [280, 60, 0], [280, 220, 2], [280, 380, 0],
  [420, 130, 0], [420, 300, 0],
  [560, 55, 2], [560, 175, 0], [560, 300, 0], [560, 410, 0],
  [680, 115, 0], [680, 250, 0], [680, 370, 2],
];
const EDGES = [
  [0, 1], [0, 2], [1, 4], [2, 4], [1, 3], [4, 6], [4, 7], [3, 6],
  [6, 8], [6, 9], [7, 10], [7, 11], [9, 12], [10, 13], [11, 14], [9, 13], [8, 12],
];

export default function ChannelMesh({ opacity = 1 }: { opacity?: number }) {
  const glow = useId();
  const veil = useId();
  return (
    <svg viewBox="0 0 720 460" preserveAspectRatio="xMidYMid slice" aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}>
      <defs>
        <radialGradient id={glow} cx="72%" cy="24%" r="55%">
          <stop offset="0%" stopColor={orange} stopOpacity="0.16" />
          <stop offset="100%" stopColor={orange} stopOpacity="0" />
        </radialGradient>
        {/* keeps nodes/lines from colliding with centered hero text */}
        <radialGradient id={veil} cx="50%" cy="47%" r="62%">
          <stop offset="0%" stopColor={navy} stopOpacity="0.78" />
          <stop offset="52%" stopColor={navy} stopOpacity="0.34" />
          <stop offset="100%" stopColor={navy} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="460" fill={`url(#${glow})`} />
      {EDGES.map(([a, b], i) => (
        <line key={i}
          x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]}
          stroke="#fff" strokeOpacity="0.09" strokeWidth="1" />
      ))}
      {NODES.map(([x, y, kind], i) => (
        <circle key={i} cx={x} cy={y}
          r={kind === 2 ? 5 : kind === 1 ? 4 : 3}
          fill={kind === 2 ? orange : "#fff"}
          fillOpacity={kind === 2 ? 0.85 : kind === 1 ? 0.35 : 0.18} />
      ))}
      <rect width="720" height="460" fill={`url(#${veil})`} />
    </svg>
  );
}
