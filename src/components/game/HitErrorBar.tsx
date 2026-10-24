import React from 'react';

interface HitErrorBarProps {
  lastDelta: number | null; // ms (음수: Early, 양수: Late)
  windowS: number;
  windowA: number;
  windowB: number;
  recentDeltas: number[];
}

export const HitErrorBar: React.FC<HitErrorBarProps> = ({
  lastDelta,
  windowS,
  windowA,
  windowB,
  recentDeltas,
}) => {
  // 전체 표시 범위는 max(windowB * 1.4, 180)
  const range = Math.max(windowB * 1.3, 160);

  const getPositionPercent = (delta: number) => {
    const clamped = Math.max(-range, Math.min(range, delta));
    return ((clamped + range) / (range * 2)) * 100;
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-lg p-2.5 shadow-lg">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
        <span className="text-cyan-400 font-semibold">◀ EARLY</span>
        <span className="text-slate-300">
          {lastDelta !== null ? (
            <span
              className={`font-bold ${
                Math.abs(lastDelta) <= windowS
                  ? 'text-amber-300'
                  : Math.abs(lastDelta) <= windowA
                  ? 'text-emerald-400'
                  : Math.abs(lastDelta) <= windowB
                  ? 'text-blue-400'
                  : 'text-red-400'
              }`}
            >
              {lastDelta > 0 ? `+${lastDelta.toFixed(1)}` : lastDelta.toFixed(1)} ms
            </span>
          ) : (
            '-- ms'
          )}
        </span>
        <span className="text-orange-400 font-semibold">LATE ▶</span>
      </div>

      {/* 오차 게이지 바 */}
      <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex items-center">
        {/* B 윈도우 영역 */}
        <div
          className="absolute h-full bg-blue-900/40"
          style={{
            left: `${getPositionPercent(-windowB)}%`,
            width: `${((windowB * 2) / (range * 2)) * 100}%`,
          }}
        />

        {/* A 윈도우 영역 */}
        <div
          className="absolute h-full bg-emerald-900/50"
          style={{
            left: `${getPositionPercent(-windowA)}%`,
            width: `${((windowA * 2) / (range * 2)) * 100}%`,
          }}
        />

        {/* S 윈도우 영역 */}
        <div
          className="absolute h-full bg-amber-500/40"
          style={{
            left: `${getPositionPercent(-windowS)}%`,
            width: `${((windowS * 2) / (range * 2)) * 100}%`,
          }}
        />

        {/* 센터 정박 기준선 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10 -translate-x-1/2" />

        {/* 최근 타격 히스토리 틱 (희미하게 표시) */}
        {recentDeltas.slice(-12).map((d, i) => (
          <div
            key={i}
            className="absolute top-0.5 bottom-0.5 w-1 bg-white/40 rounded -translate-x-1/2 pointer-events-none transition-opacity"
            style={{
              left: `${getPositionPercent(d)}%`,
              opacity: (i + 1) / 12 * 0.6,
            }}
          />
        ))}

        {/* 최신 타격 지점 인디케이터 (강조) */}
        {lastDelta !== null && (
          <div
            className="absolute top-0 bottom-0 w-2 bg-amber-300 rounded shadow-md shadow-amber-300/80 -translate-x-1/2 z-20 transition-all duration-75"
            style={{
              left: `${getPositionPercent(lastDelta)}%`,
            }}
          />
        )}
      </div>

      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1 px-1">
        <span>-{range.toFixed(0)}ms</span>
        <span className="text-amber-400/80">S: ±{windowS}ms</span>
        <span>+{range.toFixed(0)}ms</span>
      </div>
    </div>
  );
};
