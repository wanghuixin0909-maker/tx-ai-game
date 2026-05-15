import type { Npc } from "../../types/game";

interface NpcAvatarProps {
  npc: Npc;
  size?: "sm" | "md" | "lg";
  showRing?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 44, inner: 36, stroke: 1.5 },
  md: { container: 56, inner: 46, stroke: 2 },
  lg: { container: 72, inner: 60, stroke: 2.5 },
};

const statusDotColors: Record<Npc["status"], string> = {
  online: "#22c55e",
  guarded: "#eab308",
  suspect: "#ef4444",
  offline: "#6b7280",
};

function getAvatarStyle(npcId: string): {
  bgGradient: string;
  accentColor: string;
  pattern: "grid" | "circuit" | "scan" | "hex";
} {
  const styles: Record<string, ReturnType<typeof getAvatarStyle>> = {
    nova: {
      bgGradient: "linear-gradient(135deg, #0a1628 0%, #0f2744 100%)",
      accentColor: "#8eb2c1",
      pattern: "circuit",
    },
    shade: {
      bgGradient: "linear-gradient(135deg, #1a0f28 0%, #2d1a3d 100%)",
      accentColor: "#9c95b5",
      pattern: "grid",
    },
    echo: {
      bgGradient: "linear-gradient(135deg, #0f1a1a 0%, #1a2d2d 100%)",
      accentColor: "#b9a8c0",
      pattern: "scan",
    },
    iris: {
      bgGradient: "linear-gradient(135deg, #1a1408 0%, #2d2510 100%)",
      accentColor: "#ffd15e",
      pattern: "hex",
    },
  };
  return styles[npcId] ?? styles.nova;
}

function AvatarCircuitPattern({ color, stroke }: { color: string; stroke: number }) {
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.4">
      <path d="M20 10 L30 10 L30 20" />
      <path d="M30 30 L40 30 L40 20" />
      <path d="M10 30 L10 20 L20 20" />
      <circle cx="30" cy="10" r="2" fill={color} />
      <circle cx="30" cy="30" r="2" fill={color} />
      <circle cx="10" cy="30" r="2" fill={color} />
      <line x1="10" y1="40" x2="20" y2="40" />
      <line x1="40" y1="40" x2="50" y2="40" />
    </g>
  );
}

function AvatarGridPattern({ color, stroke }: { color: string; stroke: number }) {
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.35">
      <rect x="12" y="12" width="36" height="36" rx="4" />
      <line x1="12" y1="24" x2="48" y2="24" />
      <line x1="12" y1="36" x2="48" y2="36" />
      <line x1="24" y1="12" x2="24" y2="48" />
      <line x1="36" y1="12" x2="36" y2="48" />
      <circle cx="30" cy="30" r="8" fill={color} opacity="0.2" />
    </g>
  );
}

function AvatarScanPattern({ color, stroke }: { color: string; stroke: number }) {
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.4">
      <line x1="10" y1="20" x2="50" y2="20" />
      <line x1="10" y1="30" x2="50" y2="30" />
      <line x1="10" y1="40" x2="50" y2="40" />
      <rect x="20" y="15" width="20" height="30" rx="2" strokeDasharray="3 2" />
      <circle cx="30" cy="30" r="6" />
    </g>
  );
}

function AvatarHexPattern({ color, stroke }: { color: string; stroke: number }) {
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.4">
      <polygon points="30,8 48,19 48,41 30,52 12,41 12,19" />
      <polygon points="30,18 40,24 40,36 30,42 20,36 20,24" />
      <circle cx="30" cy="30" r="4" fill={color} opacity="0.3" />
    </g>
  );
}

