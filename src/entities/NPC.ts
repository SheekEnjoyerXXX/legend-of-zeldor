import Phaser from 'phaser';

export interface DialogStage {
  flag: string;
  dialogKey: string;
}

export interface NPCConfig {
  key: string;
  spriteKey: string;
  x: number;
  y: number;
  dialogKey: string;
  dialogKeyAfter?: string;
  questFlag?: string;
  facingDir?: number;
  dialogStages?: DialogStage[];
}

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  config: NPCConfig;
  private scene: Phaser.Scene;
  private interactIcon: Phaser.GameObjects.Text;
  private questMarker: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    this.scene = scene;
    this.config = config;

    this.sprite = scene.physics.add.sprite(config.x, config.y, config.spriteKey, config.facingDir ?? 0);
    this.sprite.setImmovable(false);
    this.sprite.setSize(12, 12).setOffset(2, 2);
    this.sprite.setDepth(8);
    // High drag so NPCs resist being pushed but don't fully block doorways
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setDrag(400, 400);
    body.setMaxVelocity(20, 20);

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

    // Quest marker (! or ?)
    this.questMarker = scene.add.text(config.x, config.y - 20, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setDepth(21).setVisible(false);
  }

  showPrompt(show: boolean): void {
    this.interactIcon.setVisible(show);
    this.interactIcon.setPosition(this.sprite.x, this.sprite.y - 14);
  }

  setQuestMarker(type: 'available' | 'in_progress' | 'none'): void {
    if (type === 'none') {
      this.questMarker.setVisible(false);
      return;
    }
    this.questMarker.setVisible(true);
    this.questMarker.setText(type === 'available' ? '!' : '?');
    this.questMarker.setColor(type === 'available' ? '#ffd700' : '#888888');
    this.questMarker.setPosition(this.sprite.x, this.sprite.y - 20);
  }

  getDialogKey(questComplete: boolean, flags?: Record<string, boolean>): string {
    // Check stage-aware dialog (most recent matching flag first)
    if (this.config.dialogStages && flags) {
      for (let i = this.config.dialogStages.length - 1; i >= 0; i--) {
        const stage = this.config.dialogStages[i];
        if (flags[stage.flag]) {
          return stage.dialogKey;
        }
      }
    }
    if (questComplete && this.config.dialogKeyAfter) {
      return this.config.dialogKeyAfter;
    }
    return this.config.dialogKey;
  }

  destroy(): void {
    this.sprite.destroy();
    this.interactIcon.destroy();
    this.questMarker.destroy();
  }
}
