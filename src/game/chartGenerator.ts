import { Difficulty, Note, SimulatorConfig, SongData } from './gameTypes';

export function generateChart(
  song: SongData,
  difficulty: Difficulty,
  config: SimulatorConfig
): Note[] {
  const notes: Note[] = [];
  const beatSec = 60 / song.bpm; // 1박자 (초)
  const startTime = config.startDelaySec;
  const endTime = song.duration - 1.5; // 곡 종료 1.5초 전까지 노트 생성

  // 난이도별 밀도 배율 및 스텝 단위
  let densityMultiplier = config.densityMultiplierNormal;
  if (difficulty === 'nightmare') {
    densityMultiplier = config.densityMultiplierNightmare;
  } else if (difficulty === 'gototohell') {
    densityMultiplier = config.densityMultiplierGotoHell;
  }

  // 기본 스텝: 4분음표(1 beat), 8분음표(0.5 beat), 16분음표(0.25 beat)
  const stepSubdivision = difficulty === 'gototohell' ? 4 : difficulty === 'nightmare' ? 2 : 1;
  const stepSec = beatSec / stepSubdivision;
  const totalSteps = Math.floor((endTime - startTime) / stepSec);

  let lastLeftTime = -999;
  let lastRightTime = -999;
  let currentHand: 'left' | 'right' = 'left';

  // 시드 기반 일관된 패턴 생성을 위한 난수 생성기
  let seed = song.id * 1000 + (difficulty === 'normal' ? 1 : difficulty === 'nightmare' ? 2 : 3);
  function pseudoRandom(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const minGapSec = (config.spamCooldownMs + 20) / 1000; // 연타 방지 최소 간격 보장

  for (let s = 0; s < totalSteps; s++) {
    const targetTime = startTime + s * stepSec;
    const beatIndex = (s / stepSubdivision) % 4; // 마디 내 비트 (0, 1, 2, 3)
    const isDownbeat = Math.abs(beatIndex - Math.round(beatIndex)) < 0.05; // 정박

    // 노트 출현 확률 계산
    let spawnProb = 0.45 * densityMultiplier;
    if (isDownbeat) {
      spawnProb += 0.35; // 정박일수록 출현 확률 높음
    }

    if (difficulty === 'normal') {
      // Normal: 주로 4분음표, 간혹 8분음표
      if (!isDownbeat && pseudoRandom() > 0.25) continue;
    } else if (difficulty === 'nightmare') {
      // Nightmare: 8분음표 밀도 증가, 연속 노트 패턴
      spawnProb = Math.min(0.85, spawnProb);
    } else {
      // GO TO HELL: 16분음표 폭타 및 트릴 출현
      spawnProb = Math.min(0.92, spawnProb);
    }

    if (pseudoRandom() <= spawnProb) {
      // 손 배치 결정 (번갈아 치기, 단타 연속, 트릴 등)
      const randPattern = pseudoRandom();
      if (randPattern < 0.6) {
        // 번갈아 치기 (Left <-> Right)
        currentHand = currentHand === 'left' ? 'right' : 'left';
      } else if (randPattern < 0.85) {
        // 동손 연속타 (Left-Left 또는 Right-Right)
        // 단, 연타 최소 간격(minGapSec) 체크
        const lastTime = currentHand === 'left' ? lastLeftTime : lastRightTime;
        if (targetTime - lastTime < minGapSec) {
          currentHand = currentHand === 'left' ? 'right' : 'left';
        }
      } else {
        // 랜덤 선택
        currentHand = pseudoRandom() > 0.5 ? 'right' : 'left';
      }

      // 쿨타임 안전성 재확인
      const lastTimeForHand = currentHand === 'left' ? lastLeftTime : lastRightTime;
      if (targetTime - lastTimeForHand >= minGapSec) {
        notes.push({
          id: `note-${s}-${currentHand}`,
          targetTime,
          button: currentHand,
          state: 'pending',
        });

        if (currentHand === 'left') {
          lastLeftTime = targetTime;
        } else {
          lastRightTime = targetTime;
        }
      }
    }
  }

  // 혹시 노트가 너무 적으면 기본 정박 비트 보충
  if (notes.length < 8) {
    for (let b = 0; b < Math.floor((endTime - startTime) / beatSec); b++) {
      const targetTime = startTime + b * beatSec;
      notes.push({
        id: `fallback-note-${b}`,
        targetTime,
        button: b % 2 === 0 ? 'left' : 'right',
        state: 'pending',
      });
    }
  }

  return notes;
}
