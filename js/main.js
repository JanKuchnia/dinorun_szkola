// ─── Main Game Loop ────────────────────────────────────────────────────────────

const GameState = {
  MENU:       'MENU',
  SKIN_SELECT:'SKIN_SELECT',
  PLAYING:    'PLAYING',
  GAME_OVER:  'GAME_OVER',
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.state     = GameState.MENU;
    this.score     = 0;
    this.gameSpeed = SPEED_INITIAL;

    this.input       = new InputHandler();
    this.renderer    = new Renderer(this.ctx);
    this.terrain     = new Terrain(this.ctx);
    this.player      = new Player();
    this.obstacles   = new ObstacleManager();
    this.collectibles= new CollectibleManager();
    this.particles   = new ParticleSystem();
    this.ui          = new UI(this.canvas, this.ctx);
    this.audio       = new AudioManager();

    this._lastTime   = 0;
    this._milestones = new Set();
    this._milestoneTimer = 0;
    this._currentMilestone = 0;

    this._bindMenuEvents();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // ── Event Bindings ─────────────────────────────────────────────────────────
  _bindMenuEvents() {
    // Start button
    document.getElementById('btnStart').addEventListener('click', () => this._goToSkinSelect());
    document.getElementById('btnRestart').addEventListener('click', () => this._startGame());
    document.getElementById('btnSkinBack').addEventListener('click', () => this._goToMenu());
    document.getElementById('btnSkinStart').addEventListener('click',() => this._startGame());
    document.getElementById('btnMute').addEventListener('click', (e) => {
      const on = this.audio.toggle();
      e.target.textContent = on ? '🔊' : '🔇';
    });

    // Leaderboard
    document.getElementById('btnLeaderboard').addEventListener('click', () => this._showLeaderboard());
    document.getElementById('btnGameOverLeaderboard').addEventListener('click', () => this._showLeaderboard(true));
    document.getElementById('btnLbBack').addEventListener('click', () => {
      document.getElementById('leaderboardOverlay').style.display = 'none';
      if (this.state === GameState.GAME_OVER) {
        document.getElementById('gameOverOverlay').style.display = 'flex';
      } else {
        document.getElementById('menuOverlay').style.display = 'flex';
      }
    });

    const btnSubmit = document.getElementById('btnSubmitScore');
    const nameInput = document.getElementById('playerNameInput');
    btnSubmit.addEventListener('click', async () => {
      const name = nameInput.value.trim() || 'ANON';
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'ZAPISYW...';
      await Leaderboard.addScore(name, this.score);
      await this._renderLeaderboard();
      document.getElementById('nameInputContainer').style.display = 'none';
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'ZAPISZ';
    });

    // Space bar on menu/game-over starts game
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'Enter') {
        const lbVisible = document.getElementById('leaderboardOverlay').style.display === 'flex';
        if (lbVisible) return; // ignore if leaderboard is open

        if      (this.state === GameState.MENU)      this._goToSkinSelect();
        else if (this.state === GameState.GAME_OVER) this._startGame();
      }
    });

    // Tap on canvas during game-over
    this.canvas.addEventListener('click', () => {
      const lbVisible = document.getElementById('leaderboardOverlay').style.display === 'flex';
      if (this.state === GameState.GAME_OVER && !lbVisible) this._startGame();
    });

    // Skin selection cards
    const grid = document.getElementById('skinGrid');
    SKINS.forEach((skin, i) => {
      const card = document.createElement('div');
      card.className   = 'skin-card' + (i === 0 ? ' selected' : '');
      card.dataset.idx = i;
      card.innerHTML   = `
        <canvas class="skin-preview" width="80" height="100"></canvas>
        <div class="skin-name">${skin.name}</div>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.player.skinIndex = i;
      });
      grid.appendChild(card);

      // Draw preview
      const previewCtx = card.querySelector('.skin-preview').getContext('2d');
      // Reuse the main game's cached sprites instead of regenerating
      previewCtx.drawImage(this.renderer.sprites[i].run1, 12, 14);
    });
  }

  // ── State transitions ──────────────────────────────────────────────────────
  _goToMenu() {
    this.state = GameState.MENU;
    document.getElementById('menuOverlay').style.display     = 'flex';
    document.getElementById('skinOverlay').style.display     = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
  }

  _goToSkinSelect() {
    this.state = GameState.SKIN_SELECT;
    document.getElementById('menuOverlay').style.display     = 'none';
    document.getElementById('skinOverlay').style.display     = 'flex';
    document.getElementById('gameOverOverlay').style.display = 'none';
  }

  async _showLeaderboard(fromGameOver = false) {
    document.getElementById('menuOverlay').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('leaderboardOverlay').style.display = 'flex';
    
    // Hide name input by default
    document.getElementById('nameInputContainer').style.display = 'none';
    const list = document.getElementById('leaderboardList');
    list.innerHTML = 'Wczytywanie...';

    // If opening from Game Over with a valid score, show the input
    if (fromGameOver && this.score > 0) {
       document.getElementById('nameInputContainer').style.display = 'flex';
       document.getElementById('lbCurrentScore').textContent = Math.floor(this.score);
       document.getElementById('playerNameInput').value = '';
       document.getElementById('playerNameInput').focus();
    }

    await this._renderLeaderboard();
  }

  async _renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    const scores = await Leaderboard.getScores();
    if (scores.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding: 20px;">BRAK WYNIKÓW</div>';
      return;
    }
    list.innerHTML = scores.map((s, i) => `
      <div class="leaderboard-entry">
        <span>${i + 1}. ${s.name}</span>
        <span style="color: var(--c-gold)">${s.score}</span>
      </div>
    `).join('');
  }

  _startGame() {
    this.state     = GameState.PLAYING;
    this.score     = 0;
    this.gameSpeed = SPEED_INITIAL;
    this._milestones.clear();
    this._milestoneTimer = 0;

    document.getElementById('menuOverlay').style.display     = 'none';
    document.getElementById('skinOverlay').style.display     = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';

    this.player.reset();
    this.obstacles.reset();
    this.collectibles.reset();
    this.particles.reset();
  }

  _gameOver() {
    this.state = GameState.GAME_OVER;
    this.ui.saveHiScore(Math.floor(this.score));

    const overlay  = document.getElementById('gameOverOverlay');
    overlay.style.display = 'flex';
    document.getElementById('finalScore').textContent = `WYNIK: ${Math.floor(this.score)}`;
    document.getElementById('hiScore').textContent    = `NAJLEPSZY: ${parseInt(localStorage.getItem('dinoHS'))}`;

    this.renderer.triggerShake(14, 8);
    this.audio.death();
  }

  // ── Main loop ─────────────────────────────────────────────────────────────
  _loop(timestamp) {
    const dt   = Math.min(timestamp - this._lastTime, 50); // cap at 50ms
    this._lastTime = timestamp;

    this.ctx.save();
    this.renderer.applyShake();

    this.terrain.draw();

    if (this.state === GameState.PLAYING) {
      this._update(dt);
    }

    this._drawEntities();
    this.renderer.applyFlash();

    this.ctx.restore();
    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    // Score & speed
    this.score     += SCORE_PER_FRAME * (this.player.isSlowed ? 0.4 : 1);
    const newSpeed  = SPEED_INITIAL + Math.floor(this.score / SPEED_SCORE_INTERVAL) * SPEED_INCREMENT;
    this.gameSpeed  = Math.min(newSpeed, SPEED_MAX);

    // Check milestones
    const milestoneScores = [500, 1000, 2000, 3000, 5000];
    for (const ms of milestoneScores) {
      if (this.score >= ms && !this._milestones.has(ms)) {
        this._milestones.add(ms);
        this._milestoneTimer  = 90;
        this._currentMilestone = ms;
        this.audio.milestone();
        this.renderer.triggerFlash('rgba(255,220,50,0.35)', 10);
      }
    }
    if (this._milestoneTimer > 0) this._milestoneTimer--;

    // Terrain phase
    this.terrain.setPhase(this.score);

    // Determine effective speed (slow from tar)
    const effectiveSpeed = this.player.isSlowed ? this.gameSpeed * 0.4 : this.gameSpeed;

    // Update subsystems
    this.terrain.update(effectiveSpeed, dt);
    this.player.update(this.input, dt);

    // Jump sound
    if (this.player.state === 'JUMPING'        && this.player.vy === JUMP_FORCE) this.audio.jump();
    if (this.player.state === 'DOUBLE_JUMPING' && this.player.vy === JUMP_FORCE) this.audio.doubleJump();

    // Dust particles when running on ground
    if (this.player.onGround && this.player.state === 'RUNNING') {
      if (Math.random() < 0.15) {
        this.particles.dustCloud(
          this.player.x + 4,
          GROUND_Y + 4
        );
      }
    }

    this.obstacles.setGap(this.score);
    this.obstacles.update(effectiveSpeed, this.score, dt);
    this.collectibles.update(effectiveSpeed, this.score, dt, this.obstacles.obstacles);
    this.particles.update(dt);
    this.ui.updatePopups();

    // Collision detection
    const hitbox = this.player.hitbox;

    // Obstacles
    const hitObs = this.obstacles.checkCollision(hitbox);
    if (hitObs) {
      const killed = this.player.hitByObstacle();
      if (killed) {
        // Burst of particles at player
        this.particles.burst(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#e74c3c', 14);
        this._gameOver();
        return;
      } else {
        this.renderer.triggerFlash('rgba(52,152,219,0.5)', 8);
        this.renderer.triggerShake(5, 4);
        this.particles.burst(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#3498db', 8);
      }
    }

    // Tar slow
    if (this.obstacles.checkTarCollision(hitbox)) {
      this.player.slowByTar();
    }

    // Collectibles
    const collected = this.collectibles.checkCollision(hitbox);
    if (collected) {
      // Score popup
      const displayX = this.player.x + this.player.w + 6;
      const displayY = this.player.y;
      if (collected.score > 0) {
        this.score += collected.score;
        const label = collected.score >= 50 ? `+${collected.score}!` : `+${collected.score}`;
        const color = collected.id === 'golden_egg' ? '#ffd700' : '#2ecc71';
        this.ui.addPopup(label, displayX, displayY, color);
      } else {
        const names = {
          'wings': 'SKRZYDŁA!',
          'star': 'GWIAZDA!',
          'shield': 'TARCZA!'
        };
        this.ui.addPopup(names[collected.id] || collected.id.toUpperCase() + '!', displayX, displayY, '#9b59b6');
      }

      // Activate power-up
      if (collected.powerup) {
        this.player.applyPowerup(collected.powerup);
      }

      // Particle burst — color by type
      const burstColors = {
        egg: '#f5f5dc', golden_egg: '#ffd700', coins: '#f39c12',
        wings: '#9b59b6', star: '#f1c40f', shield: '#3498db',
      };
      this.particles.burst(
        this.player.x + this.player.w/2,
        this.player.y + this.player.h/2,
        burstColors[collected.id] || '#fff',
        10
      );
      this.renderer.triggerFlash('rgba(255,255,255,0.15)', 3);
      this.audio.collect(collected.id);
    }
  }

  _drawEntities() {
    if (this.state === GameState.PLAYING || this.state === GameState.GAME_OVER) {
      // Obstacles
      for (const obs of this.obstacles.obstacles) {
        if (obs.active) this.renderer.drawObstacle(obs);
      }
      // Collectibles
      for (const col of this.collectibles.collectibles) {
        if (col.active) this.renderer.drawCollectible(col);
      }
      // Particles
      this.renderer.drawParticles(this.particles.particles);
      // Player (on top)
      this.renderer.drawPlayer(this.player);
      // HUD
      this.ui.drawHUD(this.score, this.player);
      this.ui.drawSpeedIndicator(this.gameSpeed);
      // Slow tint
      if (this.player.isSlowed) this.ui.drawSlowEffect(this.ctx);
      // Milestone banner
      if (this._milestoneTimer > 0) this.ui.drawMilestone(this._currentMilestone);
    }
  }
}

// Start when DOM ready
window.addEventListener('DOMContentLoaded', () => { new Game(); });
