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
    this.offset         = (this.offset + gameSpeed) % CANVAS_WIDTH;
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

    // Draw Sun / Moon (Pixel Art)
    ctx.fillStyle = this.terrainPhase === 0 ? '#f1c40f' : this.terrainPhase === 1 ? '#ecf0f1' : '#c0392b';
    const cRadius = 24;
    const cx = 700 - this._bgMountainOffset * 0.1 % CANVAS_WIDTH;
    const cy = 80;
    // pixelated circle
    for(let i = -cRadius; i <= cRadius; i += 4) {
      for(let j = -cRadius; j <= cRadius; j += 4) {
        if(i*i + j*j <= cRadius*cRadius) {
           ctx.fillRect(cx + i, cy + j, 4, 4);
        }
      }
    }

    // 3 parallax layers
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = colors[layer];
      const step  = 180 - layer * 30;
      const ht    = 80 + layer * 40;
      const speed = layer + 1;
      const off   = (offsetX * speed * 0.5) % step;

      for (let tx = -step + off % step; tx < CANVAS_WIDTH + step; tx += step) {
        // Draw pixelated / stepped mountain
        for (let y = 0; y < ht; y += 4) {
          const w = Math.max(4, Math.floor((y / ht) * step / 4) * 4);
          const cx = tx + step/2;
          ctx.fillRect(Math.floor(cx - w/2), GROUND_Y - ht + y, w, 4);
        }
      }
    }
  }

  _generateGroundTextures() {
    this.groundTextures = {};
    for (let p = 0; p < 3; p++) {
      const c = document.createElement('canvas');
      const cw = CANVAS_WIDTH;
      const ch = CANVAS_HEIGHT - GROUND_Y;
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext('2d');

      const dirtCol = p === 0 ? '#8B6914' : p === 1 ? '#424242' : '#3a0000';
      const bgCol   = p === 0 ? '#63490b' : p === 1 ? '#212121' : '#1a0000';
      const topCol  = p === 0 ? '#5d9c3a' : p === 1 ? '#757575' : '#2c2c2c';
      const edgeCol = p === 0 ? '#4a7f2e' : p === 1 ? '#616161' : '#1a1a1a';
      const fossCol = p === 0 ? '#d4c990' : p === 1 ? '#9e9e9e' : '#5a0000';
      const gemCol  = p === 0 ? '#3498db' : p === 1 ? '#9b59b6' : '#ff5500';

      // Base dirt
      ctx.fillStyle = dirtCol;
      ctx.fillRect(0, 0, cw, ch);

      // Noise generator (clumps of bg color)
      ctx.fillStyle = bgCol;
      for (let i = 0; i < 400; i++) {
        const nx = Math.floor(Math.random() * (cw / 4)) * 4;
        const ny = Math.floor(Math.random() * (ch / 4)) * 4;
        if (ny > 8) ctx.fillRect(nx, ny, 4 + Math.random()*8, 4);
      }

      // Fossils & Gems
      for (let i = 0; i < 15; i++) {
        const fx = Math.floor(Math.random() * (cw / 20)) * 20;
        const fy = 24 + Math.floor(Math.random() * (ch - 30));
        ctx.fillStyle = Math.random() > 0.8 ? gemCol : fossCol;
        // Simple pixel bone/gem shape
        ctx.fillRect(fx, fy, 12, 4);
        ctx.fillRect(fx-4, fy-4, 4, 4);
        ctx.fillRect(fx-4, fy+4, 4, 4);
        ctx.fillRect(fx+12, fy-4, 4, 4);
        ctx.fillRect(fx+12, fy+4, 4, 4);
      }

      // Top strip with jagged 'dripping' edges
      for (let x = 0; x < cw; x += 4) {
        // Random root drip
        const drip = Math.random() > 0.8 ? Math.floor(Math.random() * 4)*4 : 0;
        const h = GROUND_HEIGHT + (p === 0 ? drip : (Math.random()>0.5?4:0)); // more drip for grass
        
        ctx.fillStyle = topCol;
        ctx.fillRect(x, 0, 4, h);
        
        ctx.fillStyle = edgeCol;
        ctx.fillRect(x, h - 4, 4, 4);
      }
      this.groundTextures[p] = c;
    }
  }

  _drawGround() {
    const ctx = this.ctx;
    if (!this.groundTextures) this._generateGroundTextures();

    const tex = this.groundTextures[this.terrainPhase];
    const off = Math.floor(this.offset) % CANVAS_WIDTH;
    
    // Draw two copies of the texture side by side to scroll seamlessly
    ctx.drawImage(tex, -off, GROUND_Y);
    ctx.drawImage(tex, CANVAS_WIDTH - off, GROUND_Y);
  }
}
