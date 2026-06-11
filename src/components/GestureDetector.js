/**
 * GestureDetector.js — 핀치 기반 코드 선택 & 스트로크 제스처 인식
 * 왼손: 엄지(4)-검지(8) 핀치로 코드 선택, 검지 tip 위치가 그리드 셀에 닿으면 해당 코드
 * 오른손: 위→아래 스와이프로 다운스트로크
 */

import { strokeVelocity, handRole, isPickGrip, distance, toPixel } from '../utils/handUtils.js';

const PINCH_THRESHOLD = 0.055; // 정규화 좌표 기준 핀치 거리

export class GestureDetector {
    constructor({ onChordSelect, onStrum, onStatusUpdate }) {
        this.onChordSelect = onChordSelect;
        this.onStrum = onStrum;
        this.onStatusUpdate = onStatusUpdate;

        // 설정
        this.strumMinVelocity = 0.012;
        this.intensityMultiplier = 1;
        this.swapHands = false;

        // 스트로크 추적 상태
        this._prevStrumY = null;
        this._strumCooldown = false;

        // 핀치 코드 선택 디바운스
        this._lastSelectedChord = null;
        this._chordHoldFrames = 0;
        this._chordSelectThreshold = 3; // 핀치 상태 유지 프레임 수
        this._wasPinching = false;
    }

    /** 스트로크 세기 배율 설정 */
    setIntensityMultiplier(value) {
        this.intensityMultiplier = value / 5;
    }

    /** 손 바꾸기 토글 */
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
            this._wasPinching = false;
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

        // ---- 왼손(코드 선택): 손목으로 그리드 고정 + 핀치로 선택 ----
        let isPinching = false;
        if (chordHand) {
            // 좌표 반전 적용 (CSS scaleX(-1)에 맞춤)
            const wrist = chordHand[0];
            const wristPx = {
                x: (1 - wrist.x) * canvasW,
                y: wrist.y * canvasH,
            };

            // 그리드 위치를 손목에 고정
            chordGrid.setAnchor(wristPx.x, wristPx.y);

            // 핀치 감지: 엄지(4)와 검지(8) 거리
            const thumbTip = chordHand[4];
            const indexTip = chordHand[8];
            const pinchDist = distance(thumbTip, indexTip);
            isPinching = pinchDist < PINCH_THRESHOLD;

            if (isPinching) {
                // 검지 tip 위치로 hitTest (반전 적용)
                const indexPx = {
                    x: (1 - indexTip.x) * canvasW,
                    y: indexTip.y * canvasH,
                };
                const hitChord = chordGrid.hitTest(indexPx.x, indexPx.y);

                chordGrid.setHovered(hitChord);

                if (hitChord) {
                    if (hitChord === this._lastSelectedChord) {
                        this._chordHoldFrames++;
                    } else {
                        this._lastSelectedChord = hitChord;
                        this._chordHoldFrames = 1;
                    }

                    // 일정 프레임 유지 시 코드 선택 확정
                    if (this._chordHoldFrames === this._chordSelectThreshold) {
                        chordGrid.setActive(hitChord);
                        this.onChordSelect?.(hitChord);
                    }
                } else {
                    this._lastSelectedChord = null;
                    this._chordHoldFrames = 0;
                }
            } else {
                chordGrid.setHovered(null);
                this._lastSelectedChord = null;
                this._chordHoldFrames = 0;
            }

            this._wasPinching = isPinching;
        } else {
            chordGrid?.hide();
            chordGrid?.setHovered(null);
            this._lastSelectedChord = null;
            this._chordHoldFrames = 0;
            this._wasPinching = false;
        }

        // ---- 오른손(스트로크): 아래→ 스와이프 감지 ----
        if (strumHand) {
            const wristY = strumHand[0].y;

            if (this._prevStrumY !== null) {
                const vel = strokeVelocity(this._prevStrumY, wristY);

                if (vel > this.strumMinVelocity && !this._strumCooldown) {
                    const normalizedVel = Math.min(vel / 0.06, 1);
                    this.onStrum?.(normalizedVel, this.intensityMultiplier);
                    this._strumCooldown = true;
                    setTimeout(() => {
                        this._strumCooldown = false;
                    }, 120);
                }
            }

            this._prevStrumY = wristY;
        } else {
            this._prevStrumY = null;
        }

        // 상태 업데이트
        this.onStatusUpdate?.({
            leftPinch: isPinching,
            rightPickGrip: strumHand ? isPickGrip(strumHand) : false,
        });
    }
}
