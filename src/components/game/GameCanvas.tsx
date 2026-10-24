import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BackgroundTheme,
  ButtonType,
  Difficulty,
  GamePlayResult,
  JudgementType,
  Note,
  RankType,
  SimulatorConfig,
  SongData,
} from '../../game/gameTypes';
import { audio } from '../../game/audioEngine';
import { CharacterBackground } from './CharacterBackground';
import { HitErrorBar } from './HitErrorBar';

interface GameCanvasProps {
  song: SongData;
  background: BackgroundTheme;
  difficulty: Difficulty;
  notes: Note[];
  config: SimulatorConfig;
  onGameEnd: (result: GamePlayResult) => void;
  onQuit: () => void;
}

interface VisualFeedback {
  id: string;
  text: string;
  color: string;
  time: number;
  button: ButtonType;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  song,
  background,
  difficulty,
  notes: initialNotes,
  config,
  onGameEnd,
  onQuit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 게임 진행 상태
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentHp, setCurrentHp] = useState<number>(config.startHp);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastJudgement, setLastJudgement] = useState<JudgementType | null>(null);
  const [isHitReacting, setIsHitReacting] = useState<boolean>(false);
  const [animFrame, setAnimFrame] = useState<number>(0);

  // 히트 에러 통계
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [recentDeltas, setRecentDeltas] = useState<number[]>([]);
  const hitErrorsRef = useRef<number[]>([]);

  // 판정 카운트
  const judgementsRef = useRef<{ S: number; A: number; B: number; MISS: number }>({
    S: 0,
    A: 0,
    B: 0,
    MISS: 0,
  });

  // 버튼 눌림 상태 및 쿨타임
  const [leftPressed, setLeftPressed] = useState<boolean>(false);
  const [rightPressed, setRightPressed] = useState<boolean>(false);
  const lastTapTimeRef = useRef<{ left: number; right: number; global: number }>({
    left: 0,
    right: 0,
    global: 0,
  });

  // 시각 피드백 팝업 목록
  const [feedbacks, setFeedbacks] = useState<VisualFeedback[]>([]);

  // 노트 상태 및 타이머
  const notesRef = useRef<Note[]>([]);
  const gameStartTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const reactionTimerRef = useRef<number | null>(null);
  const isGameOverRef = useRef<boolean>(false);

  // 초기화
  useEffect(() => {
    // 딥카피로 노트 초기화
    notesRef.current = initialNotes.map((n) => ({ ...n }));
    judgementsRef.current = { S: 0, A: 0, B: 0, MISS: 0 };
    hitErrorsRef.current = [];
    isGameOverRef.current = false;

    // 오디오 시작
    const startAudio = async () => {
      await audio.init();
      audio.setVolumes(config.soundVolume, config.hitSoundVolume);
      const now = audio.getCurrentTime();
      gameStartTimeRef.current = now;
      setIsPlaying(true);

      // BGM 스케줄링 (startDelaySec 후 시작)
      audio.startThemeBgm(song.id, song.bpm, now + config.startDelaySec, song.duration);
    };

    startAudio();

    return () => {
      audio.stopBgm();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    };
  }, [song, initialNotes, config]);

  // 게임 종료 처리
  const finishGame = useCallback(
    (isCleared: boolean) => {
      if (isGameOverRef.current) return;
      isGameOverRef.current = true;
      setIsPlaying(false);
      audio.stopBgm();

      // 총점 및 최대 가능 점수 계산
      const totalNotes = notesRef.current.length;
      const maxPossibleScore = totalNotes * config.scoreS;
      const currentScore = score;
      const accuracy = maxPossibleScore > 0 ? currentScore / maxPossibleScore : 0;

      // 랭크 계산
      let rank: RankType = 'D';
      if (isCleared) {
        if (accuracy >= config.rankCutoffS) rank = 'S';
        else if (accuracy >= config.rankCutoffA) rank = 'A';
        else if (accuracy >= config.rankCutoffB) rank = 'B';
        else if (accuracy >= config.rankCutoffC) rank = 'C';
        else rank = 'D';
      }

      // 경험치 계산
      let expGained = 0;
      if (!isCleared) {
        expGained = config.expGainFail;
      } else {
        if (rank === 'S') expGained = config.expGainRankS;
        else if (rank === 'A') expGained = config.expGainRankA;
        else if (rank === 'B') expGained = config.expGainRankB;
        else if (rank === 'C') expGained = config.expGainRankC;
        else expGained = config.expGainRankD;
      }

      const result: GamePlayResult = {
        song,
        background,
        difficulty,
        score: currentScore,
        maxScore: maxPossibleScore,
        rank,
        isCleared,
        maxCombo,
        judgements: { ...judgementsRef.current },
        hitErrors: [...hitErrorsRef.current],
        expGained,
        leveledUp: false,
        oldLevel: 1,
        newLevel: 1,
        newlyUnlockedSongs: [],
        newlyUnlockedBgs: [],
      };

      onGameEnd(result);
    },
    [background, config, difficulty, maxCombo, onGameEnd, score, song]
  );

  // 캐릭터 4프레임 및 히트 리액션 트리거
  const triggerReaction = useCallback(
    (judgement: JudgementType) => {
      setLastJudgement(judgement);
      setIsHitReacting(true);

      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = window.setTimeout(() => {
        setIsHitReacting(false);
      }, config.reactionDurationMs);
    },
    [config.reactionDurationMs]
  );

  // 판정 처리 및 점수/체력 갱신
  const applyJudgement = useCallback(
    (judgement: JudgementType, deltaMs: number, button: ButtonType) => {
      judgementsRef.current[judgement] += 1;
      triggerReaction(judgement);

      if (judgement !== 'MISS') {
        hitErrorsRef.current.push(deltaMs);
        setLastDelta(deltaMs);
        setRecentDeltas((prev) => [...prev.slice(-20), deltaMs]);
      }

      // 점수 가산
      let point = 0;
      if (judgement === 'S') point = config.scoreS;
      else if (judgement === 'A') point = config.scoreA;
      else if (judgement === 'B') point = config.scoreB;
      else point = config.scoreMiss;

      setScore((prev) => prev + point);

      // 콤보 갱신
      if (judgement === 'MISS') {
        setCombo(0);
        audio.playMissSound();
      } else {
        setCombo((prev) => {
          const next = prev + 1;
          setMaxCombo((m) => Math.max(m, next));
          return next;
        });
      }

      // 체력 갱신
      setCurrentHp((prev) => {
        let nextHp = prev;
        if (judgement === 'MISS') {
          nextHp -= config.hpLossMiss;
        } else if (judgement === 'S') {
          nextHp += config.hpRecoveryS;
        } else if (judgement === 'A') {
          nextHp += config.hpRecoveryA;
        } else if (judgement === 'B') {
          nextHp += config.hpRecoveryB;
        }

        nextHp = Math.max(0, Math.min(config.maxHp, nextHp));

        if (nextHp <= 0 && config.instantFailOnZeroHp) {
          // 게임 오버
          finishGame(false);
        }
        return nextHp;
      });

      // 피드백 팝업
      let feedbackText = 'MISS';
      let feedbackColor = 'text-red-500';
      if (judgement === 'S') {
        feedbackText = 'S !!';
        feedbackColor = 'text-amber-400';
      } else if (judgement === 'A') {
        feedbackText = 'A !';
        feedbackColor = 'text-emerald-400';
      } else if (judgement === 'B') {
        feedbackText = 'B';
        feedbackColor = 'text-blue-400';
      }

      const fb: VisualFeedback = {
        id: `${Date.now()}-${Math.random()}`,
        text: feedbackText,
        color: feedbackColor,
        time: Date.now(),
        button,
      };

      setFeedbacks((prev) => [...prev.slice(-5), fb]);
    },
    [config, finishGame, triggerReaction]
  );

  // 사용자 타격 입력 처리
  const handleTap = useCallback(
    (button: ButtonType) => {
      if (!isPlaying || isGameOverRef.current) return;

      const nowAudio = audio.getCurrentTime();
      const nowMs = performance.now();

      // D03: 연타 쿨타임 체크
      const lastTime = config.spamCooldownGlobal
        ? lastTapTimeRef.current.global
        : lastTapTimeRef.current[button];

      if (nowMs - lastTime < config.spamCooldownMs) {
        // 연타 쿨타임 중 무시
        return;
      }

      lastTapTimeRef.current[button] = nowMs;
      lastTapTimeRef.current.global = nowMs;

      // 버튼 시각 효과
      if (button === 'left') {
        setLeftPressed(true);
        setTimeout(() => setLeftPressed(false), 80);
      } else {
        setRightPressed(true);
        setTimeout(() => setRightPressed(false), 80);
      }

      // 타격음 재생 ('동' or '딱')
      audio.playHitSound(button);

      // 판정 대상 노트 탐색 (해당 버튼의 pending 노트 중 가장 가까운 것)
      const currentTrackTime = nowAudio - gameStartTimeRef.current - config.audioOffsetMs / 1000;
      let closestNote: Note | null = null;
      let minDiff = Infinity;

      for (const note of notesRef.current) {
        if (note.state === 'pending' && note.button === button) {
          const diffMs = (currentTrackTime - note.targetTime) * 1000;
          if (Math.abs(diffMs) < Math.abs(minDiff)) {
            minDiff = diffMs;
            closestNote = note;
          }
        }
      }

      // D02 판정 윈도우 검사
      const absDiff = Math.abs(minDiff);

      if (closestNote && absDiff <= config.windowB) {
        // 유효 타격 판정
        closestNote.state = 'hit';
        let judgement: JudgementType = 'B';
        if (absDiff <= config.windowS) {
          judgement = 'S';
        } else if (absDiff <= config.windowA) {
          judgement = 'A';
        }
        closestNote.judgement = judgement;
        closestNote.hitDelta = minDiff;
        applyJudgement(judgement, minDiff, button);
      } else {
        // D04: 무효 입력 규칙 (노트 없는 시점의 탭)
        if (config.punishBlankTap) {
          applyJudgement('MISS', minDiff, button);
        } else {
          // 키 입력은 정상 인식되었으나 타이밍이 너무 빠르거나 늦었음을 알려주는 시각 피드백
          let warningText = 'TAP';
          if (closestNote && minDiff < -config.windowB) {
            warningText = 'TOO EARLY';
          } else if (closestNote && minDiff > config.windowB) {
            warningText = 'TOO LATE';
          }
          const fb: VisualFeedback = {
            id: `${Date.now()}-${Math.random()}`,
            text: warningText,
            color: 'text-slate-400 text-sm font-semibold opacity-80',
            time: Date.now(),
            button,
          };
          setFeedbacks((prev) => [...prev.slice(-5), fb]);
        }
      }
    },
    [applyJudgement, config, isPlaying]
  );

  // 키보드 눌림 추적 상태 (e.code 기준)
  const activeKeysRef = useRef<Set<string>>(new Set());

  // 키보드 이벤트 리스너 (e.code 물리적 키 매핑 + 한글 IME 완벽 지원)
  useEffect(() => {
    const isLeftKey = (e: KeyboardEvent) => {
      // 1. 물리적 키 위치 (한/영 전환과 무관하게 항상 동작!)
      if (['KeyD', 'KeyF', 'KeyA', 'KeyS', 'KeyZ', 'KeyX', 'ArrowLeft', 'ArrowDown'].includes(e.code)) {
        return true;
      }
      // 2. 키 값 (영문 및 한글 자모)
      const k = e.key.toLowerCase();
      return ['d', 'f', 'a', 's', 'z', 'x', 'ㅇ', 'ㄹ', 'ㅁ', 'ㄴ', 'ㅋ', 'ㅌ'].includes(k);
    };

    const isRightKey = (e: KeyboardEvent) => {
      // 1. 물리적 키 위치
      if (['KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'KeyN', 'KeyM', 'ArrowRight', 'ArrowUp'].includes(e.code)) {
        return true;
      }
      // 2. 키 값 (영문 및 한글 자모)
      const k = e.key.toLowerCase();
      return ['j', 'k', 'l', ';', 'n', 'm', 'ㅓ', 'ㅏ', 'ㅣ', 'ㅜ', 'ㅡ'].includes(k);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'Escape') {
        onQuit();
        return;
      }

      if (isLeftKey(e)) {
        e.preventDefault();
        activeKeysRef.current.add('left');
        handleTap('left');
      } else if (isRightKey(e)) {
        e.preventDefault();
        activeKeysRef.current.add('right');
        handleTap('right');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isLeftKey(e)) {
        activeKeysRef.current.delete('left');
        setLeftPressed(false);
      } else if (isRightKey(e)) {
        activeKeysRef.current.delete('right');
        setRightPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleTap, onQuit]);

  // 메인 게임 루프 (RAF)
  useEffect(() => {
    const loop = () => {
      if (!isPlaying || isGameOverRef.current) return;

      const nowAudio = audio.getCurrentTime();
      const currentTrackTime = nowAudio - gameStartTimeRef.current;
      setElapsedTime(Math.max(0, currentTrackTime - config.startDelaySec));

      // 4프레임 비트 애니메이션 동기화
      const beatSec = 60 / song.bpm;
      const frameSec = config.animFrameDurationMs / 1000;
      const frameIndex = Math.floor((currentTrackTime % beatSec) / (beatSec / 4)) % 4;
      setAnimFrame(frameIndex);

      // 노트 상태 갱신 & 오토플레이 & 미스 판정 체크
      const approachSec = config.approachTimeMs / 1000;
      const missThresholdSec = config.missThresholdMs / 1000;

      for (const note of notesRef.current) {
        if (note.state === 'pending') {
          const deltaSec = currentTrackTime - note.targetTime;

          // 오토플레이 기능
          if (config.autoPlay && deltaSec >= 0) {
            note.state = 'hit';
            note.judgement = 'S';
            note.hitDelta = 0;
            audio.playHitSound(note.button);
            applyJudgement('S', 0, note.button);
            if (note.button === 'left') {
              setLeftPressed(true);
              setTimeout(() => setLeftPressed(false), 60);
            } else {
              setRightPressed(true);
              setTimeout(() => setRightPressed(false), 60);
            }
            continue;
          }

          // 시간이 지나쳐버린 노트 Miss 처리
          if (deltaSec > missThresholdSec) {
            note.state = 'miss';
            note.judgement = 'MISS';
            applyJudgement('MISS', deltaSec * 1000, note.button);
          }
        }
      }

      // 곡 종료 검사
      if (currentTrackTime >= song.duration + config.startDelaySec) {
        finishGame(true);
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [applyJudgement, config, finishGame, isPlaying, song]);

  // 피드백 팝업 자동 청소
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setFeedbacks((prev) => prev.filter((f) => now - f.time < 700));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // 현재 화면에 렌더링해야 할 접근 링(Approach Rings) 계산
  const currentAudioTime = audio.getCurrentTime();
  const currentTrackTime = currentAudioTime - gameStartTimeRef.current;
  const approachSec = config.approachTimeMs / 1000;

  const visibleNotes = notesRef.current.filter((note) => {
    if (note.state !== 'pending') return false;
    const timeUntilHit = note.targetTime - currentTrackTime;
    return timeUntilHit <= approachSec && timeUntilHit >= -0.15;
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[620px] max-w-2xl mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col justify-between select-none"
    >
      {/* 1. 상단 HUD: 체력 바, 점수, 콤보, 타이머 */}
      <div className="relative z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-between gap-4">
          {/* 체력 게이지 (상단 전체) */}
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="font-bold flex items-center gap-1">
                ❤️ HP{' '}
                <span className={currentHp < 30 ? 'text-red-400 animate-pulse' : 'text-slate-200'}>
                  {currentHp.toFixed(0)}/{config.maxHp}
                </span>
              </span>
              <span className="text-slate-400">
                {Math.floor(elapsedTime)}s / {song.duration}s
              </span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  currentHp > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                    : currentHp > 25
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                }`}
                style={{ width: `${(currentHp / config.maxHp) * 100}%` }}
              />
            </div>
          </div>

          {/* 스코어 & 콤보 */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">SCORE</div>
            <div className="text-2xl font-black text-amber-300 font-mono tracking-wider">
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 콤보 카운트 표시 */}
        {combo > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 top-14 text-center pointer-events-none animate-bounce-short">
            <div className="text-3xl font-black italic tracking-tighter text-yellow-300 drop-shadow-[0_2px_10px_rgba(234,179,8,0.6)]">
              {combo}
            </div>
            <div className="text-[10px] tracking-widest font-black text-amber-200 uppercase">
              COMBO
            </div>
          </div>
        )}

        {/* 오토플레이 표시기 */}
        {config.autoPlay && (
          <div className="absolute left-4 top-14 bg-red-600/90 text-white font-mono text-xs px-2.5 py-0.5 rounded-full shadow-lg animate-pulse font-bold">
            🤖 AUTO PLAYING
          </div>
        )}
      </div>

      {/* 2. 중앙 캐릭터 및 배경 반응 애니메이션 */}
      <div className="absolute inset-0 z-0">
        <CharacterBackground
          theme={background}
          currentFrame={animFrame}
          lastJudgement={lastJudgement}
          isHitReacting={isHitReacting}
          bpm={song.bpm}
        />
      </div>

      {/* 2-1. 곡 시작 전 카운트다운 연출 */}
      {currentTrackTime < config.startDelaySec && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[2px]">
          <div className="text-sm font-black tracking-widest text-amber-400 uppercase animate-pulse">
            GET READY
          </div>
          <div className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] mt-2 font-mono animate-bounce-short">
            {Math.ceil(config.startDelaySec - currentTrackTime)}
          </div>
          <div className="text-xs text-slate-300 mt-3 font-mono bg-black/60 px-3 py-1 rounded-full border border-white/10">
            키보드: 좌측(D, F, ←) / 우측(J, K, →)
          </div>
        </div>
      )}

      {/* 3. 실시간 히트 에러 바 (Inspector 연동) */}
      {config.showHitErrorGraph && (
        <div className="relative z-20 px-4 mt-auto mb-2">
          <HitErrorBar
            lastDelta={lastDelta}
            windowS={config.windowS}
            windowA={config.windowA}
            windowB={config.windowB}
            recentDeltas={recentDeltas}
          />
        </div>
      )}

      {/* 4. 하단 2버튼 및 접근하는 원(Shrinking Ring) 컨트롤러 */}
      <div
        className="relative z-30 pb-6 pt-2 flex items-center justify-around px-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
        style={{ paddingBottom: `${config.buttonVerticalOffset}px` }}
      >
        {/* 좌측 버튼 (동 / 킥) */}
        <div className="relative flex flex-col items-center">
          {/* 접근 링 (좌측 노트들) */}
          {visibleNotes
            .filter((n) => n.button === 'left')
            .map((note) => {
              const timeUntilHit = note.targetTime - currentTrackTime;
              const progress = 1 - timeUntilHit / approachSec; // 0 -> 1 (1이 될 때 일치)
              const scale = 2.6 - progress * 1.6; // 2.6배에서 1.0배로 축소

              return (
                <div
                  key={note.id}
                  className="absolute rounded-full border-4 pointer-events-none transition-opacity"
                  style={{
                    width: `${config.buttonSize}px`,
                    height: `${config.buttonSize}px`,
                    borderColor: '#f97316',
                    transform: `scale(${Math.max(1, scale)})`,
                    opacity: Math.max(0.15, Math.min(1, progress * 1.4)),
                    boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)',
                  }}
                />
              );
            })}

          {/* 좌측 판정 텍스트 팝업 */}
          {feedbacks
            .filter((f) => f.button === 'left')
            .map((f) => (
              <div
                key={f.id}
                className={`absolute -top-10 font-black text-2xl tracking-wider ${f.color} drop-shadow-md animate-bounce-short pointer-events-none`}
              >
                {f.text}
              </div>
            ))}

          {/* 좌측 메인 원형 터치 버튼 */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleTap('left');
            }}
            className={`rounded-full flex flex-col items-center justify-center font-bold shadow-2xl transition-all duration-75 border-4 select-none touch-none relative ${
              leftPressed
                ? 'scale-90 bg-orange-600 border-orange-300 ring-4 ring-orange-400/60 shadow-orange-500/50'
                : 'bg-gradient-to-br from-orange-500 to-amber-600 border-amber-300/80 hover:brightness-110 active:scale-95 shadow-orange-600/30'
            }`}
            style={{
              width: `${config.buttonSize}px`,
              height: `${config.buttonSize}px`,
            }}
          >
            <span className="text-2xl font-black text-white drop-shadow">동</span>
            <span className="text-[10px] text-orange-200 font-mono mt-0.5">LEFT</span>
          </button>

          {/* 키보드 키 바인딩 뱃지 */}
          <div className="flex items-center gap-1 mt-2 font-mono text-[11px]">
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${leftPressed ? 'bg-orange-500 text-slate-950 font-black border-orange-400' : 'bg-slate-900 text-orange-300 border-slate-700'}`}>
              D
            </span>
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${leftPressed ? 'bg-orange-500 text-slate-950 font-black border-orange-400' : 'bg-slate-900 text-orange-300 border-slate-700'}`}>
              F
            </span>
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${leftPressed ? 'bg-orange-500 text-slate-950 font-black border-orange-400' : 'bg-slate-900 text-orange-300 border-slate-700'}`}>
              ◀
            </span>
          </div>
        </div>

        {/* 우측 버튼 (딱 / 스네어) */}
        <div className="relative flex flex-col items-center">
          {/* 접근 링 (우측 노트들) */}
          {visibleNotes
            .filter((n) => n.button === 'right')
            .map((note) => {
              const timeUntilHit = note.targetTime - currentTrackTime;
              const progress = 1 - timeUntilHit / approachSec; // 0 -> 1
              const scale = 2.6 - progress * 1.6;

              return (
                <div
                  key={note.id}
                  className="absolute rounded-full border-4 pointer-events-none transition-opacity"
                  style={{
                    width: `${config.buttonSize}px`,
                    height: `${config.buttonSize}px`,
                    borderColor: '#38bdf8',
                    transform: `scale(${Math.max(1, scale)})`,
                    opacity: Math.max(0.15, Math.min(1, progress * 1.4)),
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                  }}
                />
              );
            })}

          {/* 우측 판정 텍스트 팝업 */}
          {feedbacks
            .filter((f) => f.button === 'right')
            .map((f) => (
              <div
                key={f.id}
                className={`absolute -top-10 font-black text-2xl tracking-wider ${f.color} drop-shadow-md animate-bounce-short pointer-events-none`}
              >
                {f.text}
              </div>
            ))}

          {/* 우측 메인 원형 터치 버튼 */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleTap('right');
            }}
            className={`rounded-full flex flex-col items-center justify-center font-bold shadow-2xl transition-all duration-75 border-4 select-none touch-none relative ${
              rightPressed
                ? 'scale-90 bg-sky-600 border-sky-300 ring-4 ring-sky-400/60 shadow-sky-500/50'
                : 'bg-gradient-to-br from-sky-500 to-blue-600 border-sky-300/80 hover:brightness-110 active:scale-95 shadow-sky-600/30'
            }`}
            style={{
              width: `${config.buttonSize}px`,
              height: `${config.buttonSize}px`,
            }}
          >
            <span className="text-2xl font-black text-white drop-shadow">딱</span>
            <span className="text-[10px] text-sky-200 font-mono mt-0.5">RIGHT</span>
          </button>

          {/* 키보드 키 바인딩 뱃지 */}
          <div className="flex items-center gap-1 mt-2 font-mono text-[11px]">
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${rightPressed ? 'bg-sky-500 text-slate-950 font-black border-sky-400' : 'bg-slate-900 text-sky-300 border-slate-700'}`}>
              J
            </span>
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${rightPressed ? 'bg-sky-500 text-slate-950 font-black border-sky-400' : 'bg-slate-900 text-sky-300 border-slate-700'}`}>
              K
            </span>
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${rightPressed ? 'bg-sky-500 text-slate-950 font-black border-sky-400' : 'bg-slate-900 text-sky-300 border-slate-700'}`}>
              ▶
            </span>
          </div>
        </div>
      </div>

      {/* 화면 전체 터치 지원 (모바일 편의를 위해 좌반신/우반신 터치 영역 오버레이) */}
      <div className="absolute inset-0 z-10 flex pointer-events-none">
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap('left');
          }}
          className="flex-1 pointer-events-auto opacity-0"
        />
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap('right');
          }}
          className="flex-1 pointer-events-auto opacity-0"
        />
      </div>
    </div>
  );
};
