import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../game/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create(): void {
    // Loading text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.scene.start(SCENES.PRELOAD);
  }
}
