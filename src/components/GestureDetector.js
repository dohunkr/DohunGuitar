/**
 * GestureDetector.js — 손 위치 기반 코드 선택 & 스트로크 제스처 인식
 * 왼손 검지 tip이 코드 존 네모에 닿으면 코드 선택
 * 오른손 위→아래 스와이프로 다운스트로크
 */

import { strokeVelocity, handRole, isPickGrip } from '../utils/handUtils.js';

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

        // 코드 선택 디바운스 (같은 코드 연속 선택 방지)
        this._lastSelectedChord = null;
        this._chordHoldFrames = 0;
        this._chordSelectThreshold = 5; // 프레임 수만큼 유지해야 선택
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
     * @param {Object} chordGrid ChordGrid 인스턴스 (hitTest 사용)
     */
    process(results, chordGrid) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this._prevStrumY = null;
            this._lastSelectedChord = null;
            this._chordHoldFrames = 0;
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

        // ---- 왼손(코드 선택): 검지 tip 위치로 코드 존 충돌 감지 ----
        let touchingChord = false;
        if (chordHand && chordGrid) {
            const indexTip = chordHand[8]; // 검지 끝
            // 정규화 좌표 그대로 사용 (캔버스와 동일 좌표계)
            const hitChord = chordGrid.hitTest(indexTip.x, indexTip.y);

            chordGrid.setHovered(hitChord);

            if (hitChord) {
                touchingChord = true;
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
            chordGrid?.setHovered(null);
            this._lastSelectedChord = null;
            this._chordHoldFrames = 0;
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
            leftPinch: touchingChord,
            rightPickGrip: strumHand ? isPickGrip(strumHand) : false,
        });
    }
}
