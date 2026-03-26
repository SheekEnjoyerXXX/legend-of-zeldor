import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/constants';
import { DialogSequence } from '../data/dialog';

export class DialogSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgRect: Phaser.GameObjects.Rectangle;
  private borderRect: Phaser.GameObjects.Rectangle;
  private speakerText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private queue: DialogSequence = [];
  private currentIndex = 0;
  private isActive = false;
  private onComplete?: () => void;
  private typeTimer?: Phaser.Time.TimerEvent;
  private fullText = '';
  private displayedChars = 0;
  private isTyping = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const boxY = GAME_HEIGHT - 85;
    const boxW = GAME_WIDTH - 20;
    const boxH = 75;
    const boxX = GAME_WIDTH / 2;

    this.borderRect = scene.add.rectangle(boxX, boxY + boxH / 2, boxW + 4, boxH + 4, COLORS.UI_BORDER)
      .setScrollFactor(0).setDepth(1000);
    this.bgRect = scene.add.rectangle(boxX, boxY + boxH / 2, boxW, boxH, COLORS.UI_BG)
      .setScrollFactor(0).setDepth(1001);
    this.speakerText = scene.add.text(16, boxY + 4, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#e6c619',
    }).setScrollFactor(0).setDepth(1002);
    this.bodyText = scene.add.text(16, boxY + 18, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
      wordWrap: { width: boxW - 20 }, lineSpacing: 4,
    }).setScrollFactor(0).setDepth(1002);
    this.promptText = scene.add.text(GAME_WIDTH - 30, boxY + boxH - 12, '▼', {
      fontSize: '10px', fontFamily: 'monospace', color: '#e6c619',
    }).setScrollFactor(0).setDepth(1002);

    this.container = scene.add.container(0, 0, [
      this.borderRect, this.bgRect, this.speakerText, this.bodyText, this.promptText,
    ]).setDepth(1000).setScrollFactor(0);

    this.hide();
  }

  show(dialog: DialogSequence, onComplete?: () => void): void {
    this.queue = dialog;
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.isActive = true;
    this.container.setVisible(true);
    this.showLine();
  }

  private showLine(): void {
    if (this.currentIndex >= this.queue.length) {
      this.hide();
      this.onComplete?.();
      return;
    }

    const line = this.queue[this.currentIndex];
    this.speakerText.setText(line.speaker);
    this.fullText = line.text;
    this.displayedChars = 0;
    this.bodyText.setText('');
    this.isTyping = true;
    this.promptText.setVisible(false);

    this.typeTimer?.destroy();
    this.typeTimer = this.scene.time.addEvent({
      delay: 35,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.displayedChars++;
        this.bodyText.setText(this.fullText.substring(0, this.displayedChars));
        if (this.displayedChars >= this.fullText.length) {
          this.isTyping = false;
          this.promptText.setVisible(true);
        }
      },
    });
  }

  advance(): void {
    if (!this.isActive) return;

    if (this.isTyping) {
      // Skip to end of current line
      this.typeTimer?.destroy();
      this.displayedChars = this.fullText.length;
      this.bodyText.setText(this.fullText);
      this.isTyping = false;
      this.promptText.setVisible(true);
      return;
    }

    this.currentIndex++;
    this.showLine();
  }

  hide(): void {
    this.isActive = false;
    this.container.setVisible(false);
    this.typeTimer?.destroy();
  }

  get active(): boolean {
    return this.isActive;
  }

  destroy(): void {
    this.typeTimer?.destroy();
    this.container.destroy();
  }
}
