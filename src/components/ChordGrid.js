/**
 * ChordGrid.js — 왼손 손목 위치에 고정되는 2행 8열 코드 그리드
 * 캔버스 위에 직접 렌더링, 핀치로 코드 선택
 */

// 코드 배열: 2행 8열
const ROW1 = ['C', 'D', 'E', 'F', 'G', 'A', 'E7', 'B7'];
const ROW2 = ['C7', 'Dm', 'Em', 'Fm', 'G7', 'A7', 'Am', 'F'];
const GRID = [ROW1, ROW2];

const COLS = 8;
const ROWS = 2;

// 셀 크기 (픽셀)
const CELL_W = 70;
const CELL_H = 50;
const CELL_GAP = 4;
const GRID_PADDING = 6;

// 전체 그리드 크기
const GRID_W = COLS * CELL_W + (COLS - 1) * CELL_GAP + GRID_PADDING * 2;
const GRID_H = ROWS * CELL_H + (ROWS - 1) * CELL_GAP + GRID_PADDING * 2;

export class ChordGrid {
    /**
     * @param {Function} onSelect 코드 선택 콜백
     */
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.activeChord = null;
        this.hoveredChord = null;
        this.visible = false;

        // 그리드 기준점 (왼손 손목 픽셀 좌표)
        this._anchorX = 0;
        this._anchorY = 0;
    }

    /**
     * 왼손 손목 좌표로 그리드 위치 업데이트
     * @param {number} px 손목 x (캔버스 픽셀)
     * @param {number} py 손목 y (캔버스 픽셀)
     */
    setAnchor(px, py) {
        this._anchorX = px;
        this._anchorY = py;
        this.visible = true;
    }

    /** 왼손 미감지 시 그리드 숨김 */
    hide() {
        this.visible = false;
    }

    /**
     * 그리드 좌상단 좌표 계산 (손목이 정중앙)
     */
    _getOrigin() {
        return {
            x: this._anchorX - GRID_W / 2,
            y: this._anchorY - GRID_H / 2,
        };
    }

    /**
     * 캔버스에 코드 그리드 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasW
     * @param {number} canvasH
     */
    draw(ctx, canvasW, canvasH) {
        if (!this.visible) return;

        const origin = this._getOrigin();

        // 외곽선 박스
        ctx.save();
        ctx.strokeStyle = '#00BCD4';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        this._roundRect(ctx, origin.x, origin.y, GRID_W, GRID_H, 8);
        ctx.stroke();

        // 반투명 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.restore();

        // 각 셀 그리기
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const chord = GRID[row][col];
                const cellX = origin.x + GRID_PADDING + col * (CELL_W + CELL_GAP);
                const cellY = origin.y + GRID_PADDING + row * (CELL_H + CELL_GAP);

                const isActive = chord === this.activeChord;
                const isHovered = chord === this.hoveredChord;

                ctx.save();

                // 셀 배경
                if (isActive) {
                    ctx.fillStyle = 'rgba(0, 188, 212, 0.4)';
                } else if (isHovered) {
                    ctx.fillStyle = 'rgba(0, 188, 212, 0.2)';
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                }

                this._roundRect(ctx, cellX, cellY, CELL_W, CELL_H, 4);
                ctx.fill();

                // 셀 테두리
                if (isActive) {
                    ctx.strokeStyle = '#00BCD4';
                    ctx.lineWidth = 2;
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                }
                ctx.stroke();

                // 코드 텍스트
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px "DM Sans", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(chord, cellX + CELL_W / 2, cellY + CELL_H / 2);

                ctx.restore();
            }
        }
    }

    /**
     * 핀치 위치(캔버스 픽셀)로 코드 존 충돌 감지
     * @param {number} px 검지 tip x (캔버스 픽셀)
     * @param {number} py 검지 tip y (캔버스 픽셀)
     * @returns {string|null}
     */
    hitTest(px, py) {
        if (!this.visible) return null;

        const origin = this._getOrigin();

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cellX = origin.x + GRID_PADDING + col * (CELL_W + CELL_GAP);
                const cellY = origin.y + GRID_PADDING + row * (CELL_H + CELL_GAP);

                if (
                    px >= cellX &&
                    px <= cellX + CELL_W &&
                    py >= cellY &&
                    py <= cellY + CELL_H
                ) {
                    return GRID[row][col];
                }
            }
        }
        return null;
    }

    /** 호버 상태 업데이트 */
    setHovered(chord) {
        this.hoveredChord = chord;
    }

    /** 활성 코드 설정 */
    setActive(chord) {
        if (chord && chord !== this.activeChord) {
            this.activeChord = chord;
            if (this.onSelect) this.onSelect(chord);
        }
    }

    /** 현재 활성 코드 반환 */
    getActiveChord() {
        return this.activeChord;
    }

    /** 둥근 사각형 경로 헬퍼 */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
