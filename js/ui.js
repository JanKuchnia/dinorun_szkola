// ─── UI / HUD ─────────────────────────────────────────────────────────────────

class UI {
  constructor(canvas, ctx) {
    this.canvas   = canvas;
    this.ctx      = ctx;
    this._hiScore = parseInt(localStorage.getItem('dinoHS') || '0');

    // Floating score popups
    this._popups = [];
  }

  saveHiScore(score) {
    if (score > this._hiScore) {
      this._hiScore = score;
      localStorage.setItem('dinoHS', score);
    }
  }

  addPopup(text, x, y, color = '#f1c40f') {
    this._popups.push({ text, x, y, vy: -1.5, life: 1, maxLife: 1, color });
  }

  updatePopups() {
    for (const p of this._popups) {
      p.y    += p.vy;
      p.life -= 0.025;
    }
    this._popups = this._popups.filter(p => p.life > 0);
  }

  drawHUD(score, player) {
    const ctx  = this.ctx;
    const disp = Math.floor(score);

    // Score panel background
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(12, 10, 220, 44, 10);
    ctx.fill();

    // Score text
    ctx.fillStyle = '#e8d5a3';
    ctx.font      = 'bold 15px "Press Start 2P", monospace';
    ctx.fillText(`WYNIK  ${String(disp).padStart(6,'0')}`, 22, 28);

    ctx.fillStyle = '#aaa';
    ctx.font      = '10px "Press Start 2P", monospace';
    ctx.fillText(`MAX  ${String(this._hiScore).padStart(6,'0')}`, 22, 48);

    // Power-up icons
    let px = CANVAS_WIDTH - 60;
    if (player.powerups.wings) {
      this._drawPowerupBar(px, 12, '#9b59b6', player.wingRatio, '✦');
      px -= 60;
    }
    if (player.powerups.star) {
      this._drawPowerupBar(px, 12, '#f1c40f', player.starRatio, '★');
      px -= 60;
    }
    if (player.powerups.shield) {
      this._drawPowerupBar(px, 12, '#3498db', 1, '⛊');
    }

    // Floating popups
    for (const p of this._popups) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.font        = 'bold 14px "Press Start 2P", monospace';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  _drawPowerupBar(x, y, color, ratio, icon) {
    const ctx = this.ctx;
    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, 50, 36, 8);
    ctx.fill();

    // Fill bar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 24, Math.max(0, Math.round(46 * ratio)), 8, 4);
    ctx.fill();

    // Icon
    ctx.fillStyle = '#fff';
    ctx.font      = '18px sans-serif';
    ctx.fillText(icon, x + 14, y + 20);
  }

  drawSpeedIndicator(gameSpeed) {
    const ctx   = this.ctx;
    const level = Math.floor((gameSpeed - SPEED_INITIAL) / (SPEED_MAX - SPEED_INITIAL) * 10);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(12, 60, 130, 18, 6);
    ctx.fill();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(14, 62, Math.round(Math.min(level,10) / 10 * 126), 14, 5);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font      = '7px "Press Start 2P", monospace';
    ctx.fillText('PRĘDKOŚĆ', 16, 73);
  }

  drawSlowEffect(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawMilestone(score) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,220,60,0.22)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${score} PUNKTÓW!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font      = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffe97d';
    if (score === 500)  ctx.fillText('PTERODAKTYLE ATAKUJĄ!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    if (score === 1000) ctx.fillText('TEREN: EPOKA KAMIENIA!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    if (score === 2000) ctx.fillText('TEREN: WULKANICZNY!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}
