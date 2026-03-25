// ─── Renderer ─────────────────────────────────────────────────────────────────
// All pixel-art drawing helpers. Sprites are drawn procedurally.

class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this._shakeFrames  = 0;
    this._shakeIntensity = 0;
    this._flashFrames  = 0;
    this._flashColor   = 'rgba(255,255,255,0.5)';
    this._initSprites();
    this._initPteroSprites();
  }

  _initPteroSprites() {
    const upStr = `
.....BBBBB.........................
....B33333B........................
...B3222222B.......................
..B322222211B......................
.B32222111111B.....................
B3222111111111B...........BBBBBB...
B322211111111111B........B333333B..
B32221111111111111B......B322WW2B..
B2211111111BB11111222B...B3222B22B.
.B11111111B..BB1122222B.B32222222B.
..BB11111B.....BB222222B22222222BBB
....BB11B........B22222211111111YYB
......BB...BBBBBBB11122211BBBBBBBBB
..........B3222221111111BB.........
..........B2222222111111B..........
...........B2222B111111B...........
............BBBB.B1111B............
................B1111B.............
.................BBBB..............
...................................
...................................
...................................
...................................
`;
    const downStr = `
...................................
...................................
...................................
...................................
..........................BBBBBB...
.........................B333333B..
.........................B322WW2B..
.........................B3222B22B.
...............BBBBBBBBBB32222222B.
..............B33333333332222222BBB
.............B322222222211111111YYB
............B3222221111111BBBBBBBBB
...........B3222211111111B.........
..........B3222111111111B..........
.........B3222111111111B...........
........B3222111111111B............
.......B2211111111111B.............
......B1111111111111B..............
.....BB111111111111B...............
....B1111111111111B................
...BB111111111111B.................
...BBBBBBBBBBBBBB..................
...................................
`;
    this.pteroSprites = {
      up: this._renderPteroSprite(upStr),
      down: this._renderPteroSprite(downStr)
    };
  }

  _renderPteroSprite(map) {
    const c = document.createElement('canvas');
    c.width  = 70;
    c.height = 46;
    const ctx = c.getContext('2d');
    const pal = {
      '.': null, 'B': '#1a1a1a', '1': '#1e8449',
      '2': '#27ae60', '3': '#2ecc71', 'Y': '#f1c40f', 'W': '#ffffff'
    };
    const rows = map.trim().split('\n');
    for (let r = 0; r < 23; r++) {
      if (!rows[r]) continue;
      for (let cCol = 0; cCol < 35; cCol++) {
        const char = rows[r][cCol] || '.';
        if (pal[char]) {
          ctx.fillStyle = pal[char];
          ctx.fillRect(cCol * 2, r * 2, 2, 2);
        }
      }
    }
    return c;
  }

  _initSprites() {
    this.sprites = {};
    for (let i = 0; i < SKINS.length; i++) {
        const skinInfo = SKINS[i];
        const template = skinInfo.id === 'dino' ? SPRITE_MAPS.dino : SPRITE_MAPS.human;
        this.sprites[i] = {
           run1: this._renderSpriteMap(template.run1, skinInfo.colors),
           run2: this._renderSpriteMap(template.run2, skinInfo.colors),
           duck: this._renderSpriteMap(template.duck, skinInfo.colors)
        };
    }
  }

  _renderSpriteMap(map, colors) {
    const c = document.createElement('canvas');
    c.width = PLAYER_W;
    c.height = PLAYER_H;
    const ctx = c.getContext('2d');
    
    for (let row = 0; row < 18; row++) {
      if (!map[row]) continue;
      for (let col = 0; col < 14; col++) {
        const char = map[row][col] || ' ';
        if (char === ' ') continue;
        
        let fill = '';
        switch(char) {
          case 'D': fill = '#1a1a1a'; break;
          case 'B': fill = colors.body; break;
          case 'P': fill = colors.pants || colors.body; break;
          case '+': fill = colors.skin  || colors.body; break;
          case '^': fill = colors.hair  || colors.body; break;
          case 'E': fill = colors.extra || colors.body; break;
          case 'O': fill = '#111'; break;
          case 'S': fill = '#fff'; break;
        }
        if (fill) {
           ctx.fillStyle = fill;
           ctx.fillRect(col * 4, row * 4, 4, 4);
        }
      }
    }
    return c;
  }

  // ── Screen FX ──────────────────────────────────────────────────────────────
  triggerShake(frames = 8, intensity = 6) {
    this._shakeFrames    = frames;
    this._shakeIntensity = intensity;
  }

  triggerFlash(color = 'rgba(255,220,0,0.4)', frames = 6) {
    this._flashFrames = frames;
    this._flashColor  = color;
  }

  applyShake() {
    if (this._shakeFrames > 0) {
      const i = this._shakeIntensity;
      this.ctx.translate(
        (Math.random() - 0.5) * i,
        (Math.random() - 0.5) * i
      );
      this._shakeFrames--;
    }
  }

  applyFlash() {
    if (this._flashFrames > 0) {
      this.ctx.fillStyle = this._flashColor;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this._flashFrames--;
    }
  }

  // ── Pixel rect helper ──────────────────────────────────────────────────────
  px(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  // ── Player ─────────────────────────────────────────────────────────────────
  drawPlayer(player) {
    const { x, y, w, h, skinIndex, state, frame, powerups } = player;

    // Blink effect if invulnerable
    if (player._invulnerableTimer > 0 && Math.floor(frame / 4) % 2 === 0) {
      return;
    }

    const skin = SKINS[skinIndex].colors;
    const ctx  = this.ctx;
    const isDucking = state === 'DUCKING';

    ctx.save();

    // Glow for star / shield
    if (powerups.star) {
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur  = 18;
    } else if (powerups.shield) {
      ctx.shadowColor = '#3498db';
      ctx.shadowBlur  = 14;
    } else if (powerups.wings) {
      ctx.shadowColor = '#9b59b6';
      ctx.shadowBlur  = 10;
    }

    if (isDucking) {
      const sprite = this.sprites[skinIndex].duck;
      // duck sprite is drawn at ground level
      ctx.drawImage(sprite, x, y + h - PLAYER_DUCK_H - (PLAYER_H - PLAYER_DUCK_H));
    } else {
      const legCycle = Math.floor(frame * 0.15) % 2 === 0;
      const sprite = legCycle ? this.sprites[skinIndex].run1 : this.sprites[skinIndex].run2;
      
      // --- Wings ---
      if (powerups.wings) {
        const wy = y + 16;
        const flap = Math.sin(frame * 0.4) * 4;
        ctx.fillStyle = '#ecf0f1';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, wy);
        ctx.lineTo(x - 16, wy - 10 + flap);
        ctx.lineTo(x - 4,  wy + 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.drawImage(sprite, x, y);
    }

    ctx.restore();

    // shield bubble
    if (powerups.shield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(52,152,219,0.9)';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      // Add slight pulsing to shield
      const p = Math.sin(frame * 0.1) * 2;
      ctx.ellipse(x + w/2, y + h/2, w/2 + 8 + p, h/2 + 8 + p, 0, 0, Math.PI*2);
      ctx.stroke();
      // Outer glow of the stroke
      ctx.lineWidth   = 1;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Obstacles ──────────────────────────────────────────────────────────────
  drawObstacle(obs) {
    const { x, y, w, h, type, frame } = obs;
    switch (type.id) {
      case 'rocks':       this._drawRocks(x, y, w, h);          break;
      case 'log':         this._drawLog(x, y, w, h);            break;
      case 'tar':         this._drawTar(x, y, w, h, frame);     break;
      case 'pterodactyl': this._drawPterodactyl(x, y, w, h, frame); break;
      case 'volcano':     this._drawVolcano(x, y, w, h, frame); break;
      case 'bones':       this._drawBones(x, y, w, h);          break;
    }
  }

  _drawRocks(x, y, w, h) {
    // Outlines
    this.px(x-2,  y+12, 26, 34, '#1a1a1a');
    this.px(x+2,  y+6,  22, 18, '#1a1a1a');
    this.px(x+18, y+18, 30, 28, '#1a1a1a');
    this.px(x+22, y+10, 26, 18, '#1a1a1a');
    this.px(x+38, y+16, 16, 30, '#1a1a1a');

    // Fill
    this.px(x,    y+14, 22, 30, '#7f8c8d');
    this.px(x+4,  y+8,  18, 14, '#95a5a6');
    this.px(x+20, y+20, 26, 24, '#6c7a7d');
    this.px(x+24, y+12, 22, 14, '#8a9a9d');
    this.px(x+40, y+18, 12, 26, '#5d6d7e');

    // Highlights (top/left)
    this.px(x,    y+14, 10, 4, '#bdc3c7');
    this.px(x+4,  y+8,   8, 4, '#d0d3d4');
    this.px(x+20, y+20, 12, 4, '#aab7b8');
    this.px(x+24, y+12, 10, 4, '#bdc3c7');

    // Shadows (bottom/right)
    this.px(x+14, y+34,  8, 10, '#5d6d7e');
    this.px(x+36, y+36, 10,  8, '#5d6d7e');
    this.px(x+44, y+34,  8, 10, '#34495e');
  }

  _drawLog(x, y, w, h) {
    // Outline
    this.px(x-2, y+8, w+4, h-6, '#1a1a1a');

    // Body
    this.px(x,   y+10, w,   h-10, '#8B4513');   
    this.px(x,   y+10, 12,  h-10, '#e67e22'); // left cut face
    this.px(x+w-16, y+10, 16, h-10, '#5c2d0c'); // right shadow
    
    // Highlight
    this.px(x+12, y+10, w-28, 4, '#d35400');   
    
    // Bark rings / grains
    this.px(x+16, y+16, w-36, 2, '#5c2d0c');
    this.px(x+24, y+22, w-40, 2, '#5c2d0c');
    this.px(x+12, y+28, w-32, 2, '#5c2d0c');
    
    // Face spiral
    this.px(x+4, y+14, 4, 4, '#a04000');
  }

  _drawTar(x, y, w, h, frame) {
    const pulse = Math.sin(frame * 0.1) * 3;
    this.px(x,    y+4,  w,   h-4, '#1a1a1a');
    this.px(x+4,  y,    w-8, h-4, '#2c2c2c');
    // bubbles
    this.px(x+10+pulse, y+2, 6, 6, '#3d3d3d');
    this.px(x+30,       y+1, 4, 4, '#3d3d3d');
    this.px(x+55-pulse, y+3, 6, 6, '#3d3d3d');
  }

  _drawPterodactyl(x, y, w, h, frame) {
    const flap = Math.sin(frame * 0.2) > 0;
    this.ctx.drawImage(flap ? this.pteroSprites.up : this.pteroSprites.down, x, y);
  }


  _drawVolcano(x, y, w, h, frame) {
    // Base
    this.px(x,    y+h/2, w,   h/2, '#7f3b08');
    this.px(x+8,  y+h/3, w-16, h*2/3, '#9c4a1a');
    this.px(x+16, y+8,   w-32, h*0.7, '#b05a2a');
    // Crater
    this.px(x+20, y+4,   w-40, 12, '#3d1f00');
    // Lava glow
    const g = Math.abs(Math.sin(frame * 0.08));
    this.ctx.fillStyle = `rgba(255,${Math.round(80+g*80)},0,0.85)`;
    this.ctx.fillRect(x+24, y+6, w-48, 8);
    // Lava drips
    if (frame % 20 < 10) {
      this.px(x+28, y+14, 6, 10, '#ff5500');
    }
    if ((frame+10) % 20 < 10) {
      this.px(x+38, y+14, 6, 8, '#ff7700');
    }
  }

  _drawBones(x, y, w, h) {
    // Outline
    this.px(x-2, y+4, 16, 20, '#1a1a1a');
    this.px(x+w-14, y+4, 16, 20, '#1a1a1a');
    this.px(x-2, y+16, 14, 18, '#1a1a1a');
    this.px(x+w-14, y+16, 14, 18, '#1a1a1a');
    this.px(x-2, y+8, w+4, 12, '#1a1a1a');
    this.px(x-2, y+20, w+4, 10, '#1a1a1a');

    // horizontal bone
    this.px(x+6,  y+10, w-12, 8, '#fff');
    this.px(x+6,  y+14, w-12, 4, '#e0e0e0'); // shadow strip

    // end knobs
    this.px(x,    y+6,  12,  16, '#fff');
    this.px(x+w-12, y+6, 12, 16, '#fff');
    
    // second bone (angled via separate rect)
    this.px(x+4,  y+22, w-8,  6, '#fff');
    this.px(x+2,  y+18, 10,  14, '#fff');
    this.px(x+w-12, y+18, 10, 14, '#fff');
    
    // bottom shadows of knobs
    this.px(x,    y+18, 12,   4, '#e0e0e0');
    this.px(x+w-12, y+18, 12, 4, '#e0e0e0');
    this.px(x+2,  y+28, 10,   4, '#e0e0e0');
  }

  // ── Collectibles ───────────────────────────────────────────────────────────
  drawCollectible(col) {
    const { x, y, w, h, type, frame } = col;
    const bob = Math.sin(frame * 0.1) * 3;
    switch (type.id) {
      case 'egg':        this._drawEgg(x, y+bob, w, h, '#f5f5dc', '#d4c990'); break;
      case 'golden_egg': this._drawEgg(x, y+bob, w, h, '#ffd700', '#b8860b'); break;
      case 'coins':      this._drawCoins(x, y+bob, w, h); break;
      case 'wings':      this._drawWings(x, y+bob, w, h, frame); break;
      case 'star':       this._drawStar(x, y+bob, w, h, frame); break;
      case 'shield':     this._drawShield(x, y+bob, w, h, frame); break;
    }
  }

  _drawEgg(x, y, w, h, c1, c2) {
    this.px(x+4,  y,   w-8, 6,   c1);
    this.px(x+2,  y+6, w-4, 12,  c1);
    this.px(x,    y+18, w,   8,   c2);
    this.px(x+2,  y+26, w-4, 4,   c2);
  }

  _drawCoins(x, y, w, h) {
    const cx = [[0,0], [16,2], [28,-2]];
    for (const [dx, dy] of cx) {
      this.px(x+dx+2, y+dy,   8,  2, '#ffd700');
      this.px(x+dx,   y+dy+2, 12, 4, '#ffd700');
      this.px(x+dx+2, y+dy+6,  8,  2, '#b8860b');
      this.px(x+dx+4, y+dy+2,  4,  4, '#fff176');  // shine
    }
  }

  _drawWings(x, y, w, h, frame) {
    const flap = Math.sin(frame * 0.15) * 4;
    this.px(x,    y+flap, 14, 10, '#bdc3c7');
    this.px(x,    y+flap+8, 10, 12, '#ecf0f1');
    this.px(x+18, y+flap, 14, 10, '#bdc3c7');
    this.px(x+18, y+flap+8, 10, 12, '#ecf0f1');
    this.px(x+13, y+4,     6,  18, '#7f8c8d');  // center quill
  }

  _drawStar(x, y, w, h, frame) {
    const glow = Math.abs(Math.sin(frame * 0.1));
    this.ctx.fillStyle = `rgba(255,220,0,${0.3 + glow * 0.4})`;
    this.ctx.fillRect(x-4, y-4, w+8, h+8);
    // star shape via pixel blocks
    this.px(x+12, y,    6, 30, '#f1c40f');  // vertical bar
    this.px(x,    y+12, 30,  6, '#f1c40f'); // horizontal bar
    this.px(x+4,  y+4,  6,  6, '#f1c40f');  // corners
    this.px(x+20, y+4,  6,  6, '#f1c40f');
    this.px(x+4,  y+20, 6,  6, '#f1c40f');
    this.px(x+20, y+20, 6,  6, '#f1c40f');
  }

  _drawShield(x, y, w, h, frame) {
    const glow = Math.abs(Math.sin(frame * 0.1));
    this.ctx.fillStyle = `rgba(52,152,219,${0.15 + glow * 0.25})`;
    this.ctx.fillRect(x-2, y-2, w+4, h+4);
    // shield shape
    this.px(x+2,  y,    w-4, 4, '#7fb3d3');
    this.px(x,    y+4,  w,   18, '#3498db');
    this.px(x+2,  y+22, w-4, 6, '#2980b9');
    this.px(x+6,  y+28, w-12, 4, '#2471a3');
    this.px(x+10, y+30, 8,   2, '#1a5276');
    // cross emblem
    this.px(x+12, y+8,  4,  14, '#ecf0f1');
    this.px(x+7,  y+13, 14,  4,  '#ecf0f1');
  }

  // ── Particles ──────────────────────────────────────────────────────────────
  drawParticles(particles) {
    for (const p of particles) {
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.px(p.x, p.y, p.size, p.size, p.color);
    }
    this.ctx.globalAlpha = 1;
  }

  // ── HUD elements ───────────────────────────────────────────────────────────
  drawPowerupIcon(type, x, y, timeLeft, duration) {
    const ratio = timeLeft / duration;
    // background bar
    this.px(x-2, y-2, 44, 34, 'rgba(0,0,0,0.5)');
    // icon
    const fakeCol = { x, y: y+2, w: 30, h: 28, type: COLLECTIBLE_TYPES.find(t=>t.id===type), frame: 0 };
    if (fakeCol.type) this.drawCollectible(fakeCol);
    // timer bar
    this.ctx.fillStyle = ratio > 0.3 ? '#2ecc71' : '#e74c3c';
    this.ctx.fillRect(x-2, y+32, Math.round(44*ratio), 4);
  }
}
