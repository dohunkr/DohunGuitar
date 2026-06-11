/**
 * GestureDetector.js — 손 위치 기반 코드 선택 & 스트로크 제스처 인식
 * 단순화: 왼손 검지 끝이 코드 셀에 닿으면 바로 선택 (핀치 불필요)
 * 오른손 아래로 스와이프하면 스트럼
 */

import { strokeVelocity, handRole, isPickGrip } from '../utils/handUtils.js';

export class GestureDetector {
    constructor({ onChordSelect, onStrum, onStatusUpdate }) {
        this.onChordSelect = onChordSelect;
        this.onStrum = onStrum;
        this.onStatusUpdate = onStatusUpdate;

        // 설정 — 피크 그립 필수 + 적절한 감도
        this.strumMinVelocity = 0.015; // 미세 떨림 무시, 확실한 스트로크만
        this.intensityMultiplier = 1;
        this.swapHands = false;

        // 스트로크 추적
        this._prevStrumY = null;
        this._strumCooldown = false;

        // 코드 선택 디바운스
        this._lastSelectedChord = null;
        this._chordHoldFrames = 0;
        this._chordSelectThreshold = 8; // 8프레임 유지 시 선택 (더 확실하게 머물러야 전환)
    }

    setIntensityMultiplier(value) {
        this.intensityMultiplier = value / 5;
    }

    setSwapHands(swapped) {
        this.swapHands = swapped;
    }

    /**
     * MediaPipe 결과를 프레임마다 처리
     * @param {Object} results MediaPipe Hands 결과
     * @param {Object} chordGrid ChordGrid 인스턴스
     * @param {number} canvasW 캔버스 폭
     * @param {number} canvasH 캔버스 높이
     */
    process(results, chordGrid, canvasW, canvasH) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this._prevStrumY = null;
            this._lastSelectedChord = null;
            this._chordHoldFrames = 0;
            chordGrid?.hide();
            chordGrid?.setHovered(null);
            this.onStatusUpdate?.({
                leftPinch: false,
                rightPickGrip: false,
            });
            return;
        }

        let chordHand = null;
        let strumHand = null;

        // 각 손 분류
        results.multiHandLandmarks.forEach((landmarks, idx) => {
            const label = results.multiHandedness[idx].label;
            const role = handRole(label, this.swapHands);

            if (role === 'chord') {
                chordHand = landmarks;
            } else {
                strumHand = landmarks;
            }
        });

        // ---- 왼손(코드 선택): 검지 끝 위에 그리드 고정 + 셀 터치 선택 ----
        let isTouching = false;
        if (chordHand && chordGrid) {
            const indexTip = chordHand[8]; // 검지 끝
            // 좌표 반전 (CSS video scaleX(-1)에 맞춤)
            const px = (1 - indexTip.x) * canvasW;
            const py = indexTip.y * canvasH;

            // 검지 위치를 그리드 앵커로 설정 (EMA 스무딩)
            chordGrid.setAnchor(px, py);

            const hitChord = chordGrid.hitTest(px, py, canvasW, canvasH);
            chordGrid.setHovered(hitChord);

            if (hitChord) {
                isTouching = true;
                if (hitChord === this._lastSelectedChord) {
                    this._chordHoldFrames++;
                } else {
                    this._lastSelectedChord = hitChord;
                    this._chordHoldFrames = 1;
                }

                if (this._chordHoldFrames === this._chordSelectThreshold) {
                    chordGrid.setActive(hitChord);
                    this.onChordSelect?.(hitChord);
                }
            } else {
                this._lastSelectedChord = null;
                this._chordHoldFrames = 0;
            }
        } else {
            // 왼손 미감지 시 그리드 숨김
            chordGrid?.hide();
            chordGrid?.setHovered(null);
            this._lastSelectedChord = null;
            this._chordHoldFrames = 0;
        }

        // ---- 오른손(스트로크): 피크 그립 + 아래 스와이프 감지 ----
        const pickGrip = strumHand ? isPickGrip(strumHand, 0.08) : false;

        if (strumHand && pickGrip) {
            // 피크 그립 상태일 때만 스트럼 감지
            const wristY = strumHand[0].y;

            if (this._prevStrumY !== null) {
                const vel = strokeVelocity(this._prevStrumY, wristY);

                if (vel > this.strumMinVelocity && !this._strumCooldown) {
                    const normalizedVel = Math.min(vel / 0.05, 1);
                    this.onStrum?.(normalizedVel, this.intensityMultiplier);
                    this._strumCooldown = true;
                    setTimeout(() => {
                        this._strumCooldown = false;
                    }, 150); // 쿨다운 150ms
                }
            }

            this._prevStrumY = wristY;
        } else {
            // 피크 그립이 아니면 스트럼 추적 초기화
            this._prevStrumY = null;
        }

        // 상태 업데이트
        this.onStatusUpdate?.({
            leftPinch: isTouching,
            rightPickGrip: pickGrip,
        });
    }
}
