/**
 * AudioEngine.js — Web Audio API 기타 화음 합성 엔진
 */

// 코드별 구성음 주파수 (Hz) — 기타 표준 튜닝 기반
const CHORD_FREQUENCIES = {
    C: [130.81, 164.81, 196.00, 261.63, 329.63],
    D: [146.83, 220.00, 293.66, 369.99],
    E: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63],
    F: [87.31, 130.81, 174.61, 220.00, 261.63],
    G: [98.00, 123.47, 146.83, 196.00, 246.94, 392.00],
    A: [110.00, 164.81, 220.00, 277.18, 329.63],
    Em: [82.41, 123.47, 164.81, 196.00, 246.94, 329.63],
    Dm: [146.83, 220.00, 293.66, 349.23],
    Am: [110.00, 164.81, 220.00, 261.63, 329.63],
    G7: [98.00, 123.47, 146.83, 196.00, 246.94, 349.23],
    A7: [110.00, 164.81, 220.00, 277.18, 302.00],
    E7: [82.41, 123.47, 164.81, 207.65, 246.94, 302.00],
    B7: [123.47, 185.00, 246.94, 293.66, 349.23],
    C7: [130.81, 164.81, 196.00, 261.63, 311.13],
    Fm: [87.31, 130.81, 174.61, 207.65, 261.63],
};

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.isReady = false;
    }

    /** AudioContext를 초기화 (사용자 제스처 후 호출) */
    init() {
        if (this.isReady) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // 컴프레서로 클리핑 방지
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        this.compressor.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7;
        this.masterGain.connect(this.compressor);

        this.isReady = true;
    }

    /**
     * 코드를 스트럼(연주)
     * @param {string} chordName 코드 이름 (예: 'C', 'Am')
     * @param {number} velocity 스트로크 세기 (0~1)
     * @param {number} intensityMultiplier UI 세기 배율
     */
    strum(chordName, velocity = 0.5, intensityMultiplier = 1) {
        if (!this.isReady) this.init();

        const freqs = CHORD_FREQUENCIES[chordName];
        if (!freqs) return;

        const now = this.ctx.currentTime;
        const vol = Math.min(velocity * intensityMultiplier, 1);

        freqs.forEach((freq, i) => {
            // 스트로크 딜레이: 각 줄을 약간씩 시차를 두어 자연스러움 부여
            const delay = i * 0.018;
            this._pluckString(freq, now + delay, vol);
        });
    }

    /**
     * 미리보기 사운드 (짧은 뮤트 톤)
     * @param {string} chordName
     */
    preview(chordName) {
        if (!this.isReady) this.init();

        const freqs = CHORD_FREQUENCIES[chordName];
        if (!freqs) return;

        const now = this.ctx.currentTime;
        freqs.forEach((freq, i) => {
            this._pluckString(freq, now + i * 0.012, 0.15, 0.4);
        });
    }

    /**
     * 단일 줄 플럭 시뮬레이션
     * Karplus-Strong 간소화 — 오실레이터 + 필터 + 엔벨로프
     */
    _pluckString(freq, startTime, volume = 0.5, duration = 1.5) {
        const ctx = this.ctx;

        // 오실레이터 (삼각파 → 기타 유사 톤)
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // 고조파 추가용 오실레이터
        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq;

        // 필터 — 고주파를 시간에 따라 감쇠 (기타 줄 느낌)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4000, startTime);
        filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);
        filter.Q.value = 1;

        // 엔벨로프
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        // 2차 오실레이터 (낮은 볼륨으로 질감 추가)
        const envelope2 = ctx.createGain();
        envelope2.gain.setValueAtTime(0, startTime);
        envelope2.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.005);
        envelope2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);

        // 연결
        osc.connect(filter);
        osc2.connect(envelope2);
        envelope2.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.masterGain);

        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + duration + 0.05);
        osc2.stop(startTime + duration + 0.05);
    }

    /** 사용 가능한 코드 목록 반환 */
    static getChordNames() {
        return Object.keys(CHORD_FREQUENCIES);
    }

    /** 리소스 정리 */
    dispose() {
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.close();
        }
    }
}