function AvatarFace({ color, size }: { color: string; size: number }) {
  const center = size / 2;
  const faceSize = size * 0.45;

  return (
    <g>
      <circle cx={center} cy={center} r={faceSize} fill={`${color}20`} stroke={color} strokeWidth="1.5" />
      <ellipse cx={center - faceSize * 0.2} cy={center - faceSize * 0.1} rx={faceSize * 0.12} ry={faceSize * 0.08} fill={color} opacity="0.9" />
      <ellipse cx={center + faceSize * 0.2} cy={center - faceSize * 0.1} rx={faceSize * 0.12} ry={faceSize * 0.08} fill={color} opacity="0.9" />
      <path d={`M ${center - faceSize * 0.15} ${center + faceSize * 0.25} Q ${center} ${center + faceSize * 0.4} ${center + faceSize * 0.15} ${center + faceSize * 0.25}`} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function NpcAvatar({ npc, size = "md", showRing = false, className = "" }: NpcAvatarProps) {
  const { container, inner, stroke } = sizeMap[size];
  const style = getAvatarStyle(npc.id);
  const StatusPattern = {
    circuit: AvatarCircuitPattern,
    grid: AvatarGridPattern,
    scan: AvatarScanPattern,
    hex: AvatarHexPattern,
  }[style.pattern];

  return (
    <div className={`relative inline-flex ${className}`}>
      <svg
        width={container}
        height={container}
        viewBox={`0 0 ${container} ${container}`}
        className="drop-shadow-lg"
      >
        <defs>
          <clipPath id={`clip-${npc.id}-${size}`}>
            <circle cx={container / 2} cy={container / 2} r={inner / 2} />
          </clipPath>
          <linearGradient id={`grad-${npc.id}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.bgGradient.split(" ")[2]} />
            <stop offset="100%" stopColor={style.bgGradient.split(" ")[4]} />
          </linearGradient>
          <filter id={`glow-${npc.id}-${size}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={container / 2}
          cy={container / 2}
          r={inner / 2 + 4}
          fill="none"
          stroke={style.accentColor}
          strokeWidth="1"
          opacity="0.3"
        />

        {showRing && (
          <circle
            cx={container / 2}
            cy={container / 2}
            r={inner / 2 + 2}
            fill="none"
            stroke={style.accentColor}
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-spin"
            style={{ animationDuration: "8s", transformOrigin: "center" }}
          />
        )}

        <circle
          cx={container / 2}
          cy={container / 2}
          r={inner / 2}
          fill={`url(#grad-${npc.id}-${size})`}
          stroke={style.accentColor}
          strokeWidth={stroke}
          filter={`url(#glow-${npc.id}-${size})`}
        />

        <g clipPath={`url(#clip-${npc.id}-${size})`}>
          <StatusPattern color={style.accentColor} stroke={stroke} />
          <AvatarFace color={style.accentColor} size={inner} />
        </g>
      </svg>
    </div>
  );
}

interface NpcIdentityCardProps {
  npc: Npc;
  compact?: boolean;
}

const dangerLevelMap: Record<string, { level: string; color: string }> = {
  nova: { level: "MEDIUM", color: "#eab308" },
  shade: { level: "HIGH", color: "#f97316" },
  echo: { level: "LOW", color: "#22c55e" },
  iris: { level: "EXTREME", color: "#ef4444" },
};

export function NpcIdentityCard({ npc, compact = false }: NpcIdentityCardProps) {
  const danger = dangerLevelMap[npc.id] ?? { level: "UNKNOWN", color: "#6b7280" };
  const statusColor = statusDotColors[npc.status];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <NpcAvatar npc={npc} size="sm" />
        <div>
          <p className="text-sm font-semibold text-slate-50">{npc.name}</p>
          <p className="text-xs text-[#AEB8C5]">{npc.role}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: `${npc.accentColor}40`,
        background: `linear-gradient(135deg, ${npc.accentColor}08, rgba(255,255,255,0.02))`,
      }}
    >
      <div className="flex items-start gap-4">
        <NpcAvatar npc={npc} size="lg" showRing />

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
            <p
              className="text-lg font-bold tracking-wide"
              style={{ color: npc.accentColor }}
            >
              {npc.name}
            </p>
          </div>

          <p className="text-sm text-[#AEB8C5]">{npc.role}</p>

          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em]"
              style={{
                borderColor: `${danger.color}60`,
                color: danger.color,
                background: `${danger.color}15`,
              }}
            >
              危险 {danger.level}
            </span>

            <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-[#D7DEE7]">
              信任 T{npc.trustLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${npc.trustLevel}%`,
              background: `linear-gradient(90deg, ${npc.accentColor}, ${npc.accentColor}aa)`,
            }}
          />
        </div>
        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
          Trust {npc.trustLevel}%
        </span>
      </div>
    </div>
  );
}
