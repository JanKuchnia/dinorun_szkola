// ─── Input Handler ───────────────────────────────────────────────────────────

class InputHandler {
  constructor() {
    this.keys = {};
    this.jumpPressed  = false;
    this.duckPressed  = false;
    this._jumpConsumed = false;

    // Touch support
    this._touchStartY = 0;

    window.addEventListener('keydown', e => this._onKeyDown(e));
    window.addEventListener('keyup',   e => this._onKeyUp(e));
    window.addEventListener('touchstart', e => this._onTouchStart(e), { passive: true });
    window.addEventListener('touchend',   e => this._onTouchEnd(e),   { passive: true });
  }

  _onKeyDown(e) {
    this.keys[e.code] = true;

    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (!this._jumpConsumed) {
        this.jumpPressed = true;
        this._jumpConsumed = true;
      }
    }
    if (e.code === 'ArrowDown') {
      this.duckPressed = true;
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      this._jumpConsumed = false;
    }
    if (e.code === 'ArrowDown') {
      this.duckPressed = false;
    }
  }

  _onTouchStart(e) {
    this._touchStartY = e.touches[0].clientY;
  }

  _onTouchEnd(e) {
    const dy = e.changedTouches[0].clientY - this._touchStartY;
    if (dy > 40) {
      this.duckPressed = true;
      setTimeout(() => { this.duckPressed = false; }, 400);
    } else {
      this.jumpPressed = true;
      setTimeout(() => { this.jumpPressed = false; this._jumpConsumed = false; }, 50);
    }
  }

  consumeJump() {
    const j = this.jumpPressed;
    this.jumpPressed = false;
    return j;
  }

  isDucking() {
    return this.duckPressed || this.keys['ArrowDown'];
  }
}
