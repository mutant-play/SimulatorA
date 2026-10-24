// BEAT BOUT 120 BPM 60초 오리지널 스포츠 사운드트랙 및 타격음 합성 엔진

export class BeatBoutAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // 타이밍 동기화 상태
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPaused: boolean = false;
  private isPlaying: boolean = false;
  private scheduledEvents: number[] = [];

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
      this.bgmGain.gain.value = 0.8;
      this.sfxGain.gain.value = 0.95;
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // 현재 재생 중인 트랙의 정확한 진행 시간 (초)
  public getTrackTime(): number {
    if (!this.ctx || !this.isPlaying) return 0;
    if (this.isPaused) return this.pauseTime;
    return Math.max(0, this.ctx.currentTime - this.startTime);
  }

  // 60초 오리지널 스포츠 리듬 트랙 시작
  public startTrack(): void {
    if (!this.ctx) return;
    this.stopTrack();

    this.startTime = this.ctx.currentTime;
    this.pauseTime = 0;
    this.isPaused = false;
    this.isPlaying = true;

    // 120 BPM -> 1박 = 0.5초, 1마디 = 2.0초, 총 30마디 = 60초
    const bpm = 120;
    const beatSec = 60 / bpm; // 0.5s
    const totalBars = 30;

    this.scheduleSoundtrack(this.startTime, beatSec, totalBars);
  }

  // 일시정지 (Pause)
  public pause(): void {
    if (!this.ctx || !this.isPlaying || this.isPaused) return;
    this.pauseTime = this.ctx.currentTime - this.startTime;
    this.isPaused = true;
    if (this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  // 재개 (Resume)
  public async resume(): Promise<void> {
    if (!this.ctx || !this.isPlaying || !this.isPaused) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.startTime = this.ctx.currentTime - this.pauseTime;
    this.isPaused = false;
  }

  // 트랙 중지
  public stopTrack(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseTime = 0;
  }

  // 120 BPM 5개 페이즈 스포츠 브라스/비트 스케줄링
  private scheduleSoundtrack(start: number, beatSec: number, totalBars: number): void {
    if (!this.ctx || !this.bgmGain) return;

    // 복싱 훈련 및 결승 라운드 영화적 코드 진행: Em -> G -> C -> D
    const chords = [
      [164.81, 196.00, 246.94], // Em (E3, G3, B3)
      [196.00, 246.94, 293.66], // G  (G3, B3, D4)
      [130.81, 164.81, 196.00], // C  (C3, E3, G3)
      [146.83, 185.00, 220.00], // D  (D3, F#3, A3)
    ];

    const bassNotes = [82.41, 98.00, 65.41, 73.42]; // E2, G2, C2, D2

    for (let bar = 0; bar < totalBars; bar++) {
      const barTime = start + bar * (beatSec * 4);
      const chordIdx = bar % chords.length;
      const currentChord = chords[chordIdx];
      const currentBass = bassNotes[chordIdx];

      // 페이즈 1: 0~12s (마디 0~6) - 워밍업 (킥 + 베이스)
      // 페이즈 2: 12~28s (마디 6~14) - 전개 (스네어 + 하이햇 + 신스 리프)
      // 페이즈 3: 28~38s (마디 14~19) - 브레이크다운 (잠시 숨고르기, 탐 드럼롤)
      // 페이즈 4: 38~52s (마디 19~26) - 후반 고조 (16분 하이햇 + 아르페지오)
      // 페이즈 5: 52~60s (마디 26~30) - 마지막 라운드 피니시 (풀 브라스)

      const isWarmup = bar < 6;
      const isBreakdown = bar >= 14 && bar < 19;
      const isClimax = bar >= 19;

      // 4박자 드럼 루프
      for (let beat = 0; beat < 4; beat++) {
        const beatTime = barTime + beat * beatSec;

        // 킥 드럼:
        if (!isBreakdown) {
          if (beat === 0 || beat === 2 || (isClimax && (beat === 1 || beat === 3))) {
            this.playKick(beatTime);
          }
        } else {
          // 브레이크다운 구간에는 탐탐 드럼롤
          if (beat % 2 === 0) this.playTom(beatTime, 130);
          else this.playTom(beatTime, 95);
        }

        // 스네어 드럼: 2박, 4박
        if (!isWarmup && !isBreakdown) {
          if (beat === 1 || beat === 3) {
            this.playSnare(beatTime);
          }
        }

        // 하이햇: 오프비트 또는 16비트
        if (!isWarmup) {
          this.playHiHat(beatTime + beatSec * 0.5, 0.08);
          if (isClimax) {
            this.playHiHat(beatTime + beatSec * 0.25, 0.05);
            this.playHiHat(beatTime + beatSec * 0.75, 0.05);
          }
        }
      }

      // 베이스라인 (매 박자 펌핑)
      for (let beat = 0; beat < 4; beat++) {
        const beatTime = barTime + beat * beatSec;
        this.playBassSynth(beatTime, currentBass, beatSec * 0.85);
      }

      // 브라스/신스 코드 리프 (전개 및 클라이맥스 구간)
      if (!isWarmup && !isBreakdown) {
        // 싱코페이션 리프
        this.playBrassChord(barTime, currentChord, beatSec * 1.5);
        this.playBrassChord(barTime + beatSec * 2.5, currentChord, beatSec * 1.2);
      }
    }
  }

  // 킥 드럼 합성
  private playKick(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.17);
  }

  // 스네어 드럼 합성
  private playSnare(time: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.09);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.13);

    // 노이즈 스냅
    this.playNoise(time, 0.14, 1500, 0.45);
  }

  // 하이햇 합성
  private playHiHat(time: number, vol: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(4200, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // 탐 드럼
  private playTom(time: number, freq: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.18);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.21);
  }

  // 베이스 신스
  private playBassSynth(time: number, freq: number, duration: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  // 브라스 코드 신스
  private playBrassChord(time: number, freqs: number[], duration: number): void {
    if (!this.ctx || !this.bgmGain) return;
    freqs.forEach((freq) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(600, time + duration);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration + 0.02);
    });
  }

  private playNoise(time: number, duration: number, cutoff: number, vol: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoff, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  // 타격음: 왼손 펀치 (묵직한 보디/턱 펀치)
  public playPunchLeft(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.16);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.21);

    // 가죽 글러브 임팩트 스냅
    this.playNoise(now, 0.07, 800, 0.6);
  }

  // 타격음: 오른손 펀치 (날카로운 스트레이트/어퍼컷)
  public playPunchRight(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);

    // 날카로운 가죽 타격 스냅
    this.playNoise(now, 0.08, 1200, 0.7);
  }

  // Miss 시 헛스윙 (바람 소리 Whoosh)
  public playMissWhoosh(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.18);
  }
}

export const beatBoutAudio = new BeatBoutAudioEngine();
