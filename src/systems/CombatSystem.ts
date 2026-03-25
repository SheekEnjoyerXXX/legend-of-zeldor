import Phaser from 'phaser';
import { PLAYER_INVULN_TIME, PLAYER_KNOCKBACK, SWORD_DAMAGE, BLASTER_DAMAGE } from '../game/constants';

export interface Damageable {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  invulnerable: boolean;
  lastHitTime: number;
}

export class CombatSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  dealDamage(
    target: Damageable,
    amount: number,
    knockbackSource?: { x: number; y: number },
    knockbackForce = PLAYER_KNOCKBACK,
  ): boolean {
    if (target.invulnerable || target.hp <= 0) return false;

    target.hp = Math.max(0, target.hp - amount);
    target.invulnerable = true;
    target.lastHitTime = this.scene.time.now;

    // Flash effect
    this.flashSprite(target.sprite);

    // Knockback
    if (knockbackSource && target.sprite.body) {
      const angle = Phaser.Math.Angle.Between(
        knockbackSource.x, knockbackSource.y,
        target.sprite.x, target.sprite.y
      );
      const body = target.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * knockbackForce,
        Math.sin(angle) * knockbackForce
      );
      this.scene.time.delayedCall(200, () => {
        if (body.enable) body.setVelocity(0, 0);
      });
    }

    // Reset invulnerability
    this.scene.time.delayedCall(PLAYER_INVULN_TIME, () => {
      target.invulnerable = false;
      target.sprite.setAlpha(1);
    });

    return true;
  }

  private flashSprite(sprite: Phaser.GameObjects.Sprite): void {
    let flashCount = 0;
    const flashTimer = this.scene.time.addEvent({
      delay: 80,
      repeat: 7,
      callback: () => {
        flashCount++;
        sprite.setAlpha(flashCount % 2 === 0 ? 1 : 0.3);
      },
    });
    // Cleanup reference to prevent leaks
    this.scene.time.delayedCall(PLAYER_INVULN_TIME, () => {
      flashTimer.destroy();
      sprite.setAlpha(1);
    });
  }

  getSwordDamage(): number { return SWORD_DAMAGE; }
  getBlasterDamage(): number { return BLASTER_DAMAGE; }
}
