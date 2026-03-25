// ─── Obstacle Manager ─────────────────────────────────────────────────────────

class ObstacleManager {
  constructor() {
    this.obstacles  = [];
    this._gap       = OBSTACLE_MIN_GAP;
    this._nextSpawn = OBSTACLE_MIN_GAP;
    this._traveled  = 0;
  }

  reset() {
    for (const obs of this.obstacles) obs.active = false;
    this._gap       = OBSTACLE_MIN_GAP;
    this._nextSpawn = OBSTACLE_MIN_GAP + 200;
    this._traveled  = 0;
  }

  setGap(score) {
    const reductions = Math.floor(score / SPEED_SCORE_INTERVAL);
    this._gap = Math.max(OBSTACLE_GAP_MIN, OBSTACLE_MIN_GAP - reductions * OBSTACLE_GAP_REDUCE);
  }

  update(gameSpeed, score, dt = 16.666) {
    const timeScale = dt / 16.666;
    const frameSpeed = gameSpeed * timeScale;
    this._traveled += frameSpeed;

    // Move existing obstacles
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      
      let speed = frameSpeed;
      if (obs.type.id === 'pterodactyl') {
        speed += PTERODACTYL_SPEED_OFFSET * timeScale;
      }
      
      obs.x     -= speed;
      obs.frame += timeScale;
      // Pterodactyl hover sine movement
      if (obs.type.id === 'pterodactyl') {
        obs.y = obs._baseY + Math.sin(obs.frame * 0.05) * 10;
      }
      if (obs.x + obs.w <= -100) obs.active = false;
    }

    // Spawn new
    if (this._traveled >= this._nextSpawn) {
      this._spawn(score);
      // More randomized spacing: from 80% to 150% of the current gap
      const randomFactor = 0.8 + Math.random() * 0.7;
      this._nextSpawn = this._traveled + (this._gap * randomFactor);
    }
  }

  _spawn(score) {
    // Available obstacle types at current score
    const available = OBSTACLE_TYPES.filter(t => !t.minScore || score >= t.minScore);
    const typeA     = available[Math.floor(Math.random() * available.length)];

    this._addObstacle(typeA, 0);

    // Combos after 1000 pts (30% chance of a second obstacle)
    if (score >= COMBO_SCORE_START && Math.random() < 0.30) {
      const typeB = available[Math.floor(Math.random() * available.length)];
      // Offset second obstacle so it's reachable
      this._addObstacle(typeB, typeA.w + 80 + Math.random() * 60);
    }
  }

  _addObstacle(type, xOffset = 0) {
    let y = GROUND_Y - type.h;
    if (type.aerial) {
      const rand = Math.random();
      if (rand < 0.33) {
        y = GROUND_Y - type.h - 15; // Low (must jump)
      } else if (rand < 0.66) {
        y = GROUND_Y - type.h - 35; // Mid (must duck)
      } else {
        y = GROUND_Y - type.h - 60; // High (avoid jumping)
      }
    }

    const obs = this.obstacles.find(o => !o.active);
    if (obs) {
      obs.active = true;
      obs.type = type;
      obs.x = CANVAS_WIDTH + 20 + xOffset;
      obs.y = y;
      obs._baseY = y;
      obs.w = type.w;
      obs.h = type.h;
      obs.frame = 0;
    } else {
      this.obstacles.push({
        active: true,
        type,
        x:      CANVAS_WIDTH + 20 + xOffset,
        y,
        _baseY: y,
        w:      type.w,
        h:      type.h,
        frame:  0,
      });
    }
  }

  // AABB collision with player hitbox
  checkCollision(playerHitbox) {
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      const obsHitbox = this._hitbox(obs);
      if (rectsOverlap(playerHitbox, obsHitbox)) {
        return obs;
      }
    }
    return null;
  }

  checkTarCollision(playerHitbox) {
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      if (obs.type.id !== 'tar') continue;
      if (rectsOverlap(playerHitbox, this._hitbox(obs))) return true;
    }
    return false;
  }

  _hitbox(obs) {
    // Slightly inset hitboxes for fairness
    return { x: obs.x + 4, y: obs.y + 4, w: obs.w - 8, h: obs.h - 8 };
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
