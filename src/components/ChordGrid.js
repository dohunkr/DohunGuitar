/**
 * ChordGrid.js — 화면 하단 고정 2행 8열 코드 그리드
 * 캔버스 위에 직접 렌더링, 손가락 터치로 코드 선택
 */

// 코드 배열: 2행 8열
const ROW1 = ['C', 'D', 'E', 'F', 'G', 'A', 'E7', 'B7'];
const ROW2 = ['C7', 'Dm', 'Em', 'Fm', 'G7', 'A7', 'Am', 'F'];
const GRID = [ROW1, ROW2];

const COLS = 8;
const ROWS = 2;

// 셀 크기 (픽셀) — 크게! 유치원생도 터치 가능
const CELL_W = 120;
const CELL_H = 64;
const CELL_GAP = 6;
const GRID_PADDING = 10;

// 전체 그리드 크기
const GRID_TOTAL_W = COLS * CELL_W + (COLS - 1) * CELL_GAP + GRID_PADDING * 2;
const GRID_TOTAL_H = ROWS * CELL_H + (ROWS - 1) * CELL_GAP + GRID_PADDING * 2;

// Design.md 색상
const COLOR_PRIMARY = '#6366F1';       // indigo
const COLOR_PRIMARY_GLOW = 'rgba(99, 102, 241, 0.35)';
const COLOR_CELL_BG = 'rgba(10, 10, 10, 0.55)';
const COLOR_CELL_HOVER = 'rgba(99, 102, 241, 0.2)';
const COLOR_CELL_ACTIVE = 'rgba(99, 102, 241, 0.45)';
const COLOR_BORDER = 'rgba(232, 232, 236, 0.3)'; // #E8E8EC 30%
const COLOR_ACTIVE_BORDER = 'rgba(99, 102, 241, 0.9)';
const COLOR_TEXT = '#FAFAFA';          // near-white
const COLOR_GRID_OUTLINE = 'rgba(99, 102, 241, 0.6)';

export class ChordGrid {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.activeChord = null;
        this.hoveredChord = null;
    }

    /**
     * 그리드 좌상단 좌표 계산 — 화면 하단 중앙 고정
     */
    _getOrigin(canvasW, canvasH) {
        const x = (canvasW - GRID_TOTAL_W) / 2;
        const y = canvasH - GRID_TOTAL_H - 24; // 하단 24px 여백
        return { x, y };
    }

    /**
     * 캔버스에 코드 그리드 렌더링
     */
    draw(ctx, canvasW, canvasH) {
        const origin = this._getOrigin(canvasW, canvasH);

        // 외곽선 박스
        ctx.save();
        ctx.strokeStyle = COLOR_GRID_OUTLINE;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        this._roundRect(ctx, origin.x, origin.y, GRID_TOTAL_W, GRID_TOTAL_H, 12);
        ctx.stroke();

        // 전체 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
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
                    ctx.fillStyle = COLOR_CELL_ACTIVE;
                } else if (isHovered) {
                    ctx.fillStyle = COLOR_CELL_HOVER;
                } else {
                    ctx.fillStyle = COLOR_CELL_BG;
                }

                this._roundRect(ctx, cellX, cellY, CELL_W, CELL_H, 6);
                ctx.fill();

                // 셀 테두리
                if (isActive) {
                    ctx.strokeStyle = COLOR_ACTIVE_BORDER;
                    ctx.lineWidth = 2.5;
                    // 글로우 효과
                    ctx.shadowColor = COLOR_PRIMARY_GLOW;
                    ctx.shadowBlur = 12;
                } else {
                    ctx.strokeStyle = COLOR_BORDER;
                    ctx.lineWidth = 1;
                }
                ctx.stroke();
                ctx.shadowBlur = 0;

                // 코드 텍스트
                ctx.fillStyle = isActive ? '#FFFFFF' : COLOR_TEXT;
                const fontSize = isActive ? 22 : 20;
                ctx.font = `bold ${fontSize}px "General Sans", "DM Sans", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(chord, cellX + CELL_W / 2, cellY + CELL_H / 2);

                ctx.restore();
            }
        }
    }

    /**
     * 손 위치(캔버스 픽셀)로 코드 존 충돌 감지
     */
    hitTest(px, py, canvasW, canvasH) {
        const origin = this._getOrigin(canvasW, canvasH);

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
