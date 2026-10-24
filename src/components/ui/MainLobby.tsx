import React, { useState } from 'react';
import {
  BackgroundTheme,
  Difficulty,
  PlayerProfile,
  SongData,
} from '../../game/gameTypes';
import {
  Play,
  Flame,
  Skull,
  Music,
  Sparkles,
  Lock,
  Upload,
  Info,
} from 'lucide-react';
import { audio } from '../../game/audioEngine';

interface MainLobbyProps {
  profile: PlayerProfile;
  allSongs: SongData[];
  allBgs: BackgroundTheme[];
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onStartGame: (song: SongData, bg: BackgroundTheme) => void;
  onUploadCustomSong: (song: SongData) => void;
}

export const MainLobby: React.FC<MainLobbyProps> = ({
  profile,
  allSongs,
  allBgs,
  selectedDifficulty,
  onSelectDifficulty,
  onStartGame,
  onUploadCustomSong,
}) => {
  const [activeTab, setActiveTab] = useState<'lobby' | 'inventory'>('lobby');
  const [customSongLoading, setCustomSongLoading] = useState(false);

  // 신규 해금 우선 규칙이 적용되는지 확인
  const isPriorityNew =
    profile.pendingFirstPlaySongId !== null || profile.pendingFirstPlayBgId !== null;

  const prioritySong = allSongs.find((s) => s.id === profile.pendingFirstPlaySongId);
  const priorityBg = allBgs.find((b) => b.id === profile.pendingFirstPlayBgId);

  // 게임 시작 버튼 클릭 핸들러 (랜덤 또는 신규 우선 선택)
  const handleStart = () => {
    let chosenSong: SongData;
    let chosenBg: BackgroundTheme;

    if (isPriorityNew && prioritySong && priorityBg) {
      chosenSong = prioritySong;
      chosenBg = priorityBg;
    } else {
      // 해금된 목록 중 무작위 추첨
      const availableSongs = allSongs.filter((s) => profile.unlockedSongs.includes(s.id));
      const availableBgs = allBgs.filter((b) => profile.unlockedBgs.includes(b.id));

      chosenSong =
        availableSongs[Math.floor(Math.random() * availableSongs.length)] || allSongs[0];
      chosenBg =
        availableBgs[Math.floor(Math.random() * availableBgs.length)] || allBgs[0];
    }

    onStartGame(chosenSong, chosenBg);
  };

  // 커스텀 음원 업로드 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomSongLoading(true);
    try {
      const duration = await audio.loadCustomAudioFile(file);
      const customSong: SongData = {
        id: 999,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: '사용자 커스텀 음원',
        bpm: 130, // 기본 가정
        duration: Math.min(Math.round(duration), 60),
        genre: 'User Audio File',
        unlockedAtLevel: 1,
      };
      onUploadCustomSong(customSong);
      alert(`음원 "${customSong.title}" 로드 완료! (길이: ${customSong.duration}초)`);
    } catch (err) {
      alert('오디오 파일 로드에 실패했습니다. mp3/wav 파일인지 확인해주세요.');
    } finally {
      setCustomSongLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* 1. 상단 프로필 & 계정 성장 헤더 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xl font-black text-slate-950 shadow-lg shadow-orange-500/20">
            Lv.{profile.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">리듬 마스터 (테스터)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono border border-amber-500/30">
                해금: {profile.unlockedSongs.length}/12곡
              </span>
            </div>
            {/* 경험치 바 */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (profile.currentExp / (100 + (profile.level - 1) * 50)) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {profile.currentExp}/{100 + (profile.level - 1) * 50} EXP
              </span>
            </div>
          </div>
        </div>

        {/* 탭 전환 (메인 / 콘텐츠 도감) */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'lobby'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            플레이
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            해금 도감
          </button>
        </div>
      </div>

      {activeTab === 'lobby' ? (
        <div className="space-y-6">
          {/* 신규 해금 우선 규칙 알림 배지 (기획서 D11) */}
          {isPriorityNew && prioritySong && priorityBg && (
            <div className="p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-transparent border border-amber-500/40 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div className="text-xs">
                  <div className="font-bold text-amber-300">신규 콘텐츠 우선 체험 대기 중!</div>
                  <div className="text-slate-300 text-[11px]">
                    🎵 {prioritySong.title} & 🎨 {priorityBg.name}
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                신규 고정
              </span>
            </div>
          )}

          {/* 2. 메인 게임 타이틀 배너 */}
          <div className="relative text-center py-6 px-4 bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 drop-shadow">
              🥁 TAIKO PROTO 🥁
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              두 개의 버튼(동/딱)으로 음악에 맞춰 행동하고 성장하는 리듬 액션 기획 시뮬레이터
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-orange-300">좌측: 동 (D,F)</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300">우측: 딱 (J,K)</span>
            </div>
          </div>

          {/* 3. 기획서 명시: 난이도 선택 버튼 3개 (Normal / Nightmare / GO TO HELL) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 px-1">난이도 선택 (DIFFICULTY)</div>
            <div className="grid grid-cols-3 gap-3">
              {/* Normal */}
              <button
                onClick={() => onSelectDifficulty('normal')}
                className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  selectedDifficulty === 'normal'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl">🌱</div>
                <div className="font-black text-sm tracking-wide">Normal</div>
                <div className="text-[10px] text-slate-400">표준 박자 / 입문</div>
              </button>

              {/* Nightmare */}
              <button
                onClick={() => onSelectDifficulty('nightmare')}
                className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  selectedDifficulty === 'nightmare'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Flame className="w-6 h-6 text-amber-400" />
                <div className="font-black text-sm tracking-wide">Nightmare</div>
                <div className="text-[10px] text-slate-400">8분음표 / 연타</div>
              </button>

              {/* GO TO HELL */}
              <button
                onClick={() => onSelectDifficulty('gototohell')}
                className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  selectedDifficulty === 'gototohell'
                    ? 'border-rose-500 bg-rose-500/25 text-rose-300 shadow-lg shadow-rose-500/30'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Skull className="w-6 h-6 text-rose-500" />
                <div className="font-black text-sm tracking-wide">GO TO HELL</div>
                <div className="text-[10px] text-slate-400">초고밀도 폭타</div>
              </button>
            </div>
          </div>

          {/* 4. 기획서 명시: 게임 시작 버튼 1개 */}
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-lg tracking-wider shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 transition-all active:scale-98"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>게임 시작 (GAME START)</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              ※ 시작 시 해금된 12종 음원과 배경 중 무작위(또는 신규 해금 우선)로 자동 선택되어 진행됩니다.
            </p>
          </div>

          {/* 5. 커스텀 음원 업로드 테스트 슬롯 */}
          <div className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>기획자용 커스텀 음원 로드 (MP3, WAV)</span>
            </div>
            <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold cursor-pointer border border-slate-700 transition">
              {customSongLoading ? '로드 중...' : '파일 선택'}
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        /* 콘텐츠 도감 (12종 음악 & 12종 배경 해금 상태) */
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold px-1">
            <Music className="w-4 h-4" />
            <span>음악 12곡 & 배경 12종 해금 현황 (레벨업으로 순차 해금)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {allSongs.map((song) => {
              const bg = allBgs.find((b) => b.id === song.id);
              const isUnlocked = profile.unlockedSongs.includes(song.id);

              return (
                <div
                  key={song.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                    isUnlocked
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-slate-950/60 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-amber-400 font-bold">
                          #{song.id}
                        </span>
                        <h4 className="font-bold text-xs text-slate-100">{song.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {song.genre} • BPM {song.bpm}
                      </p>
                    </div>

                    {!isUnlocked ? (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        <Lock className="w-3 h-3" /> Lv.{song.unlockedAtLevel}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold">해금됨</span>
                    )}
                  </div>

                  {bg && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="text-xs">🎨</span>
                      <span>배경: <strong>{bg.name}</strong> ({bg.characterName}의 {bg.actionName})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
