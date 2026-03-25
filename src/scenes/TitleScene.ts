import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, IS_DEV } from '../game/constants';
import { hasSaveData } from '../game/save';

export class TitleScene extends Phaser.Scene {
  private menuItems: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private cursorText!: Phaser.GameObjects.Text;
  private titleMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super(SCENES.TITLE);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    // Starfield background
    for (let i = 0; i < 60; i++) {
      const star = this.add.rectangle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT,
        1, 1, 0xffffff, Math.random() * 0.5 + 0.3
      );
      this.tweens.add({
        targets: star, alpha: 0.1, duration: 1000 + Math.random() * 2000,
        yoyo: true, repeat: -1,
      });
    }

    // Title text - "LEGEND OF ZELDOR"
    const titleY = 50;
    this.add.text(GAME_WIDTH / 2, titleY, 'LEGEND OF', {
      fontSize: '14px', fontFamily: 'monospace', color: '#8888cc',
    }).setOrigin(0.5);

    const mainTitle = this.add.text(GAME_WIDTH / 2, titleY + 22, 'ZELDOR', {
      fontSize: '28px', fontFamily: 'monospace', color: '#e6c619',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Pulsing glow on title
    this.tweens.add({
      targets: mainTitle, scaleX: 1.05, scaleY: 1.05,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Floating characters
    this.addFloatingCharacter('linkler', 60, 130, 0);
    this.addFloatingCharacter('zeldor', 400, 120, 0);
    this.addFloatingCharacter('pickle', 130, 170, 0);
    this.addFloatingCharacter('obamasphere', 350, 180, 0);

    // Shreek lurking in corner
    if (this.textures.exists('shreek')) {
      const shreek = this.add.sprite(430, 250, 'shreek', 0).setScale(0.5).setAlpha(0.4);
      this.tweens.add({
        targets: shreek, alpha: 0.6, duration: 3000, yoyo: true, repeat: -1,
      });
    }

    // Menu
    const menuX = GAME_WIDTH / 2;
    const menuStartY = 200;
    const menuSpacing = 20;

    const items = ['Start Game', 'Continue', 'Controls', 'Quit'];
    this.menuItems = items.map((label, i) => {
      const text = this.add.text(menuX, menuStartY + i * menuSpacing, label, {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5);
      if (i === 1 && !hasSaveData()) {
        text.setColor('#555555');
      }
      return text;
    });

    this.cursorText = this.add.text(0, 0, '▸', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e6c619',
    }).setOrigin(0.5);

    this.updateCursor();

    // Subtitle
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'A Totally Original Adventure™', {
      fontSize: '7px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Dev mode scene selector
    if (IS_DEV) {
      this.add.text(4, 4, '[DEV MODE]', {
        fontSize: '7px', fontFamily: 'monospace', color: '#ff4444',
      });
      this.addDevSceneSelector();
    }

    // Input
    this.setupInput();

    // Play title music
    this.playTitleMusic();
  }

  private addFloatingCharacter(key: string, x: number, y: number, frame: number): void {
    if (!this.textures.exists(key)) return;
    const sprite = this.add.sprite(x, y, key, frame).setScale(1.5);
    this.tweens.add({
      targets: sprite,
      y: y - 8 + Math.random() * 6,
      duration: 2000 + Math.random() * 1000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.input.keyboard.on('keydown-UP', () => this.moveMenu(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveMenu(1));
    this.input.keyboard.on('keydown-W', () => this.moveMenu(-1));
    this.input.keyboard.on('keydown-S', () => this.moveMenu(1));
    this.input.keyboard.on('keydown-SPACE', () => this.selectItem());
    this.input.keyboard.on('keydown-ENTER', () => this.selectItem());
    this.input.keyboard.on('keydown-E', () => this.selectItem());
    this.input.keyboard.on('keydown-J', () => this.selectItem());
  }

  private moveMenu(dir: number): void {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.menuItems.length);
    this.updateCursor();
  }

  private updateCursor(): void {
    const item = this.menuItems[this.selectedIndex];
    this.cursorText.setPosition(item.x - item.width / 2 - 12, item.y);
  }

  private selectItem(): void {
    switch (this.selectedIndex) {
      case 0: // Start Game
        this.titleMusic?.stop();
        this.scene.start(SCENES.INTRO);
        break;
      case 1: // Continue
        if (hasSaveData()) {
          this.titleMusic?.stop();
          // Load save and go to saved scene
          this.scene.start(SCENES.VILLAGE); // Default fallback; actual scene from save
        }
        break;
      case 2: // Controls
        this.showControls();
        break;
      case 3: // Quit
        this.showQuitMessage();
        break;
    }
  }

  private showControls(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40, 0x111122, 0.95).setDepth(100);
    const controls = [
      'CONTROLS',
      '',
      'Arrow Keys / WASD - Move',
      'J - Attack (sword / blaster)',
      'K - Shield',
      'L - Ranged Attack (A-OK 47)',
      'E / Space - Interact / Confirm',
      'I - Inventory',
      'Enter - Pause',
      'Shift - Sprint',
      '',
      'Press any key to close',
    ];
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, controls.join('\n'), {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff', align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5).setDepth(101);

    const close = () => { overlay.destroy(); text.destroy(); };
    this.input.keyboard?.once('keydown', close);
  }

  private showQuitMessage(): void {
    const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Nice try.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff4444',
    }).setOrigin(0.5).setDepth(100);
    this.time.delayedCall(2000, () => msg.destroy());
  }

  private addDevSceneSelector(): void {
    const scenes = [
      { key: 'V', scene: SCENES.VILLAGE, label: 'Village' },
      { key: 'H', scene: SCENES.SHRINE, label: 'Shrine' },
      { key: 'F', scene: SCENES.FIELDS, label: 'Fields' },
      { key: 'G', scene: SCENES.GATES, label: 'Gates' },
      { key: 'R', scene: SCENES.DIGITAL, label: 'Digital' },
      { key: 'M', scene: SCENES.SEWERS, label: 'Sewers' },
      { key: 'O', scene: SCENES.FORTRESS, label: 'Fortress' },
      { key: 'N', scene: SCENES.FINALE, label: 'Finale' },
    ];
    let y = 16;
    for (const s of scenes) {
      this.add.text(4, y, `[${s.key}] ${s.label}`, {
        fontSize: '6px', fontFamily: 'monospace', color: '#ff8888',
      });
      this.input.keyboard?.on(`keydown-${s.key}`, () => {
        if (!IS_DEV) return;
        this.titleMusic?.stop();
        this.scene.start(s.scene, { devMode: true });
      });
      y += 10;
    }
  }

  private playTitleMusic(): void {
    try {
      // Use Web Audio directly since decodeAudio is async
      const audioData = this.registry.get('audioData');
      if (audioData?.music_title) {
        this.titleMusic = this.sound.add('music_title', { loop: true, volume: 0.4 });
        // Will play once decoded
        if (this.sound.locked) {
          this.sound.once('unlocked', () => this.titleMusic?.play());
        } else {
          this.titleMusic.play();
        }
      }
    } catch {
      // Audio might not be ready yet, that's fine
    }
  }
}
