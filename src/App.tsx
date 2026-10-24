import React, { useState, useEffect } from 'react';
import {
  BackgroundTheme,
  Difficulty,
  GamePlayResult,
  Note,
  PlayerProfile,
  SimulatorConfig,
  SongData,
} from './game/gameTypes';
import {
  DEFAULT_BACKGROUNDS,
  DEFAULT_CONFIG,
  DEFAULT_SONGS,
} from './game/presetConfigs';
import { generateChart } from './game/chartGenerator';
import { MainLobby } from './components/ui/MainLobby';
import { GameCanvas } from './components/game/GameCanvas';
import { ResultModal } from './components/ui/ResultModal';
import { InspectorDrawer } from './components/inspector/InspectorDrawer';

const LOCAL_STORAGE_KEY_CONFIG = 'simulator_a_config_v1';
const LOCAL_STORAGE_KEY_PROFILE = 'simulator_a_profile_v1';

export const App: React.FC = () => {
  // 기획 파라미터 상태
  const [config, setConfig] = useState<SimulatorConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      // 로드 실패 시 기본값
    }
    return DEFAULT_CONFIG;
  });

  // 플레이어 계정 상태 (Lv 1 시작, 1번 곡/배경 기본 해금)
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // 무시
    }
    return {
      level: 1,
      currentExp: 0,
      maxLevel: 12,
      unlockedSongs: [1],
      unlockedBgs: [1],
      pendingFirstPlaySongId: null,
      pendingFirstPlayBgId: null,
      totalPlays: 0,
      clearCounts: { normal: 0, nightmare: 0, gototohell: 0 },
    };
  });

  // 화면 상태: 'lobby' | 'playing'
  const [view, setView] = useState<'lobby' | 'playing'>('lobby');

  // 난이도 (기본: normal)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // 현재 스테이지 정보
  const [currentSong, setCurrentSong] = useState<SongData>(DEFAULT_SONGS[0]);
  const [currentBg, setCurrentBg] = useState<BackgroundTheme>(DEFAULT_BACKGROUNDS[0]);
  const [currentNotes, setCurrentNotes] = useState<Note[]>([]);

  // 결과 모달 상태
  const [playResult, setPlayResult] = useState<GamePlayResult | null>(null);

  // 인스펙터 서랍 열림 여부
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // 음원 및 배경 마스터 목록
  const [songs, setSongs] = useState<SongData[]>(DEFAULT_SONGS);
  const [bgs] = useState<BackgroundTheme[]>(DEFAULT_BACKGROUNDS);

  // 설정 저장
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch {
      // 저장 실패 무시
    }
  }, [config]);

  // 프로필 저장
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // 저장 실패 무시
    }
  }, [profile]);

  // 게임 시작 트리거
  const handleStartGame = (song: SongData, bg: BackgroundTheme) => {
    setCurrentSong(song);
    setCurrentBg(bg);

    // 신규 고정 체험 소비 (기획서 D11)
    if (
      profile.pendingFirstPlaySongId === song.id ||
      profile.pendingFirstPlayBgId === bg.id
    ) {
      setProfile((prev) => ({
        ...prev,
        pendingFirstPlaySongId: null,
        pendingFirstPlayBgId: null,
      }));
    }

    // 채보 생성
    const notes = generateChart(song, difficulty, config);
    setCurrentNotes(notes);

    setPlayResult(null);
    setView('playing');
  };

  // 게임 종료 처리 (결과 정산 및 레벨업 루프)
  const handleGameEnd = (rawResult: GamePlayResult) => {
    const oldLevel = profile.level;
    let newLevel = oldLevel;
    let nextExp = profile.currentExp + rawResult.expGained;
    const newlyUnlockedSongs: number[] = [];
    const newlyUnlockedBgs: number[] = [];

    // 레벨업 계산 루프
    while (newLevel < profile.maxLevel) {
      const requiredExp = config.expPerLevelBase + (newLevel - 1) * config.expPerLevelScaling;
      if (nextExp >= requiredExp) {
        nextExp -= requiredExp;
        newLevel += 1;

        // 신규 콘텐츠 해금 (해당 레벨의 음원 & 배경)
        const unlockSong = songs.find((s) => s.unlockedAtLevel === newLevel);
        const unlockBg = bgs.find((b) => b.unlockedAtLevel === newLevel);

        if (unlockSong && !profile.unlockedSongs.includes(unlockSong.id)) {
          newlyUnlockedSongs.push(unlockSong.id);
        }
        if (unlockBg && !profile.unlockedBgs.includes(unlockBg.id)) {
          newlyUnlockedBgs.push(unlockBg.id);
        }
      } else {
        break;
      }
    }

    const leveledUp = newLevel > oldLevel;

    // 프로필 갱신
    setProfile((prev) => {
      const updatedUnlockedSongs = Array.from(
        new Set([...prev.unlockedSongs, ...newlyUnlockedSongs])
      );
      const updatedUnlockedBgs = Array.from(
        new Set([...prev.unlockedBgs, ...newlyUnlockedBgs])
      );

      // 신규 콘텐츠 우선 배정 예약 (기획서 D11)
      let nextPendingSong = prev.pendingFirstPlaySongId;
      let nextPendingBg = prev.pendingFirstPlayBgId;

      if (config.prioritizeNewUnlock && newlyUnlockedSongs.length > 0) {
        nextPendingSong = newlyUnlockedSongs[0];
        nextPendingBg = newlyUnlockedBgs[0] || null;
      }

      return {
        ...prev,
        level: newLevel,
        currentExp: nextExp,
        unlockedSongs: updatedUnlockedSongs,
        unlockedBgs: updatedUnlockedBgs,
        pendingFirstPlaySongId: nextPendingSong,
        pendingFirstPlayBgId: nextPendingBg,
        totalPlays: prev.totalPlays + 1,
        clearCounts: {
          ...prev.clearCounts,
          [difficulty]: prev.clearCounts[difficulty] + (rawResult.isCleared ? 1 : 0),
        },
      };
    });

    const finalizedResult: GamePlayResult = {
      ...rawResult,
      oldLevel,
      newLevel,
      leveledUp,
      newlyUnlockedSongs,
      newlyUnlockedBgs,
    };

    setPlayResult(finalizedResult);
  };

  // 다시하기
  const handleRetry = () => {
    setPlayResult(null);
    const notes = generateChart(currentSong, difficulty, config);
    setCurrentNotes(notes);
    setView('playing');
  };

  // 로비로 복귀
  const handleBackToLobby = () => {
    setPlayResult(null);
    setView('lobby');
  };

  // 커스텀 음원 등록
  const handleUploadCustomSong = (customSong: SongData) => {
    setSongs((prev) => [customSong, ...prev]);
    setProfile((prev) => ({
      ...prev,
      unlockedSongs: Array.from(new Set([...prev.unlockedSongs, customSong.id])),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 relative overflow-x-hidden">
      {/* 배경 장식 글로우 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 메인 뷰 라우팅 */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        {view === 'lobby' ? (
          <MainLobby
            profile={profile}
            allSongs={songs}
            allBgs={bgs}
            selectedDifficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            onStartGame={handleStartGame}
            onUploadCustomSong={handleUploadCustomSong}
          />
        ) : (
          <div className="w-full">
            <div className="w-full max-w-2xl mx-auto mb-2 flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-bold text-slate-300">
                🎵 {currentSong.title} • {difficulty.toUpperCase()}
              </span>
              <button
                onClick={handleBackToLobby}
                className="hover:text-amber-400 underline font-mono cursor-pointer"
              >
                [중도 포기 / ESC]
              </button>
            </div>

            <GameCanvas
              song={currentSong}
              background={currentBg}
              difficulty={difficulty}
              notes={currentNotes}
              config={config}
              onGameEnd={handleGameEnd}
              onQuit={handleBackToLobby}
            />
          </div>
        )}
      </main>

      {/* 결과 팝업 모달 */}
      {playResult && (
        <ResultModal
          result={playResult}
          onRetry={handleRetry}
          onBackToLobby={handleBackToLobby}
          allSongs={songs}
          allBgs={bgs}
        />
      )}

      {/* 기획 튜닝 인스펙터 서랍 (언제든 열어 실시간 튜닝 가능) */}
      <InspectorDrawer
        config={config}
        onChangeConfig={setConfig}
        onResetConfig={() => setConfig(DEFAULT_CONFIG)}
        isOpen={isInspectorOpen}
        onToggle={() => setIsInspectorOpen((prev) => !prev)}
      />

      {/* 하단 푸터 */}
      <footer className="text-center text-[11px] text-slate-600 mt-6 relative z-10">
        태고의 달인 오마주 리듬게임 기획 시뮬레이터 v0.1 • Simulator A • 기획서 연동
      </footer>
    </div>
  );
};
