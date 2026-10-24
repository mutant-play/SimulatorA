import React, { useState } from 'react';
import { SimulatorConfig } from '../../game/gameTypes';
import { PRESETS } from '../../game/presetConfigs';
import {
  Sliders,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Bot,
  Zap,
  Volume2,
  Table,
} from 'lucide-react';

interface InspectorDrawerProps {
  config: SimulatorConfig;
  onChangeConfig: (newConfig: SimulatorConfig) => void;
  onResetConfig: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  config,
  onChangeConfig,
  onResetConfig,
  isOpen,
  onToggle,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tuning' | 'sheetMapping'>('tuning');

  const update = <K extends keyof SimulatorConfig>(key: K, value: SimulatorConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      onChangeConfig({
        ...config,
        ...preset.config,
      });
    }
  };

  const copyConfigJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* 서랍 열기/닫기 고정 플로팅 버튼 */}
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-xl backdrop-blur-md hover:bg-slate-800 transition-all active:scale-95"
      >
        <Sliders className="w-4 h-4 text-amber-400" />
        <span>기획 튜닝 인스펙터</span>
        {config.autoPlay && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        )}
      </button>

      {/* 인스펙터 슬라이드 드로어 */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 드로어 헤더 */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">기획 시뮬레이션 스튜디오</h2>
              <p className="text-[11px] text-slate-400">구글 기획서 D01~D14 실시간 파라미터 튜닝</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tuning')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'tuning'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            파라미터 실시간 조정
          </button>
          <button
            onClick={() => setActiveTab('sheetMapping')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'sheetMapping'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            시트 D01~D14 매핑표
          </button>
        </div>

        {/* 드로어 스크롤 바디 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {activeTab === 'tuning' ? (
            <>
              {/* 1. 프리셋 및 원클릭 퀵 컨트롤 */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>🎯 검증 프리셋</span>
                  <button
                    onClick={onResetConfig}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-400 transition"
                  >
                    <RotateCcw className="w-3 h-3" /> 초기화
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* 오토플레이 토글 */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Bot className="w-4 h-4 text-rose-400" />
                    <span>Auto Play (컴퓨터 자동 연주)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoPlay}
                    onChange={(e) => update('autoPlay', e.target.checked)}
                    className="toggle accent-rose-500 w-4 h-4 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* 2. D02 판정 시간 & 싱크 */}
              <div className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>D02: 판정 시간 윈도우 & 오차 (ms)</span>
                </div>

                {/* S 판정 윈도우 */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>S 판정 범위 (Perfect)</span>
                    <span className="font-mono text-amber-400 font-bold">±{config.windowS} ms</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={80}
                    step={5}
                    value={config.windowS}
                    onChange={(e) => update('windowS', Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* A 판정 윈도우 */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>A 판정 범위 (Great)</span>
                    <span className="font-mono text-emerald-400 font-bold">±{config.windowA} ms</span>
                  </div>
                  <input
                    type="range"
                    min={config.windowS + 10}
                    max={140}
                    step={5}
                    value={config.windowA}
                    onChange={(e) => update('windowA', Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* B 판정 윈도우 */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>B 판정 범위 (Good)</span>
                    <span className="font-mono text-blue-400 font-bold">±{config.windowB} ms</span>
                  </div>
                  <input
                    type="range"
                    min={config.windowA + 10}
                    max={220}
                    step={5}
                    value={config.windowB}
                    onChange={(e) => update('windowB', Number(e.target.value))}
                    className="w-full accent-blue-400 cursor-pointer"
                  />
                </div>

                {/* 오디오 오프셋 */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>오디오 싱크 지연 보정 (Offset)</span>
                    <span className="font-mono text-slate-200">{config.audioOffsetMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    step={5}
                    value={config.audioOffsetMs}
                    onChange={(e) => update('audioOffsetMs', Number(e.target.value))}
                    className="w-full accent-slate-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* 3. D03 연타 제한 & D04 무효 입력 */}
              <div className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="font-bold text-amber-300">D03 & D04: 연타 제한 및 무효 입력</div>

                {/* 연타 쿨타임 */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>동일 버튼 연타 쿨타임</span>
                    <span className="font-mono text-cyan-400 font-bold">{config.spamCooldownMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={250}
                    step={10}
                    value={config.spamCooldownMs}
                    onChange={(e) => update('spamCooldownMs', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* D04 무효 입력 패널티 */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300">노트 없는 시점 탭 시 Miss 패널티</span>
                  <input
                    type="checkbox"
                    checked={config.punishBlankTap}
                    onChange={(e) => update('punishBlankTap', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* 4. D06 체력 규칙 & 게임오버 */}
              <div className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="font-bold text-amber-300">D06: 체력 규칙 & 종료 조건</div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Miss 1회당 체력 감소량</span>
                    <span className="font-mono text-red-400 font-bold">-{config.hpLossMiss} HP</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={config.hpLossMiss}
                    onChange={(e) => update('hpLossMiss', Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>S 판정 시 체력 회복량</span>
                    <span className="font-mono text-green-400 font-bold">+{config.hpRecoveryS} HP</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={config.hpRecoveryS}
                    onChange={(e) => update('hpRecoveryS', Number(e.target.value))}
                    className="w-full accent-green-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300">체력 0 도달 시 즉시 실패(게임오버)</span>
                  <input
                    type="checkbox"
                    checked={config.instantFailOnZeroHp}
                    onChange={(e) => update('instantFailOnZeroHp', e.target.checked)}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* 5. D07 접근 속도 & 버튼 UI */}
              <div className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="font-bold text-amber-300">D01 & D07: 접근 링 & 버튼 크기</div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>접근 링 도달 시간 (Approach Time)</span>
                    <span className="font-mono text-yellow-300 font-bold">{config.approachTimeMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={1400}
                    step={50}
                    value={config.approachTimeMs}
                    onChange={(e) => update('approachTimeMs', Number(e.target.value))}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>터치 버튼 크기 (px)</span>
                    <span className="font-mono text-slate-200">{config.buttonSize} px</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={150}
                    step={5}
                    value={config.buttonSize}
                    onChange={(e) => update('buttonSize', Number(e.target.value))}
                    className="w-full accent-slate-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* 6. 사운드 볼륨 */}
              <div className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>사운드 볼륨 설정</span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>BGM 볼륨</span>
                    <span className="font-mono text-slate-200">
                      {Math.round(config.soundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.soundVolume}
                    onChange={(e) => update('soundVolume', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>타격음(동/딱) 볼륨</span>
                    <span className="font-mono text-slate-200">
                      {Math.round(config.hitSoundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.hitSoundVolume}
                    onChange={(e) => update('hitSoundVolume', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </>
          ) : (
            /* 구글 스프레드시트 D01~D14 1:1 매핑표 탭 */
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200">
                기획자 친구의 구글 스프레드시트 항목과 현재 시뮬레이터 수치의 연결 상태입니다.
              </div>

              <div className="space-y-2">
                {[
                  { id: 'D01', name: '플랫폼·화면', val: `버튼 ${config.buttonSize}px, 하단여백 ${config.buttonVerticalOffset}px` },
                  { id: 'D02', name: '판정 시간·동기화', val: `S:±${config.windowS}ms, A:±${config.windowA}ms, B:±${config.windowB}ms` },
                  { id: 'D03', name: '연타 제한·채보', val: `버튼별 ${config.spamCooldownMs}ms 쿨다운 적용` },
                  { id: 'D04', name: '무효 입력', val: config.punishBlankTap ? '빈 탭 시 Miss 처리' : '무시(안전)' },
                  { id: 'D05', name: '점수·랭크', val: `S:${config.scoreS}점, S컷:95%, A컷:85%, B컷:70%` },
                  { id: 'D06', name: '체력·종료', val: `시작 100, Miss당 -${config.hpLossMiss}, S시 +${config.hpRecoveryS}` },
                  { id: 'D07', name: '접근 시간·밀도', val: `Approach: ${config.approachTimeMs}ms, 3단계 배율 적용` },
                  { id: 'D08', name: '무작위 선택', val: '해금된 음악/배경 동일 확률 무작위 추첨' },
                  { id: 'D09', name: '초기 콘텐츠·해금', val: 'Lv 1에 1종 해금, 레벨업 시 1쌍 순차 해금' },
                  { id: 'D10', name: '경험치·레벨', val: `S랭크: ${config.expGainRankS} EXP, 레벨당 +${config.expPerLevelScaling}` },
                  { id: 'D11', name: '신규 고정 체험', val: config.prioritizeNewUnlock ? '해금 직후 다음 판 우선 배정' : '해제' },
                  { id: 'D12', name: '배경 반응 규칙', val: `4프레임 (${config.animFrameDurationMs}ms/f), 타격 리액션` },
                  { id: 'D13', name: '결과 화면', val: '점수, 랭크, 판정 분포, EXP 게이지, 해금 팝업' },
                  { id: 'D14', name: '음악·행동 소재', val: '12종 BGM 트랙 & 12종 캐릭터 애니메이션 구현됨' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-amber-400">{item.id} {item.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-1.5 rounded">
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 드로어 푸터: JSON 복사 & 스프레드시트 바로가기 */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            onClick={copyConfigJson}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료! (시트에 붙여넣기)' : '현재 설정 JSON 복사'}</span>
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/1_Cc1omZjFHvpDnZDzPl0EdrcnGbTFEKNWy4d-DrYhUo/edit?gid=1643423963#gid=1643423963"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="구글 스프레드시트 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
};
