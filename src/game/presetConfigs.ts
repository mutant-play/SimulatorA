import { BackgroundTheme, SimulatorConfig, SongData } from './gameTypes';

// 12종 음원 메타데이터 (BPM 및 장르 다양화)
export const DEFAULT_SONGS: SongData[] = [
  { id: 1, title: '시작의 북소리 (Taiko Genesis)', artist: 'Sound Studio A', bpm: 120, duration: 28, genre: '전통 비트 / 마츠리', unlockedAtLevel: 1 },
  { id: 2, title: '비둘기 댄스홀 (Pigeon Groove)', artist: 'DJ Coo', bpm: 128, duration: 30, genre: '힙합 & 펑크', unlockedAtLevel: 2 },
  { id: 3, title: '네온 시티의 밤 (Neon Moonlight)', artist: 'Cyber Shinobi', bpm: 135, duration: 30, genre: '신스웨이브', unlockedAtLevel: 3 },
  { id: 4, title: '냥냥 디스코 스크래치 (Meow Scratch)', artist: 'DJ Kitty', bpm: 132, duration: 32, genre: '하우스 디스코', unlockedAtLevel: 4 },
  { id: 5, title: '대나무 숲의 권법 (Kungfu Bamboo)', artist: 'Master Panda', bpm: 140, duration: 30, genre: '오리엔탈 퓨전', unlockedAtLevel: 5 },
  { id: 6, title: '달나라 당근 로켓 (Carrot Orbit)', artist: 'Cosmo Bunny', bpm: 145, duration: 32, genre: '스페이스 팝', unlockedAtLevel: 6 },
  { id: 7, title: '도트 용사의 모험 (8-Bit Valiant)', artist: 'Chiptune Hero', bpm: 150, duration: 32, genre: '레트로 칩튠', unlockedAtLevel: 7 },
  { id: 8, title: '도효 위의 한판 (Sumo Rumble)', artist: 'Yokozuna Beats', bpm: 138, duration: 34, genre: '헤비 비트', unlockedAtLevel: 8 },
  { id: 9, title: '반짝이는 스포트라이트 (Star Idol)', artist: 'Sparkle 5', bpm: 155, duration: 32, genre: '아이돌 팝', unlockedAtLevel: 9 },
  { id: 10, title: '기어 앤 스팀 (Overclocked)', artist: 'Bot Factory', bpm: 160, duration: 34, genre: '인더스트리얼 테크노', unlockedAtLevel: 10 },
  { id: 11, title: '폭풍의 소환술 (Arcane Lightning)', artist: 'Archmage', bpm: 168, duration: 35, genre: '심포닉 리듬', unlockedAtLevel: 11 },
  { id: 12, title: '지옥의 헤드뱅잉 (GO TO HELL Anthem)', artist: 'Inferno Skull', bpm: 180, duration: 36, genre: '스피드 메탈 / 하드코어', unlockedAtLevel: 12 },
];

// 12종 배경 애니메이션 테마 (4프레임 캐릭터 동작)
export const DEFAULT_BACKGROUNDS: BackgroundTheme[] = [
  { id: 1, name: '축제 마당', characterName: '축제 북요괴 (돈군)', actionName: '쿵쾅 북치기', description: '등불이 흔들리고 신나게 북을 두드리는 요괴', themeColor: '#f97316', unlockedAtLevel: 1 },
  { id: 2, name: '도시 옥상', characterName: '힙합 비둘기 (구구)', actionName: '모이 쪼기 바운스', description: '선글라스를 끼고 고개를 끄덕이며 모이를 쪼는 비둘기', themeColor: '#3b82f6', unlockedAtLevel: 2 },
  { id: 3, name: '네온 지붕', characterName: '사이버 닌자 (하야테)', actionName: '수리검 던지기', description: '화려한 사이버 네온 불빛 아래 표창을 던지는 닌자', themeColor: '#a855f7', unlockedAtLevel: 3 },
  { id: 4, name: '클럽 DJ부스', characterName: '고양이 DJ (나비)', actionName: '발바닥 스크래치', description: '헤드폰을 쓰고 LP판을 발바닥으로 긁는 고양이', themeColor: '#ec4899', unlockedAtLevel: 4 },
  { id: 5, name: '달밤 대나무 숲', characterName: '무림 팬더 (보)', actionName: '원투 정권 지르기', description: '대나무를 배경으로 리듬에 맞춰 펀치를 날리는 팬더', themeColor: '#10b981', unlockedAtLevel: 5 },
  { id: 6, name: '달 표면 기지', characterName: '우주 토끼 (루나)', actionName: '당근 안테나 회전', description: '무중력 공간에서 둥둥 뜨며 당근 발사 준비를 하는 토끼', themeColor: '#06b6d4', unlockedAtLevel: 6 },
  { id: 7, name: '픽셀 던전', characterName: '도트 기사 (아서)', actionName: '검 방패 패링', description: '슬라임을 상대로 정확한 타이밍에 방패를 내미는 기사', themeColor: '#eab308', unlockedAtLevel: 7 },
  { id: 8, name: '모래판 경기장', characterName: '스모 장사 (천하)', actionName: '철썩 손바닥 치기', description: '기합을 넣으며 우렁차게 손바닥을 부딪히는 장사', themeColor: '#f43f5e', unlockedAtLevel: 8 },
  { id: 9, name: '홀로그램 라이브', characterName: '사이버 아이돌 (유나)', actionName: '마이크 윙크 댄스', description: '스포트라이트를 받으며 마이크를 쥐고 윙크하는 아이돌', themeColor: '#8b5cf6', unlockedAtLevel: 9 },
  { id: 10, name: '증기 로봇 공장', characterName: '용접봇 (MK-II)', actionName: '스파크 해머 타격', description: '증기를 뿜으며 거대한 망치로 리듬에 맞춰 쇠를 두드리는 로봇', themeColor: '#64748b', unlockedAtLevel: 10 },
  { id: 11, name: '마법 도서관 탑', characterName: '견습 마법사 (메린)', actionName: '지팡이 번개 마법', description: '지팡이를 휘두르며 박자에 맞춰 마법 구체를 터뜨리는 마법사', themeColor: '#6366f1', unlockedAtLevel: 11 },
  { id: 12, name: '마계의 무대', characterName: '지옥 록커 (바알)', actionName: '화염 기타 솔로', description: '화염이 치솟는 무대에서 불꽃을 튀기며 솔로를 연주하는 악마', themeColor: '#ef4444', unlockedAtLevel: 12 },
];

