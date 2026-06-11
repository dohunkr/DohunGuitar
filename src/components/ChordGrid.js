/**
 * ChordGrid.js — 캔버스 위에 코드 존(네모)을 오버레이로 그리고,
 * 손 위치가 해당 영역에 닿으면 코드를 선택하는 컴포넌트
 */

import { AudioEngine } from './AudioEngine.js';

const CHORDS = AudioEngine.getChordNames();

// 그리드 설정: 왼쪽 영역에 5행 3열 배치
const GRID_COLS = 3;
const GRID_ROWS = Math.ceil(CHORDS.length / GRID_COLS);

// 코드 존 영역 (정규화 좌표 0~1 기준)
const ZONE_LEFT = 0.02;
const ZONE_TOP = 0.05;
const ZONE_WIDTH = 0.28;
const ZONE_HEIGHT = 0.88;

export class ChordGrid {
    /**
     * @param {Function} onSelect 코드 선택 콜백
     */
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.activeChord = null;
        this.hoveredChord = null;
        this._zones = this._buildZones();
    }

    /** 각 코드의 정규화 바운딩 영역 계산 */
    _buildZones() {
        const cellW = ZONE_WIDTH / GRID_COLS;
        const cellH = ZONE_HEIGHT / GRID_ROWS;
        const pad = 0.005; // 셀 간 패딩

        return CHORDS.map((chord, i) => {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            return {
                chord,
                x: ZONE_LEFT + col * cellW + pad,
                y: ZONE_TOP + row * cellH + pad,
                w: cellW - pad * 2,
                h: cellH - pad * 2,
            };
        });
    }

    /**
     * 캔버스에 코드 존 네모들을 그림
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasW 캔버스 폭 (px)
     * @param {number} canvasH 캔버스 높이 (px)
     */
    draw(ctx, canvasW, canvasH) {
        this._zones.forEach((zone) => {
            const x = zone.x * canvasW;
            const y = zone.y * canvasH;
            const w = zone.w * canvasW;
            const h = zone.h * canvasH;

            const isActive = zone.chord === this.activeChord;
            const isHovered = zone.chord === this.hoveredChord;

            // 배경
            if (isActive) {
                ctx.fillStyle = 'rgba(99, 102, 241, 0.45)';
            } else if (isHovered) {
                ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            }

            // 둥근 모서리 사각형
            const r = Math.min(w, h) * 0.12;
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
            ctx.fill();

            // 테두리
            ctx.strokeStyle = isActive
                ? 'rgba(99, 102, 241, 0.9)'
                : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = isActive ? 2.5 : 1;
            ctx.stroke();

            // 코드 이름 텍스트
            const fontSize = Math.max(12, Math.min(w * 0.35, h * 0.35));
            ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive
                ? 'rgba(255, 255, 255, 1)'
                : 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(zone.chord, x + w / 2, y + h / 2);
        });
    }

    /**
     * 손 위치(정규화 좌표)로 코드 존 충돌 감지
     * @param {number} nx 정규화 x (0~1, 미러 보정 전)
     * @param {number} ny 정규화 y (0~1)
     * @returns {string|null} 해당 코드 이름 또는 null
     */
    hitTest(nx, ny) {
        for (const zone of this._zones) {
            if (
                nx >= zone.x &&
                nx <= zone.x + zone.w &&
                ny >= zone.y &&
                ny <= zone.y + zone.h
            ) {
                return zone.chord;
            }
        }
        return null;
    }

    /**
     * 호버 상태 업데이트 (매 프레임 호출)
     * @param {string|null} chord
     */
    setHovered(chord) {
        this.hoveredChord = chord;
    }

    /**
     * 활성 코드 설정
     * @param {string} chord
     */
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
}
