// 기획서 및 D01~D14 세부 결정 항목 기반 타입 정의

export type Difficulty = 'normal' | 'nightmare' | 'gototohell';

export type JudgementType = 'S' | 'A' | 'B' | 'MISS';

export type RankType = 'S' | 'A' | 'B' | 'C' | 'D';

export type ButtonType = 'left' | 'right';

export interface Note {
  id: string;
  targetTime: number; // 초 단위 (AudioContext.currentTime 기준)
  button: ButtonType; // 좌 / 우
  state: 'pending' | 'hit' | 'miss';
  judgement?: JudgementType;
  hitDelta?: number; // 목표 시간 대비 오차 (ms, +면 늦게, -면 일찍)
}

// 12종 음원 정보
export interface SongData {
  id: number; // 1 ~ 12
  title: string;
  artist: string;
  bpm: number;
  duration: number; // 초 단위 (기본 약 30~45초, 시뮬레이션에 최적화)
  genre: string;
  unlockedAtLevel: number;
}

// 12종 배경 애니메이션 테마 정보
export interface BackgroundTheme {
  id: number; // 1 ~ 12
  name: string;
  description: string;
  characterName: string;
  actionName: string;
  themeColor: string;
  unlockedAtLevel: number;
}

// D01 ~ D14 기획 시뮬레이터 파라미터 구조
export interface SimulatorConfig {
  // D01: 플랫폼 & 화면
  buttonSize: number; // px (기본 120)
  buttonSpacing: number; // px (기본 180)
  buttonVerticalOffset: number; // 하단 여백 px (기본 80)
  
  // D02: 판정 시간 & 동기화
  windowS: number; // ±ms (기본 45ms)
  windowA: number; // ±ms (기본 90ms)
  windowB: number; // ±ms (기본 140ms)
  // windowB 초과 시는 Miss
  audioOffsetMs: number; // 입력/출력 싱크 보정 (ms)
  missThresholdMs: number; // 지나간 노트가 자동으로 Miss 처리되는 시간 (ms, 기본 150ms)

  // D03: 연타 제한 & 채보
  spamCooldownMs: number; // 동일 버튼 연타 방지 쿨타임 (ms, 기본 100ms)
  spamCooldownGlobal: boolean; // 버튼별(false) or 양버튼 공통(true)

  // D04: 무효 입력 규칙
  punishBlankTap: boolean; // 노트 없는 시점의 빈 타격 시 체력 감소/패널티 여부 (기본 false)

  // D05: 점수 & 랭크
  scoreS: number; // S 점수 (기본 1000)
  scoreA: number; // A 점수 (기본 700)
  scoreB: number; // B 점수 (기본 400)
  scoreMiss: number; // Miss 점수 (기본 0)
  rankCutoffS: number; // S랭크 컷오프 비율 (기본 0.95 = 95%)
  rankCutoffA: number; // A랭크 (기본 0.85 = 85%)
  rankCutoffB: number; // B랭크 (기본 0.70 = 70%)
  rankCutoffC: number; // C랭크 (기본 0.50 = 50%)
  // C 미만은 D

  // D06: 체력 & 게임오버
  maxHp: number; // 최대 체력 (기본 100)
  startHp: number; // 시작 체력 (기본 100)
  hpLossMiss: number; // miss 1회당 체력 감소량 (기본 15)
  hpRecoveryS: number; // S 판정 체력 회복량 (기본 2)
  hpRecoveryA: number; // A 판정 회복량 (기본 1)
  hpRecoveryB: number; // B 판정 회복량 (기본 0)
  instantFailOnZeroHp: boolean; // 체력 0 도달 시 즉시 게임 오버 (기본 true)

  // D07: 채보 밀도 & 접근 링
  approachTimeMs: number; // 링이 축소되어 버튼에 도달하기까지의 시간 (ms, 기본 900ms)
  startDelaySec: number; // 곡 시작 전 카운트다운/준비 시간 (초, 기본 2.0s)
  densityMultiplierNormal: number; // Normal 난이도 밀도 배율 (기본 1.0)
  densityMultiplierNightmare: number; // Nightmare 밀도 배율 (기본 1.8)
  densityMultiplierGotoHell: number; // GO TO HELL 밀도 배율 (기본 2.8)

  // D09 & D10: 경험치 & 레벨
  expGainRankS: number; // S 클리어 EXP (기본 150)
  expGainRankA: number; // A 클리어 EXP (기본 100)
  expGainRankB: number; // B 클리어 EXP (기본 70)
  expGainRankC: number; // C 클리어 EXP (기본 40)
  expGainRankD: number; // D 클리어 EXP (기본 20)
  expGainFail: number; // 실패 시 EXP (기본 10)
  expPerLevelBase: number; // 레벨업 기본 필요 경험치 (기본 100)
  expPerLevelScaling: number; // 레벨당 필요 경험치 증가량 (기본 50)

  // D11: 신규 콘텐츠 우선 규칙
  prioritizeNewUnlock: boolean; // 신규 해금 시 다음 게임 강제 배정 (기본 true)

  // D12: 배경 애니메이션
  animFrameDurationMs: number; // 4프레임 중 1프레임당 지속시간 (ms, 기본 120ms)
  reactionDurationMs: number; // 히트 시 리액션 모션 지속시간 (ms, 기본 400ms)

  // 시뮬레이터 전용 디버그 옵션
  autoPlay: boolean; // 컴퓨터 자동 입력
  showHitErrorGraph: boolean; // 실시간 타이밍 오차 바 표시
  soundVolume: number; // 0.0 ~ 1.0
  hitSoundVolume: number; // 0.0 ~ 1.0
}

// 플레이어 계정 프로필 상태
export interface PlayerProfile {
  level: number;
  currentExp: number;
  maxLevel: number;
  unlockedSongs: number[]; // 해금된 Song ID 목록
  unlockedBgs: number[]; // 해금된 BG ID 목록
  pendingFirstPlaySongId: number | null; // 신규 해금되어 아직 플레이하지 않은 곡 ID
  pendingFirstPlayBgId: number | null; // 신규 해금되어 아직 플레이하지 않은 배경 ID
  totalPlays: number;
  clearCounts: Record<Difficulty, number>;
}

// 게임 플레이 결과 데이터
export interface GamePlayResult {
  song: SongData;
  background: BackgroundTheme;
  difficulty: Difficulty;
  score: number;
  maxScore: number;
  rank: RankType;
  isCleared: boolean;
  maxCombo: number;
  judgements: {
    S: number;
    A: number;
    B: number;
    MISS: number;
  };
  hitErrors: number[]; // ms 오차 배열
  expGained: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newlyUnlockedSongs: number[];
  newlyUnlockedBgs: number[];
}
