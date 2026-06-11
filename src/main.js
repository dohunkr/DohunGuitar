/**
 * main.js — DohunGuitar 앱 엔트리 포인트
 * MediaPipe Hands 초기화 및 모든 컴포넌트 연결
 */

import { AudioEngine } from './components/AudioEngine.js';
import { GestureDetector } from './components/GestureDetector.js';
import { HandOverlay } from './components/HandOverlay.js';
import { ChordGrid } from './components/ChordGrid.js';
import { StatusBar } from './components/StatusBar.js';
import './styles/main.css';

// ---- DOM 요소 ----
const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay-canvas');
const statusBarContainer = document.getElementById('status-bar');
const currentChordEl = document.getElementById('current-chord');
const strokeSlider = document.getElementById('stroke-intensity');
const previewToggle = document.getElementById('preview-toggle');
const swapHandsToggle = document.getElementById('swap-hands');
const cameraSection = document.getElementById('camera-section');

// ---- 컴포넌트 초기화 ----
const audioEngine = new AudioEngine();
const handOverlay = new HandOverlay(canvas, video);
const statusBar = new StatusBar(statusBarContainer);

let selectedChord = null;
let previewEnabled = false;

// 코드 그리드 (캔버스 오버레이 방식 — 선택은 GestureDetector에서 처리)
const chordGrid = new ChordGrid();

// HandOverlay에 ChordGrid 연결
handOverlay.setChordGrid(chordGrid);

// 제스처 감지기
const gestureDetector = new GestureDetector({
    onChordSelect: (chord) => {
        selectedChord = chord;
        currentChordEl.textContent = chord;
        if (previewEnabled) {
            audioEngine.preview(chord);
        }
    },
    onStrum: (velocity, intensityMultiplier) => {
        if (!selectedChord) return;
        audioEngine.strum(selectedChord, velocity, intensityMultiplier);
        _flashStrum();
    },
    onStatusUpdate: (info) => {
        statusBar.update(info);
    },
});

// ---- UI 이벤트 바인딩 ----
strokeSlider.addEventListener('input', (e) => {
    gestureDetector.setIntensityMultiplier(Number(e.target.value));
});

previewToggle.addEventListener('change', (e) => {
    previewEnabled = e.target.checked;
});

swapHandsToggle.addEventListener('change', (e) => {
    const swapped = e.target.checked;
    gestureDetector.setSwapHands(swapped);
    handOverlay.setSwapHands(swapped);
});

// ---- 스트럼 플래시 효과 ----
function _flashStrum() {
    cameraSection.classList.remove('strum-flash');
    // reflow를 강제하여 애니메이션 재시작
    void cameraSection.offsetWidth;
    cameraSection.classList.add('strum-flash');
    setTimeout(() => cameraSection.classList.remove('strum-flash'), 320);
}

// ---- MediaPipe Hands 초기화 ----
const hands = new window.Hands({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
});

hands.onResults((results) => {
    handOverlay.draw(results);
    const cw = canvas.width || video.videoWidth;
    const ch = canvas.height || video.videoHeight;
    gestureDetector.process(results, chordGrid, cw, ch);
});

// ---- 카메라 시작 ----
const camera = new window.Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 1280,
    height: 720,
});

camera.start().then(() => {
    statusBar.setMessage('카메라 준비 완료 — 왼손으로 코드 터치, 오른손 스트로크로 연주');
});

// AudioContext unlock (사용자 인터랙션 필요)
document.addEventListener(
    'click',
    () => {
        audioEngine.init();
    },
    { once: true }
);
