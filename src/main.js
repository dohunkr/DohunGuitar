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
const chordGridContainer = document.getElementById('chord-grid-container');
const statusBarContainer = document.getElementById('status-bar');
const currentChordEl = document.getElementById('current-chord');
const pinchSlider = document.getElementById('pinch-sensitivity');
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

// 코드 그리드
const chordGrid = new ChordGrid(chordGridContainer, (chord) => {
    selectedChord = chord;
    currentChordEl.textContent = chord;
    if (previewEnabled) {
        audioEngine.preview(chord);
    }
});

// 제스처 감지기
const gestureDetector = new GestureDetector({
    onChordSelect: (chord) => {
        selectedChord = chord;
        currentChordEl.textContent = chord;
        chordGrid.setActive(chord);
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
pinchSlider.addEventListener('input', (e) => {
    gestureDetector.setPinchSensitivity(Number(e.target.value));
});

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

// 스트럼 플래시 효과
function _flashStrum() {
    const flash = document.createElement('div');
    flash.className = 'strum-flash';
    cameraSection.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
}

// ---- FPS 카운터 ----
let frameCount = 0;
let lastFpsTime = performance.now();

function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
        statusBar.updateFPS(frameCount);
        frameCount = 0;
        lastFpsTime = now;
    }
}

// ---- MediaPipe Hands 초기화 ----
async function initMediaPipe() {
    // eslint-disable-next-line no-undef
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
        updateFPS();
        handOverlay.draw(results);

        const bounds = chordGrid.getButtonBounds(
            video.videoWidth,
            video.videoHeight
        );
        gestureDetector.process(results, bounds);
    });

    return hands;
}

// ---- 웹캠 시작 ----
async function startCamera(hands) {
    // eslint-disable-next-line no-undef
    const camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 1280,
        height: 720,
    });

    await camera.start();
}

// ---- 앱 시작 ----
async function main() {
    try {
        // AudioContext는 사용자 상호작용 후 초기화
        document.addEventListener(
            'click',
            () => {
                audioEngine.init();
            },
            { once: true }
        );

        const hands = await initMediaPipe();
        await startCamera(hands);

        // 초기 슬라이더 값 적용
        gestureDetector.setPinchSensitivity(Number(pinchSlider.value));
        gestureDetector.setIntensityMultiplier(Number(strokeSlider.value));
    } catch (err) {
        console.error('DohunGuitar 초기화 실패:', err);
        statusBarContainer.innerHTML = `
      <div class="status-item">
        <span class="status-dot error"></span>
        <span>카메라 접근 실패 — 브라우저 권한을 확인하세요.</span>
      </div>
    `;
    }
}

main();
