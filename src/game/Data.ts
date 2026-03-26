export interface CharacterDef {
  id: string;
  name: string;
  classes: string[];
  description: string;
  tier: number; // 1 to 4 cost equivalents
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'hexagon' | 'diamond' | 'cross';
  weapon: 'sword' | 'arrow' | 'orb' | 'dagger' | 'lightning' | 'shield' | 'gun';
}

export const CLASS_DATA: Record<string, { setNumbers: number[], mults: { hp: number, dmg: number, aspd: number, areaDmg: number, areaSize: number, def: number, mvspd: number } }> = {
  Warrior: { setNumbers: [3, 6], mults: { hp: 1.4, dmg: 1.1, aspd: 0.9, areaDmg: 1, areaSize: 1, def: 1.25, mvspd: 0.9 } },
  Ranger: { setNumbers: [3, 6], mults: { hp: 1, dmg: 1.2, aspd: 1.5, areaDmg: 1, areaSize: 1, def: 0.9, mvspd: 1.2 } },
  Mage: { setNumbers: [3, 6], mults: { hp: 0.6, dmg: 1.4, aspd: 1, areaDmg: 1.25, areaSize: 1.2, def: 0.75, mvspd: 1 } },
  Rogue: { setNumbers: [3, 6], mults: { hp: 0.8, dmg: 1.3, aspd: 1.1, areaDmg: 0.6, areaSize: 0.6, def: 0.8, mvspd: 1.4 } },
  Healer: { setNumbers: [2, 4], mults: { hp: 1.2, dmg: 1, aspd: 0.5, areaDmg: 1, areaSize: 1, def: 1.2, mvspd: 1 } },
  Enchanter: { setNumbers: [2, 4], mults: { hp: 1.2, dmg: 1, aspd: 1, areaDmg: 1, areaSize: 1, def: 1.2, mvspd: 1.2 } },
  Nuker: { setNumbers: [3, 6], mults: { hp: 0.9, dmg: 1, aspd: 0.75, areaDmg: 1.5, areaSize: 1.3, def: 1, mvspd: 1 } },
  Conjurer: { setNumbers: [2, 4], mults: { hp: 1, dmg: 1, aspd: 1, areaDmg: 1, areaSize: 1, def: 1, mvspd: 1 } },
  Psyker: { setNumbers: [2, 4], mults: { hp: 1.5, dmg: 1, aspd: 1, areaDmg: 1, areaSize: 1, def: 0.5, mvspd: 1 } },
  Trapper: { setNumbers: [2, 4], mults: { hp: 1, dmg: 1, aspd: 1, areaDmg: 1, areaSize: 1, def: 0.75, mvspd: 1 } },
  Forcer: { setNumbers: [2, 4], mults: { hp: 1.25, dmg: 1.1, aspd: 0.9, areaDmg: 0.75, areaSize: 0.75, def: 1.2, mvspd: 1 } },
  Swarmer: { setNumbers: [2, 4], mults: { hp: 1.2, dmg: 1, aspd: 1.25, areaDmg: 1, areaSize: 1, def: 0.75, mvspd: 0.5 } },
  Voider: { setNumbers: [2, 4], mults: { hp: 0.75, dmg: 1.3, aspd: 1, areaDmg: 0.8, areaSize: 0.75, def: 0.6, mvspd: 0.8 } }
};

export const CHARACTER_DATA: CharacterDef[] = [
  { id: 'c1', name: 'Vagrant', classes: ['Psyker', 'Ranger', 'Warrior'], description: 'shoots a projectile', tier: 1, color: '#f1c40f', shape: 'circle', weapon: 'sword' },
  { id: 'c2', name: 'Swordsman', classes: ['Warrior'], description: 'deals AoE damage', tier: 1, color: '#ff4757', shape: 'square', weapon: 'sword' },
  { id: 'c3', name: 'Wizard', classes: ['Mage'], description: 'shoots an AoE orb', tier: 2, color: '#1e90ff', shape: 'hexagon', weapon: 'orb' },
  { id: 'c4', name: 'Archer', classes: ['Ranger'], description: 'shoots a piercing arrow', tier: 1, color: '#2ed573', shape: 'triangle', weapon: 'arrow' },
  { id: 'c5', name: 'Scout', classes: ['Rogue'], description: 'throws a chaining knife', tier: 1, color: '#eccc68', shape: 'diamond', weapon: 'dagger' },
  { id: 'c6', name: 'Cleric', classes: ['Healer'], description: 'heals allies periodically', tier: 2, color: '#ffffff', shape: 'cross', weapon: 'orb' },
  { id: 'c7', name: 'Outlaw', classes: ['Warrior', 'Rogue'], description: 'throws a fan of knives', tier: 2, color: '#ff6b81', shape: 'diamond', weapon: 'dagger' },
  { id: 'c8', name: 'Blade', classes: ['Warrior', 'Nuker'], description: 'throws multiple AoE blades', tier: 3, color: '#ff7f50', shape: 'square', weapon: 'sword' },
  { id: 'c9', name: 'Elementor', classes: ['Mage', 'Nuker'], description: 'deals massive random AoE', tier: 3, color: '#7bed9f', shape: 'hexagon', weapon: 'orb' },
  { id: 'c10', name: 'Saboteur', classes: ['Rogue', 'Conjurer', 'Nuker'], description: 'calls exploding saboteurs', tier: 4, color: '#9b59b6', shape: 'diamond', weapon: 'orb' },
  { id: 'c11', name: 'Stormweaver', classes: ['Enchanter'], description: 'infuses projectiles with lightning', tier: 2, color: '#70a1ff', shape: 'hexagon', weapon: 'lightning' },
  { id: 'c12', name: 'Sage', classes: ['Nuker'], description: 'shoots slow pulling projectile', tier: 3, color: '#ffffff', shape: 'hexagon', weapon: 'orb' },
  { id: 'c13', name: 'Squire', classes: ['Warrior', 'Enchanter'], description: 'pumps nearby allies defense/damage', tier: 2, color: '#fbed9f', shape: 'square', weapon: 'shield' },
];
// Simplified subset of characters to maintain prototype velocity while keeping deep architecture.

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  effectId?: string;
}

export const ITEM_DATA: ItemDef[] = [
  { id: 'i1', name: 'Centipede', description: '+20% snake movement speed and attack speed.', effectId: 'centipede' },
  { id: 'i2', name: 'Intimidation', description: 'Enemies spawn with -20% max HP.', effectId: 'intimidation' },
  { id: 'i3', name: 'Heavy Impact', description: 'Projectiles deal 25% more base damage.', effectId: 'heavy_impact' }
];
