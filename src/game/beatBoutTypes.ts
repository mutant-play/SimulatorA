// BEAT BOUT 핵심 타입 및 인터페이스 정의

export type JudgementGrade = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface FallingNote {
  id: string;
  targetTime: number; // 음악 기준 판정 목표 시간 (초)
  hand: 'left' | 'right';
  state: 'pending' | 'hit' | 'miss';
  judgement?: JudgementGrade;
  hitDeltaMs?: number; // ms (+: late, -: early)
  missTime?: number; // miss가 발생한 시점 (초)
}

export interface Shockwave {
  id: string;
  x: number; // 캔버스 기준 X
  y: number; // 캔버스 기준 Y
  hand: 'left' | 'right';
  grade: JudgementGrade;
  startTime: number;
  durationMs: number;
}

export interface BoxerAnimState {
  hitSide: 'left' | 'right' | null;
  hitTime: number;
  threatSide: 'left' | 'right' | null;
  threatTime: number;
  bobPhase: number;
}

export interface PlayerFistState {
  leftPunchTime: number;
  rightPunchTime: number;
}

export type GameState = 'title' | 'countdown' | 'playing' | 'paused' | 'knockout' | 'complete';

export interface BeatBoutConfig {
  approachTimeSec: number; // 노트가 상단에서 버튼까지 내려오는 시간 (기본 0.8초)
  windowS: number; // ±80ms (PERFECT)
  windowA: number; // ±150ms (GREAT)
  windowB: number; // ±220ms (GOOD)
  timingOffsetMs: number; // 사용자 보정 (-200 ~ +200ms)
  maxHp: number; // 100
  startHp: number; // 100
  hpRecoveryS: number; // +3
  hpRecoveryA: number; // +2
  hpRecoveryB: number; // +1
  hpLossMiss: number; // -12
  hpLossEarlyBlank: number; // -2 (노트 없는 시점 조기 입력 페널티)
  scoreS: number; // 1000
  scoreA: number; // 700
  scoreB: number; // 400
}

export const DEFAULT_BEAT_BOUT_CONFIG: BeatBoutConfig = {
  approachTimeSec: 0.8,
  windowS: 80,
  windowA: 150,
  windowB: 220,
  timingOffsetMs: 0,
  maxHp: 100,
  startHp: 100,
  hpRecoveryS: 3,
  hpRecoveryA: 2,
  hpRecoveryB: 1,
  hpLossMiss: 12,
  hpLossEarlyBlank: 2,
  scoreS: 1000,
  scoreA: 700,
  scoreB: 400,
};

export interface GameSummary {
  finalScore: number;
  highScore: number;
  isNewHigh: boolean;
  maxCombo: number;
  accuracy: number; // 0 ~ 100%
  counts: {
    PERFECT: number;
    GREAT: number;
    GOOD: number;
    MISS: number;
  };
  totalNotes: number;
  isClear: boolean;
}
