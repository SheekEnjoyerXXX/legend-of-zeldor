import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../game/constants';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENES.INTRO);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);

    const lines = [
      'In the land of Mudfork...',
      '',
      'Where the dwarves are short',
      'and the buildings are crooked...',
      '',
      'A great evil has awakened.',
      '',
      'The ogre SHREEK has kidnapped',
      'Princess Zeldor, the AI robot princess,',
      'and dragged her into the Digital Realm.',
      '',
      'Only one hero can save her...',
      '',
      'A very short, very determined dwarf',
      'named LINKLER.',
      '',
      'His quest begins now.',
      '',
      '(Press SPACE to skip)',
    ];

    const fullText = lines.join('\n');
    const textObj = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT + 20, fullText, {
      fontSize: '9px', fontFamily: 'monospace', color: '#cccccc',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);

    // Scroll text upward
    this.tweens.add({
      targets: textObj,
      y: -textObj.height,
      duration: 15000,
      ease: 'Linear',
      onComplete: () => this.startGame(),
    });

    // Skip
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-E', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start(SCENES.VILLAGE);
  }
}
