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
    this._doubleJumpUsed = false;
    this._slowTimer = 0;  // frames of slowdown from tar

    // Power-ups
    this.powerups = {
      wings:  false,
      star:   false,
      shield: false,
    };
    this._wingsDuration  = 0;
    this._starDuration   = 0;
  }

  reset() {
    this.y   = GROUND_Y - PLAYER_H;
    this.vy  = 0;
    this.onGround = true;
    this.state    = 'RUNNING';
    this.frame    = 0;
    this._doubleJumpUsed = false;
    this._slowTimer = 0;
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
        break;
    }
  }

  hitByObstacle() {
    if (this.powerups.star) return false; // invincible
    if (this.powerups.shield) {
      this.powerups.shield = false;
      return false; // absorbed
    }
    return true; // real hit
  }

  slowByTar() {
    this._slowTimer = 60;
  }

  get isSlowed() { return this._slowTimer > 0; }

  update(input, dt) {
    // Power-up timers
    if (this.powerups.wings) {
      this._wingsDuration -= dt;
      if (this._wingsDuration <= 0) this.powerups.wings = false;
    }
    if (this.powerups.star) {
      this._starDuration -= dt;
      if (this._starDuration <= 0) this.powerups.star = false;
    }
    if (this._slowTimer > 0) this._slowTimer--;

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
      this.vy += GRAVITY;
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
  get wingRatio()  { return this._wingsDuration / WINGS_DURATION; }
  get starRatio()  { return this._starDuration  / STAR_DURATION; }
}
