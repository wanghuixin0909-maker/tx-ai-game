import type { Npc } from "../../types/game";

interface NpcAvatarProps {
  npc: Npc;
  size?: "sm" | "md" | "lg" | "xl";
  showRing?: boolean;
  showGlow?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 48, inner: 38, stroke: 1.5, fontSize: "text-[0.65rem]" },
  md: { container: 56, inner: 46, stroke: 2, fontSize: "text-[0.75rem]" },
  lg: { container: 72, inner: 60, stroke: 2.5, fontSize: "text-[0.9rem]" },
  xl: { container: 96, inner: 82, stroke: 3, fontSize: "text-[1.1rem]" },
};

const statusDotColors: Record<Npc["status"], string> = {
  online: "#22c55e",
  guarded: "#eab308",
  suspect: "#ef4444",
  offline: "#6b7280",
};

interface NpcStyle {
  bgGradient: string;
  accentColor: string;
  pattern: "circuit" | "grid" | "scan" | "hex";
  glitchColor: string;
  frameStyle: "tech" | "cyber" | "droid" | "elite";
}

function getNpcStyle(npcId: string): NpcStyle {
  const styles: Record<string, NpcStyle> = {
    nova: {
      bgGradient: "linear-gradient(135deg, #0a1628 0%, #0f2744 100%)",
      accentColor: "#5ef2ff",
      pattern: "circuit",
      glitchColor: "#00d4ff",
      frameStyle: "tech",
    },
    shade: {
      bgGradient: "linear-gradient(135deg, #1a0f28 0%, #2d1a3d 100%)",
      accentColor: "#ff4fd8",
      pattern: "grid",
      glitchColor: "#ff00ff",
      frameStyle: "cyber",
    },
    echo: {
      bgGradient: "linear-gradient(135deg, #0f1a1a 0%, #1a2d2d 100%)",
      accentColor: "#93ff7a",
      pattern: "scan",
      glitchColor: "#00ff88",
      frameStyle: "droid",
    },
    iris: {
      bgGradient: "linear-gradient(135deg, #1a1408 0%, #2d2510 100%)",
      accentColor: "#ffd15e",
      pattern: "hex",
      glitchColor: "#ffaa00",
      frameStyle: "elite",
    },
  };
  return styles[npcId] ?? styles.nova;
}

// 电路板图案 - Nova
function CircuitPattern({ color, stroke, size }: { color: string; stroke: number; size: number }) {
  const s = size * 0.8;
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.5">
      <rect x={size * 0.1} y={size * 0.1} width={s} height={s} rx="4" />
      <line x1={size * 0.1} y1={size * 0.3} x2={size * 0.9} y2={size * 0.3} />
      <line x1={size * 0.3} y1={size * 0.1} x2={size * 0.3} y2={size * 0.9} />
      <line x1={size * 0.3} y1={size * 0.5} x2={size * 0.7} y2={size * 0.5} />
      <line x1={size * 0.5} y1={size * 0.3} x2={size * 0.5} y2={size * 0.9} />
      <circle cx={size * 0.3} cy={size * 0.3} r={size * 0.06} fill={color} opacity="0.8" />
      <circle cx={size * 0.7} cy={size * 0.5} r={size * 0.05} fill={color} opacity="0.6" />
      <circle cx={size * 0.3} cy={size * 0.7} r={size * 0.04} fill={color} opacity="0.4" />
      <path d={`M ${size * 0.7} ${size * 0.3} L ${size * 0.85} ${size * 0.15}`} strokeDasharray="2 2" />
      <path d={`M ${size * 0.5} ${size * 0.7} L ${size * 0.7} ${size * 0.85}`} strokeDasharray="2 2" />
    </g>
  );
}

// 网格图案 - Shade
function GridPattern({ color, stroke, size }: { color: string; stroke: number; size: number }) {
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.4">
      <rect x={size * 0.1} y={size * 0.1} width={size * 0.8} height={size * 0.8} rx="6" />
      <rect x={size * 0.2} y={size * 0.2} width={size * 0.6} height={size * 0.6} rx="4" />
      <line x1={size * 0.1} y1={size * 0.5} x2={size * 0.9} y2={size * 0.5} strokeDasharray="4 3" />
      <line x1={size * 0.5} y1={size * 0.1} x2={size * 0.5} y2={size * 0.9} strokeDasharray="4 3" />
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.15} fill={color} opacity="0.2" />
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.08} fill={color} opacity="0.5" />
      <circle cx={size * 0.25} cy={size * 0.25} r={size * 0.04} fill={color} opacity="0.6" />
      <circle cx={size * 0.75} cy={size * 0.75} r={size * 0.04} fill={color} opacity="0.6" />
    </g>
  );
}

