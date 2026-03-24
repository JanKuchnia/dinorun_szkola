// ─── Particle System ───────────────────────────────────────────────────────────

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  reset() { this.particles = []; }

  burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size:    3 + Math.floor(Math.random() * 4),
        color,
        life:    1,
        maxLife: 1,
        decay:   0.04 + Math.random() * 0.04,
      });
    }
  }

  dustCloud(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + Math.random() * 30,
        y: y + Math.random() * 8,
        vx: -1 - Math.random() * 2,
        vy: -0.5 - Math.random(),
        size:    4,
        color:   '#c8b89a',
        life:    1,
        maxLife: 1,
        decay:   0.06,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity on particles
      p.life -= p.decay;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }
}
