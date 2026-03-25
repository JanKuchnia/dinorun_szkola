// ─── Audio (Web Audio API + Assets) ──────────────────────────────────────────────

class AudioManager {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    
    // External asset URLs (stable raw GitHub links)
    this.urls = {
      jump:      'https://raw.githubusercontent.com/itsmarsss/dinosaur-game/main/assets/jump.mp3',
      collect:   'https://raw.githubusercontent.com/itsmarsss/dinosaur-game/main/assets/point.mp3',
      death:     'https://raw.githubusercontent.com/itsmarsss/dinosaur-game/main/assets/die.mp3',
      powerup:   'https://raw.githubusercontent.com/urho3d/Urho3D/master/bin/Data/Sounds/Powerup.wav'
    };
    
    // Cache for Audio objects
    this.samples = {};
    this._preLoad();
  }

  _preLoad() {
    for (const [key, url] of Object.entries(this.urls)) {
      const audio = new Audio(url);
      audio.volume = 0.4;
      this.samples[key] = audio;
    }
  }

  _ensure() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
  }

  // Procedural fallback (Oscillators)
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

  _playAsset(key) {
    if (!this._enabled) return false;
    const s = this.samples[key];
    if (s) {
      const clone = s.cloneNode();
      clone.volume = 0.35;
      clone.play().catch(() => {});
      return true;
    }
    return false;
  }

  jump() { 
    if (!this._playAsset('jump')) {
      this._beep(520, 'square', 0.12, 0.12);
      this._beep(680, 'square', 0.10, 0.08, 0.04);
    }
  }

  doubleJump() { 
    this.jump(); // Reuse jump sound
    this._beep(880, 'square', 0.10, 0.10, 0.05); 
  }

  collect(id) {
    const isPowerup = ['wings','star','shield'].includes(id);
    if (isPowerup) {
      if (!this._playAsset('powerup')) {
        this._beep(660,  'sine', 0.08, 0.12);
        this._beep(880,  'sine', 0.08, 0.12, 0.07);
        this._beep(1100, 'sine', 0.08, 0.10, 0.14);
      }
    } else {
      if (!this._playAsset('collect')) {
        this._beep(600, 'sine', 0.08, 0.12);
        this._beep(900, 'sine', 0.06, 0.10, 0.06);
      }
    }
  }

  death() {
    if (!this._playAsset('death')) {
      this._beep(400, 'sawtooth', 0.15, 0.20);
      this._beep(280, 'sawtooth', 0.15, 0.20, 0.10);
      this._beep(180, 'sawtooth', 0.20, 0.18, 0.22);
    }
  }

  milestone() {
    if (!this._playAsset('collect')) { // Reuse collect/point sound
      [523, 659, 784, 1047].forEach((f, i) => this._beep(f, 'square', 0.12, 0.12, i * 0.09));
    }
  }

  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  }
}
