/**
 * handUtils.js — MediaPipe Hands 헬퍼 함수 모음
 */

/** 두 랜드마크 사이 유클리드 거리 */
export function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** 핀치(엄지 tip=4, 검지 tip=8) 거리 반환 (0~1 정규화 좌표 기준) */
export function pinchDistance(landmarks) {
    return distance(landmarks[4], landmarks[8]);
}

/** 핀치 여부 판정 */
export function isPinching(landmarks, threshold = 0.045) {
    return pinchDistance(landmarks) < threshold;
}

/** 핀치 위치 (엄지-검지 중점) — 정규화 좌표 */
export function pinchCenter(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    return {
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2,
    };
}

/**
 * 손목(0) y좌표 변화량으로 스트로크 속도 계산
 * @param {number} prevY 이전 프레임 손목 y
 * @param {number} currY 현재 프레임 손목 y
 * @returns {number} 양수 = 아래로 이동 (다운스트로크)
 */
export function strokeVelocity(prevY, currY) {
    return currY - prevY;
}

/**
 * 왼손/오른손 분류 (MediaPipe 결과 기준)
 * MediaPipe는 미러된 라벨을 반환하므로 Left → 실제 오른손
 * @param {string} label 'Left' | 'Right'
 * @param {boolean} swapped 손 바꾸기 옵션
 * @returns {'chord' | 'strum'}
 */
export function handRole(label, swapped = false) {
    // MediaPipe 미러 → Left label = 사용자 오른손
    const isRight = label === 'Left';
    if (swapped) {
        return isRight ? 'chord' : 'strum';
    }
    return isRight ? 'strum' : 'chord';
}

/** 랜드마크를 캔버스 픽셀 좌표로 변환 */
export function toPixel(landmark, width, height) {
    return {
        x: landmark.x * width,
        y: landmark.y * height,
    };
}

/** 피크 그립 감지 (엄지-검지 끝이 가까운지 = 피크 잡는 자세) */
export function isPickGrip(landmarks, threshold = 0.08) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const d = distance(thumbTip, indexTip);
    return d < threshold;
}
