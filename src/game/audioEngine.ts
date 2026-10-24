// Web Audio API 기반 오디오 엔진 (초정밀 타임 클락 및 신시사이저 BGM / 타격음)

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // 현재 재생 중인 BGM 상태
  private currentBgmSource: AudioBufferSourceNode | null = null;
  private bgmLoopTimer: number | null = null;
  private bgmStartTime: number = 0;
  private customAudioBuffer: AudioBuffer | null = null;

  constructor() {
    // 생성 시점에는 유저 제스처 대기를 위해 지연 초기화
  }

  // AudioContext 활성화 (사용자 클릭/터치 시 호출)
  public async init(): Promise<void> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.masterGain.gain.value = 1.0;
      this.bgmGain.gain.value = 0.75;
      this.sfxGain.gain.value = 0.9;
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : performance.now() / 1000;
  }

  public setVolumes(bgmVol: number, sfxVol: number): void {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, bgmVol)), this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, sfxVol)), this.ctx.currentTime);
    }
  }

  // 타격음 재생 ('동' = 좌측 킥/북, '딱' = 우측 림샷/스네어)
  public playHitSound(button: 'left' | 'right'): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (button === 'left') {
      // 태고 "동" (묵직하고 웅장한 북 소리 - 피치 드롭 킥 + 우드 레조넌스)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.23);

      // 펀치감을 더해주는 짧은 어택 클릭
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(320, now);
      clickOsc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
      clickGain.gain.setValueAtTime(0.6, now);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.05);

    } else {
      // 태고 "딱" (경쾌하고 찰진 림샷 / 스네어 타격음)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);

      // 고주파 노이즈 스냅
      this.playNoiseSnap(now, 0.08, 1200);
    }
  }

  // Miss 사운드 (뮤트 틱)
  public playMissSound(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private playNoiseSnap(time: number, duration: number, cutoff: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoff, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + duration);
  }

  // 12종 테마별 절차적 BGM 스트림 생성 및 재생
  public startThemeBgm(songId: number, bpm: number, startTime: number, duration: number): void {
    this.stopBgm();
    if (!this.ctx || !this.bgmGain) return;

    this.bgmStartTime = startTime;
    const beatDuration = 60 / bpm;
    const totalBars = Math.ceil(duration / (beatDuration * 4));

    // Web Audio 이벤트 사전 스케줄링 (곡 전체의 악기 트랙을 오차 없이 타임라인에 등록)
    this.scheduleProceduralTrack(songId, bpm, startTime, totalBars);
  }

  private scheduleProceduralTrack(songId: number, bpm: number, startTime: number, totalBars: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const beatDuration = 60 / bpm;
    const stepDuration = beatDuration / 2; // 8분음표 단위

    // 음계 스케일 정의
    const pentatonic = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37];
    const minorScale = [196, 220, 246.94, 261.63, 293.66, 329.63, 392, 440];
    const technoScale = [130.81, 146.83, 155.56, 174.61, 196.00, 220.00];

    // 곡 테마별 멜로디/코드 선택
    let scale = pentatonic;
    if (songId % 3 === 0) scale = technoScale;
    else if (songId % 2 === 0) scale = minorScale;

    for (let bar = 0; bar < totalBars; bar++) {
      const barStartTime = startTime + bar * beatDuration * 4;

      // 4박 비트 드럼 (4-on-the-floor 또는 하프비트)
      for (let beat = 0; beat < 4; beat++) {
        const beatTime = barStartTime + beat * beatDuration;

        // 킥 (1, 3박 또는 전 박자)
        if (songId >= 8 || beat === 0 || beat === 2) {
          this.scheduleSynthKick(beatTime);
        }

        // 스네어 / 클랩 (2, 4박)
        if (beat === 1 || beat === 3) {
          this.scheduleSynthSnare(beatTime);
        }

        // 하이햇 (매 8분음표 오프비트)
        this.scheduleSynthHiHat(beatTime + stepDuration);
      }

      // 베이스라인 & 신스 리드 아르페지오 (8스텝)
      for (let step = 0; step < 8; step++) {
        const stepTime = barStartTime + step * stepDuration;
        const noteIndex = (songId * 3 + bar * 2 + step) % scale.length;
        const freq = scale[noteIndex];

        // 4마디마다 변주
        if (step % 2 === 0 || (bar % 2 === 1 && step === 5)) {
          this.scheduleSynthBass(stepTime, freq * 0.5, stepDuration * 0.9);
        }

        // 신스 리드 (멜로디)
        if ((step + bar) % 3 === 0 || step === 2 || step === 6) {
          this.scheduleSynthLead(stepTime, freq * (songId > 6 ? 1.5 : 1.0), stepDuration * 0.7);
        }
      }
    }
  }

  private scheduleSynthKick(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private scheduleSynthSnare(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  private scheduleSynthHiHat(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(3500, time);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.045);
  }

  private scheduleSynthBass(time: number, freq: number, dur: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  private scheduleSynthLead(time: number, freq: number, dur: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  // 커스텀 음원 파일(mp3/wav) 로드 및 재생 지원
  public async loadCustomAudioFile(file: File): Promise<number> {
    await this.init();
    if (!this.ctx) throw new Error('AudioContext not ready');
    const arrayBuffer = await file.arrayBuffer();
    this.customAudioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    return this.customAudioBuffer.duration;
  }

  public playCustomAudio(startTime: number): void {
    this.stopBgm();
    if (!this.ctx || !this.bgmGain || !this.customAudioBuffer) return;
    this.currentBgmSource = this.ctx.createBufferSource();
    this.currentBgmSource.buffer = this.customAudioBuffer;
    this.currentBgmSource.connect(this.bgmGain);
    this.currentBgmSource.start(startTime);
  }

  public stopBgm(): void {
    if (this.currentBgmSource) {
      try {
        this.currentBgmSource.stop();
        this.currentBgmSource.disconnect();
      } catch {
        // 이미 멈춘 경우 무시
      }
      this.currentBgmSource = null;
    }
  }
}

// 싱글톤 인스턴스
export const audio = new AudioEngine();
