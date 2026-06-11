/**
 * GestureDetector.js — 핀치(코드 선택) & 스트로크(연주) 제스처 인식
 */

import { isPinching, pinchCenter, strokeVelocity, handRole, isPickGrip } from '../utils/handUtils.js';

export class GestureDetector {
    constructor({ onChordSelect, onStrum, onStatusUpdate }) {
        this.onChordSelect = onChordSelect;
        this.onStrum = onStrum;
        this.onStatusUpdate = onStatusUpdate;

        // 설정
        this.pinchThreshold = 0.045;
        this.strumMinVelocity = 0.012;
        this.intensityMultiplier = 1;
        this.swapHands = false;

        // 스트로크 추적 상태
        this._prevStrumY = null;
        this._strumCooldown = false;

        // 핀치 상태 (디바운스)
        this._wasPinching = false;
        this._pinchLock = false;
    }

    /** 핀치 감도 설정 (range 값 → threshold 변환) */
    setPinchSensitivity(value) {
        // 슬라이더 값 (20~80) → threshold (0.08~0.02): 높을수록 민감
        this.pinchThreshold = 0.08 - (value / 100) * 0.06;
    }

    /** 스트로크 세기 배율 설정 */
    setIntensityMultiplier(value) {
        this.intensityMultiplier = value / 5; // 슬라이더 1~10 → 0.2~2.0
    }

    /** 손 바꾸기 토글 */
    setSwapHands(swapped) {
        this.swapHands = swapped;
    }

    /**
     * MediaPipe 결과를 프레임마다 처리
     * @param {Object} results MediaPipe Hands 결과
     * @param {Object} chordGridBounds 코드 그리드의 각 버튼 바운딩 정보
     */
    process(results, chordGridBounds) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this._prevStrumY = null;
            this._wasPinching = false;
            this._pinchLock = false;
            this.onStatusUpdate?.({
                leftPinch: false,
                rightPickGrip: false,
            });
            return;
        }

        let chordHand = null;
        let strumHand = null;
        let chordHandLabel = null;
        let strumHandLabel = null;

        // 각 손 분류
        results.multiHandLandmarks.forEach((landmarks, idx) => {
            const label = results.multiHandedness[idx].label;
            const role = handRole(label, this.swapHands);

            if (role === 'chord') {
                chordHand = landmarks;
                chordHandLabel = label;
            } else {
                strumHand = landmarks;
                strumHandLabel = label;
            }
        });

        // 상태 업데이트
        const statusInfo = {
            leftPinch: chordHand ? isPinching(chordHand, this.pinchThreshold) : false,
            rightPickGrip: strumHand ? isPickGrip(strumHand) : false,
        };

        // ---- 왼손(코드 선택): 핀치 감지 ----
        if (chordHand) {
            const pinching = isPinching(chordHand, this.pinchThreshold);

            if (pinching && !this._pinchLock) {
                const center = pinchCenter(chordHand);
                // 미러링 보정: x를 반전
                const mirroredCenter = { x: 1 - center.x, y: center.y };
                this._selectChordAtPosition(mirroredCenter, chordGridBounds);
                this._pinchLock = true;
            }

            if (!pinching) {
                this._pinchLock = false;
            }

            this._wasPinching = pinching;
        } else {
            this._wasPinching = false;
            this._pinchLock = false;
        }

        // ---- 오른손(스트로크): 아래→ 스와이프 감지 ----
        if (strumHand) {
            const wristY = strumHand[0].y;

            if (this._prevStrumY !== null) {
                const vel = strokeVelocity(this._prevStrumY, wristY);

                // 다운스트로크: 양수 속도가 임계값 이상
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

        this.onStatusUpdate?.(statusInfo);
    }

    /**
     * 핀치 위치를 코드 그리드 버튼과 매칭
     * @param {Object} position {x, y} 정규화 좌표
     * @param {Array} chordGridBounds 각 버튼의 바운딩 정보
     */
    _selectChordAtPosition(position, chordGridBounds) {
        if (!chordGridBounds || chordGridBounds.length === 0) return;

        // 가장 가까운 코드 버튼 찾기
        let closest = null;
        let minDist = Infinity;

        chordGridBounds.forEach((bound) => {
            const dx = position.x - bound.centerX;
            const dy = position.y - bound.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closest = bound;
            }
        });

        // 합리적인 거리 범위 내에서만 선택
        if (closest && minDist < 0.15) {
            this.onChordSelect?.(closest.chord);
        }
    }
}
