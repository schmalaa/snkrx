import { GameNode } from '../core/Node';
import { Transform, Physics, ParticleComp, HealthComp, PlayerBrain, EnemyBrain, ProjectileComp, Collider, HfxComp, HitCircleComp, SnakeHistoryComp, TargetComp } from '../core/Components';
import { PhysicsSystem, ParticleSystem, CameraSystem, HfxSystem, HitCircleSystem } from '../core/Systems';
import { CLASS_DATA } from './Data';
import type { ItemDef } from './Data';
import { UnitStats } from './Stats';

export class ArenaEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  root: GameNode;
  systems = [new PhysicsSystem(), new ParticleSystem(), new CameraSystem(), new HfxSystem(), new HitCircleSystem()];
  
  mouseX: number = 0;
  mouseY: number = 0;
  isRunning: boolean = false;
  lastTime: number = 0;
  
  classCounts: Record<string, number>;
  inventory: ItemDef[];
  round: number;
  score: number = 0;
  
  onGameOver: () => void;
  onVictory: (score: number) => void;
  
  // Fast query wrappers
  getNodesWith(components: string[]): GameNode[] {
    const list: GameNode[] = [];
    const traverse = (n: GameNode) => {
      if (n.dead) return;
      if (components.every(c => n.hasComponent(c))) list.push(n);
      for (const child of n.children) traverse(child);
    };
    traverse(this.root);
    return list;
  }

  constructor(canvas: HTMLCanvasElement, heroes: any[], classCounts: Record<string, number>, round: number, onGameOver: () => void, onVictory: (score: number) => void, inventory: ItemDef[] = []) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.classCounts = classCounts;
    this.round = round;
    this.inventory = inventory;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    this.root = new GameNode('world');
    this.init(heroes);
  }

  public get health(): number {
    const h = this.root.getComponent<HealthComp>('HealthComp');
    return h ? h.hp : 0;
  }
  public get maxHealth(): number {
    const h = this.root.getComponent<HealthComp>('HealthComp');
    return h ? h.maxHp : 100;
  }

  init(heroes: any[]) {
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    
    let maxBaseHp = 100 + (this.classCounts['Warrior'] ? 50 : 0);
    this.root.addComponent('HealthComp', new HealthComp(maxBaseHp));

    heroes.forEach((h, i) => {
      const node = new GameNode(`hero_${i}`, 'hero');
      node.addComponent('Transform', new Transform(this.width / 2, this.height / 2));
      
      const stats = new UnitStats();
      h.classes.forEach((c: string) => {
        const cData = CLASS_DATA[c];
        if (cData) {
          stats.hp *= cData.mults.hp;
          stats.damage *= cData.mults.dmg;
          stats.aspd *= cData.mults.aspd;
          stats.areaDmg *= cData.mults.areaDmg;
          stats.areaSize *= cData.mults.areaSize;
          stats.defense *= cData.mults.def;
          stats.mvspd *= cData.mults.mvspd;
        }
      });
      
      const hasCentipede = this.inventory.some(i => i.effectId === 'centipede');
      if (hasCentipede) {
        stats.aspd *= 1.2; // 20% faster attack speed
      }
      
      const pb = new PlayerBrain();
      pb.cooldown = Math.random() * (60 / stats.aspd);
      node.addComponent('PlayerBrain', pb);
      node.addComponent('HeroDef', h); 
      node.addComponent('UnitStats', stats);
      node.addComponent('HfxComp', new HfxComp());
      const shc = new SnakeHistoryComp();
      shc.isLeader = (i === 0);
      shc.followerIndex = i;
      node.addComponent('SnakeHistoryComp', shc);
      this.root.append(node);
    });

    window.addEventListener('mousemove', this.handleMouseMove);
    const enemyCount = this.round === 1 ? 5 : this.round === 2 ? 8 : 10 + this.round * 3;
    for (let i = 0; i < enemyCount; i++) this.spawnEnemy();
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.root.destroy();
  }

  handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  spawnEnemy() {
    const node = new GameNode(undefined, 'enemy');
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * this.width; y = -50; }
    else if (side === 1) { x = this.width + 50; y = Math.random() * this.height; }
    else if (side === 2) { x = Math.random() * this.width; y = this.height + 50; }
    else { x = -50; y = Math.random() * this.height; }
    
    node.addComponent('Transform', new Transform(x, y));
    
    const isBig = Math.random() > 0.8 || (this.round >= 3 && Math.random() > 0.9);
    let hpScale = 0.5 + (this.round * 0.2); // R1: 0.7x, R5: 1.5x, R10: 2.5x
    let baseHp = isBig ? 100 : 30;
    baseHp *= hpScale;
    
    if (this.inventory.some(i => i.effectId === 'intimidation')) {
      baseHp *= 0.8; // -20% max HP
    }
    
    node.addComponent('HealthComp', new HealthComp(baseHp));
    
    const brain = new EnemyBrain();
    brain.isBoss = isBig;
    brain.color = isBig ? 'hsl(330, 100%, 50%)' : 'hsl(350, 100%, 60%)';
    brain.speedMultiplier = (isBig ? 0.7 : 1.2) * (0.8 + this.round * 0.05);
    node.addComponent('EnemyBrain', brain);
    
    node.addComponent('Collider', new Collider(isBig ? 24 : 12));
    node.addComponent('HfxComp', new HfxComp());
    this.root.append(node);
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
    
    const enemies = this.getNodesWith(['EnemyBrain']);
    if (enemies.length === 0) {
      this.isRunning = false;
      this.onVictory(this.score);
      return;
    }
    
    requestAnimationFrame(this.loop);
  }

  update(dt: number) {
    this.systems.forEach(s => s.update(dt, this.root));
    
    const snake = this.getNodesWith(['PlayerBrain', 'Transform', 'HeroDef']);
    if (snake.length === 0) return;

    // Body follow
    let moveSpeed = 5;
    if (this.inventory.some(i => i.effectId === 'centipede')) moveSpeed = 6;
    
    // Head movement
    const headT = snake[0].getComponent<Transform>('Transform')!;
    const hHist = snake[0].getComponent<SnakeHistoryComp>('SnakeHistoryComp');
    
    let dx = this.mouseX - headT.x;
    let dy = this.mouseY - headT.y;
    headT.rotation = Math.atan2(dy, dx);
    headT.x += dx * dt * moveSpeed;
    headT.y += dy * dt * moveSpeed;

    // True snake pathing history
    if (hHist) {
      hHist.history.unshift({ x: headT.x, y: headT.y, r: headT.rotation });
      if (hHist.history.length > 256) hHist.history.pop();
    }

    for (let i = 1; i < snake.length; i++) {
       const cur = snake[i].getComponent<Transform>('Transform')!;
       const targetDistance = 30 * i;
       let distanceSum = 0;
       
       if (hHist && hHist.history.length > 0) {
         let prevPos = hHist.history[0];
         let found = false;
         for (let j = 1; j < hHist.history.length; j++) {
           const pt = hHist.history[j];
           distanceSum += Math.hypot(prevPos.x - pt.x, prevPos.y - pt.y);
           if (distanceSum >= targetDistance) {
             cur.x = pt.x;
             cur.y = pt.y;
             cur.rotation = pt.r;
             found = true;
             break;
           }
           prevPos = pt;
         }
         if (!found) {
           const lastObj = hHist.history[hHist.history.length - 1];
           cur.x = lastObj.x; cur.y = lastObj.y; cur.rotation = lastObj.r;
         }
       }
    }

    const enemies = this.getNodesWith(['EnemyBrain', 'Transform', 'Collider', 'HealthComp']);
    
    // Gun logic
    for (const heroNode of snake) {
      const pb = heroNode.getComponent<PlayerBrain>('PlayerBrain')!;
      const hDef = heroNode.getComponent<any>('HeroDef')!;
      const hTrans = heroNode.getComponent<Transform>('Transform')!;
      const stats = heroNode.getComponent<UnitStats>('UnitStats')!;
      
      if (pb.cooldown > 0) {
        pb.cooldown -= dt * 60;
      } else if (enemies.length > 0) {
        let nearest = enemies[0];
        let minDist = Infinity;
        for (const e of enemies) {
          const et = e.getComponent<Transform>('Transform')!;
          const d = Math.hypot(et.x - hTrans.x, et.y - hTrans.y);
          if (d < minDist) { minDist = d; nearest = e; }
        }
        
        if (minDist < 250) {
          const et = nearest.getComponent<Transform>('Transform')!;
          const angle = Math.atan2(et.y - hTrans.y, et.x - hTrans.x);
          
          const baseCd = hDef.cooldownFrames || 60;
          pb.cooldown = baseCd / stats.aspd;
          
          let dmg = (hDef.damage || 15) * stats.damage;
          
          if (this.inventory.some(i => i.effectId === 'heavy_impact')) {
             dmg *= 1.25;
          }
          
          // Apply Synergies (Active Class Set Bonuses)
          if (hDef.classes.includes('Warrior') && this.classCounts['Warrior'] >= 3) dmg *= 1.5;
          if (hDef.classes.includes('Mage') && this.classCounts['Mage'] >= 3) dmg *= 1.5;
          if (hDef.classes.includes('Enchanter') && this.classCounts['Enchanter'] >= 2) dmg *= 1.25;

          if (hDef.weapon === 'lightning') {
             // Instant chain lightning effect
             const targets = enemies.filter(e => {
               const et = e.getComponent<Transform>('Transform')!;
               return Math.hypot(et.x - hTrans.x, et.y - hTrans.y) < 250;
             }).slice(0, 3); // chain up to 3 targets

             if (targets.length > 0) {
               targets.forEach((t, tIdx) => {
                  const th = t.getComponent<HealthComp>('HealthComp')!;
                  th.hp -= dmg * (1 - (tIdx * 0.2)); // Reduces dmg on chained targets
                  const ehfx = t.getComponent<HfxComp>('HfxComp');
                  if (ehfx) ehfx.hitLife = 0.2;
                  
                  // Spawn visual transient arc
                  const arc = new GameNode(undefined, 'lightning_arc');
                  arc.addComponent('Transform', new Transform(hTrans.x, hTrans.y));
                  // We misuse ProjectileComp simply as a transient data container for the renderer
                  const pComp = new ProjectileComp();
                  pComp.life = 0.15;
                  pComp.color = hDef.color;
                  pComp.weapon = 'lightning_arc';
                  const et = t.getComponent<Transform>('Transform')!;
                  // Store target coordinates explicitly via TargetComp to prevent Physics overlap drifting
                  const tc = new TargetComp(); tc.x = et.x; tc.y = et.y;
                  arc.addComponent('TargetComp', tc);
                  arc.addComponent('ProjectileComp', pComp);
                  this.root.append(arc);
                  
                  this.spawnParticles(et.x, et.y, hDef.color, 3, 2);
               });
               pb.cooldown = baseCd / stats.aspd;
               const shx = heroNode.getComponent<HfxComp>('HfxComp');
               if (shx) shx.shootLife = 0.2;
             }
          } else {
             // Normal projectile spawning
             const proj = new GameNode(undefined, 'projectile');
             const pTrans = new Transform(hTrans.x, hTrans.y);
             pTrans.rotation = angle;
             proj.addComponent('Transform', pTrans);
             
             const pComp = new ProjectileComp();
             pComp.damage = dmg;
             pComp.color = hDef.color;
             pComp.type = hDef.type || 'normal';
             pComp.weapon = hDef.weapon || 'orb';
             pComp.life = 5;
             proj.addComponent('ProjectileComp', pComp);
             
             const phys = new Physics();
             phys.vx = Math.cos(angle) * 500;
             phys.vy = Math.sin(angle) * 500;
             phys.friction = 1.0;
             proj.addComponent('Physics', phys);
             
             this.root.append(proj);
             const shx = heroNode.getComponent<HfxComp>('HfxComp');
             if (shx) shx.shootLife = 0.1;
             this.spawnParticles(hTrans.x, hTrans.y, hDef.color, 1, 3);
          }
        }
      }
    }

    // Projects hit logic
    const projectiles = this.getNodesWith(['ProjectileComp', 'Transform', 'Physics']);
    for (const proj of projectiles) {
      const pt = proj.getComponent<Transform>('Transform')!;
      const pComp = proj.getComponent<ProjectileComp>('ProjectileComp')!;
      
      pComp.life -= dt;
      if (pComp.life <= 0 || pt.x < 0 || pt.x > this.width || pt.y < 0 || pt.y > this.height) {
        proj.destroy();
        continue;
      }
      
      let hit = false;
      
      if (pComp.type === 'aoe') {
        let aoeRadius = 60;
        if (this.classCounts['Mage'] >= 3) aoeRadius *= 1.5;
        
        for (const e of enemies) {
          const et = e.getComponent<Transform>('Transform')!;
          const col = e.getComponent<Collider>('Collider')!;
          if (Math.hypot(et.x - pt.x, et.y - pt.y) < aoeRadius + col.radius) {
            e.getComponent<HealthComp>('HealthComp')!.hp -= pComp.damage * 4 * dt; 
            const ehfx = e.getComponent<HfxComp>('HfxComp');
            if (ehfx) ehfx.hitLife = 0.1;
            if (Math.random() < 0.05) this.spawnParticles(et.x, et.y, pComp.color, 1, 2);
          }
        }
        // AOE projectiles pierce infinitely
        hit = false;
      } else {
        for (const e of enemies) {
          const et = e.getComponent<Transform>('Transform')!;
          const col = e.getComponent<Collider>('Collider')!;
          if (Math.hypot(et.x - pt.x, et.y - pt.y) < col.radius + 5) {
             const eh = e.getComponent<HealthComp>('HealthComp')!;
             eh.hp -= pComp.damage;
             hit = true;
             const ehfx = e.getComponent<HfxComp>('HfxComp');
             if (ehfx) ehfx.hitLife = 0.2;
             this.spawnParticles(pt.x, pt.y, 'white', 5, 2);
             this.spawnHitCircle(pt.x, pt.y, 'white', 20);
             const camSys = this.systems.find(s => s instanceof CameraSystem) as CameraSystem;
             if (camSys && pComp.damage > 20) camSys.shake(2, 0.1);
             break;
          }
        }
      }
      
      // Cleanup enemies loop
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.dead) continue;
        const eh = e.getComponent<HealthComp>('HealthComp')!;
        if (eh.hp <= 0) {
          e.destroy();
          this.score += 10;
          const eb = e.getComponent<EnemyBrain>('EnemyBrain')!;
          const et = e.getComponent<Transform>('Transform')!;
          this.spawnParticles(et.x, et.y, eb.color, 20, 4);
        }
      }

      if (hit) proj.destroy();
    }

    // Enemy follow snake logic
    const globalHealth = this.root.getComponent<HealthComp>('HealthComp')!;
    for (const e of enemies) {
      const et = e.getComponent<Transform>('Transform')!;
      const eb = e.getComponent<EnemyBrain>('EnemyBrain')!;
      const col = e.getComponent<Collider>('Collider')!;
      
      const dHead = Math.hypot(headT.x - et.x, headT.y - et.y);
      if (dHead < col.radius + 15) {
        globalHealth.hp -= 10 * dt;
        this.spawnParticles(headT.x, headT.y, 'white', 1, 2);
        const camSys = this.systems.find(s => s instanceof CameraSystem) as CameraSystem;
        if (camSys) camSys.shake(5, 0.2);
      } else {
        const hAngle = Math.atan2(headT.y - et.y, headT.x - et.x);
        et.x += Math.cos(hAngle) * eb.speedMultiplier * dt * 60;
        et.y += Math.sin(hAngle) * eb.speedMultiplier * dt * 60;
      }
    }
  }

  spawnHitCircle(x: number, y: number, color: string, maxRadius: number) {
    const c = new GameNode(undefined, 'hitcircle');
    c.addComponent('Transform', new Transform(x, y));
    const hc = new HitCircleComp();
    hc.color = color;
    hc.maxRadius = maxRadius;
    c.addComponent('HitCircleComp', hc);
    this.root.append(c);
  }

  spawnParticles(x: number, y: number, color: string, count: number, size: number) {
    for (let i = 0; i < count; i++) {
      const p = new GameNode(undefined, 'particle');
      p.addComponent('Transform', new Transform(x, y));
      const pc = new ParticleComp();
      pc.color = color;
      pc.size = Math.random() * size + 1;
      pc.life = 20 + Math.random() * 20;
      pc.maxLife = 40;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5;
      pc.vx = Math.cos(angle) * speed;
      pc.vy = Math.sin(angle) * speed;
      
      p.addComponent('ParticleComp', pc);
      this.root.append(p);
    }
  }

  drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, shape: string) {
    ctx.beginPath();
    if (shape === 'square') {
      ctx.roundRect(x - radius, y - radius, radius * 2, radius * 2, 4);
    } else if (shape === 'triangle') {
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y + radius);
      ctx.lineTo(x - radius, y + radius);
      ctx.closePath();
    } else if (shape === 'diamond') {
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius, y);
      ctx.closePath();
    } else if (shape === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
        if (i === 0) ctx.moveTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
        else ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
      }
      ctx.closePath();
    } else if (shape === 'cross') {
      const r2 = radius / 3;
      ctx.moveTo(x - r2, y - radius);
      ctx.lineTo(x + r2, y - radius);
      ctx.lineTo(x + r2, y - r2);
      ctx.lineTo(x + radius, y - r2);
      ctx.lineTo(x + radius, y + r2);
      ctx.lineTo(x + r2, y + r2);
      ctx.lineTo(x + r2, y + radius);
      ctx.lineTo(x - r2, y + radius);
      ctx.lineTo(x - r2, y + r2);
      ctx.lineTo(x - radius, y + r2);
      ctx.lineTo(x - radius, y - r2);
      ctx.lineTo(x - r2, y - r2);
      ctx.closePath();
    } else {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
  }

  render() {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.save();
    const camSys = this.systems.find(s => s instanceof CameraSystem) as CameraSystem;
    if (camSys && camSys.shakeIntensity > 0) {
      const offsetX = (Math.random() - 0.5) * camSys.shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * camSys.shakeIntensity * 2;
      this.ctx.translate(offsetX, offsetY);
    }
    
    // Draw grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
    }
    
    this.systems.forEach(s => s.render(this.ctx, this.root));
    
    // Enemies
    const enemies = this.getNodesWith(['EnemyBrain', 'Transform', 'Collider', 'HealthComp']);
    for (const e of enemies) {
      const et = e.getComponent<Transform>('Transform')!;
      const eb = e.getComponent<EnemyBrain>('EnemyBrain')!;
      const eh = e.getComponent<HealthComp>('HealthComp')!;
      const col = e.getComponent<Collider>('Collider')!;
      
      const hfx = e.getComponent<HfxComp>('HfxComp');
      
      const isWhite = hfx && hfx.hitLife > 0;
      this.ctx.fillStyle = isWhite ? '#fff' : eb.color;
      if (eb.isBoss) {
        this.ctx.fillRect(et.x - col.radius, et.y - col.radius, col.radius*2, col.radius*2);
      } else {
        this.ctx.beginPath();
        const angle = Math.atan2(this.mouseY - et.y, this.mouseX - et.x);
        this.ctx.moveTo(et.x + Math.cos(angle)*col.radius, et.y + Math.sin(angle)*col.radius);
        this.ctx.lineTo(et.x + Math.cos(angle+2.5)*col.radius, et.y + Math.sin(angle+2.5)*col.radius);
        this.ctx.lineTo(et.x + Math.cos(angle-2.5)*col.radius, et.y + Math.sin(angle-2.5)*col.radius);
        this.ctx.fill();
      }
      if (eh.hp < eh.maxHp) {
        this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
        this.ctx.fillRect(et.x - 10, et.y - col.radius - 8, 20, 4);
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(et.x - 10, et.y - col.radius - 8, 20 * (eh.hp/eh.maxHp), 4);
      }
    }
    
    // Projectiles
    const projectiles = this.getNodesWith(['ProjectileComp', 'Transform']);
    for (const p of projectiles) {
      const pt = p.getComponent<Transform>('Transform')!;
      const pc = p.getComponent<ProjectileComp>('ProjectileComp')!;
      
      if (pc.weapon === 'lightning_arc') {
         // Realistic jagged lightning multi-pass
         const tc = p.getComponent<TargetComp>('TargetComp')!;
         
         const drawJagged = (ctx: CanvasRenderingContext2D, width: number, color: string, jitter: number) => {
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            const steps = 6;
            for (let i = 1; i <= steps; i++) {
               const rx = (tc.x - pt.x) * (i / steps) + pt.x + (Math.random() - 0.5) * jitter;
               const ry = (tc.y - pt.y) * (i / steps) + pt.y + (Math.random() - 0.5) * jitter;
               if (i === steps) ctx.lineTo(tc.x, tc.y);
               else ctx.lineTo(rx, ry);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.shadowBlur = 0;
         };

         // Core flash intensity based on remaining life
         const alpha = Math.max(0, Math.min(1, pc.life / 0.15));
         this.ctx.globalAlpha = alpha;
         
         drawJagged(this.ctx, 4, pc.color, 40); // Outer colored plasma string
         drawJagged(this.ctx, 1.5, '#ffffff', 15); // Inner hot white core
         
         // Impact blooms
         this.ctx.beginPath();
         this.ctx.arc(tc.x, tc.y, 30 + Math.random() * 20, 0, Math.PI * 2);
         this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
         this.ctx.fill();
         this.ctx.beginPath();
         this.ctx.arc(pt.x, pt.y, 20 + Math.random() * 10, 0, Math.PI * 2);
         this.ctx.fill();
         
         this.ctx.globalAlpha = 1.0;
         continue;
      }

      this.ctx.save();
      this.ctx.translate(pt.x, pt.y);
      this.ctx.rotate(pt.rotation);
      
      this.ctx.fillStyle = pc.color;
      this.ctx.strokeStyle = pc.color;
      this.ctx.lineWidth = 2;
      
      if (pc.type === 'aoe') {
        let aoeRadius = 60;
        if (this.classCounts['Mage'] >= 3) aoeRadius *= 1.5;
        this.ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, aoeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      } else if (pc.weapon === 'sword') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, -Math.PI / 3, Math.PI / 3);
        this.ctx.stroke();
      } else if (pc.weapon === 'arrow') {
        this.ctx.beginPath();
        this.ctx.moveTo(-6, 0); this.ctx.lineTo(6, 0);
        this.ctx.moveTo(2, -4); this.ctx.lineTo(6, 0); this.ctx.lineTo(2, 4);
        this.ctx.stroke();
      } else if (pc.weapon === 'dagger') {
        this.ctx.rotate((performance.now() / 100) % (Math.PI * 2));
        this.ctx.beginPath();
        this.ctx.moveTo(0, -6); this.ctx.lineTo(4, 0); this.ctx.lineTo(0, 6); this.ctx.lineTo(-4, 0);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (pc.weapon === 'lightning') {
        this.ctx.beginPath();
        this.ctx.moveTo(-6, 0); this.ctx.lineTo(-2, -4); this.ctx.lineTo(2, 4); this.ctx.lineTo(6, 0);
        this.ctx.stroke();
      } else if (pc.weapon === 'shield') {
        this.ctx.fillRect(-4, -6, 8, 12);
      } else {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = pc.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
      this.ctx.restore();
    }
    
    // Snake
    const snake = this.getNodesWith(['PlayerBrain', 'Transform', 'HeroDef', 'HfxComp']);
    for (let i = snake.length - 1; i >= 0; i--) {
      const heroNode = snake[i]; // Renamed from 'snake[i]' to 'heroNode' for clarity
      const hTrans = heroNode.getComponent<Transform>('Transform')!;
      const hDef = heroNode.getComponent<any>('HeroDef')!;
      const hfx = heroNode.getComponent<HfxComp>('HfxComp')!;
      
      const isWhite = hfx.hitLife > 0 || hfx.shootLife > 0;
      this.ctx.fillStyle = isWhite ? '#fff' : hDef.color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#fff';
      
      this.ctx.save();
      this.ctx.translate(hTrans.x, hTrans.y);
      this.ctx.rotate(hTrans.rotation);
      this.ctx.scale(0.7, 0.7); // Reduce hero size globally by 30% to prevent massive screen clutter
      
      this.drawShape(this.ctx, 0, 0, 15, hDef.shape || 'circle');
      this.ctx.fill();
      this.ctx.stroke();
      
      // inner detail artistic weapon vectors
      this.ctx.fillStyle = isWhite ? '#fff' : 'rgba(255, 255, 255, 0.4)';
      this.ctx.strokeStyle = isWhite ? '#fff' : 'rgba(255, 255, 255, 0.6)';
      this.ctx.lineWidth = 1.5;
      this.ctx.lineJoin = 'round';
      const wpn = hDef.weapon;
      if (wpn === 'sword') {
         this.ctx.beginPath();
         this.ctx.moveTo(0, 8); this.ctx.lineTo(0, -8);
         this.ctx.moveTo(-3, 4); this.ctx.lineTo(3, 4);
         this.ctx.stroke();
      } else if (wpn === 'arrow') {
         this.ctx.beginPath();
         this.ctx.moveTo(0, 8); this.ctx.lineTo(0, -8);
         this.ctx.moveTo(-3, -5); this.ctx.lineTo(0, -8); this.ctx.lineTo(3, -5);
         this.ctx.stroke();
      } else if (wpn === 'orb') {
         this.ctx.beginPath();
         this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
         this.ctx.fill();
         this.ctx.beginPath();
         this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
         this.ctx.fillStyle = '#000';
         this.ctx.fill();
      } else if (wpn === 'dagger') {
         this.ctx.beginPath();
         this.ctx.moveTo(0, -7); this.ctx.lineTo(2, -2); this.ctx.lineTo(0, 7); this.ctx.lineTo(-2, -2);
         this.ctx.fill();
      } else if (wpn === 'shield') {
         this.ctx.beginPath();
         this.ctx.moveTo(-4, -5); this.ctx.lineTo(4, -5); this.ctx.lineTo(4, 2); 
         this.ctx.lineTo(0, 6); this.ctx.lineTo(-4, 2); this.ctx.closePath();
         this.ctx.fill();
      } else if (wpn === 'lightning') {
         this.ctx.beginPath();
         this.ctx.moveTo(2, -7); this.ctx.lineTo(-2, 0); this.ctx.lineTo(3, 0); this.ctx.lineTo(-3, 7);
         this.ctx.stroke();
      } else {
         this.drawShape(this.ctx, 0, 0, 6, hDef.shape || 'circle');
         this.ctx.fill();
      }
      this.ctx.restore();
    }
    
    this.ctx.restore();
  }
}
