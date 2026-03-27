export function computeDamageMultiplier(defense: number): number {
  if (defense >= 0) {
    return 100 / (100 + defense);
  } else {
    return 2 - 100 / (100 - defense);
  }
}

export function computeFinalDamage(baseDmg: number, attackerClassMultiplier: number, itemMultiplier: number, targetDefense: number): number {
  const dmg = baseDmg * attackerClassMultiplier * itemMultiplier;
  return dmg * computeDamageMultiplier(targetDefense);
}

export class UnitStats {
  hp: number = 100;
  maxHp: number = 100;
  damage: number = 10;
  aspd: number = 1;
  areaDmg: number = 1;
  areaSize: number = 1;
  defense: number = 0;
  mvspd: number = 1;
  
  // Clone helper
  clone(): UnitStats {
    const s = new UnitStats();
    s.hp = this.hp;
    s.maxHp = this.maxHp;
    s.damage = this.damage;
    s.aspd = this.aspd;
    s.areaDmg = this.areaDmg;
    s.areaSize = this.areaSize;
    s.defense = this.defense;
    s.mvspd = this.mvspd;
    return s;
  }
}
