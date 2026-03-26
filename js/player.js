// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
  constructor() {
    this.skinIndex = 0;
    const skin = SKINS[this.skinIndex];
    this.x   = PLAYER_X;
    this.w   = skin.w;
    this.h   = skin.h;
    this.y   = GROUND_Y - this.h;
    this.vy  = 0;
    this.onGround = true;
    this.state    = 'RUNNING'; // RUNNING | JUMPING | DOUBLE_JUMPING | DUCKING | HIT
    this.frame    = 0;
    this._wingsDuration  = 0;
    this._starDuration   = 0;
    this._shieldDuration = 0;
    this._doubleJumpUsed = false;
    this._slowTimer = 0;  // frames of slowdown from tar
    this._invulnerableTimer = 0; // frames of invulnerability after shield break

    // Power-ups
    this.powerups = {
      wings:  false,
      star:   false,
      shield: false,
    };
  }

  reset() {
    const skin = SKINS[this.skinIndex];
    this.w   = skin.w;
    this.h   = skin.h;
    this.y   = GROUND_Y - this.h;
    this.vy  = 0;
    this.onGround = true;
    this.state    = 'RUNNING';
    this.frame    = 0;
    this._doubleJumpUsed = false;
    this._slowTimer = 0;
    this._invulnerableTimer = 0;
    this.powerups = { wings: false, star: false, shield: false };
    this._wingsDuration = 0;
    this._starDuration  = 0;
  }

  // hitbox (using skin-specific offsets)
  get hitbox() {
    const skin = SKINS[this.skinIndex];
    if (this.state === 'DUCKING') {
      const d = skin.duckHit;
      // Adjust y position for ducking height
      const duckY = this.y + (this.h - skin.duckH);
      return { 
        x: this.x + d.x, 
        y: duckY + d.y, 
        w: d.w, 
        h: d.h 
      };
    }
    const h = skin.hit;
    return { 
      x: this.x + h.x, 
      y: this.y + h.y, 
      w: h.w, 
      h: h.h 
    };
  }

  applyPowerup(id) {
    switch (id) {
      case 'wings':
        this.powerups.wings = true;
        this._wingsDuration = WINGS_DURATION;
        break;
      case 'star':
        this.powerups.star = true;
        this._starDuration  = STAR_DURATION;
        break;
      case 'shield':
        this.powerups.shield = true;
        this._shieldDuration = SHIELD_DURATION;
        break;
    }
  }

  hitByObstacle() {
    if (this.powerups.star || this._invulnerableTimer > 0) return false; // invincible
    if (this.powerups.shield) {
      this.powerups.shield = false;
      this._invulnerableTimer = 60; // 1 second invulnerability
      return false; // absorbed
    }
    return true; // real hit
  }

  slowByTar() {
    this._slowTimer = 60;
  }

  get isSlowed() { return this._slowTimer > 0; }

  update(input, dt) {
    // Power-up timers (subtracting explicit milliseconds)
    if (this.powerups.wings) {
      this._wingsDuration -= dt;
      if (this._wingsDuration <= 0) {
        this.powerups.wings = false;
        this._wingsDuration = 0;
      }
    }
    if (this.powerups.star) {
      this._starDuration -= dt;
      if (this._starDuration <= 0) {
        this.powerups.star = false;
        this._starDuration = 0;
      }
    }
    if (this.powerups.shield) {
      this._shieldDuration -= dt;
      if (this._shieldDuration <= 0) {
        this.powerups.shield = false;
        this._shieldDuration = 0;
      }
    }

    // Still scaling logical frames for invulnerability and slowdown
    const timeScale = dt / 16.666;
    if (this._slowTimer > 0) this._slowTimer -= timeScale;
    if (this._invulnerableTimer > 0) this._invulnerableTimer -= timeScale;

    // Ducking
    if (input.isDucking() && this.onGround) {
      this.state = 'DUCKING';
    } else if (this.onGround && this.state === 'DUCKING' && !input.isDucking()) {
      this.state = 'RUNNING';
    }

    const skin = SKINS[this.skinIndex];
    if (this.state === 'DUCKING') {
      this.h = skin.duckH;
    } else {
      this.h = skin.h;
    }

    // Jump
    if (input.consumeJump()) {
      if (this.onGround && this.state !== 'DUCKING') {
        this._jump();
      } else if (!this.onGround && this.powerups.wings && !this._doubleJumpUsed) {
        this._jump();
        this._doubleJumpUsed = true;
        this.state = 'DOUBLE_JUMPING';
      }
    }

    // Physics
    if (!this.onGround || this.state === 'JUMPING' || this.state === 'DOUBLE_JUMPING') {
      let gravity = GRAVITY;
      
      // Fast Fall: if ducking in air, fall much faster
      if (input.isDucking()) {
        gravity *= 4;
      }

      this.vy += gravity;
      this.y  += this.vy;

      const groundTop = GROUND_Y - this.h;
      if (this.y >= groundTop) {
        this.y   = groundTop;
        this.vy  = 0;
        this.onGround = true;
        this._doubleJumpUsed = false;
        this.state = 'RUNNING';
      } else {
        this.onGround = false;
      }
    }

    // Animation frame
    this.frame++;
  }

  _jump() {
    this.vy = JUMP_FORCE;
    this.onGround = false;
    this.state = 'JUMPING';
  }

  // Power-up remaining ratios for HUD
  get wingRatio() { return Math.max(0, this._wingsDuration / WINGS_DURATION); }
  get starRatio() { return Math.max(0, this._starDuration / STAR_DURATION); }
  get shieldRatio() { return Math.max(0, this._shieldDuration / SHIELD_DURATION); }
}
