import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BeatBoutConfig,
  BoxerAnimState,
  DEFAULT_BEAT_BOUT_CONFIG,
  FallingNote,
  GameState,
  GameSummary,
  JudgementGrade,
  PlayerFistState,
  Shockwave,
} from '../../game/beatBoutTypes';
import { beatBoutAudio } from '../../game/beatBoutAudio';
import { createBeatBout60sChart } from '../../game/beatBoutChart';
import { BoxerRingCanvas } from './BoxerRingCanvas';
import { FallingNotesLayer } from './FallingNotesLayer';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Trophy,
  Flame,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_OFFSET = 'beat_bout_offset_ms';
const STORAGE_KEY_HIGHSCORE = 'beat_bout_highscore';

export const BeatBoutGame: React.FC = () => {
  // 환경 설정 및 타이밍 오프셋
  const [config, setConfig] = useState<BeatBoutConfig>(() => {
    const savedOffset = localStorage.getItem(STORAGE_KEY_OFFSET);
    return {
      ...DEFAULT_BEAT_BOUT_CONFIG,
      timingOffsetMs: savedOffset ? Number(savedOffset) : 0,
    };
  });

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
    return saved ? Number(saved) : 0;
  });

  // 게임 흐름 상태
  const [gameState, setGameState] = useState<GameState>('title');
  const [countdown, setCountdown] = useState<number>(3);
  const [currentHp, setCurrentHp] = useState<number>(config.startHp);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(60);
  const [summary, setSummary] = useState<GameSummary | null>(null);

  // 노트 및 시각 피드백 상태
  const [notes, setNotes] = useState<FallingNote[]>([]);
  const notesRef = useRef<FallingNote[]>([]);
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [lastJudgementText, setLastJudgementText] = useState<string | null>(null);
  const [lastJudgementColor, setLastJudgementColor] = useState<string>('#f8fafc');
  const [isHitFlashing, setIsHitFlashing] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<number>(0);

  // 복서 및 플레이어 애니메이션 상태
  const [boxerState, setBoxerState] = useState<BoxerAnimState>({
    hitSide: null,
    hitTime: 0,
    threatSide: null,
    threatTime: 0,
    bobPhase: 0,
  });

  const [playerFistState, setPlayerFistState] = useState<PlayerFistState>({
    leftPunchTime: 0,
    rightPunchTime: 0,
  });

  // 버튼 눌림 상태
  const [leftButtonPressed, setLeftButtonPressed] = useState<boolean>(false);
  const [rightButtonPressed, setRightButtonPressed] = useState<boolean>(false);

  // 판정 통계 Ref
  const countsRef = useRef<{ PERFECT: number; GREAT: number; GOOD: number; MISS: number }>({
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    MISS: 0,
  });

  const animFrameIdRef = useRef<number | null>(null);
  const isGameOverRef = useRef<boolean>(false);

  // 모바일/데스크톱 캔버스 해상도 규격 (너비 414px, 높이 736px - 아이폰 표준 비율)
  const gameWidth = 414;
  const gameHeight = 736;

  // 오프셋 저장
  const updateOffset = (newOffset: number) => {
    setConfig((prev) => ({ ...prev, timingOffsetMs: newOffset }));
    localStorage.setItem(STORAGE_KEY_OFFSET, String(newOffset));
  };

  // 게임 시작 (카운트다운 돌입)
  const startGame = async () => {
    await beatBoutAudio.init();
    notesRef.current = createBeatBout60sChart();
    setNotes(notesRef.current);
    countsRef.current = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    setCurrentHp(config.startHp);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setRemainingTime(60);
    setShockwaves([]);
    setLastJudgementText(null);
    isGameOverRef.current = false;
    setGameState('countdown');
    setCountdown(3);

    let count = 3;
    const countTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countTimer);
        setGameState('playing');
        beatBoutAudio.startTrack();
      }
    }, 700);
  };

  // 일시정지 (Pause)
  const handlePause = () => {
    if (gameState === 'playing') {
      beatBoutAudio.pause();
      setGameState('paused');
    }
  };

  // 재개 (Resume)
  const handleResume = async () => {
    if (gameState === 'paused') {
      await beatBoutAudio.resume();
      setGameState('playing');
    }
  };

  // 탭 백그라운드 전환 시 자동 일시정지
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && gameState === 'playing') {
        handlePause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [gameState]);

  // 게임 종료 (클리어 or 녹다운)
  const finishGame = useCallback(
    (isClear: boolean) => {
      if (isGameOverRef.current) return;
      isGameOverRef.current = true;
      beatBoutAudio.stopTrack();

      const totalNotes = notesRef.current.length;
      const totalHits = countsRef.current.PERFECT + countsRef.current.GREAT + countsRef.current.GOOD;
      const accuracy = totalNotes > 0 ? (totalHits / totalNotes) * 100 : 0;

      const currentScore = score;
      const isNewHigh = currentScore > highScore;
      if (isNewHigh) {
        setHighScore(currentScore);
        localStorage.setItem(STORAGE_KEY_HIGHSCORE, String(currentScore));
      }

      setSummary({
        finalScore: currentScore,
        highScore: Math.max(currentScore, highScore),
        isNewHigh,
        maxCombo,
        accuracy,
        counts: { ...countsRef.current },
        totalNotes,
        isClear,
      });

      setGameState(isClear ? 'complete' : 'knockout');

      if (isClear) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }
    },
    [highScore, maxCombo, score]
  );

  // 펀치 명중 및 이펙트 트리거
  const triggerHitImpact = useCallback(
    (hand: 'left' | 'right', grade: JudgementGrade) => {
      const now = performance.now();

      // 1. 플레이어 펀치 전진
      setPlayerFistState((prev) => ({
        ...prev,
        [hand === 'left' ? 'leftPunchTime' : 'rightPunchTime']: now,
      }));

      // 2. 복서 안면 피격 모션
      setBoxerState((prev) => ({
        ...prev,
        hitSide: hand,
        hitTime: now,
      }));

      // 3. 독립 원형 충격파 (명중 좌표: 복서 안면 부근)
      const hitX = hand === 'left' ? gameWidth * 0.44 : gameWidth * 0.56;
      const hitY = gameHeight * 0.35;
      const newShockwave: Shockwave = {
        id: `sw-${now}-${Math.random()}`,
        x: hitX,
        y: hitY,
        hand,
        grade,
        startTime: now,
        durationMs: 250,
      };

      setShockwaves((prev) => [...prev.slice(-10), newShockwave]);

      // 4. 화면 연출 (플래시, 미세 셰이크, 진동)
      setIsHitFlashing(true);
      setTimeout(() => setIsHitFlashing(false), 50);

      setScreenShake(5);
      setTimeout(() => setScreenShake(0), 100);

      if (navigator.vibrate) {
        navigator.vibrate(hand === 'left' ? [15, 20] : [20, 30]);
      }
    },
    [gameHeight, gameWidth]
  );

  // 입력 판정 처리
  const handleButtonPress = useCallback(
    (hand: 'left' | 'right') => {
      if (gameState !== 'playing' || isGameOverRef.current) return;

      const trackTime = beatBoutAudio.getTrackTime() - config.timingOffsetMs / 1000;

      // 가장 가까운 pending 노트 탐색 (양손 모두 검색하여 잘못된 손 체크)
      let closestNote: FallingNote | null = null;
      let minDiffMs = Infinity;

      for (const note of notesRef.current) {
        if (note.state === 'pending') {
          const diffMs = (trackTime - note.targetTime) * 1000;
          if (Math.abs(diffMs) < Math.abs(minDiffMs)) {
            minDiffMs = diffMs;
            closestNote = note;
          }
        }
      }

      const absDiff = Math.abs(minDiffMs);

      if (closestNote && absDiff <= config.windowB) {
        // 판정 범위 안
        if (closestNote.hand !== hand) {
          // 반대쪽 손을 누른 경우 -> MISS 처리 (요구사항)
          closestNote.state = 'miss';
          closestNote.judgement = 'MISS';
          closestNote.missTime = trackTime;
          countsRef.current.MISS += 1;
          setCombo(0);
          beatBoutAudio.playMissWhoosh();
          setCurrentHp((prev) => {
            const next = Math.max(0, prev - config.hpLossMiss);
            if (next <= 0) finishGame(false);
            return next;
          });
          setLastJudgementText('MISS · WRONG HAND');
          setLastJudgementColor('#ef4444');
          return;
        }

        // 정상 유효 타격
        closestNote.state = 'hit';
        let grade: JudgementGrade = 'GOOD';
        let pts = config.scoreB;
        let hpAdd = config.hpRecoveryB;
        let text = 'B · GOOD';
        let color = '#38bdf8';

        if (absDiff <= config.windowS) {
          grade = 'PERFECT';
          pts = config.scoreS;
          hpAdd = config.hpRecoveryS;
          text = 'S · PERFECT';
          color = '#2dd4bf';
        } else if (absDiff <= config.windowA) {
          grade = 'GREAT';
          pts = config.scoreA;
          hpAdd = config.hpRecoveryA;
          text = 'A · GREAT';
          color = '#34d399';
        }

        closestNote.judgement = grade;
        closestNote.hitDeltaMs = minDiffMs;
        countsRef.current[grade] += 1;

        // 점수 & 콤보 가산
        setCombo((prev) => {
          const next = prev + 1;
          setMaxCombo((m) => Math.max(m, next));
          // 콤보 보너스: 콤보 * 10
          setScore((s) => s + pts + next * 10);
          return next;
        });

        // 체력 회복
        setCurrentHp((prev) => Math.min(config.maxHp, prev + hpAdd));

        // 타격음 & 안면 피격 연출
        if (hand === 'left') {
          beatBoutAudio.playPunchLeft();
        } else {
          beatBoutAudio.playPunchRight();
        }

        triggerHitImpact(hand, grade);

        setLastJudgementText(text);
        setLastJudgementColor(color);
      } else {
        // 판정 범위 밖: 너무 이른 입력 (Early Blank Tap)
        // 노트를 소비하지 않고 작은 체력 페널티만 적용 (요구사항)
        beatBoutAudio.playMissWhoosh();
        setCurrentHp((prev) => {
          const next = Math.max(0, prev - config.hpLossEarlyBlank);
          if (next <= 0) finishGame(false);
          return next;
        });
        setLastJudgementText('TOO EARLY · PENALTY');
        setLastJudgementColor('#94a3b8');
      }
    },
    [config, finishGame, gameState, triggerHitImpact]
  );

  // 키보드 이벤트 리스너 (e.code 기준: F/←, J/→, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // 시작 화면에서 스페이스바로 시작
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'title' || gameState === 'complete' || gameState === 'knockout') {
          startGame();
          return;
        } else if (gameState === 'playing') {
          handlePause();
          return;
        } else if (gameState === 'paused') {
          handleResume();
          return;
        }
      }

      if (gameState !== 'playing') return;

      // 왼손 입력: F 또는 ArrowLeft, KeyA
      if (['KeyF', 'ArrowLeft', 'KeyA', 'KeyD'].includes(e.code) || ['f', 'a', 'd', 'ㄹ', 'ㅁ', 'ㅇ'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setLeftButtonPressed(true);
        handleButtonPress('left');
      }
      // 오른손 입력: J 또는 ArrowRight, KeyL, Semicolon
      else if (['KeyJ', 'ArrowRight', 'KeyK', 'KeyL'].includes(e.code) || ['j', 'k', 'l', 'ㅓ', 'ㅏ', 'ㅣ'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setRightButtonPressed(true);
        handleButtonPress('right');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyF', 'ArrowLeft', 'KeyA', 'KeyD'].includes(e.code) || ['f', 'a', 'd', 'ㄹ', 'ㅁ', 'ㅇ'].includes(e.key.toLowerCase())) {
        setLeftButtonPressed(false);
      } else if (['KeyJ', 'ArrowRight', 'KeyK', 'KeyL'].includes(e.code) || ['j', 'k', 'l', 'ㅓ', 'ㅏ', 'ㅣ'].includes(e.key.toLowerCase())) {
        setRightButtonPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleButtonPress]);

  // 메인 게임 루프 (60fps RAF)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = () => {
      const trackTime = beatBoutAudio.getTrackTime() - config.timingOffsetMs / 1000;
      const leftTime = Math.max(0, 60 - trackTime);
      setRemainingTime(Math.ceil(leftTime));

      // 1. 상대 복서의 공격 위협 전조 감지 (노트가 0.3초 내에 접근할 때 해당 주먹을 전방으로 뻗음)
      let threatHand: 'left' | 'right' | null = null;
      for (const note of notesRef.current) {
        if (note.state === 'pending') {
          const timeUntil = note.targetTime - trackTime;
          if (timeUntil > 0 && timeUntil <= 0.32) {
            threatHand = note.hand;
            break;
          }
        }
      }

      if (threatHand) {
        setBoxerState((prev) => ({
          ...prev,
          threatSide: threatHand,
          threatTime: performance.now(),
        }));
      }

      // 2. 놓친 노트(MISS) 처리 (판정 윈도우 +220ms를 지나치면 Miss)
      for (const note of notesRef.current) {
        if (note.state === 'pending' && trackTime - note.targetTime > config.windowB / 1000) {
          note.state = 'miss';
          note.judgement = 'MISS';
          note.missTime = trackTime;
          countsRef.current.MISS += 1;
          setCombo(0);
          beatBoutAudio.playMissWhoosh();
          setCurrentHp((prev) => {
            const next = Math.max(0, prev - config.hpLossMiss);
            if (next <= 0) finishGame(false);
            return next;
          });
          setLastJudgementText('MISS');
          setLastJudgementColor('#ef4444');
        }
      }

      setNotes([...notesRef.current]);

      // 3. 60초 완주 시 클리어
      if (trackTime >= 60) {
        finishGame(true);
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [config, finishGame, gameState]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-2 sm:p-6 select-none font-sans overflow-hidden">
      {/* 데스크톱 외곽 아케이드 프레임 (모바일에서는 숨김) */}
      <div className="hidden lg:flex flex-col justify-between w-64 h-[736px] mr-6 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl text-xs backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-black text-lg tracking-wider">
            🥊 BEAT BOUT
          </div>
          <p className="text-slate-400 mt-1 leading-relaxed">
            정면의 복서와 60초 동안 음악에 맞춰 펼치는 리듬 복싱 배틀!
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>조작 키 안내</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-teal-400">왼손 펀치:</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">F / ◀</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sky-400">오른손 펀치:</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">J / ▶</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">시작/정지:</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">Space</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1 text-[11px] font-mono">
            <div className="font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>판정 기준</span>
            </div>
            <div className="text-teal-300">S · PERFECT: ±80ms (1000점)</div>
            <div className="text-emerald-300">A · GREAT: ±150ms (700점)</div>
            <div className="text-sky-300">B · GOOD: ±220ms (400점)</div>
            <div className="text-red-400">MISS: 220ms 초과 / 오타</div>
          </div>
        </div>

        <div className="text-slate-500 text-[10px] text-center">
          HIGH SCORE: <span className="text-amber-400 font-bold font-mono">{highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* 중앙 모바일 세로형 게임 화면 프레임 (414 x 736) */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-[0_0_50px_rgba(45,212,191,0.15)] bg-slate-950 flex flex-col justify-between"
        style={{ width: `${gameWidth}px`, height: `${gameHeight}px` }}
      >
        {/* 1. 최상단 약 10% HUD: 체력 바, 현재 수치, 일시정지 */}
        <div className="relative z-30 px-4 pt-3 pb-2 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            {/* 체력 게이지 */}
            <div className="flex-1 mr-4">
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="font-bold flex items-center gap-1 text-slate-200">
                  ❤️ HP{' '}
                  <span className={currentHp <= 25 ? 'text-red-400 font-black animate-pulse' : 'text-teal-300'}>
                    {Math.round(currentHp)}/{config.maxHp}
                  </span>
                </span>
                <span className="font-mono text-amber-300 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {remainingTime}s
                </span>
              </div>

              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    currentHp > 50
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                      : currentHp > 25
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                      : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${(currentHp / config.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* 일시정지 버튼 */}
            {gameState === 'playing' && (
              <button
                onClick={handlePause}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95"
                title="일시정지"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 스코어 & 콤보 (상단 미니 헤더) */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              SCORE: <span className="font-black text-amber-300 text-sm">{score.toLocaleString()}</span>
            </div>
            {combo > 1 && (
              <div className="text-yellow-400 font-black tracking-wider animate-bounce-short">
                🔥 {combo} COMBO!
              </div>
            )}
          </div>
        </div>

        {/* 2. 주 연출 영역: 캔버스 (복서, 링, 플레이어 펀치, 충격파) */}
        <BoxerRingCanvas
          width={gameWidth}
          height={gameHeight}
          boxerState={boxerState}
          playerFistState={playerFistState}
          shockwaves={shockwaves}
          lastJudgementText={lastJudgementText}
          lastJudgementColor={lastJudgementColor}
          isHitFlashing={isHitFlashing}
          screenShake={screenShake}
        />

        {/* 3. 수직 낙하 노트 및 중간 반투명 터치 버튼 레이어 */}
        {gameState === 'playing' && (
          <FallingNotesLayer
            width={gameWidth}
            height={gameHeight}
            notes={notes}
            currentTrackTime={beatBoutAudio.getTrackTime() - config.timingOffsetMs / 1000}
            approachTimeSec={config.approachTimeSec}
            leftButtonPressed={leftButtonPressed}
            rightButtonPressed={rightButtonPressed}
            onButtonPress={(hand) => {
              if (hand === 'left') setLeftButtonPressed(true);
              else setRightButtonPressed(true);
              handleButtonPress(hand);
            }}
            onButtonRelease={(hand) => {
              if (hand === 'left') setLeftButtonPressed(false);
              else setRightButtonPressed(false);
            }}
          />
        )}

        {/* 4. 카운트다운 오버레이 (3, 2, 1) */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
            <div className="text-xs font-black tracking-widest text-teal-400 uppercase animate-pulse">
              GET READY TO BOUT
            </div>
            <div className="text-7xl font-black text-white font-mono mt-2 drop-shadow-[0_0_25px_rgba(45,212,191,0.8)] animate-bounce-short">
              {countdown}
            </div>
            <p className="text-xs text-slate-300 mt-4 font-mono">
              왼손(F / ◀) • 오른손(J / ▶)
            </p>
          </div>
        )}

        {/* 5. 시작 화면 (Title Screen) */}
        {gameState === 'title' && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6 text-center animate-fade-in">
            {/* 타이틀 로고 */}
            <div className="pt-8 space-y-2">
              <div className="text-[11px] font-bold tracking-widest text-teal-400 font-mono">
                ORIGINAL RHYTHM BOXING
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-400 to-orange-400 drop-shadow">
                BEAT BOUT
              </h1>
              <div className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">ROUND 1: TIE-BREAKER</span>
                <span>•</span>
                <span>120 BPM (60s)</span>
              </div>
            </div>

            {/* 조작 및 안내 카드 */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 text-left">
              <div className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>게임 조작법</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                  <div className="text-teal-400 font-bold">민트색 노트 (좌)</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">왼쪽 버튼 / [F] / [◀]</div>
                </div>
                <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                  <div className="text-sky-400 font-bold">하늘색 노트 (우)</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">오른쪽 버튼 / [J] / [▶]</div>
                </div>
              </div>

              {/* 판정 보정 슬라이더 (-200 ~ +200ms) */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-teal-400" /> 타이밍 보정 (Offset)
                  </span>
                  <span className="font-bold text-teal-300">{config.timingOffsetMs} ms</span>
                </div>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  step={5}
                  value={config.timingOffsetMs}
                  onChange={(e) => updateOffset(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>-200ms (일찍)</span>
                  <span>0ms (기본)</span>
                  <span>+200ms (늦게)</span>
                </div>
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="pb-4 space-y-2">
              <button
                onClick={startGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-sky-500 to-orange-500 hover:from-teal-300 hover:to-orange-400 text-slate-950 font-black text-lg tracking-wider shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>ENTER THE RING</span>
              </button>
              <div className="text-[11px] text-slate-500 font-mono">
                [Space 키로도 즉시 시작 가능]
              </div>
            </div>
          </div>
        )}

        {/* 6. 일시정지 모달 */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xs space-y-4">
              <div className="text-xl font-black text-amber-300 font-mono">PAUSED</div>
              <p className="text-xs text-slate-400">경기가 잠시 멈췄습니다.</p>
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleResume}
                  className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" /> 경기 재개
                </button>
                <button
                  onClick={startGame}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" /> 처음부터 재도전
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. 결과 모달 (ROUND COMPLETE vs KNOCK OUT) */}
        {(gameState === 'complete' || gameState === 'knockout') && summary && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between p-6 text-center animate-fade-in">
            <div className="pt-6 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-slate-400">
                MATCH RESULT
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                {summary.isClear ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400 drop-shadow">
                    🏆 ROUND COMPLETE!
                  </span>
                ) : (
                  <span className="text-rose-500 drop-shadow">
                    💥 KNOCK OUT!
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {summary.isClear ? '60초 라운드를 무사히 버텨냈습니다!' : '체력이 모두 소진되었습니다!'}
              </p>
            </div>

            {/* 스코어 카드 */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <div>
                <div className="text-[11px] text-slate-400 font-mono">FINAL SCORE</div>
                <div className="text-4xl font-black text-amber-300 font-mono tracking-wider">
                  {summary.finalScore.toLocaleString()}
                </div>
                {summary.isNewHigh && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-full mt-1 border border-amber-500/40 animate-pulse">
                    <Sparkles className="w-3 h-3" /> NEW RECORD!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-800">
                <div className="p-2 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 text-[10px]">MAX COMBO</div>
                  <div className="text-teal-300 font-bold text-sm">{summary.maxCombo}</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <div className="text-slate-400 text-[10px]">ACCURACY</div>
                  <div className="text-emerald-300 font-bold text-sm">{summary.accuracy.toFixed(1)}%</div>
                </div>
              </div>

              {/* 판정 분포 (S, A, B, MISS) */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono">
                <div className="p-1.5 bg-teal-500/10 rounded border border-teal-500/30">
                  <div className="text-[10px] text-teal-400 font-bold">PERFECT</div>
                  <div className="text-xs font-bold text-slate-100">{summary.counts.PERFECT}</div>
                </div>
                <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-bold">GREAT</div>
                  <div className="text-xs font-bold text-slate-100">{summary.counts.GREAT}</div>
                </div>
                <div className="p-1.5 bg-sky-500/10 rounded border border-sky-500/30">
                  <div className="text-[10px] text-sky-400 font-bold">GOOD</div>
                  <div className="text-xs font-bold text-slate-100">{summary.counts.GOOD}</div>
                </div>
                <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/30">
                  <div className="text-[10px] text-rose-400 font-bold">MISS</div>
                  <div className="text-xs font-bold text-slate-100">{summary.counts.MISS}</div>
                </div>
              </div>
            </div>

            {/* 재도전 버튼 */}
            <div className="pb-4 space-y-2">
              <button
                onClick={startGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-sky-500 to-orange-500 hover:from-teal-300 hover:to-orange-400 text-slate-950 font-black text-base tracking-wider shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                <span>RETRY MATCH (다시 도전)</span>
              </button>
              <button
                onClick={() => setGameState('title')}
                className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
              >
                타이틀로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 데스크톱 우측 아케이드 정보 패널 (모바일에서는 숨김) */}
      <div className="hidden lg:flex flex-col justify-between w-64 h-[736px] ml-6 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl text-xs backdrop-blur-md">
        <div>
          <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>게임 특징 & 재미</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            음악 비트, 낙하 노트, 입력 판정, 펀치 타격, 상대 안면 변형, 충격파가 단 하나의 순간에 완벽히 일치하는 짜릿한 손맛!
          </p>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="font-bold text-teal-300">💡 플레이 팁</div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-3">
            <li>노트가 반투명 원형 버튼과 <strong>완전히 겹치는 순간</strong>에 타격하세요.</li>
            <li>노트가 없거나 너무 일찍 치면 작은 체력 페널티가 부여됩니다.</li>
            <li>키보드 한/영 상태와 관계없이 언제든 <strong>F / J</strong> 로 타격됩니다.</li>
          </ul>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400">
          <div>VERSION: BEAT BOUT v1.0</div>
          <div>PLATFORM: MOBILE WEB / PC</div>
          <div>AUDIO: 120 BPM SYNTH V1</div>
        </div>
      </div>
    </div>
  );
};
