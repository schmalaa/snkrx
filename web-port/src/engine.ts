export interface Hero {
  id: string;
  name: string;
  color: string;
  class: string;
  price: number;
  description: string;
  damage: number;
  cooldownFrames: number;
  type: 'normal' | 'spread' | 'aoe' | 'heal' | 'accelerating';
}

export class SNKRXEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  heroes: Hero[];
  
  // Game state
  snake: { x: number, y: number, hero: Hero, cooldown: number, maxCooldown: number }[] = [];
  enemies: { x: number, y: number, hp: number, maxHp: number, speed: number, size: number, color: string }[] = [];
  projectiles: { x: number, y: number, vx: number, vy: number, damage: number, color: string, type: 'normal' | 'spread' | 'aoe' | 'heal' | 'accelerating' }[] = [];
  particles: { x: number, y: number, vx: number, vy: number, life: number, maxLife: number, color: string, size: number }[] = [];
  
  mouseX: number = 0;
  mouseY: number = 0;
  
  health: number = 100;
  maxHealth: number = 100;
  score: number = 0;
  
  isRunning: boolean = false;
  lastTime: number = 0;
  
  classCounts: Record<string, number>;
  round: number;

  onGameOver: () => void;
  onVictory: (score: number) => void;
  
  constructor(canvas: HTMLCanvasElement, heroes: Hero[], classCounts: Record<string, number>, round: number, onGameOver: () => void, onVictory: (score: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.heroes = heroes;
    this.classCounts = classCounts;
    this.round = round;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    
    this.init();
  }
  
  init() {
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    
    if (this.classCounts['Warrior'] >= 2) {
      this.maxHealth += 50;
      this.health += 50;
    }
    
    // Initialize snake
    this.heroes.forEach((h) => {
      let maxCd = h.cooldownFrames;
      if (h.class === 'Ranger' && this.classCounts['Ranger'] >= 2) {
        maxCd *= 0.5; // Rangers fire twice as fast
      }
      
      this.snake.push({
        x: this.width / 2, // - i * 30,
        y: this.height / 2,
        hero: h,
        cooldown: Math.random() * maxCd,
        maxCooldown: maxCd
      });
    });
    
    // Listeners
    window.addEventListener('mousemove', this.handleMouseMove);
    
    // Spawn initial enemies, scaling with round
    const enemyCount = 10 + this.round * 5;
    for (let i = 0; i < enemyCount; i++) {
      this.spawnEnemy();
    }
  }
  
  destroy() {
    this.isRunning = false;
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
  
  handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }
  
  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * this.width; y = -50; }
    else if (side === 1) { x = this.width + 50; y = Math.random() * this.height; }
    else if (side === 2) { x = Math.random() * this.width; y = this.height + 50; }
    else { x = -50; y = Math.random() * this.height; }
    
    const isBig = Math.random() > 0.8 || (this.round >= 3 && Math.random() > 0.9);
    
    let baseHp = isBig ? 100 : 30;
    let baseSpeed = isBig ? 1 : 2;
    let color = isBig ? 'hsl(330, 100%, 50%)' : 'hsl(350, 100%, 60%)';

    // Difficulty scaling per round
    baseHp *= (1 + this.round * 0.4);
    baseSpeed *= (1 + this.round * 0.1);
    
    // Boss chance on higher rounds
    if (this.round >= 3 && Math.random() > 0.95) {
      baseHp *= 5;
      baseSpeed *= 0.5;
      color = 'var(--accent-secondary)';
    }

    this.enemies.push({
      x, y, 
      hp: baseHp,
      maxHp: baseHp,
      speed: baseSpeed,
      size: isBig ? 24 : 12,
      color: color
    });
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }
  
  loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    this.update(dt);
    this.render();
    
    if (this.health <= 0) {
      this.isRunning = false;
      this.onGameOver();
      return;
    }
    
    if (this.enemies.length === 0 && this.particles.length === 0) {
      this.isRunning = false;
      this.onVictory(this.score);
      return;
    }
    
    requestAnimationFrame(this.loop);
  }
  
  update(dt: number) {
    if (this.snake.length === 0) return;
    
    // Update snake positions
    const head = this.snake[0];
    const dx = this.mouseX - head.x;
    const dy = this.mouseY - head.y;
    head.x += dx * dt * 5;
    head.y += dy * dt * 5;
    
    for (let i = 1; i < this.snake.length; i++) {
      const prev = this.snake[i-1];
      const cur = this.snake[i];
      const ddx = prev.x - cur.x;
      const ddy = prev.y - cur.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist > 30) {
        cur.x += (ddx / dist) * (dist - 30);
        cur.y += (ddy / dist) * (dist - 30);
      }
    }
    
    // Update and shoot
    for (let i = 0; i < this.snake.length; i++) {
      const cur = this.snake[i];
      if (cur.cooldown > 0) cur.cooldown -= dt * 60;
      else if (this.enemies.length > 0) {
        // find nearest enemy
        let nearest = null;
        let minDist = 200; // Attack range
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (d < minDist) { minDist = d; nearest = e; }
        }
        
        if (nearest) {
          const angle = Math.atan2(nearest.y - cur.y, nearest.x - cur.x);
          const t = cur.hero.type;
          
          let dmg = cur.hero.damage;
          if (cur.hero.class === 'Warrior' && this.classCounts['Warrior'] >= 2) dmg *= 1.5;
          if (cur.hero.class === 'Mage' && this.classCounts['Mage'] >= 2) dmg *= 1.5;
          
          if (t === 'heal') {
            const healAmount = this.classCounts['Healer'] >= 2 ? 20 : 10;
            this.health = Math.min(this.maxHealth, this.health + healAmount);
            this.spawnParticles(cur.x, cur.y, '#0f0', 10, 3);
          } else if (t === 'spread') {
             const angles = this.classCounts['Rogue'] >= 2 ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.2, 0, 0.2];
             angles.forEach(da => {
               this.projectiles.push({
                 x: cur.x, y: cur.y,
                 vx: Math.cos(angle + da) * 400, vy: Math.sin(angle + da) * 400,
                 damage: dmg, color: cur.hero.color, type: 'spread'
               });
             });
          } else if (t === 'aoe') {
             this.projectiles.push({
               x: cur.x, y: cur.y,
               vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200,
               damage: dmg, color: cur.hero.color, type: 'aoe'
             });
          } else if (t === 'accelerating') {
             this.projectiles.push({
               x: cur.x, y: cur.y,
               vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100, // Starts slow
               damage: dmg, color: cur.hero.color, type: 'accelerating'
             });
          } else {
             this.projectiles.push({
               x: cur.x, y: cur.y,
               vx: Math.cos(angle) * 500, vy: Math.sin(angle) * 500,
               damage: dmg, color: cur.hero.color, type: 'normal'
             });
          }
          
          cur.cooldown = cur.maxCooldown;
          if (t !== 'heal') {
            this.spawnParticles(cur.x, cur.y, cur.hero.color, 1, 3);
          }
        }
      }
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
        this.projectiles.splice(i, 1);
        continue;
      }
      // Custom updates based on type
      if (p.type === 'accelerating') {
        p.vx *= 1.05;
        p.vy *= 1.05;
      }
      
      // Collision with enemies
      let hit = false;
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.size + (p.type === 'aoe' ? 20 : 5)) {
          
          if (p.type === 'aoe') {
             let aoeRadius = 60;
             if (this.classCounts['Mage'] >= 2) aoeRadius = 120; // Mage synergy doubles radius

             // Damage multiple nearby enemies
             for (const e2 of this.enemies) {
               if (Math.hypot(e2.x - p.x, e2.y - p.y) < aoeRadius) {
                 e2.hp -= p.damage;
               }
             }
             this.spawnParticles(p.x, p.y, p.color, 15, 5); // Huge explosion
             hit = true;
          } else {
             e.hp -= p.damage;
             hit = true;
             this.spawnParticles(p.x, p.y, e.color, 5, 2);
          }
          
          if (e.hp <= 0 && p.type !== 'aoe') { // AoE kills are checked differently to avoid state issues in loop
            this.enemies.splice(this.enemies.indexOf(e), 1);
            this.spawnParticles(e.x, e.y, e.color, 20, 4);
            this.score += 10;
          }
          
          break;
        }
      }
      
      // Secondary check for AoE deaths
      if (p.type === 'aoe') {
         for (let j = this.enemies.length - 1; j >= 0; j--) {
            if (this.enemies[j].hp <= 0) {
              this.spawnParticles(this.enemies[j].x, this.enemies[j].y, this.enemies[j].color, 20, 4);
              this.enemies.splice(j, 1);
              this.score += 10;
            }
         }
      }

      if (hit) this.projectiles.splice(i, 1);
    }
    
    // Update enemies
    for (const e of this.enemies) {
      const dHead = Math.hypot(head.x - e.x, head.y - e.y);
      if (dHead < e.size + 15) {
        this.health -= 10 * dt; // Take damage over time if touching
        this.spawnParticles(head.x, head.y, 'white', 1, 2);
      } else {
        const hAngle = Math.atan2(head.y - e.y, head.x - e.x);
        e.x += Math.cos(hAngle) * e.speed * dt * 60;
        e.y += Math.sin(hAngle) * e.speed * dt * 60;
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt * 60;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
  
  spawnParticles(x: number, y: number, color: string, count: number, size: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20, maxLife: 40,
        color, size: Math.random() * size + 1
      });
    }
  }
  
  render() {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw background grid (arcade feel)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
    }
    
    // Draw particles
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
    
    // Draw projectiles
    for (const p of this.projectiles) {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      const pSize = p.type === 'aoe' ? 8 : (p.type === 'accelerating' ? 6 : 4);
      this.ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
      this.ctx.fill();
      // Glow effect
      this.ctx.shadowBlur = p.type === 'aoe' ? 20 : 10;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
    
    // Draw enemies
    for (const e of this.enemies) {
      this.ctx.fillStyle = e.color;
      
      // Draw shape based on size
      if (e.size > 15) {
        // Square for big enemies
        this.ctx.fillRect(e.x - e.size, e.y - e.size, e.size*2, e.size*2);
      } else {
        // Triangle for small enemies
        this.ctx.beginPath();
        const angle = Math.atan2(this.mouseY - e.y, this.mouseX - e.x);
        this.ctx.moveTo(e.x + Math.cos(angle)*e.size, e.y + Math.sin(angle)*e.size);
        this.ctx.lineTo(e.x + Math.cos(angle+2.5)*e.size, e.y + Math.sin(angle+2.5)*e.size);
        this.ctx.lineTo(e.x + Math.cos(angle-2.5)*e.size, e.y + Math.sin(angle-2.5)*e.size);
        this.ctx.fill();
      }
      
      // HP Bar
      if (e.hp < e.maxHp) {
        this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
        this.ctx.fillRect(e.x - 10, e.y - e.size - 8, 20, 4);
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(e.x - 10, e.y - e.size - 8, 20 * (e.hp/e.maxHp), 4);
      }
    }
    
    // Draw snake (heroes)
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      // Hero circle
      this.ctx.beginPath();
      this.ctx.arc(seg.x, seg.y, 15, 0, Math.PI * 2);
      this.ctx.fillStyle = seg.hero.color;
      this.ctx.fill();
      
      // Inner dot
      this.ctx.beginPath();
      this.ctx.arc(seg.x, seg.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.fill();
      
      // Hero stroke
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#fff';
      if (i === 0) {
        // Head gets a glowing ring
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = seg.hero.color;
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }
}
