/**
 * ChordGrid.js — 코드 선택 UI 그리드
 */

import { AudioEngine } from './AudioEngine.js';

const CHORDS = AudioEngine.getChordNames();

export class ChordGrid {
    /**
     * @param {HTMLElement} container 코드 그리드 컨테이너
     * @param {Function} onSelect 코드 선택 콜백
     */
    constructor(container, onSelect) {
        this.container = container;
        this.onSelect = onSelect;
        this.activeChord = null;
        this.buttons = [];
        this._bounds = [];

        this._render();
    }

    /** 그리드 렌더링 */
    _render() {
        const grid = document.createElement('div');
        grid.className = 'chord-grid';

        CHORDS.forEach((chord) => {
            const btn = document.createElement('button');
            btn.className = 'chord-btn';
            btn.textContent = chord;
            btn.dataset.chord = chord;

            btn.addEventListener('click', () => {
                this.setActive(chord);
                this.onSelect?.(chord);
            });

            grid.appendChild(btn);
            this.buttons.push(btn);
        });

        this.container.appendChild(grid);
    }

    /** 활성 코드 설정 */
    setActive(chordName) {
        this.activeChord = chordName;
        this.buttons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.chord === chordName);
        });
    }

    /** 현재 활성 코드 반환 */
    getActive() {
        return this.activeChord;
    }

    /**
     * 각 버튼의 정규화된 바운딩 정보 계산
     * 핀치 위치와 매칭에 사용
     * @param {number} videoWidth 비디오 폭
     * @param {number} videoHeight 비디오 높이
     * @returns {Array} 바운딩 정보 배열
     */
    getButtonBounds(videoWidth, videoHeight) {
        if (!videoWidth || !videoHeight) return this._bounds;

        this._bounds = this.buttons.map((btn) => {
            const rect = btn.getBoundingClientRect();
            return {
                chord: btn.dataset.chord,
                // 화면 전체 기준 정규화 좌표
                centerX: (rect.left + rect.width / 2) / window.innerWidth,
                centerY: (rect.top + rect.height / 2) / window.innerHeight,
                halfW: (rect.width / 2) / window.innerWidth,
                halfH: (rect.height / 2) / window.innerHeight,
            };
        });

        return this._bounds;
    }

    /** 코드 목록 반환 */
    static getChords() {
        return CHORDS;
    }
}
