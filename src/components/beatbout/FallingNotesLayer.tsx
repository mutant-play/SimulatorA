import React from 'react';
import { FallingNote } from '../../game/beatBoutTypes';

interface FallingNotesLayerProps {
  width: number;
  height: number;
  notes: FallingNote[];
  currentTrackTime: number; // 초 단위
  approachTimeSec: number; // 기본 0.8초
  leftButtonPressed: boolean;
  rightButtonPressed: boolean;
  onButtonPress: (hand: 'left' | 'right') => void;
  onButtonRelease: (hand: 'left' | 'right') => void;
}

export const FallingNotesLayer: React.FC<FallingNotesLayerProps> = ({
  width,
  height,
  notes,
  currentTrackTime,
  approachTimeSec,
  leftButtonPressed,
  rightButtonPressed,
  onButtonPress,
  onButtonRelease,
}) => {
  // 버튼 위치 좌표 (화면 중간 높이 52%, 복서를 가리지 않도록 양 끝에 배치)
  const buttonY = height * 0.52;
  const buttonRadius = 38; // 버튼 반지름
  const leftButtonX = 54; // 좌측 끝
  const rightButtonX = width - 54; // 우측 끝

  // 렌더링할 노트들 필터링
  // 1) 아직 도달 전: timeUntilHit <= approachTimeSec
  // 2) 놓친 노트(miss): 버튼 아래로 0.35초 동안 붉은색으로 페이드아웃 소멸
  const activeNotes = notes.filter((n) => {
    if (n.state === 'hit') return false; // 적중 노트는 즉시 사라짐

    if (n.state === 'miss') {
      const missElapsed = currentTrackTime - (n.missTime ?? n.targetTime);
      return missElapsed <= 0.35; // 0.35초 동안 하강 페이드아웃
    }

    const timeUntilHit = n.targetTime - currentTrackTime;
    return timeUntilHit <= approachTimeSec && timeUntilHit >= -0.22;
  });

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* 1. 수직 낙하 노트들 */}
      {activeNotes.map((note) => {
        const isLeft = note.hand === 'left';
        const targetX = isLeft ? leftButtonX : rightButtonX;

        let noteY = 0;
        let opacity = 1;
        let strokeColor = isLeft ? '#2dd4bf' : '#38bdf8';
        let fillColor = isLeft ? 'rgba(45, 212, 191, 0.25)' : 'rgba(56, 189, 248, 0.25)';

        if (note.state === 'miss') {
          // 놓친 노트: 버튼 아래로 계속 내려가면서 붉은색 페이드아웃
          const missElapsed = currentTrackTime - (note.missTime ?? note.targetTime);
          const dropExtra = (missElapsed / 0.35) * (height * 0.15); // 버튼 아래로 15% 더 하강
          noteY = buttonY + dropExtra;
          opacity = Math.max(0, 1 - missElapsed / 0.35);
          strokeColor = '#ef4444'; // 붉은색
          fillColor = 'rgba(239, 68, 68, 0.2)';
        } else {
          // 정상 접근 중인 노트: Y=0(상단)에서 Y=buttonY까지 선형 낙하
          const timeUntilHit = note.targetTime - currentTrackTime;
          const progress = 1 - timeUntilHit / approachTimeSec; // 0(상단) -> 1(버튼 겹침)
          noteY = Math.max(0, progress * buttonY);
          opacity = Math.min(1, Math.max(0.2, progress * 1.5));
        }

        return (
          <div
            key={note.id}
            className="absolute flex items-center justify-center transition-opacity"
            style={{
              left: `${targetX - buttonRadius}px`,
              top: `${noteY - buttonRadius}px`,
              width: `${buttonRadius * 2}px`,
              height: `${buttonRadius * 2}px`,
              opacity,
            }}
          >
            {/* 원형 외곽선 */}
            <div
              className="w-full h-full rounded-full border-3 flex flex-col items-center justify-center shadow-lg"
              style={{
                borderColor: strokeColor,
                backgroundColor: fillColor,
                boxShadow: `0 0 14px ${strokeColor}66`,
              }}
            >
              {/* 아래 방향 가이드 화살표 */}
              <span
                className="text-xs font-black select-none pointer-events-none drop-shadow"
                style={{ color: strokeColor }}
              >
                ▼
              </span>
            </div>
          </div>
        );
      })}

      {/* 2. 화면 중간 양쪽 가장자리의 반투명 원형 터치 버튼 */}
      {/* A. 왼쪽 버튼 (민트 계열 `#2dd4bf`) */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: `${leftButtonX - buttonRadius}px`,
          top: `${buttonY - buttonRadius}px`,
          width: `${buttonRadius * 2}px`,
          height: `${buttonRadius * 2}px`,
        }}
      >
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onButtonPress('left');
          }}
          onPointerUp={() => onButtonRelease('left')}
          onPointerLeave={() => onButtonRelease('left')}
          className={`w-full h-full rounded-full border-2 flex items-center justify-center pointer-events-auto select-none touch-none transition-all duration-75 shadow-xl backdrop-blur-[2px] ${
            leftButtonPressed
              ? 'scale-90 bg-teal-400/50 border-teal-200 ring-4 ring-teal-400/60 shadow-teal-500/80'
              : 'bg-teal-500/20 border-teal-400/70 hover:bg-teal-500/30'
          }`}
          style={{ borderColor: '#2dd4bf' }}
        >
          <span className="text-base font-black text-teal-200 drop-shadow">L</span>
        </button>

        {/* 데스크톱 조작 가이드 뱃지 (복서를 가리지 않음) */}
        <div className="flex gap-1 mt-1 font-mono text-[10px]">
          <span className={`px-1.5 py-0.2 rounded border transition ${leftButtonPressed ? 'bg-teal-400 text-slate-950 font-bold border-teal-300' : 'bg-slate-950/80 text-teal-300 border-teal-800'}`}>
            F
          </span>
          <span className={`px-1.5 py-0.2 rounded border transition ${leftButtonPressed ? 'bg-teal-400 text-slate-950 font-bold border-teal-300' : 'bg-slate-950/80 text-teal-300 border-teal-800'}`}>
            ◀
          </span>
        </div>
      </div>

      {/* B. 오른쪽 버튼 (하늘색 계열 `#38bdf8`) */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: `${rightButtonX - buttonRadius}px`,
          top: `${buttonY - buttonRadius}px`,
          width: `${buttonRadius * 2}px`,
          height: `${buttonRadius * 2}px`,
        }}
      >
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onButtonPress('right');
          }}
          onPointerUp={() => onButtonRelease('right')}
          onPointerLeave={() => onButtonRelease('right')}
          className={`w-full h-full rounded-full border-2 flex items-center justify-center pointer-events-auto select-none touch-none transition-all duration-75 shadow-xl backdrop-blur-[2px] ${
            rightButtonPressed
              ? 'scale-90 bg-sky-400/50 border-sky-200 ring-4 ring-sky-400/60 shadow-sky-500/80'
              : 'bg-sky-500/20 border-sky-400/70 hover:bg-sky-500/30'
          }`}
          style={{ borderColor: '#38bdf8' }}
        >
          <span className="text-base font-black text-sky-200 drop-shadow">R</span>
        </button>

        <div className="flex gap-1 mt-1 font-mono text-[10px]">
          <span className={`px-1.5 py-0.2 rounded border transition ${rightButtonPressed ? 'bg-sky-400 text-slate-950 font-bold border-sky-300' : 'bg-slate-950/80 text-sky-300 border-sky-800'}`}>
            J
          </span>
          <span className={`px-1.5 py-0.2 rounded border transition ${rightButtonPressed ? 'bg-sky-400 text-slate-950 font-bold border-sky-300' : 'bg-slate-950/80 text-sky-300 border-sky-800'}`}>
            ▶
          </span>
        </div>
      </div>
    </div>
  );
};
