import React, { useEffect, useRef } from 'react';
import { BoxerAnimState, PlayerFistState, Shockwave } from '../../game/beatBoutTypes';

interface BoxerRingCanvasProps {
  width: number;
  height: number;
  boxerState: BoxerAnimState;
  playerFistState: PlayerFistState;
  shockwaves: Shockwave[];
  lastJudgementText: string | null;
  lastJudgementColor: string;
  isHitFlashing: boolean;
  screenShake: number; // 픽셀 단위 오프셋
}

export const BoxerRingCanvas: React.FC<BoxerRingCanvasProps> = ({
  width,
  height,
  boxerState,
  playerFistState,
  shockwaves,
  lastJudgementText,
  lastJudgementColor,
  isHitFlashing,
  screenShake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina 디스플레이 대응
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const now = performance.now();

    // 1. 화면 셰이크 적용
    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake * 2;
      const sy = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(sx, sy);
    }

    // 2. 배경 링 & 조명 & 관중 렌더링
    drawRingBackground(ctx, width, height, now);

    // 3. 상대 복서 렌더링 (안면 변형 및 공격/피격 모션 포함)
    drawOpponentBoxer(ctx, width, height, boxerState, now);

    // 4. 플레이어 펀치 주먹 렌더링 (한 손 전진 & 타격 도달)
    drawPlayerFists(ctx, width, height, playerFistState, now);

    // 5. 독립 원형 충격파 (Shockwaves)
    drawShockwaves(ctx, shockwaves, now);

    // 6. 타격 판정 텍스트 팝업 (S · PERFECT, etc)
    if (lastJudgementText) {
      drawJudgementPopup(ctx, width, height, lastJudgementText, lastJudgementColor);
    }

    // 7. 타격 플래시 오버레이
    if (isHitFlashing) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  });

  // 복싱 링 배경
  const drawRingBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => {
    // 짙은 청록/차콜 그라디언트 배경
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#060d17');
    bgGrad.addColorStop(0.4, '#0c1626');
    bgGrad.addColorStop(0.75, '#111b2b');
    bgGrad.addColorStop(1, '#0a101d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 상단 스포트라이트 조명 빔
    ctx.save();
    const lightGrad = ctx.createRadialGradient(w / 2, 0, 10, w / 2, h * 0.45, w * 0.7);
    lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    lightGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.08)');
    lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 0);
    ctx.lineTo(w * 0.8, 0);
    ctx.lineTo(w * 0.95, h * 0.7);
    ctx.lineTo(w * 0.05, h * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 어두운 관중 실루엣 (저채도)
    ctx.fillStyle = '#070b12';
    for (let i = 0; i < 18; i++) {
      const cx = (w / 18) * i + 10;
      const cy = h * 0.28 + Math.sin(i * 1.5 + now * 0.002) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 16, cy + 8, 32, 40);
    }

    // 링 로프 (3단 탄성 로프)
    const ropeY1 = h * 0.25;
    const ropeY2 = h * 0.35;
    const ropeY3 = h * 0.45;

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // 빨간 로프
    ctx.beginPath();
    ctx.moveTo(0, ropeY1);
    ctx.lineTo(w, ropeY1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // 흰색 로프
    ctx.beginPath();
    ctx.moveTo(0, ropeY2);
    ctx.lineTo(w, ropeY2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'; // 파란 로프
    ctx.beginPath();
    ctx.moveTo(0, ropeY3);
    ctx.lineTo(w, ropeY3);
    ctx.stroke();

    // 캔버스 바닥 라인
    const floorY = h * 0.55;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
    floorGrad.addColorStop(0, '#131e30');
    floorGrad.addColorStop(1, '#090e17');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 링 캔버스 매트 텍스처 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, floorY);
    ctx.lineTo(0, h);
    ctx.moveTo(w * 0.9, floorY);
    ctx.lineTo(w, h);
    ctx.stroke();
  };

  // 상대 복서 렌더링 (공격 위협 및 안면 피격 연출)
  const drawOpponentBoxer = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    state: BoxerAnimState,
    now: number
  ) => {
    const cx = w / 2;
    const baseCy = h * 0.38;

    // 기본 리듬 풋워크 바운스
    const bounce = Math.sin(now * 0.008) * 3;

    // 피격 상태 감지 (타격 후 160ms 지속)
    const isHit = state.hitSide !== null && now - state.hitTime < 160;
    const hitSide = state.hitSide;
    const hitElapsed = now - state.hitTime;
    const hitFactor = isHit ? Math.max(0, 1 - hitElapsed / 160) : 0;

    // 공격 위협 상태 (노트가 다가올 때 주먹을 내미는 전조)
    const isThreat = state.threatSide !== null && now - state.threatTime < 280;
    const threatSide = state.threatSide;

    ctx.save();
    ctx.translate(cx, baseCy + bounce);

    // 1. 피격 시 머리/상체 회전 및 젖힘
    if (isHit) {
      const rotAngle = hitSide === 'left' ? 0.2 * hitFactor : -0.2 * hitFactor;
      const shiftX = hitSide === 'left' ? 14 * hitFactor : -14 * hitFactor;
      ctx.translate(shiftX, -6 * hitFactor);
      ctx.rotate(rotAngle);
    }

    // A. 복서 몸통 및 어깨 (근육질 차콜/구릿빛)
    ctx.fillStyle = '#b45309'; // 구릿빛 피부
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;

    // 어깨 & 상체
    ctx.beginPath();
    ctx.ellipse(0, 50, 75, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 복싱 경기용 싱글렛 (차콜/네이비)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-45, 30);
    ctx.lineTo(45, 30);
    ctx.lineTo(35, 95);
    ctx.lineTo(-35, 95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. 상대 복서의 주먹 (글러브)
    // 공격 위협 시 해당 손을 화면 앞쪽으로 뻗음!
    const leftThreatY = isThreat && threatSide === 'left' ? 10 : 35;
    const rightThreatY = isThreat && threatSide === 'right' ? 10 : 35;
    const leftThreatScale = isThreat && threatSide === 'left' ? 1.3 : 1.0;
    const rightThreatScale = isThreat && threatSide === 'right' ? 1.3 : 1.0;

    // 상대 왼손 글러브 (빨간색 복싱 글러브)
    ctx.save();
    ctx.translate(-75, leftThreatY);
    ctx.scale(leftThreatScale, leftThreatScale);
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 글러브 밴드
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-15, 12, 30, 7);
    ctx.restore();

    // 상대 오른손 글러브
    ctx.save();
    ctx.translate(75, rightThreatY);
    ctx.scale(rightThreatScale, rightThreatScale);
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-15, 12, 30, 7);
    ctx.restore();

    // C. 목
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-16, -5, 32, 28);

    // D. 얼굴 (Head) - 피격 시 볼 찌그러짐 & 세로 변형
    ctx.save();
    const faceStretchY = isHit ? 1 + 0.15 * hitFactor : 1.0;
    const faceSquashX = isHit ? 1 - 0.12 * hitFactor : 1.0;
    ctx.scale(faceSquashX, faceStretchY);

    // 얼굴 윤곽
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -32, 42, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 턱선
    ctx.beginPath();
    ctx.moveTo(-22, -10);
    ctx.quadraticCurveTo(0, 16, 22, -10);
    ctx.fillStyle = '#b45309';
    ctx.fill();

    // 헤어밴드 (화이트/블랙 스트라이프)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-38, -68, 76, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, -68, 20, 14);

    // 헤어 스타일 (숏 컷)
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, -70, 36, Math.PI, Math.PI * 2);
    ctx.fill();

    // E. 눈 & 표정 (피격 시 찡그린 고통 표정 vs 기본 카리스마)
    if (isHit) {
      // 맞았을 때: 찡그린 눈 (> <) 및 고통스러운 눈썹
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#451a03';

      // 왼쪽 눈 (> 모양)
      ctx.beginPath();
      ctx.moveTo(-26, -38);
      ctx.lineTo(-14, -34);
      ctx.lineTo(-26, -30);
      ctx.stroke();

      // 오른쪽 눈 (< 모양)
      ctx.beginPath();
      ctx.moveTo(26, -38);
      ctx.lineTo(14, -34);
      ctx.lineTo(26, -30);
      ctx.stroke();

      // 비틀어진 고통의 입
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(hitSide === 'left' ? 6 : -6, -8, 12, 7, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // 타격된 볼에 붉은 멍/타격 자국
      const markX = hitSide === 'left' ? -28 : 28;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.beginPath();
      ctx.ellipse(markX, -22, 11, 7, hitSide === 'left' ? -0.3 : 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 멍 스크래치 선
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(markX - 6, -26);
      ctx.lineTo(markX + 6, -18);
      ctx.moveTo(markX - 4, -18);
      ctx.lineTo(markX + 4, -26);
      ctx.stroke();
    } else {
      // 평상시: 정면을 노려보는 날카로운 눈
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(-18, -35, 9, 6, -0.1, 0, Math.PI * 2);
      ctx.ellipse(18, -35, 9, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // 눈동자
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-17, -35, 4, 0, Math.PI * 2);
      ctx.arc(17, -35, 4, 0, Math.PI * 2);
      ctx.fill();

      // 카리스마 눈썹
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-30, -44);
      ctx.lineTo(-8, -40);
      ctx.moveTo(30, -44);
      ctx.lineTo(8, -40);
      ctx.stroke();

      // 굳게 다문 입 & 마우스피스
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.lineTo(12, -10);
      ctx.stroke();
    }

    ctx.restore(); // face
    ctx.restore(); // boxer
  };

  // 플레이어의 주먹 렌더링 (한 손 전진 & 상대 얼굴까지 도달)
  const drawPlayerFists = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    state: PlayerFistState,
    now: number
  ) => {
    const punchDurationMs = 150;

    // 왼손 펀치 진행도 (0 -> 1 -> 0)
    const leftElapsed = now - state.leftPunchTime;
    const isLeftPunching = leftElapsed < punchDurationMs;
    const leftProgress = isLeftPunching ? Math.sin((leftElapsed / punchDurationMs) * Math.PI) : 0;

    // 오른손 펀치 진행도
    const rightElapsed = now - state.rightPunchTime;
    const isRightPunching = rightElapsed < punchDurationMs;
    const rightProgress = isRightPunching ? Math.sin((rightElapsed / punchDurationMs) * Math.PI) : 0;

    // 대기 위치: 화면 하단 가드 (Y = h * 0.88)
    // 목표 위치: 상대 얼굴 (X = w/2 ± 25, Y = h * 0.35)
    const guardLeftX = w * 0.22;
    const guardLeftY = h * 0.86;
    const targetFaceLeftX = w * 0.45;
    const targetFaceLeftY = h * 0.35;

    const currentLeftX = guardLeftX + (targetFaceLeftX - guardLeftX) * leftProgress;
    const currentLeftY = guardLeftY + (targetFaceLeftY - guardLeftY) * leftProgress;
    const leftScale = 1.0 + leftProgress * 0.45; // 전진하면서 1.45배 커짐

    const guardRightX = w * 0.78;
    const guardRightY = h * 0.86;
    const targetFaceRightX = w * 0.55;
    const targetFaceRightY = h * 0.35;

    const currentRightX = guardRightX + (targetFaceRightX - guardRightX) * rightProgress;
    const currentRightY = guardRightY + (targetFaceRightY - guardRightY) * rightProgress;
    const rightScale = 1.0 + rightProgress * 0.45;

    // 플레이어 왼손 글러브 (민트 계열 `#2dd4bf`)
    ctx.save();
    ctx.translate(currentLeftX, currentLeftY);
    ctx.scale(leftScale, leftScale);
    ctx.fillStyle = '#2dd4bf'; // 민트
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 글러브 너클 디테일
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(4, -8, 14, 0, Math.PI * 2);
    ctx.fill();

    // 붕대 테이핑
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-24, 20, 48, 12);
    ctx.restore();

    // 플레이어 오른손 글러브 (하늘색 계열 `#38bdf8`)
    ctx.save();
    ctx.translate(currentRightX, currentRightY);
    ctx.scale(rightScale, rightScale);
    ctx.fillStyle = '#38bdf8'; // 하늘색
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(-4, -8, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-24, 20, 48, 12);
    ctx.restore();
  };

  // 독립 원형 충격파 (Shockwaves)
  const drawShockwaves = (ctx: CanvasRenderingContext2D, shockwaves: Shockwave[], now: number) => {
    shockwaves.forEach((sw) => {
      const elapsed = now - sw.startTime;
      if (elapsed > sw.durationMs) return;

      const progress = elapsed / sw.durationMs; // 0 -> 1
      const radius = 10 + progress * 55; // 10 -> 65px 확장
      const alpha = Math.max(0, 1 - progress);

      ctx.save();
      ctx.lineWidth = 4 * (1 - progress * 0.5);
      const ringColor =
        sw.hand === 'left' ? `rgba(45, 212, 191, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
      ctx.strokeStyle = ringColor;

      // 주 충격파 링
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 코랄 타격 스파크 링
      ctx.strokeStyle = `rgba(251, 146, 60, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  };

  // 판정 피드백 팝업 (S · PERFECT 등)
  const drawJudgementPopup = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    text: string,
    color: string
  ) => {
    ctx.save();
    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 텍스트 후광
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h * 0.22);

    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="absolute inset-0 z-0 pointer-events-none block"
    />
  );
};
