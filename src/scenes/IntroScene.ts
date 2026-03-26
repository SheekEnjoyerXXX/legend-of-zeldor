import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../game/constants';

export class IntroScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super(SCENES.INTRO);
  }

  create(): void {
    this.started = false;
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
      'Your quest: find the LEGEND SWORD,',
      'travel through the GATES OF TIME,',
      'and defeat SHREEK in his fortress.',
      '',
      'The journey begins in the Village of Mudfork.',
      '',
      '(Press ENTER to skip)',
    ];

    const fullText = lines.join('\n');
    const textObj = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT + 20, fullText, {
      fontSize: '9px', fontFamily: 'monospace', color: '#cccccc',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);

    // Scroll text upward (slower for readability)
    this.tweens.add({
      targets: textObj,
      y: -textObj.height,
      duration: 20000,
      ease: 'Linear',
      onComplete: () => this.startGame(),
    });

    // Skip - only ENTER to avoid accidental skips
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;
    this.tweens.killAll();
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000
    ).setScrollFactor(0).setDepth(9999).setAlpha(0);
    this.tweens.add({
      targets: overlay, alpha: 1, duration: 500,
      onComplete: () => this.scene.start(SCENES.VILLAGE),
    });
  }
}
