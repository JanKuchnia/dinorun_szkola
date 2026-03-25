// ─── Collectible Manager ──────────────────────────────────────────────────────

class CollectibleManager {
  constructor() {
    this.collectibles = [];
    this._frame = 0;
  }

  reset() {
    for (const col of this.collectibles) col.active = false;
    this._frame = 0;
  }

  update(gameSpeed, score, dt = 16.666, obstacles = []) {
    const timeScale = dt / 16.666;
    const frameSpeed = gameSpeed * timeScale;
    this._frame += timeScale;

    // Move existing
    for (const col of this.collectibles) {
      if (!col.active) continue;
      col.x    -= frameSpeed;
      col.frame += timeScale;
      // Remove off-screen
      if (col.x + col.w <= -10) col.active = false;
    }

    // Random spawn — higher score = slightly more collectibles
    const chance = COLLECTIBLE_CHANCE * (1 + score / 5000) * timeScale;
    if (Math.random() < chance) {
      this._spawn(score, obstacles);
    }
  }

  _spawn(score, obstacles) {
    // Weight: regular collectibles more likely than power-ups
    const weights = [30, 10, 20, 8, 6, 6]; // egg, golden_egg, coins, wings, star, shield
    const total   = weights.reduce((a, b) => a + b, 0);
    let rand      = Math.random() * total;
    let idx       = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { idx = i; break; }
    }

    const type = COLLECTIBLE_TYPES[idx];

    // Prevent spawning inside an obstacle
    const isOverlapping = obstacles.some(obs => {
      if (!obs.active) return false;
      const distX = Math.abs(obs.x - (CANVAS_WIDTH + 10));
      return distX < 70; // 70px safe zone
    });
    if (isOverlapping) return;

    const isAerial = ['wings', 'star', 'shield'].includes(type.id);
    const y = isAerial
      ? GROUND_Y - 90 - Math.random() * 40
      : GROUND_Y - type.h - 10;

    // Object Pool: find inactive, else create new
    const col = this.collectibles.find(c => !c.active);
    if (col) {
      col.active = true;
      col.type = type;
      col.x = CANVAS_WIDTH + 10;
      col.y = y;
      col.w = type.w;
      col.h = type.h;
      col.frame = 0;
      col.collected = false;
    } else {
      this.collectibles.push({
        active: true,
        type,
        x:     CANVAS_WIDTH + 10,
        y,
        w:     type.w,
        h:     type.h,
        frame: 0,
        collected: false,
      });
    }
  }

  // Returns type that was collected (if any), null otherwise
  checkCollision(playerHitbox) {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      if (!col.active || col.collected) continue;
      const hb = { x: col.x, y: col.y, w: col.w, h: col.h };
      if (rectsOverlap(playerHitbox, hb)) {
        col.collected = true;
        col.active = false; // Despawn
        return col.type;
      }
    }
    return null;
  }
}
