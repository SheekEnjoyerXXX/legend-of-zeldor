import Phaser from 'phaser';

export type PickupType = 'heart' | 'zlorp' | 'ammo' | 'key' | 'item';

export interface PickupConfig {
  type: PickupType;
  itemKey?: string; // for 'item' type
  spriteKey: string;
  x: number;
  y: number;
}

export class Pickup {
  sprite: Phaser.Physics.Arcade.Sprite;
  config: PickupConfig;
  collected = false;

  constructor(scene: Phaser.Scene, config: PickupConfig) {
    this.config = config;
    this.sprite = scene.physics.add.sprite(config.x, config.y, config.spriteKey);
    this.sprite.setDepth(6);
    this.sprite.setSize(10, 10);

    // Bob animation
    scene.tweens.add({
      targets: this.sprite,
      y: config.y - 3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.sprite.destroy();
  }

  destroy(): void {
    if (!this.collected) this.sprite.destroy();
  }
}
