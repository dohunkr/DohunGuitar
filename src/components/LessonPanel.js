/**
 * LessonPanel.js — 왼쪽 가이드 탭 (강좌 목록 + 악보 표시)
 * 유치원생도 따라할 수 있도록 계이름 + 코드 + 가사를 보여줌
 */

import { LESSONS } from '../data/lessons.js';

export class LessonPanel {
    /**
     * @param {HTMLElement} container - 패널을 렌더할 컨테이너 요소
     * @param {object} opts
     * @param {function} opts.onChordHighlight - 코드 하이라이트 콜백 (chord) => void
     */
    constructor(container, opts = {}) {
        this._container = container;
        this._onChordHighlight = opts.onChordHighlight || null;
        this._currentLessonId = null;
        this._isOpen = true;
        this._render();
    }

    /* ── 초기 렌더링 ── */
    _render() {
        this._container.innerHTML = '';
        this._container.classList.add('lesson-panel');

        // 토글 버튼 (접기/펼치기)
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'lesson-panel__toggle';
        toggleBtn.textContent = '📖';
        toggleBtn.title = '강좌 패널 접기/펼치기';
        toggleBtn.addEventListener('click', () => this.toggle());
        this._container.appendChild(toggleBtn);
        this._toggleBtn = toggleBtn;

        // 패널 본문
        const body = document.createElement('div');
        body.className = 'lesson-panel__body';
        this._container.appendChild(body);
        this._body = body;

        // 헤더
        const header = document.createElement('div');
        header.className = 'lesson-panel__header';
        header.innerHTML = '<h2>🎸 기타 강좌</h2><p>계이름으로 쉽게 배워요!</p>';
        body.appendChild(header);

        // 강좌 목록
        const list = document.createElement('div');
        list.className = 'lesson-panel__list';
        body.appendChild(list);
        this._listEl = list;

        // 악보 영역
        const sheetArea = document.createElement('div');
        sheetArea.className = 'lesson-panel__sheet';
        sheetArea.style.display = 'none';
        body.appendChild(sheetArea);
        this._sheetArea = sheetArea;

        this._renderList();
    }

    /* ── 강좌 목록 렌더링 ── */
    _renderList() {
        this._listEl.innerHTML = '';
        LESSONS.forEach((lesson) => {
            const item = document.createElement('button');
            item.className = 'lesson-item';
            if (lesson.id === this._currentLessonId) {
                item.classList.add('lesson-item--active');
            }
            item.innerHTML = `
                <span class="lesson-item__title">${lesson.title}</span>
                <span class="lesson-item__sub">${lesson.subtitle}</span>
                <span class="lesson-item__chords">${lesson.chords.join(' · ')}</span>
            `;
            item.addEventListener('click', () => this._selectLesson(lesson.id));
            this._listEl.appendChild(item);
        });
    }

    /* ── 강좌 선택 ── */
    _selectLesson(id) {
        if (this._currentLessonId === id) {
            // 같은 강좌 클릭 시 목록으로 돌아감
            this._currentLessonId = null;
            this._sheetArea.style.display = 'none';
            this._listEl.style.display = '';
            this._renderList();
            return;
        }

        this._currentLessonId = id;
        this._renderList();
        this._renderSheet(id);
    }

    /* ── 악보 렌더링 ── */
    _renderSheet(id) {
        const lesson = LESSONS.find((l) => l.id === id);
        if (!lesson) return;

        this._listEl.style.display = 'none';
        this._sheetArea.style.display = '';
        this._sheetArea.innerHTML = '';

        // 뒤로가기 버튼
        const backBtn = document.createElement('button');
        backBtn.className = 'lesson-sheet__back';
        backBtn.textContent = '← 목록으로';
        backBtn.addEventListener('click', () => this._selectLesson(id));
        this._sheetArea.appendChild(backBtn);

        // 제목
        const title = document.createElement('h3');
        title.className = 'lesson-sheet__title';
        title.textContent = lesson.title;
        this._sheetArea.appendChild(title);

        // 설명
        const desc = document.createElement('p');
        desc.className = 'lesson-sheet__desc';
        desc.textContent = lesson.description;
        this._sheetArea.appendChild(desc);

        // 사용 코드 뱃지
        const chordBadges = document.createElement('div');
        chordBadges.className = 'lesson-sheet__badges';
        lesson.chords.forEach((c) => {
            const badge = document.createElement('span');
            badge.className = 'chord-badge';
            badge.textContent = c;
            badge.addEventListener('click', () => {
                if (this._onChordHighlight) this._onChordHighlight(c);
            });
            chordBadges.appendChild(badge);
        });
        this._sheetArea.appendChild(chordBadges);

        // 악보 테이블
        const table = document.createElement('div');
        table.className = 'lesson-sheet__notes';

        lesson.sheet.forEach((item, idx) => {
            const col = document.createElement('div');
            col.className = 'note-col';

            // 코드
            const chordEl = document.createElement('div');
            chordEl.className = 'note-col__chord';
            // 이전과 같은 코드면 표시하지 않음
            const prevChord = idx > 0 ? lesson.sheet[idx - 1].chord : null;
            chordEl.textContent = item.chord !== prevChord ? item.chord : '';
            if (item.chord !== prevChord) {
                chordEl.classList.add('note-col__chord--change');
            }

            // 계이름
            const noteEl = document.createElement('div');
            noteEl.className = 'note-col__note';
            noteEl.textContent = item.note;

            // 가사
            const lyricEl = document.createElement('div');
            lyricEl.className = 'note-col__lyric';
            lyricEl.textContent = item.lyric || '';

            col.appendChild(chordEl);
            col.appendChild(noteEl);
            col.appendChild(lyricEl);

            col.addEventListener('click', () => {
                if (this._onChordHighlight) this._onChordHighlight(item.chord);
            });

            table.appendChild(col);
        });

        this._sheetArea.appendChild(table);
    }

    /* ── 패널 접기/펼치기 ── */
    toggle() {
        this._isOpen = !this._isOpen;
        this._container.classList.toggle('lesson-panel--collapsed', !this._isOpen);
        this._toggleBtn.textContent = this._isOpen ? '📖' : '▶';
    }

    /* ── 외부에서 열기/닫기 ── */
    open() {
        if (!this._isOpen) this.toggle();
    }

    close() {
        if (this._isOpen) this.toggle();
    }
}
