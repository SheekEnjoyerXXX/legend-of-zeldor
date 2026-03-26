import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/constants';

export class UIScene extends Phaser.Scene {
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private zlorpText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private keyText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private areaText!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.UI);
  }

  create(): void {
    // Reset arrays — Phaser reuses scene instances, so create() may run multiple
    // times on the same object. Old game objects are destroyed on shutdown.
    this.heartIcons = [];

    // Top HUD bar background
    this.add.rectangle(GAME_WIDTH / 2, 10, GAME_WIDTH, 20, 0x000000, 0.7).setScrollFactor(0);

    // Hearts
    for (let i = 0; i < 6; i++) {
      const heart = this.add.image(12 + i * 14, 10, 'heart_full').setScrollFactor(0).setScale(0.8);
      this.heartIcons.push(heart);
    }

    // Zlorps
    this.zlorpText = this.add.text(110, 4, 'Z:0', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffd700',
    }).setScrollFactor(0);

    // Keys
    this.keyText = this.add.text(160, 4, 'K:0', {
      fontSize: '9px', fontFamily: 'monospace', color: '#e6c619',
    }).setScrollFactor(0);

    // Ammo
    this.ammoText = this.add.text(200, 4, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#00cccc',
    }).setScrollFactor(0);

    // Weapon
    this.weaponText = this.add.text(260, 4, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
    }).setScrollFactor(0);

    // Area name
    this.areaText = this.add.text(GAME_WIDTH / 2, 28, '', {
      fontSize: '8px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    // Quest objective (bottom left)
    this.questText = this.add.text(6, GAME_HEIGHT - 14, '', {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaccff',
    }).setScrollFactor(0).setAlpha(0.8);

    // Control hints (bottom right)
    const controlLines = [
      'J:Sword  K:Shield',
      'L:Blast  E:Talk',
      'Tab:Switch  I:Inv',
    ];
    const controlBg = this.add.rectangle(
      GAME_WIDTH - 58, GAME_HEIGHT - 22, 112, 34, 0x000000, 0.5
    ).setScrollFactor(0).setOrigin(0.5);
    for (let i = 0; i < controlLines.length; i++) {
      this.add.text(GAME_WIDTH - 112, GAME_HEIGHT - 36 + i * 10, controlLines[i], {
        fontSize: '7px', fontFamily: 'monospace', color: '#888888',
      }).setScrollFactor(0).setAlpha(0.7);
    }
  }

  updateHealth(current: number, max: number): void {
    const hearts = max / 2;
    for (let i = 0; i < this.heartIcons.length; i++) {
      if (i >= hearts) {
        this.heartIcons[i].setVisible(false);
      } else {
        this.heartIcons[i].setVisible(true);
        const hpForHeart = current - i * 2;
        if (hpForHeart >= 2) {
          this.heartIcons[i].setTexture('heart_full');
        } else if (hpForHeart === 1) {
          this.heartIcons[i].setTexture('heart_half');
        } else {
          this.heartIcons[i].setTexture('heart_empty');
        }
      }
    }
  }

  updateZlorps(amount: number): void {
    this.zlorpText.setText(`Z:${amount}`);
  }

  updateKeys(amount: number): void {
    this.keyText.setText(`K:${amount}`);
  }

  updateAmmo(amount: number, hasBlaster: boolean): void {
    this.ammoText.setText(hasBlaster ? `A:${amount}` : '');
  }

  updateWeapon(weapon: string): void {
    this.weaponText.setText(weapon);
  }

  updateQuestObjective(text: string): void {
    this.questText.setText(text);
  }

  showAreaName(name: string): void {
    this.areaText.setText(name);
    this.areaText.setAlpha(1);
    this.tweens.add({
      targets: this.areaText,
      alpha: 0,
      delay: 2000,
      duration: 1000,
    });
  }
}
