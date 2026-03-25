// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
  constructor() {
    this.x   = PLAYER_X;
    this.y   = GROUND_Y - PLAYER_H;
    this.w   = PLAYER_W;
    this.h   = PLAYER_H;
    this.vy  = 0;
    this.onGround = true;
    this.state    = 'RUNNING'; // RUNNING | JUMPING | DOUBLE_JUMPING | DUCKING | HIT
    this.frame    = 0;
    this.skinIndex = 0;
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
    this.y   = GROUND_Y - PLAYER_H;
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

  // hitbox (inset slightly for fairness)
  get hitbox() {
    if (this.state === 'DUCKING') {
      return { x: this.x + 8, y: this.y + this.h - PLAYER_DUCK_H + 6, w: this.w - 16, h: PLAYER_DUCK_H - 12 };
    }
    return { x: this.x + 10, y: this.y + 6, w: this.w - 20, h: this.h - 12 };
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
