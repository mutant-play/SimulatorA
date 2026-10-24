import React from 'react';
import { BackgroundTheme } from '../../game/gameTypes';

interface CharacterBackgroundProps {
  theme: BackgroundTheme;
  currentFrame: number; // 0, 1, 2, 3
  lastJudgement: 'S' | 'A' | 'B' | 'MISS' | null;
  isHitReacting: boolean;
  bpm: number;
}

export const CharacterBackground: React.FC<CharacterBackgroundProps> = ({
  theme,
  currentFrame,
  lastJudgement,
  isHitReacting,
}) => {
  const isMiss = lastJudgement === 'MISS' && isHitReacting;

  // 캐릭터 아이콘 및 테마별 일러스트 렌더링
  const getThemeArt = () => {
    switch (theme.id) {
      case 1: // 북 요괴 (돈군)
        return (
          <div className="relative flex flex-col items-center">
            {/* 등불 장식 */}
            <div className="absolute -top-12 flex space-x-16">
              <span className="text-3xl animate-bounce">🏮</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.15s' }}>🏮</span>
            </div>
            {/* 북 캐릭터 본체 */}
            <div
              className={`w-36 h-36 rounded-full border-4 border-amber-900 flex items-center justify-center shadow-2xl transition-transform duration-100 ${
                isMiss
                  ? 'bg-red-400 rotate-12 scale-90'
                  : isHitReacting
                  ? 'bg-amber-400 scale-110 shadow-amber-400/50'
                  : currentFrame % 2 === 0
                  ? 'bg-amber-300 scale-100 -translate-y-1'
                  : 'bg-amber-300 scale-95 translate-y-1'
              }`}
            >
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-amber-700 flex flex-col items-center justify-center">
                {isMiss ? (
                  <div className="text-3xl">😵</div>
                ) : isHitReacting ? (
                  <div className="text-4xl animate-pulse">🥁</div>
                ) : (
                  <div className="text-3xl">{currentFrame > 1 ? '😆' : '😊'}</div>
                )}
                <span className="text-xs font-bold text-amber-950 mt-1">돈군</span>
              </div>
            </div>
            {/* 북채 (Sticks) 액션 */}
            <div className="flex space-x-12 -mt-4 z-10">
              <div
                className={`w-3 h-12 bg-amber-800 rounded-full origin-top transition-transform ${
                  isHitReacting ? '-rotate-45 translate-y-2' : currentFrame === 1 ? 'rotate-12' : '-rotate-12'
                }`}
              />
              <div
                className={`w-3 h-12 bg-amber-800 rounded-full origin-top transition-transform ${
                  isHitReacting ? 'rotate-45 translate-y-2' : currentFrame === 1 ? '-rotate-12' : 'rotate-12'
                }`}
              />
            </div>
          </div>
        );

      case 2: // 힙합 비둘기
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss
                  ? 'rotate-45 scale-90 opacity-70'
                  : isHitReacting
                  ? 'scale-125 -translate-y-3'
                  : currentFrame % 2 === 0
                  ? 'scale-105 translate-y-1'
                  : 'scale-95 -translate-y-1'
              }`}
            >
              {isMiss ? '🍗' : '🕊️'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-0.5 bg-blue-600/60 rounded text-xs text-white font-mono">
                {isHitReacting ? '🎵 PEK PEK!! 🎵' : '🕶️ 구구 바운스'}
              </span>
            </div>
          </div>
        );

      case 3: // 사이버 닌자
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-all duration-100 ${
                isMiss
                  ? 'grayscale scale-75'
                  : isHitReacting
                  ? 'scale-125 text-purple-400 drop-shadow-[0_0_15px_#a855f7]'
                  : 'scale-100'
              }`}
            >
              {isHitReacting ? '⚡🥷⚡' : '🥷'}
            </div>
            {isHitReacting && (
              <span className="text-xl animate-spin text-purple-300 font-bold mt-1">✳️ 슉!</span>
            )}
          </div>
        );

      case 4: // 고양이 DJ
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'rotate-180 scale-90' : isHitReacting ? 'scale-125 -rotate-6' : 'scale-100'
              }`}
            >
              {isMiss ? '🙀' : isHitReacting ? '😼' : '😸'}
            </div>
            <div className="flex items-center space-x-2 mt-2 bg-pink-900/60 px-3 py-1 rounded-full border border-pink-500/30">
              <span className="animate-spin text-lg">💿</span>
              <span className="text-xs text-pink-200 font-bold">
                {isHitReacting ? '냥냥 스크래치!!' : 'DJ 나비 ON AIR'}
              </span>
            </div>
          </div>
        );

      case 5: // 무림 팬더
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'scale-75' : isHitReacting ? 'scale-125 translate-x-2' : 'scale-100'
              }`}
            >
              {isMiss ? '🩹' : '🐼'}
            </div>
            <div className="mt-2 text-emerald-400 font-bold text-sm tracking-wider">
              {isHitReacting ? '💥 쿵푸 정권! 💥' : '🎋 대나무 기합'}
            </div>
          </div>
        );

      case 6: // 우주 토끼
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'rotate-90' : isHitReacting ? 'scale-125 -translate-y-4' : 'scale-100 translate-y-1'
              }`}
            >
              {isMiss ? '🛸💥' : '🐰'}
            </div>
            <div className="mt-2 text-cyan-400 font-bold text-xs">
              {isHitReacting ? '🚀 당근 추진력 가동!' : '🛰️ 달기지 교신중'}
            </div>
          </div>
        );

      case 7: // 도트 기사
        return (
          <div className="flex flex-col items-center font-mono">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'rotate-12 scale-90' : isHitReacting ? 'scale-125 text-yellow-300' : 'scale-100'
              }`}
            >
              {isMiss ? '🛡️💔' : isHitReacting ? '⚔️🛡️' : '🛡️🧑‍🌾'}
            </div>
            <div className="mt-2 text-yellow-400 font-bold text-xs">
              {isHitReacting ? '[PARRY SUCCESS!!]' : '[GUARD READY]'}
            </div>
          </div>
        );

      case 8: // 스모 장사
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'scale-90 opacity-60' : isHitReacting ? 'scale-125 text-rose-400' : 'scale-100'
              }`}
            >
              {isMiss ? '💧' : isHitReacting ? '✋💥' : '🥋'}
            </div>
            <div className="mt-2 text-rose-300 font-bold text-xs">
              {isHitReacting ? '철~썩!! 도효 밀어내기!' : '천하장사 기합'}
            </div>
          </div>
        );

      case 9: // 사이버 아이돌
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'scale-75' : isHitReacting ? 'scale-125 -rotate-6' : 'scale-100'
              }`}
            >
              {isMiss ? '💔' : isHitReacting ? '🎤✨' : '💃'}
            </div>
            <div className="mt-2 text-purple-300 font-bold text-xs flex items-center space-x-1">
              <span className="animate-pulse">💖</span>
              <span>{isHitReacting ? '스포트라이트 윙크!' : '유나 스테이지'}</span>
            </div>
          </div>
        );

      case 10: // 용접봇
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'rotate-45' : isHitReacting ? 'scale-125 text-orange-400' : 'scale-100'
              }`}
            >
              {isMiss ? '⚙️💥' : isHitReacting ? '⚡🤖🔨' : '🤖'}
            </div>
            <div className="mt-2 text-slate-300 font-mono text-xs">
              {isHitReacting ? 'OVERCLOCK: 100%' : 'STANDBY MODE'}
            </div>
          </div>
        );

      case 11: // 견습 마법사
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'scale-75 opacity-70' : isHitReacting ? 'scale-125 text-indigo-300' : 'scale-100'
              }`}
            >
              {isMiss ? '🪄💨' : isHitReacting ? '🧙‍♂️⚡' : '🧙'}
            </div>
            <div className="mt-2 text-indigo-300 font-bold text-xs">
              {isHitReacting ? '아케인 썬더 버스트!!' : '마법 영창 중'}
            </div>
          </div>
        );

      case 12: // 지옥 록커
        return (
          <div className="flex flex-col items-center">
            <div
              className={`text-7xl transition-transform duration-100 ${
                isMiss ? 'rotate-90' : isHitReacting ? 'scale-130 text-red-500' : 'scale-100'
              }`}
            >
              {isMiss ? '💀' : isHitReacting ? '🎸🔥🤘' : '😈🎸'}
            </div>
            <div className="mt-2 text-red-400 font-black tracking-widest text-xs">
              {isHitReacting ? '🔥 HELLFIRE SHREDDING! 🔥' : 'INFERNO TUNING'}
            </div>
          </div>
        );

      default:
        return <div className="text-6xl">🎵</div>;
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-500"
      style={{
        background: `radial-gradient(circle at center, ${theme.themeColor}1a 0%, #030712 85%)`,
      }}
    >
      {/* 배경 장식 비트 펄스 링 */}
      <div
        className={`absolute rounded-full border border-dashed transition-all duration-300 pointer-events-none ${
          isHitReacting
            ? 'w-96 h-96 opacity-40 scale-110'
            : currentFrame % 2 === 0
            ? 'w-80 h-80 opacity-20 scale-100'
            : 'w-72 h-72 opacity-10 scale-95'
        }`}
        style={{ borderColor: theme.themeColor }}
      />

      {/* 중앙 캐릭터 렌더링 */}
      <div className="relative z-10 flex flex-col items-center">
        {getThemeArt()}

        {/* 4프레임 인디케이터 (기획 검증용) */}
        <div className="flex items-center space-x-1.5 mt-5 bg-black/40 px-3 py-1 rounded-full border border-white/10">
          <span className="text-[10px] text-slate-400 mr-1 font-mono">Frame:</span>
          {[0, 1, 2, 3].map((f) => (
            <div
              key={f}
              className={`w-2 h-2 rounded-full transition-all ${
                currentFrame === f
                  ? 'bg-amber-400 scale-125 shadow-sm shadow-amber-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
          <span className="text-[10px] font-bold ml-1 text-slate-300">
            {theme.actionName}
          </span>
        </div>
      </div>
    </div>
  );
};
