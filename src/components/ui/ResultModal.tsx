import React, { useEffect } from 'react';
import { GamePlayResult, SongData, BackgroundTheme } from '../../game/gameTypes';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';

interface ResultModalProps {
  result: GamePlayResult;
  onRetry: () => void;
  onBackToLobby: () => void;
  allSongs: SongData[];
  allBgs: BackgroundTheme[];
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onRetry,
  onBackToLobby,
  allSongs,
  allBgs,
}) => {
  useEffect(() => {
    if (result.isCleared && (result.rank === 'S' || result.rank === 'A')) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'S':
        return 'text-amber-300 border-amber-400 bg-amber-500/20 shadow-amber-500/40';
      case 'A':
        return 'text-emerald-300 border-emerald-400 bg-emerald-500/20 shadow-emerald-500/40';
      case 'B':
        return 'text-blue-300 border-blue-400 bg-blue-500/20 shadow-blue-500/40';
      case 'C':
        return 'text-purple-300 border-purple-400 bg-purple-500/20 shadow-purple-500/40';
      default:
        return 'text-rose-400 border-rose-500 bg-rose-500/20 shadow-rose-500/40';
    }
  };

  const unlockedSong = allSongs.find((s) => result.newlyUnlockedSongs.includes(s.id));
  const unlockedBg = allBgs.find((b) => result.newlyUnlockedBgs.includes(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-5">
        {/* 상단 타이틀 */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            STAGE RESULT
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1 flex items-center justify-center gap-2">
            {result.isCleared ? (
              <>
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>STAGE CLEAR!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-rose-500" />
                <span className="text-rose-400">STAGE FAILED</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {result.song.title} ({result.difficulty.toUpperCase()})
          </p>
        </div>

        {/* 랭크 및 점수 카드 */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-around">
          {/* 랭크 심볼 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-5xl font-black shadow-xl ${getRankBadge(
                result.rank
              )}`}
            >
              {result.isCleared ? result.rank : 'F'}
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">CLEAR RANK</span>
          </div>

          {/* 스코어 & 콤보 */}
          <div className="text-right space-y-1">
            <div className="text-xs text-slate-400 font-mono">TOTAL SCORE</div>
            <div className="text-3xl font-black text-amber-300 font-mono tracking-wider">
              {result.score.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300 font-mono">
              MAX COMBO: <span className="font-bold text-yellow-400">{result.maxCombo}</span>
            </div>
          </div>
        </div>

        {/* 판정 통계 (S, A, B, MISS) */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-slate-800/60 rounded-lg border border-amber-500/20">
            <div className="text-xs font-bold text-amber-400">S</div>
            <div className="text-base font-black font-mono text-slate-100">{result.judgements.S}</div>
          </div>
          <div className="p-2 bg-slate-800/60 rounded-lg border border-emerald-500/20">
            <div className="text-xs font-bold text-emerald-400">A</div>
            <div className="text-base font-black font-mono text-slate-100">{result.judgements.A}</div>
          </div>
          <div className="p-2 bg-slate-800/60 rounded-lg border border-blue-500/20">
            <div className="text-xs font-bold text-blue-400">B</div>
            <div className="text-base font-black font-mono text-slate-100">{result.judgements.B}</div>
          </div>
          <div className="p-2 bg-slate-800/60 rounded-lg border border-rose-500/20">
            <div className="text-xs font-bold text-rose-400">MISS</div>
            <div className="text-base font-black font-mono text-slate-100">{result.judgements.MISS}</div>
          </div>
        </div>

        {/* 경험치 및 레벨 성장 카드 */}
        <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40 text-left space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>획득 경험치: +{result.expGained} EXP</span>
            </span>
            <span className="font-mono text-xs text-slate-300 font-semibold">
              Lv. {result.oldLevel} {result.leveledUp ? `➔ Lv. ${result.newLevel} (LEVEL UP!)` : ''}
            </span>
          </div>

          {result.leveledUp && (
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-xs text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">레벨 상승! 신규 콘텐츠가 해금되었습니다!</span>
                {unlockedSong && (
                  <div className="text-[11px] text-slate-300">
                    🎵 신규 음원: <span className="text-amber-300">{unlockedSong.title}</span>
                  </div>
                )}
                {unlockedBg && (
                  <div className="text-[11px] text-slate-300">
                    🎨 신규 배경: <span className="text-amber-300">{unlockedBg.name} ({unlockedBg.characterName})</span>
                  </div>
                )}
                <div className="text-[10px] text-amber-300/80 mt-0.5">
                  ※ 다음 게임은 신규 콘텐츠 고정 우선 규칙이 적용됩니다.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시하기</span>
          </button>

          <button
            onClick={onBackToLobby}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 transition active:scale-95"
          >
            <span>메인으로</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
