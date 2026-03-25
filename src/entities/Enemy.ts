import Phaser from 'phaser';
import { EnemyDef } from '../data/enemies';
import { Damageable } from '../systems/CombatSystem';

export class Enemy implements Damageable {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  invulnerable = false;
  lastHitTime = 0;
  def: EnemyDef;
  private scene: Phaser.Scene;
  private moveTimer = 0;
  private moveDir = { x: 0, y: 0 };
  private lastShot = 0;
  private patrolDir = 1;
  private patrolAxis: 'x' | 'y' = 'x';
  private startX: number;
  private startY: number;
  isDead = false;

  onDeath?: (enemy: Enemy) => void;
  onShoot?: (enemy: Enemy, angle: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef) {
    this.scene = scene;
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.startX = x;
    this.startY = y;

    this.sprite = scene.physics.add.sprite(x, y, def.spriteKey, 0);
    this.sprite.setSize(12, 12).setOffset(2, 2);
    this.sprite.setImmovable(true);
    this.sprite.setDepth(8);

    // Setup animation
    const animKey = `${def.spriteKey}_idle`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(def.spriteKey, { start: 0, end: 1 }),
        frameRate: 4, repeat: -1,
      });
    }
    this.sprite.anims.play(animKey, true);

    this.patrolAxis = Math.random() > 0.5 ? 'x' : 'y';
  }

  update(time: number, playerX: number, playerY: number): void {
    if (this.isDead || !this.sprite.body) return;

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerX, playerY);

    switch (this.def.behavior) {
      case 'chase':
        if (dist < this.def.chaseRange) {
          this.sprite.setVelocity(
            Math.cos(angle) * this.def.speed,
            Math.sin(angle) * this.def.speed
          );
        } else {
          this.wander(time);
        }
        break;

      case 'float':
        if (dist < this.def.chaseRange) {
          this.sprite.setVelocity(
            Math.cos(angle) * this.def.speed + Math.sin(time / 500) * 20,
            Math.sin(angle) * this.def.speed + Math.cos(time / 500) * 20
          );
        } else {
          // Gentle float
          this.sprite.setVelocity(
            Math.sin(time / 1000 + this.startX) * 30,
            Math.cos(time / 1000 + this.startY) * 30
          );
        }
        break;

      case 'patrol':
        this.patrol(time);
        break;

      case 'wander':
        this.wander(time);
        break;

      case 'charge':
        if (dist < this.def.chaseRange && dist > this.def.attackRange) {
          this.sprite.setVelocity(
            Math.cos(angle) * this.def.speed * 1.5,
            Math.sin(angle) * this.def.speed * 1.5
          );
        } else {
          this.sprite.setVelocity(0, 0);
        }
        break;
    }

    // Shooting
    if (this.def.projectile && dist < (this.def.chaseRange ?? 100)) {
      if (time - this.lastShot > (this.def.projectileCooldown ?? 2000)) {
        this.lastShot = time;
        this.onShoot?.(this, angle);
      }
    }
  }

  private wander(time: number): void {
    if (time > this.moveTimer) {
      this.moveTimer = time + 1000 + Math.random() * 2000;
      const a = Math.random() * Math.PI * 2;
      this.moveDir = { x: Math.cos(a), y: Math.sin(a) };
      if (Math.random() > 0.6) {
        this.moveDir = { x: 0, y: 0 };
      }
    }
    this.sprite.setVelocity(
      this.moveDir.x * this.def.speed * 0.5,
      this.moveDir.y * this.def.speed * 0.5
    );
  }

  private patrol(time: number): void {
    if (time > this.moveTimer) {
      this.moveTimer = time + 2000;
      this.patrolDir *= -1;
    }
    if (this.patrolAxis === 'x') {
      this.sprite.setVelocity(this.patrolDir * this.def.speed * 0.6, 0);
    } else {
      this.sprite.setVelocity(0, this.patrolDir * this.def.speed * 0.6);
    }
  }

  die(): void {
    this.isDead = true;
    this.sprite.setVelocity(0, 0);
    this.sprite.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0, scaleX: 0, scaleY: 0,
      duration: 300,
      onComplete: () => {
        this.onDeath?.(this);
        this.sprite.destroy();
      },
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
