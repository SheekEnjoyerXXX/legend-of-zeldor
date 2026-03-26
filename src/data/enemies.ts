export interface EnemyDef {
  key: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  chaseRange: number;
  attackRange: number;
  behavior: 'wander' | 'chase' | 'float' | 'patrol' | 'charge';
  projectile: boolean;
  projectileSpeed?: number;
  projectileCooldown?: number;
  drops: DropEntry[];
  spriteKey: string;
}

export interface DropEntry {
  item: string;
  chance: number; // 0-1
}

export const ENEMIES: Record<string, EnemyDef> = {
  gobdwarf: {
    key: 'gobdwarf', name: 'Gobdwarf', hp: 2, speed: 40, damage: 1,
    chaseRange: 80, attackRange: 16, behavior: 'chase', projectile: false,
    spriteKey: 'gobdwarf',
    drops: [{ item: 'zlorp', chance: 0.5 }, { item: 'heart', chance: 0.3 }],
  },
  slime_modem: {
    key: 'slime_modem', name: 'Slime Modem', hp: 3, speed: 25, damage: 1,
    chaseRange: 60, attackRange: 12, behavior: 'wander', projectile: false,
    spriteKey: 'slime_modem',
    drops: [{ item: 'zlorp', chance: 0.4 }, { item: 'heart', chance: 0.3 }],
  },
  obamasphere: {
    key: 'obamasphere', name: 'ObamaSphere', hp: 3, speed: 50, damage: 1,
    chaseRange: 120, attackRange: 20, behavior: 'float', projectile: false,
    spriteKey: 'obamasphere',
    drops: [{ item: 'zlorp', chance: 0.6 }, { item: 'ammo', chance: 0.3 }],
  },
  obamasphere_laser: {
    key: 'obamasphere_laser', name: 'Laser Sphere', hp: 3, speed: 35, damage: 1,
    chaseRange: 140, attackRange: 100, behavior: 'float', projectile: true,
    projectileSpeed: 120, projectileCooldown: 2200,
    spriteKey: 'obamasphere_laser',
    drops: [{ item: 'zlorp', chance: 0.5 }, { item: 'ammo', chance: 0.4 }],
  },
  error_bat: {
    key: 'error_bat', name: 'Error Bat', hp: 2, speed: 70, damage: 1,
    chaseRange: 100, attackRange: 14, behavior: 'float', projectile: false,
    spriteKey: 'error_bat',
    drops: [{ item: 'zlorp', chance: 0.3 }, { item: 'heart', chance: 0.2 }],
  },
  firewall_skeleton: {
    key: 'firewall_skeleton', name: 'Firewall Skeleton', hp: 4, speed: 35, damage: 2,
    chaseRange: 90, attackRange: 20, behavior: 'patrol', projectile: true,
    projectileSpeed: 100, projectileCooldown: 2500,
    spriteKey: 'firewall_skeleton',
    drops: [{ item: 'zlorp', chance: 0.6 }, { item: 'heart', chance: 0.3 }, { item: 'ammo', chance: 0.2 }],
  },
  glitch_crab: {
    key: 'glitch_crab', name: 'Glitch Crab', hp: 3, speed: 45, damage: 1,
    chaseRange: 70, attackRange: 16, behavior: 'patrol', projectile: false,
    spriteKey: 'glitch_crab',
    drops: [{ item: 'zlorp', chance: 0.4 }, { item: 'heart', chance: 0.25 }],
  },
  pickle_thief: {
    key: 'pickle_thief', name: 'Pickle Thief', hp: 2, speed: 65, damage: 1,
    chaseRange: 100, attackRange: 14, behavior: 'chase', projectile: false,
    spriteKey: 'pickle_thief',
    drops: [{ item: 'zlorp', chance: 0.7 }, { item: 'heart', chance: 0.1 }],
  },
  portal_rat: {
    key: 'portal_rat', name: 'Portal Rat', hp: 1, speed: 55, damage: 1,
    chaseRange: 60, attackRange: 12, behavior: 'wander', projectile: false,
    spriteKey: 'portal_rat',
    drops: [{ item: 'zlorp', chance: 0.4 }, { item: 'heart', chance: 0.15 }],
  },
  banana_ghost: {
    key: 'banana_ghost', name: 'Banana Ghost', hp: 3, speed: 40, damage: 1,
    chaseRange: 110, attackRange: 16, behavior: 'float', projectile: false,
    spriteKey: 'banana_ghost',
    drops: [{ item: 'zlorp', chance: 0.5 }, { item: 'heart', chance: 0.3 }],
  },
};
