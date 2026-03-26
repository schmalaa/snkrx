export class Transform {
  x: number = 0;
  y: number = 0;
  rotation: number = 0;
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
}

export class Collider {
  radius: number = 10;
  isTrigger: boolean = false;
  constructor(radius = 10, isTrigger = false) { this.radius = radius; this.isTrigger = isTrigger; }
}

export class Physics {
  vx: number = 0;
  vy: number = 0;
  mass: number = 1;
  friction: number = 0.9;
}

export class HealthComp {
  hp: number = 100;
  maxHp: number = 100;
  constructor(max = 100) { this.maxHp = max; this.hp = max; }
}

export class PlayerBrain {
  // Tags a node as part of the player snake
  cooldown: number = 0;
}

export class EnemyBrain {
  speedMultiplier: number = 1;
  isBoss: boolean = false;
  color: string = '#f00';
}

export class ProjectileComp {
  damage: number = 10;
  pierce: number = 0;
  chains: number = 0;
  life: number = 5; // seconds
  color: string = '#fff';
  type: string = 'normal';
  weapon: string = 'orb';
}

export class ParticleComp {
  life: number = 1;
  maxLife: number = 1;
  color: string = '#fff';
  size: number = 2;
  vx: number = 0;
  vy: number = 0;
}

export class HfxComp {
  hitLife: number = 0;
  shootLife: number = 0;
}

export class HitCircleComp {
  radius: number = 0;
  maxRadius: number = 30;
  life: number = 0.3;
  maxLife: number = 0.3;
  color: string = '#fff';
}

export class SnakeHistoryComp {
  history: {x: number, y: number, r: number}[] = [];
  isLeader: boolean = false;
  followerIndex: number = 0;
}

