/**
 * HandOverlay.js — 웹캠 캔버스 위에 손 skeleton + 코드 그리드 오버레이 렌더링
 * CSS transform: scaleX(-1)로 거울 반전 처리하므로 캔버스 내에서는 반전하지 않음
 * 대신 MediaPipe 좌표의 x를 1-x로 보정하여 반전된 화면과 일치시킴
 */

import { handRole } from '../utils/handUtils.js';

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
        this.chordGrid = null;
    }

    setSwapHands(swapped) {
        this.swapHands = swapped;
    }

    /** ChordGrid 인스턴스 연결 */
    setChordGrid(chordGrid) {
        this.chordGrid = chordGrid;
    }

    /**
     * 프레임마다 호출 — 코드 그리드 + 손 skeleton을 그림
     * @param {Object} results MediaPipe Hands 결과
     */
    draw(results) {
        const { canvas, ctx } = this;
        const w = this.video.videoWidth;
        const h = this.video.videoHeight;

        // 캔버스 크기를 비디오에 맞춤
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        // CSS scaleX(-1)로 전체 캔버스가 반전되므로
        // 캔버스 내에서는 좌표만 x = 1-x 보정하여 그림

        // 코드 그리드 그리기 (GestureDetector에서 setAnchor로 위치 설정됨)
        if (this.chordGrid) {
            this.chordGrid.draw(ctx, w, h);
        }

        // 손 skeleton 그리기
        if (results.multiHandLandmarks) {
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

                this._drawConnections(landmarks, color, w, h);
                this._drawLandmarks(landmarks, dotColor, w, h);
            });
        }
    }

    /** 연결선 그리기 (x 반전 적용) */
    _drawConnections(landmarks, color, w, h) {
        const { ctx } = this;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        HAND_CONNECTIONS.forEach(([from, to]) => {
            const a = this._toPixelMirrored(landmarks[from], w, h);
            const b = this._toPixelMirrored(landmarks[to], w, h);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        });
    }

    /** 랜드마크 점 그리기 (x 반전 적용) */
    _drawLandmarks(landmarks, color, w, h) {
        const { ctx } = this;
        ctx.fillStyle = color;

        landmarks.forEach((lm) => {
            const p = this._toPixelMirrored(lm, w, h);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    /** 랜드마크를 반전된 캔버스 픽셀 좌표로 변환 */
    _toPixelMirrored(lm, w, h) {
        return {
            x: (1 - lm.x) * w,
            y: lm.y * h,
        };
    }
}
