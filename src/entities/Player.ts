import Phaser from 'phaser';
import {
  PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_MAX_HEALTH,
  BLASTER_COOLDOWN, COLORS,
} from '../game/constants';
import { Damageable } from '../systems/CombatSystem';

export type Direction = 'down' | 'left' | 'right' | 'up';
const DIR_INDEX: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

export class Player implements Damageable {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  invulnerable = false;
  lastHitTime = 0;
  direction: Direction = 'down';
  isAttacking = false;
  isShielding = false;
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private attackTimer = 0;
  private lastBlasterTime = 0;

  // Callbacks for scene integration
  onAttack?: (dir: Direction) => void;
  onShoot?: (dir: Direction) => void;
  onInteract?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHp = PLAYER_MAX_HEALTH) {
    this.scene = scene;
    this.maxHp = maxHp;
    this.hp = maxHp;

    this.sprite = scene.physics.add.sprite(x, y, 'linkler', 0);
    this.sprite.setSize(10, 12).setOffset(3, 4);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    this.setupInput();
    this.setupAnimations();
  }

  private setupInput(): void {
    if (!this.scene.input.keyboard) return;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = {
      w: this.scene.input.keyboard.addKey('W'),
      a: this.scene.input.keyboard.addKey('A'),
      s: this.scene.input.keyboard.addKey('S'),
      d: this.scene.input.keyboard.addKey('D'),
      j: this.scene.input.keyboard.addKey('J'),
      k: this.scene.input.keyboard.addKey('K'),
      l: this.scene.input.keyboard.addKey('L'),
      e: this.scene.input.keyboard.addKey('E'),
      space: this.scene.input.keyboard.addKey('SPACE'),
      i: this.scene.input.keyboard.addKey('I'),
      enter: this.scene.input.keyboard.addKey('ENTER'),
      shift: this.scene.input.keyboard.addKey('SHIFT'),
    };
  }

  private setupAnimations(): void {
    const dirs: Direction[] = ['down', 'left', 'right', 'up'];
    for (let d = 0; d < dirs.length; d++) {
      if (!this.scene.anims.exists(`linkler_walk_${dirs[d]}`)) {
        this.scene.anims.create({
          key: `linkler_walk_${dirs[d]}`,
          frames: [{ key: 'linkler', frame: d * 2 }, { key: 'linkler', frame: d * 2 + 1 }],
          frameRate: 6, repeat: -1,
        });
        this.scene.anims.create({
          key: `linkler_attack_${dirs[d]}`,
          frames: [{ key: 'linkler_attack', frame: d * 2 }, { key: 'linkler_attack', frame: d * 2 + 1 }],
          frameRate: 10, repeat: 0,
        });
      }
    }
  }

  update(time: number, frozen = false): void {
    if (frozen || this.hp <= 0) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    // Attack cooldown
    if (this.isAttacking) {
      this.attackTimer -= 16;
      if (this.attackTimer <= 0) this.isAttacking = false;
    }

    // Shield
    this.isShielding = this.keys.k?.isDown ?? false;

    // Movement
    if (!this.isAttacking) {
      this.handleMovement();
    }

    // Attack (J)
    if (Phaser.Input.Keyboard.JustDown(this.keys.j) && !this.isAttacking) {
      this.attack();
    }

    // Ranged (L)
    if (Phaser.Input.Keyboard.JustDown(this.keys.l) && time - this.lastBlasterTime > BLASTER_COOLDOWN) {
      this.lastBlasterTime = time;
      this.onShoot?.(this.direction);
    }

    // Interact (E or Space)
    if (Phaser.Input.Keyboard.JustDown(this.keys.e) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.onInteract?.();
    }
  }

  private handleMovement(): void {
    const up = this.cursors.up.isDown || this.keys.w.isDown;
    const down = this.cursors.down.isDown || this.keys.s.isDown;
    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const sprint = this.keys.shift.isDown;
    const speed = sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;

    let vx = 0, vy = 0;
    if (left) { vx = -speed; this.direction = 'left'; }
    else if (right) { vx = speed; this.direction = 'right'; }
    if (up) { vy = -speed; this.direction = 'up'; }
    else if (down) { vy = speed; this.direction = 'down'; }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const factor = 0.707;
      vx *= factor;
      vy *= factor;
    }

    this.sprite.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.sprite.anims.play(`linkler_walk_${this.direction}`, true);
    } else {
      this.sprite.anims.stop();
      this.sprite.setFrame(DIR_INDEX[this.direction] * 2);
    }
  }

  private attack(): void {
    this.isAttacking = true;
    this.attackTimer = 300;
    this.sprite.setVelocity(0, 0);
    this.sprite.anims.play(`linkler_attack_${this.direction}`, true);
    this.onAttack?.(this.direction);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  increaseMaxHp(amount: number): void {
    this.maxHp += amount;
    this.hp += amount;
  }

  isKeyJustDown(key: string): boolean {
    return this.keys[key] ? Phaser.Input.Keyboard.JustDown(this.keys[key]) : false;
  }

  getInteractPoint(): { x: number; y: number } {
    const offsets: Record<Direction, { x: number; y: number }> = {
      down: { x: 0, y: 20 },
      up: { x: 0, y: -20 },
      left: { x: -20, y: 0 },
      right: { x: 20, y: 0 },
    };
    const o = offsets[this.direction];
    return { x: this.sprite.x + o.x, y: this.sprite.y + o.y };
  }

  getAttackRect(): Phaser.Geom.Rectangle {
    const w = 28, h = 28;
    const p = this.getInteractPoint();
    return new Phaser.Geom.Rectangle(p.x - w / 2, p.y - h / 2, w, h);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
