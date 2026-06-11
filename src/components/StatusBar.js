/**
 * StatusBar.js — 하단 상태 표시 바
 */

export class StatusBar {
    /**
     * @param {HTMLElement} container 상태 바 컨테이너
     */
    constructor(container) {
        this.container = container;
        this._elements = {};
        this._render();
    }

    /** 초기 렌더링 */
    _render() {
        this.container.innerHTML = `
      <div class="status-item">
        <span class="status-dot" id="status-pick"></span>
        <span id="status-pick-text">오른손 피크 그립: 대기</span>
      </div>
      <div class="status-item">
        <span id="status-fps">FPS: --</span>
      </div>
      <div class="status-item">
        <span class="status-dot" id="status-pinch"></span>
        <span id="status-pinch-text">왼손 코드 터치: 대기</span>
      </div>
    `;

        this._elements = {
            pickDot: this.container.querySelector('#status-pick'),
            pickText: this.container.querySelector('#status-pick-text'),
            pinchDot: this.container.querySelector('#status-pinch'),
            pinchText: this.container.querySelector('#status-pinch-text'),
            fps: this.container.querySelector('#status-fps'),
        };
    }

    /**
     * 상태 업데이트
     * @param {Object} info { leftPinch: boolean, rightPickGrip: boolean }
     */
    update(info) {
        if (!info) return;

        const { pickDot, pickText, pinchDot, pinchText } = this._elements;

        // 오른손 피크 그립
        if (info.rightPickGrip) {
            pickDot.className = 'status-dot active';
            pickText.textContent = '오른손 피크 그립: 감지됨';
        } else {
            pickDot.className = 'status-dot';
            pickText.textContent = '오른손 피크 그립: 대기';
        }

        // 왼손 코드 터치
        if (info.leftPinch) {
            pinchDot.className = 'status-dot active';
            pinchText.textContent = '왼손 코드 터치: 감지됨';
        } else {
            pinchDot.className = 'status-dot';
            pinchText.textContent = '왼손 코드 터치: 대기';
        }
    }

    /** FPS 표시 업데이트 */
    updateFPS(fps) {
        if (this._elements.fps) {
            this._elements.fps.textContent = `FPS: ${fps}`;
        }
    }

    /** 메시지 표시 */
    setMessage(msg) {
        if (this._elements.fps) {
            this._elements.fps.textContent = msg;
        }
    }
}
