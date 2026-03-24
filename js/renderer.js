// ─── Renderer ─────────────────────────────────────────────────────────────────
// All pixel-art drawing helpers. Sprites are drawn procedurally.

class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this._shakeFrames  = 0;
    this._shakeIntensity = 0;
    this._flashFrames  = 0;
    this._flashColor   = 'rgba(255,255,255,0.5)';
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
      this._drawPlayerDucking(x, y + h - PLAYER_DUCK_H, w, PLAYER_DUCK_H, skin, frame);
    } else {
      this._drawPlayerRunning(x, y, w, h, skin, frame, powerups);
    }

    ctx.restore();

    // shield bubble
    if (powerups.shield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(52,152,219,0.8)';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2 + 8, h/2 + 8, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPlayerRunning(x, y, w, h, skin, frame, powerups) {
    const ox = x, oy = y;
    const legCycle = Math.sin(frame * 0.4);

    // --- Wings ---
    if (powerups && powerups.wings) {
      const wy = oy + 16;
      // left wing
      this.ctx.fillStyle = '#ecf0f1';
      this.ctx.beginPath();
      this.ctx.moveTo(ox + 8, wy);
      this.ctx.lineTo(ox - 14, wy - 10 + legCycle * 4);
      this.ctx.lineTo(ox,      wy + 14);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Body
    this.px(ox+10, oy+20, 28, 32, skin.body);        // torso

    // Head
    this.px(ox+14, oy+2,  22, 20, skin.skin);         // face
    this.px(ox+14, oy,    22,  8, skin.hair);          // hair

    // Eyes
    this.px(ox+22, oy+8,   4,  4, '#222');
    this.px(ox+30, oy+8,   4,  4, '#222');

    // Arms (swing)
    const armSwing = Math.round(legCycle * 5);
    this.px(ox+4,  oy+22+armSwing, 10, 8, skin.body); // left arm
    this.px(ox+34, oy+22-armSwing, 10, 8, skin.body); // right arm

    // Legs
    const leg1 = Math.round(legCycle * 10);
    const leg2 = Math.round(-legCycle * 10);
    this.px(ox+12, oy+52+leg1,  10, 14, skin.pants);
    this.px(ox+26, oy+52+leg2,  10, 14, skin.pants);

    // Shoes
    this.px(ox+10, oy+64+leg1,  14,  8, '#fff');
    this.px(ox+24, oy+64+leg2,  14,  8, '#fff');

    // Backpack (only for backpack skin style using skin.extra)
    this.px(ox+36, oy+18, 10, 26, skin.extra);
  }

  _drawPlayerDucking(x, y, w, h, skin, frame) {
    const legCycle = Math.sin(frame * 0.4);
    this.px(x+6,  y,     30, 14, skin.skin);        // head
    this.px(x+6,  y,     30,  6, skin.hair);         // hair
    this.px(x+4,  y+14,  34, 18, skin.body);         // body
    this.px(x+34, y+12,   8, 14, skin.extra);        // back item
    // legs splayed out
    const s = Math.round(legCycle * 4);
    this.px(x,    y+30+s, 20, 10, skin.pants);
    this.px(x+22, y+30-s, 22, 10, skin.pants);
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
    // 3 rocks
    this.px(x,    y+14, 22, 30, '#7f8c8d');
    this.px(x+4,  y+8,  18, 14, '#95a5a6');
    this.px(x+20, y+20, 26, 24, '#6c7a7d');
    this.px(x+24, y+12, 22, 14, '#8a9a9d');
    this.px(x+40, y+18, 12, 26, '#5d6d7e');
    // shadows
    this.px(x+2,  y+h-4, 18, 4, '#5d6d7e');
    this.px(x+22, y+h-4, 24, 4, '#5d6d7e');
  }

  _drawLog(x, y, w, h) {
    this.px(x,   y+10, w,   h-10, '#8B4513');   // body
    this.px(x,   y+10, 12,  h-10, '#A0522D');   // left face
    this.px(x+w-12, y+10, 12, h-10, '#6B3410'); // right shadow
    this.px(x+4, y+10,  w-8, 8,   '#A0522D');   // highlight
    // rings
    this.px(x+4, y+14, w-8, 2, '#6B3410');
    this.px(x+4, y+20, w-8, 2, '#6B3410');
    this.px(x+4, y+26, w-8, 2, '#6B3410');
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
    const ctx  = this.ctx;
    ctx.fillStyle = '#7b6b52';

    // Body
    this.px(x+24, y+16, 22, 18, '#7b6b52');
    // Head
    this.px(x+44, y+10, 18, 14, '#8b7b62');
    // Beak
    this.px(x+58, y+12, 14,  6, '#c8a96e');
    // Eye
    this.px(x+50, y+12,  4,  4, '#111');

    // Wings
    if (flap) {
      // wings up
      this.px(x,    y,    26, 16, '#6b5b42');
      this.px(x+44, y,    24, 16, '#6b5b42');
    } else {
      // wings down
      this.px(x,    y+14, 26, 20, '#6b5b42');
      this.px(x+44, y+14, 24, 20, '#6b5b42');
    }
    // Legs
    this.px(x+28, y+32,  6, 14, '#7b6b52');
    this.px(x+36, y+32,  6, 14, '#7b6b52');
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
    // horizontal bone
    this.px(x+6,  y+10, w-12, 8, '#f0ead6');
    // end knobs
    this.px(x,    y+6,  12,  16, '#e8e0cc');
    this.px(x+w-12, y+6, 12, 16, '#e8e0cc');
    // second bone (angled via separate rect)
    this.px(x+4,  y+22, w-8,  6, '#f0ead6');
    this.px(x+2,  y+18, 10,  14, '#e8e0cc');
    this.px(x+w-12, y+18, 10, 14,'#e8e0cc');
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
