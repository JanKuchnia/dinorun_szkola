// ─── Audio (Web Audio API) ─────────────────────────────────────────────────────

class AudioManager {
  constructor() {
    this._ctx = null;
    this._enabled = true;
  }

  _ensure() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
  }

  _beep(freq, type, duration, gain = 0.15, delay = 0) {
    if (!this._enabled) return;
    try {
      this._ensure();
      const osc = this._ctx.createOscillator();
      const g   = this._ctx.createGain();
      osc.type  = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, this._ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + delay + duration);
      osc.connect(g);
      g.connect(this._ctx.destination);
      osc.start(this._ctx.currentTime + delay);
      osc.stop(this._ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  jump()       { this._beep(520, 'square', 0.12, 0.12);
                 this._beep(680, 'square', 0.10, 0.08, 0.04); }

  doubleJump() { this._beep(780, 'square', 0.12, 0.12);
                 this._beep(960, 'square', 0.10, 0.10, 0.05); }

  collect(id) {
    if (['wings','star','shield'].includes(id)) {
      this._beep(660,  'sine', 0.08, 0.12);
      this._beep(880,  'sine', 0.08, 0.12, 0.07);
      this._beep(1100, 'sine', 0.08, 0.10, 0.14);
    } else {
      this._beep(600, 'sine', 0.08, 0.12);
      this._beep(900, 'sine', 0.06, 0.10, 0.06);
    }
  }

  death() {
    this._beep(400, 'sawtooth', 0.15, 0.20);
    this._beep(280, 'sawtooth', 0.15, 0.20, 0.10);
    this._beep(180, 'sawtooth', 0.20, 0.18, 0.22);
  }

  milestone() {
    [523, 659, 784, 1047].forEach((f, i) => this._beep(f, 'square', 0.12, 0.12, i * 0.09));
  }

  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  }
}
