/**
 * HandOverlay.js — 웹캠 캔버스 위에 손 skeleton 오버레이 렌더링
 */

import { handRole, toPixel } from '../utils/handUtils.js';

// MediaPipe Hand 랜드마크 연결 정보
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // 엄지
    [0, 5], [5, 6], [6, 7], [7, 8],       // 검지
    [0, 9], [9, 10], [10, 11], [11, 12],   // 중지
    [0, 13], [13, 14], [14, 15], [15, 16], // 약지
    [0, 17], [17, 18], [18, 19], [19, 20], // 소지
    [5, 9], [9, 13], [13, 17],             // 손바닥 연결
];

export class HandOverlay {
    /**
     * @param {HTMLCanvasElement} canvas 오버레이 캔버스
     * @param {HTMLVideoElement} video 웹캠 비디오 요소
     */
    constructor(canvas, video) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.video = video;
        this.swapHands = false;
    }

    setSwapHands(swapped) {
        this.swapHands = swapped;
    }

    /**
     * 프레임마다 호출 — 모든 손의 skeleton을 그림
     * @param {Object} results MediaPipe Hands 결과
     */
    draw(results) {
        const { canvas, ctx } = this;

        // 캔버스 크기를 비디오에 맞춤
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!results.multiHandLandmarks) return;

        // 미러 변환 적용 (비디오가 scaleX(-1)이므로 캔버스도 동일)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        results.multiHandLandmarks.forEach((landmarks, idx) => {
            const label = results.multiHandedness[idx].label;
            const role = handRole(label, this.swapHands);

            // 왼손(코드) = 청록색, 오른손(스트럼) = 주황색
            const color = role === 'chord'
                ? 'rgba(6, 182, 212, 0.85)'
                : 'rgba(249, 115, 22, 0.85)';
            const dotColor = role === 'chord'
                ? 'rgba(6, 182, 212, 1)'
                : 'rgba(249, 115, 22, 1)';

            this._drawConnections(landmarks, color);
            this._drawLandmarks(landmarks, dotColor);
        });

        ctx.restore();
    }

    /** 연결선 그리기 */
    _drawConnections(landmarks, color) {
        const { ctx, canvas } = this;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        HAND_CONNECTIONS.forEach(([from, to]) => {
            const a = toPixel(landmarks[from], canvas.width, canvas.height);
            const b = toPixel(landmarks[to], canvas.width, canvas.height);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        });
    }

    /** 랜드마크 점 그리기 */
    _drawLandmarks(landmarks, color) {
        const { ctx, canvas } = this;
        ctx.fillStyle = color;

        landmarks.forEach((lm) => {
            const p = toPixel(lm, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
}