// 기본 기획 파라미터 (스프레드시트 D01~D14 검토 제안 반영)
export const DEFAULT_CONFIG: SimulatorConfig = {
  // D01
  buttonSize: 110,
  buttonSpacing: 180,
  buttonVerticalOffset: 70,

  // D02 (검토 제안: S/A/B 타이밍 윈도우)
  windowS: 45, // ±45ms
  windowA: 90, // ±90ms
  windowB: 140, // ±140ms
  audioOffsetMs: 0,
  missThresholdMs: 160,

  // D03 (연타 제한: 버튼별 쿨타임)
  spamCooldownMs: 100, // 100ms
  spamCooldownGlobal: false,

  // D04 (무효 입력: 노트 없을 때 탭 패널티)
  punishBlankTap: false,

  // D05 (점수 & 랭크 기준)
  scoreS: 1000,
  scoreA: 700,
  scoreB: 400,
  scoreMiss: 0,
  rankCutoffS: 0.95,
  rankCutoffA: 0.85,
  rankCutoffB: 0.70,
  rankCutoffC: 0.50,

  // D06 (체력 규칙: 시작 100, miss 1회당 -15)
  maxHp: 100,
  startHp: 100,
  hpLossMiss: 15,
  hpRecoveryS: 2,
  hpRecoveryA: 1,
  hpRecoveryB: 0,
  instantFailOnZeroHp: true,

  // D07 (난이도 밀도 & 접근 링)
  approachTimeMs: 850,
  startDelaySec: 2.0,
  densityMultiplierNormal: 1.0,
  densityMultiplierNightmare: 1.8,
  densityMultiplierGotoHell: 2.8,

  // D09 & D10 (경험치 & 레벨)
  expGainRankS: 150,
  expGainRankA: 100,
  expGainRankB: 70,
  expGainRankC: 40,
  expGainRankD: 20,
  expGainFail: 10,
  expPerLevelBase: 100,
  expPerLevelScaling: 50,

  // D11 (신규 콘텐츠 우선)
  prioritizeNewUnlock: true,

  // D12 (애니메이션 4프레임)
  animFrameDurationMs: 125,
  reactionDurationMs: 400,

  // 시뮬레이터 옵션
  autoPlay: false,
  showHitErrorGraph: true,
  soundVolume: 0.75,
  hitSoundVolume: 0.9,
};

// 기획 검증용 프리셋 모음
export const PRESETS: Record<string, { name: string; desc: string; config: Partial<SimulatorConfig> }> = {
  default: {
    name: '기획안 기본 (Standard)',
    desc: '기획서의 검토 제안을 표준적으로 적용한 기본 밸런스입니다.',
    config: { ...DEFAULT_CONFIG },
  },
  casual: {
    name: '캐주얼 관대 판정 (Casual / Easy)',
    desc: '모바일 초보자도 쉽게 즐길 수 있도록 판정 폭을 넓히고 체력 감소를 줄였습니다.',
    config: {
      windowS: 65,
      windowA: 120,
      windowB: 180,
      hpLossMiss: 8,
      hpRecoveryS: 4,
      hpRecoveryA: 2,
      approachTimeMs: 1000,
      spamCooldownMs: 80,
    },
  },
  strict: {
    name: '하드코어 아케이드 (Hardcore / Strict)',
    desc: '태고/비마니 숙련자를 위한 매우 엄격한 판정 윈도우와 가혹한 체력 감소 규칙입니다.',
    config: {
      windowS: 25,
      windowA: 55,
      windowB: 95,
      hpLossMiss: 25,
      hpRecoveryS: 1,
      hpRecoveryA: 0,
      punishBlankTap: true,
      approachTimeMs: 650,
      spamCooldownMs: 120,
    },
  },
};