// 扫描图案 - Echo
function ScanPattern({ color, stroke, size }: { color: string; stroke: number; size: number }) {
  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.5">
      <rect x={size * 0.15} y={size * 0.15} width={size * 0.7} height={size * 0.7} rx="3" strokeDasharray="6 3" />
      <line x1={size * 0.15} y1={size * 0.35} x2={size * 0.85} y2={size * 0.35} />
      <line x1={size * 0.15} y1={size * 0.65} x2={size * 0.85} y2={size * 0.65} />
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.12} />
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.05} fill={color} />
      <path d={`M ${size * 0.3} ${size * 0.15} L ${size * 0.3} ${size * 0.08}`} strokeDasharray="2 2" />
      <path d={`M ${size * 0.7} ${size * 0.15} L ${size * 0.7} ${size * 0.08}`} strokeDasharray="2 2" />
      <path d={`M ${size * 0.3} ${size * 0.85} L ${size * 0.3} ${size * 0.92}`} strokeDasharray="2 2" />
      <path d={`M ${size * 0.7} ${size * 0.85} L ${size * 0.7} ${size * 0.92}`} strokeDasharray="2 2" />
    </g>
  );
}

// 六边形图案 - Iris
function HexPattern({ color, stroke, size }: { color: string; stroke: number; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  const points2 = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * 0.6 * Math.cos(angle)},${cy + r * 0.6 * Math.sin(angle)}`;
  }).join(" ");

  return (
    <g stroke={color} strokeWidth={stroke} fill="none" opacity="0.5">
      <polygon points={points} />
      <polygon points={points2} />
      <circle cx={cx} cy={cy} r={size * 0.12} fill={color} opacity="0.3" />
      <circle cx={cx} cy={cy} r={size * 0.06} fill={color} opacity="0.6" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy - r * 0.6} strokeDasharray="3 2" />
      <line x1={cx} y1={cy + r} x2={cx} y2={cy + r * 0.6} strokeDasharray="3 2" />
    </g>
  );
}

// 面部抽象 - 更具赛博朋克感
function AvatarFace({ color, size, frameStyle }: { color: string; size: number; frameStyle: string }) {
  const center = size / 2;
  const faceSize = size * 0.35;

  if (frameStyle === "droid") {
    // Echo - 机械风格
    return (
      <g>
        <circle cx={center} cy={center} r={faceSize} fill={`${color}15`} stroke={color} strokeWidth="2" />
        <rect x={center - faceSize * 0.6} y={center - faceSize * 0.2} width={faceSize * 1.2} height={faceSize * 0.4} rx="2" fill="none" stroke={color} strokeWidth="1.5" />
        <circle cx={center - faceSize * 0.3} cy={center} r={faceSize * 0.1} fill={color} />
        <circle cx={center + faceSize * 0.3} cy={center} r={faceSize * 0.1} fill={color} />
        <line x1={center - faceSize * 0.5} y1={center - faceSize * 0.5} x2={center - faceSize * 0.2} y2={center - faceSize * 0.3} stroke={color} strokeWidth="1.5" />
        <line x1={center + faceSize * 0.5} y1={center - faceSize * 0.5} x2={center + faceSize * 0.2} y2={center - faceSize * 0.3} stroke={color} strokeWidth="1.5" />
      </g>
    );
  }

  if (frameStyle === "elite") {
    // Iris - 精英风格
    return (
      <g>
        <path d={`M ${center - faceSize * 0.8} ${center} L ${center - faceSize * 0.3} ${center - faceSize * 0.5} L ${center + faceSize * 0.3} ${center - faceSize * 0.5} L ${center + faceSize * 0.8} ${center}`} fill={`${color}20`} stroke={color} strokeWidth="1.5" />
        <circle cx={center - faceSize * 0.25} cy={center - faceSize * 0.15} r={faceSize * 0.12} fill={color} />
        <circle cx={center + faceSize * 0.25} cy={center - faceSize * 0.15} r={faceSize * 0.12} fill={color} />
        <path d={`M ${center - faceSize * 0.4} ${center + faceSize * 0.2} Q ${center} ${center + faceSize * 0.4} ${center + faceSize * 0.4} ${center + faceSize * 0.2}`} stroke={color} strokeWidth="1.5" fill="none" />
      </g>
    );
  }

  // 默认 - tech/cyber 通用
  return (
    <g>
      <circle cx={center} cy={center} r={faceSize} fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      {/* 眼睛 - 赛博风格 */}
      <ellipse cx={center - faceSize * 0.25} cy={center - faceSize * 0.1} rx={faceSize * 0.15} ry={faceSize * 0.08} fill={color} />
      <ellipse cx={center + faceSize * 0.25} cy={center - faceSize * 0.1} rx={faceSize * 0.15} ry={faceSize * 0.08} fill={color} />
      {/* 嘴巴 - 水平线 */}
      <line x1={center - faceSize * 0.3} y1={center + faceSize * 0.25} x2={center + faceSize * 0.3} y2={center + faceSize * 0.25} stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* 装饰线 */}
      <line x1={center - faceSize * 0.7} y1={center - faceSize * 0.6} x2={center - faceSize * 0.4} y2={center - faceSize * 0.3} stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1={center + faceSize * 0.7} y1={center - faceSize * 0.6} x2={center + faceSize * 0.4} y2={center - faceSize * 0.3} stroke={color} strokeWidth="1" opacity="0.5" />
    </g>
  );
}

// 状态指示器组件
function StatusIndicator({ status, size }: { status: Npc["status"]; size: number }) {
  const color = statusDotColors[status];
  const dotSize = size * 0.12;
  const offset = size * 0.02;

  return (
    <g>
      <circle
        cx={size - offset}
        cy={offset}
        r={dotSize + 2}
        fill={`${color}30`}
      />
      <circle
        cx={size - offset}
        cy={offset}
        r={dotSize}
        fill={color}
        className={status !== "offline" ? "animate-pulse" : ""}
      />
    </g>
  );
}

export function NpcAvatar({ npc, size = "md", showRing = false, showGlow = true, className = "" }: NpcAvatarProps) {
  const { container, inner, stroke } = sizeMap[size];
  const npcStyle = getNpcStyle(npc.id);
  const StatusPattern = {
    circuit: CircuitPattern,
    grid: GridPattern,
    scan: ScanPattern,
    hex: HexPattern,
  }[npcStyle.pattern];

  return (
    <div className={`relative inline-flex ${className}`} style={{ filter: showGlow ? `drop-shadow(0 0 6px ${npcStyle.accentColor}40)` : undefined }}>
      <svg
        width={container}
        height={container}
        viewBox={`0 0 ${container} ${container}`}
      >
        <defs>
          <clipPath id={`clip-${npc.id}-${size}`}>
            <circle cx={container / 2} cy={container / 2} r={inner / 2} />
          </clipPath>
          <linearGradient id={`bg-${npc.id}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={npcStyle.bgGradient.split(" ")[2]} />
            <stop offset="100%" stopColor={npcStyle.bgGradient.split(" ")[4]} />
          </linearGradient>
          <filter id={`glow-${npc.id}-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glitch-${npc.id}-${size}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* 外圈光晕 */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={inner / 2 + 6}
          fill="none"
          stroke={npcStyle.accentColor}
          strokeWidth="0.5"
          opacity="0.2"
        />

        {/* 旋转外环 */}
        {showRing && (
          <>
            <circle
              cx={container / 2}
              cy={container / 2}
              r={inner / 2 + 3}
              fill="none"
              stroke={npcStyle.accentColor}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.6"
              className="animate-spin"
              style={{ animationDuration: "10s", transformOrigin: "center" }}
            />
            <circle
              cx={container / 2}
              cy={container / 2}
              r={inner / 2 + 3}
              fill="none"
              stroke={npcStyle.glitchColor}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.3"
              className="animate-spin"
              style={{ animationDuration: "8s", animationDirection: "reverse", transformOrigin: "center" }}
            />
          </>
        )}

        {/* 主头像背景 */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={inner / 2}
          fill={`url(#bg-${npc.id}-${size})`}
          stroke={npcStyle.accentColor}
          strokeWidth={stroke}
          filter={`url(#glow-${npc.id}-${size})`}
        />

        {/* 裁剪内容 */}
        <g clipPath={`url(#clip-${npc.id}-${size})`}>
          {/* 背景图案 */}
          <StatusPattern color={npcStyle.accentColor} stroke={stroke} size={inner} />
          {/* 面部 */}
          <AvatarFace color={npcStyle.accentColor} size={inner} frameStyle={npcStyle.frameStyle} />
        </g>

        {/* 状态指示器 */}
        <StatusIndicator status={npc.status} size={container} />

        {/* 顶部装饰 */}
        <g opacity="0.4">
          <line x1={container / 2 - 8} y1={4} x2={container / 2 - 3} y2={4} stroke={npcStyle.accentColor} strokeWidth="1" />
          <line x1={container / 2 + 3} y1={4} x2={container / 2 + 8} y2={4} stroke={npcStyle.accentColor} strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

// ============================================
// 身份卡组件
// ============================================

interface NpcIdentityCardProps {
  npc: Npc;
  compact?: boolean;
  showDangerLevel?: boolean;
}

const dangerLevelConfig: Record<string, { level: string; color: string; bgColor: string }> = {
  nova: { level: "MEDIUM", color: "#eab308", bgColor: "rgba(234,179,8,0.15)" },
  shade: { level: "HIGH", color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
  echo: { level: "LOW", color: "#22c55e", bgColor: "rgba(34,197,94,0.15)" },
  iris: { level: "EXTREME", color: "#ef4444", bgColor: "rgba(239,68,68,0.15)" },
};

export function NpcIdentityCard({ npc, compact = false, showDangerLevel = true }: NpcIdentityCardProps) {
  const danger = dangerLevelConfig[npc.id] ?? { level: "UNKNOWN", color: "#6b7280", bgColor: "rgba(107,114,128,0.15)" };
  const statusColor = statusDotColors[npc.status];

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <NpcAvatar npc={npc} size="sm" showGlow={false} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-50">{npc.name}</p>
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
          </div>
          <p className="text-xs text-[#AEB8C5]">{npc.role}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border"
      style={{
        borderColor: `${npc.accentColor}50`,
        background: `linear-gradient(135deg, ${npc.accentColor}08, rgba(255,255,255,0.02))`,
      }}
    >
      <div className="flex items-start gap-4 p-4">
        <NpcAvatar npc={npc} size="lg" showRing={true} showGlow={true} />

        <div className="flex-1 min-w-0 space-y-3">
          {/* 名称和状态 */}
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

          {/* 身份 */}
          <p className="text-sm text-[#AEB8C5]">{npc.role}</p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {showDangerLevel && (
              <span
                className="rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `${danger.color}60`,
                  color: danger.color,
                  background: danger.bgColor,
                }}
              >
                {danger.level}
              </span>
            )}

            <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-[#D7DEE7]">
              T{npc.trustLevel}
            </span>

            <span
              className="rounded-full border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em]"
              style={{
                borderColor: `${npc.accentColor}40`,
                color: npc.accentColor,
              }}
            >
              {npc.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 信任度条 */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${npc.trustLevel}%`,
                background: `linear-gradient(90deg, ${npc.accentColor}, ${npc.accentColor}aa)`,
              }}
            />
          </div>
          <span className="text-[0.55rem] uppercase tracking-[0.18em] text-[#AEB8C5]">
            {npc.trustLevel}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 迷你头像 - 用于列表
// ============================================

interface NpcAvatarMiniProps {
  npc: Npc;
  showStatus?: boolean;
  className?: string;
}

export function NpcAvatarMini({ npc, showStatus = true, className = "" }: NpcAvatarMiniProps) {
  const statusColor = statusDotColors[npc.status];

  return (
    <div className={`relative inline-flex ${className}`}>
      <NpcAvatar npc={npc} size="sm" showRing={false} showGlow={false} />
      {showStatus && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1a1d23]"
          style={{ backgroundColor: statusColor }}
        />
      )}
    </div>
  );
}

// ============================================
// 聊天顶部身份卡 - 紧凑版
// ============================================

interface NpcChatHeaderProps {
  npc: Npc;
}

const statusLabelMap: Record<Npc["status"], string> = {
  online: "ONLINE",
  guarded: "GUARDED",
  suspect: "SUSPECT",
  offline: "OFFLINE",
};

export function NpcChatHeader({ npc }: NpcChatHeaderProps) {
  const danger = dangerLevelConfig[npc.id] ?? { level: "???", color: "#6b7280" };
  const statusColor = statusDotColors[npc.status];

  return (
    <div className="flex items-center gap-4">
      {/* 头像 */}
      <NpcAvatar npc={npc} size="lg" showRing={true} showGlow={true} />

      {/* 身份信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h2
            className="text-[1.15rem] font-bold tracking-[0.02em]"
            style={{ color: npc.accentColor }}
          >
            {npc.name}
          </h2>
          <div
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{
              borderColor: `${statusColor}50`,
              background: `${statusColor}15`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em]" style={{ color: statusColor }}>
              {statusLabelMap[npc.status]}
            </span>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className="terminal-pill rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em]">
            {npc.role}
          </span>

          <span
            className="rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em]"
            style={{
              borderColor: `${danger.color}60`,
              color: danger.color,
              background: `${danger.color}12`,
            }}
          >
            {danger.level}
          </span>

          <span className="text-[0.65rem] text-[#AEB8C5]">
            信任度: <span className="font-medium" style={{ color: npc.accentColor }}>{npc.trustLevel}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
