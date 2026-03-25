import Phaser from 'phaser';

export class Projectile {
  sprite: Phaser.Physics.Arcade.Sprite;
  damage: number;
  isPlayerProjectile: boolean;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    angle: number,
    speed: number,
    damage: number,
    isPlayerProjectile: boolean,
    textureKey = 'enemy_projectile',
  ) {
    this.scene = scene;
    this.damage = damage;
    this.isPlayerProjectile = isPlayerProjectile;

    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(12);
    this.sprite.setSize(4, 4);
    this.sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.sprite.setRotation(angle);

    // Auto-destroy after 3 seconds
    scene.time.delayedCall(3000, () => this.destroy());
  }

  destroy(): void {
    if (this.sprite?.active) {
      this.sprite.destroy();
    }
  }
}
