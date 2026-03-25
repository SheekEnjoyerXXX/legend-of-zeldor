import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE, COLORS } from '../game/constants';

export class DigitalRealmScene extends BaseGameScene {
  private glitchTimer = 0;

  constructor() {
    super(SCENES.DIGITAL);
    this.mapWidth = 480;
    this.mapHeight = 544;
    this.areaName = 'Digital Realm';
  }

  buildMap(): void {
    const T = TILE_SIZE;
    const cols = 30, rows = 34;

    // Digital floor
    this.fillFloor(cols, rows, 'tile_digital');

    // Border walls (neon)
    this.addWallRect(0, 0, cols, 2, 'tile_digital_wall');
    this.addWallRect(0, (rows - 2) * T, cols, 2, 'tile_digital_wall');
    this.addWallRect(0, 0, 2, rows, 'tile_digital_wall');
    this.addWallRect((cols - 2) * T, 0, 2, rows, 'tile_digital_wall');

    // Entrance at bottom
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y > (rows - 3) * T) sprite.destroy();
      });
    }

    // Exit at top (to sewers)
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y < 2 * T) sprite.destroy();
      });
    }

    // Internal maze-like corridors
    this.addWallRect(5 * T, 8 * T, 8, 1, 'tile_digital_wall');
    this.addWallRect(17 * T, 8 * T, 8, 1, 'tile_digital_wall');
    this.addWallRect(8 * T, 14 * T, 1, 6, 'tile_digital_wall');
    this.addWallRect(21 * T, 14 * T, 1, 6, 'tile_digital_wall');
    this.addWallRect(10 * T, 20 * T, 10, 1, 'tile_digital_wall');
    this.addWallRect(5 * T, 26 * T, 6, 1, 'tile_digital_wall');
    this.addWallRect(19 * T, 26 * T, 6, 1, 'tile_digital_wall');

    // Teleport pads
    this.createTeleportPad(5 * T, 5 * T, 25 * T, 25 * T);
    this.createTeleportPad(25 * T, 5 * T, 5 * T, 25 * T);

    // Disappearing tiles
    const disappearingPositions = [
      [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10],
      [14, 22], [15, 22], [16, 22],
    ];
    for (const [dx, dy] of disappearingPositions) {
      this.createDisappearingTile(dx * T + T / 2, dy * T + T / 2);
    }

    // Fake code rain effect (background)
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * this.mapWidth;
      const chars = this.add.text(x, 0, '01101\n10010\n11001\n00110', {
        fontSize: '6px', fontFamily: 'monospace', color: '#003300',
      }).setAlpha(0.3).setDepth(0);
      this.tweens.add({
        targets: chars, y: this.mapHeight, duration: 5000 + Math.random() * 5000,
        repeat: -1, onRepeat: () => { chars.y = -50; chars.x = Math.random() * this.mapWidth; },
      });
    }

    // Corrupted UI popups (cosmetic)
    this.time.addEvent({
      delay: 5000, loop: true, callback: () => {
        const popup = this.add.text(
          this.player.sprite.x + (Math.random() - 0.5) * 200,
          this.player.sprite.y + (Math.random() - 0.5) * 100,
          ['ERROR 418', 'SEGFAULT', 'NULL PTR', 'STACK OVERFLOW', '???'][Math.floor(Math.random() * 5)],
          { fontSize: '8px', fontFamily: 'monospace', color: '#ff0000' }
        ).setDepth(15);
        this.tweens.add({
          targets: popup, alpha: 0, y: popup.y - 30, duration: 2000,
          onComplete: () => popup.destroy(),
        });
      },
    });

    // Transitions
    this.addTransition(SCENES.SEWERS, 13 * T, 0, 4 * T, T, 240, 440);
  }

  private createTeleportPad(x1: number, y1: number, x2: number, y2: number): void {
    const pad1 = this.add.rectangle(x1, y1, 14, 14, 0xff00ff, 0.5).setDepth(1);
    const pad2 = this.add.rectangle(x2, y2, 14, 14, 0x00ffff, 0.5).setDepth(1);

    this.tweens.add({ targets: [pad1, pad2], alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });

    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        const d1 = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, x1, y1);
        if (d1 < 10 && this.player.isKeyJustDown('e')) {
          this.playSfx('sfx_portal');
          this.player.sprite.setPosition(x2, y2);
          this.cameras.main.flash(200, 0, 255, 255);
        }
        const d2 = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, x2, y2);
        if (d2 < 10 && this.player.isKeyJustDown('e')) {
          this.playSfx('sfx_portal');
          this.player.sprite.setPosition(x1, y1);
          this.cameras.main.flash(200, 255, 0, 255);
        }
      },
    });
  }

  private createDisappearingTile(x: number, y: number): void {
    const tile = this.add.rectangle(x, y, 14, 14, 0x00ff44, 0.6).setDepth(1);
    const hole = this.physics.add.staticImage(x, y, 'tile_digital');
    hole.setVisible(false).setSize(14, 14).refreshBody();
    (hole.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    let visible = true;
    this.time.addEvent({
      delay: 2000 + Math.random() * 2000, loop: true, callback: () => {
        visible = !visible;
        tile.setAlpha(visible ? 0.6 : 0.1);
        (hole.body as Phaser.Physics.Arcade.StaticBody).enable = !visible;
        if (!visible) {
          // Check if player is standing on it
          const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, x, y);
          if (dist < 10) {
            this.combat.dealDamage(this.player, 1, { x, y });
          }
        }
      },
    });
  }

  populate(): void {
    const T = TILE_SIZE;

    // Digital enemies
    this.spawnEnemy(6 * T, 5 * T, 'error_bat');
    this.spawnEnemy(24 * T, 5 * T, 'error_bat');
    this.spawnEnemy(10 * T, 12 * T, 'obamasphere');
    this.spawnEnemy(20 * T, 12 * T, 'obamasphere');
    this.spawnEnemy(15 * T, 16 * T, 'obamasphere_laser');
    this.spawnEnemy(6 * T, 20 * T, 'firewall_skeleton');
    this.spawnEnemy(24 * T, 20 * T, 'firewall_skeleton');
    this.spawnEnemy(12 * T, 28 * T, 'glitch_crab');
    this.spawnEnemy(18 * T, 28 * T, 'glitch_crab');
    this.spawnEnemy(15 * T, 24 * T, 'error_bat');

    // Pickups
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 4 * T, y: 12 * T });
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 26 * T, y: 12 * T });
    this.spawnPickup({ type: 'ammo', spriteKey: 'ammo_pickup', x: 15 * T, y: 30 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 4 * T, y: 28 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 26 * T, y: 28 * T });

    // Captcha puzzle area
    this.spawnNPC({
      key: 'glitch_sign', spriteKey: 'sign',
      x: 15 * T, y: 8 * T,
      dialogKey: 'digital_glitch_sign',
    });

    // Pick the Pickle cameo
    this.spawnNPC({
      key: 'pickle_digital', spriteKey: 'pickle',
      x: 25 * T, y: 16 * T,
      dialogKey: 'pickle_wisdom',
    });

    // Save crystal
    const crystal = this.add.rectangle(15 * T, 32 * T, 8, 12, 0x44aaff).setDepth(4);
    this.tweens.add({ targets: crystal, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });
    this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        if (!this.dialog.active) {
          const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, crystal.x, crystal.y);
          if (dist < 20 && this.player.isKeyJustDown('e')) {
            this.saveCheckpoint(crystal.x, crystal.y + 20);
          }
        }
      },
    });
  }

  update(time: number, delta: number): void {
    super.update(time, delta);

    // Periodic screen glitch effect
    this.glitchTimer += delta;
    if (this.glitchTimer > 4000) {
      this.glitchTimer = 0;
      this.cameras.main.shake(100, 0.005);
    }
  }

  protected playMusic(): void {
    this.startMusic('music_digital');
  }
}
