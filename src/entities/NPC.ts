import Phaser from 'phaser';

export interface NPCConfig {
  key: string;
  spriteKey: string;
  x: number;
  y: number;
  dialogKey: string;
  dialogKeyAfter?: string;
  questFlag?: string;
  facingDir?: number; // frame index
}

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  config: NPCConfig;
  private scene: Phaser.Scene;
  private interactIcon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    this.scene = scene;
    this.config = config;

    this.sprite = scene.physics.add.sprite(config.x, config.y, config.spriteKey, config.facingDir ?? 0);
    this.sprite.setImmovable(true);
    this.sprite.setSize(14, 14).setOffset(1, 1);
    this.sprite.setDepth(8);

    // Small idle animation
    const animKey = `${config.spriteKey}_idle`;
    if (!scene.anims.exists(animKey)) {
      const frameCount = scene.textures.get(config.spriteKey).frameTotal;
      if (frameCount > 1) {
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers(config.spriteKey, { start: 0, end: Math.min(1, frameCount - 2) }),
          frameRate: 2, repeat: -1,
        });
      }
    }
    if (scene.anims.exists(animKey)) {
      this.sprite.anims.play(animKey, true);
    }

    // Interact prompt
    this.interactIcon = scene.add.text(config.x, config.y - 14, '[E]', {
      fontSize: '8px', fontFamily: 'monospace', color: '#e6c619',
    }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  showPrompt(show: boolean): void {
    this.interactIcon.setVisible(show);
    this.interactIcon.setPosition(this.sprite.x, this.sprite.y - 14);
  }

  getDialogKey(questComplete: boolean): string {
    if (questComplete && this.config.dialogKeyAfter) {
      return this.config.dialogKeyAfter;
    }
    return this.config.dialogKey;
  }

  destroy(): void {
    this.sprite.destroy();
    this.interactIcon.destroy();
  }
}
