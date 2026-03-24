// ─── Collectible Manager ──────────────────────────────────────────────────────

class CollectibleManager {
  constructor() {
    this.collectibles = [];
    this._frame = 0;
  }

  reset() {
    this.collectibles = [];
    this._frame = 0;
  }

  update(gameSpeed, score) {
    this._frame++;

    // Move existing
    for (const col of this.collectibles) {
      col.x    -= gameSpeed;
      col.frame++;
    }

    // Remove off-screen
    this.collectibles = this.collectibles.filter(c => c.x + c.w > -10);

    // Random spawn — higher score = slightly more collectibles
    const chance = COLLECTIBLE_CHANCE * (1 + score / 5000);
    if (Math.random() < chance) {
      this._spawn(score);
    }
  }

  _spawn(score) {
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

    // Collectibles float at different heights
    const isAerial = ['wings', 'star', 'shield'].includes(type.id);
    const y = isAerial
      ? GROUND_Y - 90 - Math.random() * 40
      : GROUND_Y - type.h - 10;

    this.collectibles.push({
      type,
      x:     CANVAS_WIDTH + 10,
      y,
      w:     type.w,
      h:     type.h,
      frame: 0,
      collected: false,
    });
  }

  // Returns type that was collected (if any), null otherwise
  checkCollision(playerHitbox) {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      if (col.collected) continue;
      const hb = { x: col.x, y: col.y, w: col.w, h: col.h };
      if (rectsOverlap(playerHitbox, hb)) {
        col.collected = true;
        this.collectibles.splice(i, 1);
        return col.type;
      }
    }
    return null;
  }
}
