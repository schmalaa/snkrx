import { System } from './System';
import { GameNode } from './Node';
import { Transform, Physics, ParticleComp, HfxComp, HitCircleComp } from './Components';

export class PhysicsSystem extends System {
  update(dt: number, root: GameNode) {
    const nodes = this.getNodesWith(root, ['Transform', 'Physics']);
    for (const node of nodes) {
      const t = node.getComponent<Transform>('Transform')!;
      const p = node.getComponent<Physics>('Physics')!;
      t.x += p.vx * dt;
      t.y += p.vy * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
    }
  }
  render() {}
}

export class ParticleSystem extends System {
  update(dt: number, root: GameNode) {
    const nodes = this.getNodesWith(root, ['Transform', 'ParticleComp']);
    for (const node of nodes) {
      const t = node.getComponent<Transform>('Transform')!;
      const p = node.getComponent<ParticleComp>('ParticleComp')!;
      t.x += p.vx * dt * 60;
      t.y += p.vy * dt * 60;
      p.life -= dt * 60;
      if (p.life <= 0) node.destroy();
    }
  }
  
  render(ctx: CanvasRenderingContext2D, root: GameNode) {
    const nodes = this.getNodesWith(root, ['Transform', 'ParticleComp']);
    for (const node of nodes) {
      const t = node.getComponent<Transform>('Transform')!;
      const p = node.getComponent<ParticleComp>('ParticleComp')!;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(t.x, t.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}

export class CameraSystem extends System {
  shakeIntensity: number = 0;
  
  shake(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    setTimeout(() => this.shakeIntensity = 0, duration * 1000);
  }
  
  update(dt: number) {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
    }
  }
  render() {}
}

export class HfxSystem extends System {
  update(dt: number, root: GameNode) {
    const nodes = this.getNodesWith(root, ['HfxComp']);
    for (const node of nodes) {
      const h = node.getComponent<HfxComp>('HfxComp')!;
      if (h.hitLife > 0) h.hitLife -= dt;
      if (h.shootLife > 0) h.shootLife -= dt;
    }
  }
  render() {}
}

export class HitCircleSystem extends System {
  update(dt: number, root: GameNode) {
    const nodes = this.getNodesWith(root, ['Transform', 'HitCircleComp']);
    for (const node of nodes) {
      const h = node.getComponent<HitCircleComp>('HitCircleComp')!;
      h.life -= dt;
      h.radius = h.maxRadius * (1 - (h.life / h.maxLife));
      if (h.life <= 0) node.destroy();
    }
  }
  
  render(ctx: CanvasRenderingContext2D, root: GameNode) {
    const nodes = this.getNodesWith(root, ['Transform', 'HitCircleComp']);
    for (const node of nodes) {
      const t = node.getComponent<Transform>('Transform')!;
      const h = node.getComponent<HitCircleComp>('HitCircleComp')!;
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0, h.life / h.maxLife);
      ctx.beginPath();
      ctx.arc(t.x, t.y, h.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
}
