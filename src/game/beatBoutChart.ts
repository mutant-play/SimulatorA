import { FallingNote } from './beatBoutTypes';

export function createBeatBout60sChart(): FallingNote[] {
  const notes: FallingNote[] = [];
  const bpm = 120;
  const beatSec = 60 / bpm; // 0.5초

  let idCounter = 0;
  const add = (time: number, hand: 'left' | 'right') => {
    notes.push({
      id: `note-${idCounter++}-${hand}`,
      targetTime: Number(time.toFixed(3)),
      hand,
      state: 'pending',
    });
  };

  // ==========================================
  // 페이즈 1: 워밍업 (0s ~ 12s, 마디 0 ~ 6)
  // 마디 1(2.0s)부터 4분음표 정박 펀치
  // ==========================================
  // 마디 1: L, R
  add(2.0, 'left');
  add(3.0, 'right');

  // 마디 2: L, R
  add(4.0, 'left');
  add(5.0, 'right');

  // 마디 3: L, L, R
  add(6.0, 'left');
  add(7.0, 'left');
  add(7.5, 'right');

  // 마디 4: R, R, L
  add(8.0, 'right');
  add(9.0, 'right');
  add(9.5, 'left');

  // 마디 5: L, R, L, R (4연속 4분음표)
  add(10.0, 'left');
  add(10.5, 'right');
  add(11.0, 'left');
  add(11.5, 'right');

  // ==========================================
  // 페이즈 2: 전개 (12s ~ 28s, 마디 6 ~ 14)
  // 8분음표 원투 콤보 및 싱코페이션
  // ==========================================
  // 마디 6: 원-투! (L, R)
  add(12.0, 'left');
  add(12.25, 'right');
  add(13.0, 'left');
  add(13.5, 'right');

  // 마디 7: 투-원! (R, L)
  add(14.0, 'right');
  add(14.25, 'left');
  add(15.0, 'right');
  add(15.5, 'left');

  // 마디 8: L, L, R, R
  add(16.0, 'left');
  add(16.25, 'left');
  add(17.0, 'right');
  add(17.25, 'right');

  // 마디 9: L, R, L-R-L 3연타
  add(18.0, 'left');
  add(18.5, 'right');
  add(19.0, 'left');
  add(19.25, 'right');
  add(19.5, 'left');

  // 마디 10: R, L, R-L-R 3연타
  add(20.0, 'right');
  add(20.5, 'left');
  add(21.0, 'right');
  add(21.25, 'left');
  add(21.5, 'right');

  // 마디 11: 싱코페이션 비트
  add(22.0, 'left');
  add(22.5, 'right');
  add(22.75, 'left');
  add(23.5, 'right');

  // 마디 12: 연속 잽
  add(24.0, 'left');
  add(24.25, 'left');
  add(24.5, 'left');
  add(25.0, 'right');

  // 마디 13: 크로스 스트레이트
  add(26.0, 'right');
  add(26.25, 'right');
  add(26.5, 'right');
  add(27.0, 'left');

  // ==========================================
  // 페이즈 3: 브레이크다운 (28s ~ 38s, 마디 14 ~ 19)
  // 잠시 템포를 조절하며 탐탐 리듬에 맞춘 타이밍 펀치
  // ==========================================
  // 마디 14: 묵직한 카운터
  add(28.0, 'left');
  add(29.0, 'right');

  // 마디 15: 엇박 탐 드럼
  add(30.0, 'left');
  add(30.75, 'right');
  add(31.5, 'left');

  // 마디 16: 더블 잽
  add(32.0, 'right');
  add(32.75, 'left');
  add(33.5, 'right');

  // 마디 17: 빌드업 롤
  add(34.0, 'left');
  add(34.5, 'left');
  add(35.0, 'right');
  add(35.5, 'right');

  // 마디 18: 폭풍 전야
  add(36.0, 'left');
  add(36.25, 'right');
  add(36.5, 'left');
  add(37.0, 'right');
  add(37.5, 'left');

  // ==========================================
  // 페이즈 4: 후반 고조 (38s ~ 52s, 마디 19 ~ 26)
  // 클라이맥스 고밀도 연타 및 빠른 교차
  // ==========================================
  // 마디 19: 콤보 4타
  add(38.0, 'left');
  add(38.25, 'right');
  add(38.5, 'left');
  add(38.75, 'right');

  // 마디 20: 콤보 4타 반대
  add(40.0, 'right');
  add(40.25, 'left');
  add(40.5, 'right');
  add(40.75, 'left');

  // 마디 21: 더블 콤보
  add(42.0, 'left');
  add(42.25, 'left');
  add(42.5, 'right');
  add(42.75, 'right');
  add(43.25, 'left');

  // 마디 22:
  add(44.0, 'right');
  add(44.25, 'right');
  add(44.5, 'left');
  add(44.75, 'left');
  add(45.25, 'right');

  // 마디 23: 5연속 펀치
  add(46.0, 'left');
  add(46.25, 'right');
  add(46.5, 'left');
  add(46.75, 'right');
  add(47.0, 'left');

  // 마디 24:
  add(48.0, 'right');
  add(48.25, 'left');
  add(48.5, 'right');
  add(48.75, 'left');
  add(49.0, 'right');

  // 마디 25: 파이널 빌드업
  add(50.0, 'left');
  add(50.25, 'left');
  add(50.5, 'right');
  add(50.75, 'right');
  add(51.0, 'left');
  add(51.25, 'right');

  // ==========================================
  // 페이즈 5: 마지막 라운드 피니시 (52s ~ 58s, 마디 26 ~ 29)
  // 챔피언 결정타 폭타 및 KO 결정 펀치
  // ==========================================
  // 마디 26: 고속 6연타
  add(52.0, 'left');
  add(52.25, 'right');
  add(52.5, 'left');
  add(52.75, 'right');
  add(53.0, 'left');
  add(53.25, 'right');

  // 마디 27:
  add(54.0, 'right');
  add(54.25, 'left');
  add(54.5, 'right');
  add(54.75, 'left');
  add(55.0, 'right');
  add(55.25, 'left');

  // 마디 28: 최후의 파이널 콤보
  add(56.0, 'left');
  add(56.25, 'right');
  add(56.5, 'left');
  add(56.75, 'right');

  // 마디 29: 피니시 KO 블로우!
  add(57.5, 'left');
  add(58.0, 'right'); // 마지막 라운드 종료 펀치!

  return notes;
}
