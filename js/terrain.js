// ─── Terrain ─────────────────────────────────────────────────────────────────

class Terrain {
  constructor(ctx) {
    this.ctx    = ctx;
    this.offset = 0;
    this._cloudOffset = 0;
    this._bgMountainOffset = 0;
    this._clouds = this._genClouds();
    this.terrainPhase = 0; // 0=grass, 1=stone, 2=metal
  }

  _genClouds() {
    const clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 30 + Math.random() * 90,
        w: 50 + Math.random() * 80,
        h: 20 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.4,
      });
    }
    return clouds;
  }

  update(gameSpeed) {
    this.offset         = (this.offset + gameSpeed) % TILE_WIDTH;
    this._cloudOffset   = (this._cloudOffset + 0.4) % (CANVAS_WIDTH + 200);
    this._bgMountainOffset = (this._bgMountainOffset + gameSpeed * 0.2) % CANVAS_WIDTH;

    for (const c of this._clouds) {
      c.x -= c.speed * (gameSpeed / SPEED_INITIAL);
      if (c.x + c.w < 0) {
        c.x = CANVAS_WIDTH + 10;
        c.y = 30 + Math.random() * 90;
        c.w = 50 + Math.random() * 80;
      }
    }
  }

  setPhase(score) {
    if      (score >= 2000) this.terrainPhase = 2;
    else if (score >= 1000) this.terrainPhase = 1;
    else                    this.terrainPhase = 0;
  }

  draw() {
    const ctx = this.ctx;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    switch (this.terrainPhase) {
      case 0: grad.addColorStop(0, '#87ceeb'); grad.addColorStop(1, '#e0f4fd'); break;
      case 1: grad.addColorStop(0, '#546e7a'); grad.addColorStop(1, '#b0bec5'); break;
      case 2: grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e'); break;
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this._drawClouds();
    this._drawMountains();
    this._drawGround();
  }

  _drawClouds() {
    const ctx = this.ctx;
    for (const c of this._clouds) {
      ctx.fillStyle = this.terrainPhase === 2
        ? 'rgba(100,120,160,0.3)'
        : 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.ellipse(c.x + c.w*0.3, c.y + c.h*0.3, c.w*0.35, c.h*0.55, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.ellipse(c.x + c.w*0.7, c.y + c.h*0.35, c.w*0.3, c.h*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    }
  }

  _drawMountains() {
    const ctx = this.ctx;
    const offsetX = -this._bgMountainOffset;
    const colors = this.terrainPhase === 0
      ? ['#90a9b7', '#6d8a9a', '#4e6e7e']
      : this.terrainPhase === 1
        ? ['#546e7a', '#455a64', '#37474f']
        : ['#1a237e', '#283593', '#303f9f'];

    // 3 parallax layers
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = colors[layer];
      const step  = 180 - layer * 30;
      const ht    = 80 + layer * 40;
      const speed = layer + 1;
      const off   = (offsetX * speed * 0.5) % step;

      for (let tx = -step + off % step; tx < CANVAS_WIDTH + step; tx += step) {
        ctx.beginPath();
        ctx.moveTo(tx,        GROUND_Y - 20);
        ctx.lineTo(tx + step/2, GROUND_Y - 20 - ht);
        ctx.lineTo(tx + step,   GROUND_Y - 20);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  _drawGround() {
    const ctx = this.ctx;
    // ground block
    const groundColor  = this.terrainPhase === 0 ? '#8B6914'
                       : this.terrainPhase === 1 ? '#616161'
                       : '#37474f';
    const topColor     = this.terrainPhase === 0 ? '#5d9c3a'
                       : this.terrainPhase === 1 ? '#9e9e9e'
                       : '#607d8b';
    const detailColor  = this.terrainPhase === 0 ? '#4a7f2e'
                       : this.terrainPhase === 1 ? '#757575'
                       : '#455a64';

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // top strip
    ctx.fillStyle = topColor;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);

    // tiling detail lines
    ctx.fillStyle = detailColor;
    const tileW = TILE_WIDTH;
    for (let tx = -this.offset; tx < CANVAS_WIDTH; tx += tileW) {
      ctx.fillRect(Math.round(tx), GROUND_Y + 4, 2, GROUND_HEIGHT - 8);
    }

    // small pebble dots
    const seed = Math.floor(this.offset);
    for (let i = 0; i < 8; i++) {
      const px = (i * 113 + seed * 7) % CANVAS_WIDTH;
      const py = GROUND_Y + GROUND_HEIGHT + 4 + (i * 31) % 10;
      ctx.fillStyle = detailColor;
      ctx.fillRect(px, py, 3, 2);
    }
  }
}
