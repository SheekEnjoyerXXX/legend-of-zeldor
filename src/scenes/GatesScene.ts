import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE, COLORS } from '../game/constants';
import { DIALOG } from '../data/dialog';

export class GatesScene extends BaseGameScene {
  private bossDefeated = false;
  private portalOpen = false;
  private switchesActivated = 0;

  constructor() {
    super(SCENES.GATES);
    this.mapWidth = 480;
    this.mapHeight = 480;
    this.areaName = 'Gates of Time';
  }

  buildMap(): void {
    const T = TILE_SIZE;
    const cols = 30, rows = 30;

    // Stone floor
    this.fillFloor(cols, rows, 'tile_stone');

    // Border walls
    this.addWallRect(0, 0, cols, 2, 'tile_wall');
    this.addWallRect(0, (rows - 2) * T, cols, 2, 'tile_wall');
    this.addWallRect(0, 0, 2, rows, 'tile_wall');
    this.addWallRect((cols - 2) * T, 0, 2, rows, 'tile_wall');

    // Entrance from fields (bottom)
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y > (rows - 3) * T) sprite.destroy();
      });
    }

    // The Gates - large portal structure at top
    this.addWallRect(8 * T, 2 * T, 5, 4, 'tile_wall');
    this.addWallRect(17 * T, 2 * T, 5, 4, 'tile_wall');

    // Portal area
    const portalGlow = this.add.rectangle(15 * T, 4 * T, T * 4, T * 3, 0x6633cc, 0.3).setDepth(1);
    this.tweens.add({ targets: portalGlow, alpha: 0.1, duration: 1500, yoyo: true, repeat: -1 });

    // Switches (3 needed to activate the gate)
    this.createSwitch(6 * T, 15 * T);
    this.createSwitch(15 * T, 20 * T);
    this.createSwitch(24 * T, 15 * T);

    // Inner walls creating corridors
    this.addWallRect(5 * T, 8 * T, 8, 1, 'tile_wall');
    this.addWallRect(17 * T, 8 * T, 8, 1, 'tile_wall');
    this.addWallRect(12 * T, 12 * T, 1, 6, 'tile_wall');
    this.addWallRect(17 * T, 12 * T, 1, 6, 'tile_wall');

    // Doner chef area (before the portal)
    this.addWallRect(6 * T, 22 * T, 4, 2, 'tile_hut');

    // Transitions
    this.addTransition(SCENES.FIELDS, 13 * T, (rows - 1) * T, 4 * T, T, 288, 20);
  }

  private createSwitch(x: number, y: number): void {
    const switchImg = this.add.image(x, y, 'switch_off').setDepth(4);
    let activated = false;

    this.time.addEvent({
      delay: 150, loop: true, callback: () => {
        if (activated) return;
        const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, x, y);
        if (dist < 16 && this.player.isKeyJustDown('e')) {
          activated = true;
          switchImg.setTexture('switch_on');
          this.switchesActivated++;
          this.playSfx('sfx_pickup');

          if (this.switchesActivated >= 3 && !this.bossDefeated) {
            this.showDialogByKey('gates_plaque', () => {
              this.spawnGatekeeper();
            });
          }
        }
      },
    });
  }

  populate(): void {
    const T = TILE_SIZE;

    // Enemies
    this.spawnEnemy(6 * T, 10 * T, 'firewall_skeleton');
    this.spawnEnemy(24 * T, 10 * T, 'firewall_skeleton');
    this.spawnEnemy(10 * T, 18 * T, 'obamasphere');
    this.spawnEnemy(20 * T, 18 * T, 'obamasphere');
    this.spawnEnemy(15 * T, 25 * T, 'gobdwarf');
    this.spawnEnemy(8 * T, 25 * T, 'gobdwarf');
    this.spawnEnemy(22 * T, 25 * T, 'gobdwarf');

    // Doner Chef NPC
    this.spawnNPC({
      key: 'doner_chef', spriteKey: 'merchant',
      x: 8 * T, y: 24 * T,
      dialogKey: 'doner_chef',
    });

    // Pickups
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 4 * T, y: 20 * T });
    this.spawnPickup({ type: 'ammo', spriteKey: 'ammo_pickup', x: 26 * T, y: 20 * T });
    this.spawnPickup({ type: 'key', spriteKey: 'key', x: 15 * T, y: 16 * T });

    // Save point
    const crystal = this.add.rectangle(15 * T, 26 * T, 8, 12, 0x44aaff).setDepth(4);
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

  private spawnGatekeeper(): void {
    const T = TILE_SIZE;
    const bossX = 15 * T;
    const bossY = 10 * T;

    const boss = this.physics.add.sprite(bossX, bossY, 'gatekeeper');
    boss.setDepth(10).setSize(24, 24).setOffset(4, 8);

    let bossHp = 15;
    const maxHp = 15;
    let bossInvuln = false;
    let introShown = false;
    let lastAttack = 0;

    // HP bar
    const hpBg = this.add.rectangle(bossX, bossY - 28, 40, 4, 0x333333).setDepth(20);
    const hpBar = this.add.rectangle(bossX, bossY - 28, 40, 4, COLORS.RED).setDepth(21);
    const nameText = this.add.text(bossX, bossY - 36, 'Gatekeeper 2000', {
      fontSize: '7px', fontFamily: 'monospace', color: '#00ff00',
    }).setOrigin(0.5).setDepth(20);

    this.startMusic('music_boss');

    this.time.addEvent({
      delay: 80, loop: true, callback: () => {
        if (bossHp <= 0) return;

        if (!introShown) {
          introShown = true;
          this.showDialogByKey('gatekeeper_intro');
          return;
        }

        const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, boss.x, boss.y);
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.sprite.x, this.player.sprite.y);

        // Movement - circular pattern + chase
        const time = this.time.now;
        boss.setVelocity(
          Math.cos(angle) * 25 + Math.sin(time / 800) * 40,
          Math.sin(angle) * 25 + Math.cos(time / 800) * 40
        );

        // Shoot lasers periodically
        if (time - lastAttack > 1500) {
          lastAttack = time;
          for (let i = 0; i < 4; i++) {
            const a = angle + (i - 1.5) * 0.3;
            const proj = this.physics.add.sprite(boss.x, boss.y, 'enemy_projectile');
            proj.setVelocity(Math.cos(a) * 100, Math.sin(a) * 100);
            proj.setDepth(12);
            this.time.delayedCall(3000, () => proj.destroy());
            this.physics.add.overlap(proj, this.player.sprite, () => {
              this.combat.dealDamage(this.player, 1, { x: proj.x, y: proj.y });
              proj.destroy();
            });
          }
        }

        // Update HP bar
        hpBg.setPosition(boss.x, boss.y - 28);
        hpBar.setPosition(boss.x - (1 - bossHp / maxHp) * 20, boss.y - 28);
        hpBar.setSize(40 * (bossHp / maxHp), 4);
        nameText.setPosition(boss.x, boss.y - 36);

        // Player attack check
        if (this.player.isAttacking && !bossInvuln) {
          const rect = this.player.getAttackRect();
          if (Phaser.Geom.Rectangle.Contains(rect, boss.x, boss.y)) {
            bossHp -= 1;
            bossInvuln = true;
            boss.setTint(0xff8888);
            this.time.delayedCall(400, () => { bossInvuln = false; boss.clearTint(); });

            if (bossHp <= 0) {
              this.defeatGatekeeper(boss, hpBg, hpBar, nameText);
            }
          }
        }

        // Contact damage
        if (dist < 20 && !this.player.invulnerable) {
          this.combat.dealDamage(this.player, 1, { x: boss.x, y: boss.y });
        }
      },
    });
  }

  private defeatGatekeeper(
    boss: Phaser.Physics.Arcade.Sprite,
    hpBg: Phaser.GameObjects.Rectangle,
    hpBar: Phaser.GameObjects.Rectangle,
    nameText: Phaser.GameObjects.Text,
  ): void {
    const T = TILE_SIZE;
    boss.setVelocity(0, 0);
    this.bossDefeated = true;
    this.quest.setFlag('gatekeeper_defeated');

    this.showDialogByKey('gatekeeper_defeat', () => {
      // Explosion effect
      for (let i = 0; i < 15; i++) {
        const p = this.add.rectangle(
          boss.x + (Math.random() - 0.5) * 40,
          boss.y + (Math.random() - 0.5) * 40,
          4, 4, [0x00ff00, 0xff0000, 0x0088ff][Math.floor(Math.random() * 3)]
        ).setDepth(30);
        this.tweens.add({
          targets: p, alpha: 0, scaleX: 3, scaleY: 3,
          duration: 500 + Math.random() * 500,
          onComplete: () => p.destroy(),
        });
      }

      boss.destroy();
      hpBg.destroy();
      hpBar.destroy();
      nameText.destroy();

      // Open portal
      this.openPortal();
      this.startMusic('music_dungeon');
    });
  }

  private openPortal(): void {
    const T = TILE_SIZE;
    this.portalOpen = true;

    const portal = this.add.sprite(15 * T, 4 * T, 'portal', 0).setDepth(8);
    if (!this.anims.exists('portal_spin')) {
      this.anims.create({
        key: 'portal_spin',
        frames: this.anims.generateFrameNumbers('portal', { start: 0, end: 1 }),
        frameRate: 4, repeat: -1,
      });
    }
    portal.anims.play('portal_spin');

    // Portal transition
    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y, portal.x, portal.y
        );
        if (dist < 20 && this.player.isKeyJustDown('e')) {
          this.playSfx('sfx_portal');
          this.showDialogByKey('portal_enter', () => {
            this.transitionTo(SCENES.DIGITAL, 240, 440);
          });
        }
      },
    });
  }

  protected onDialogComplete(npcKey: string, dialogKey: string): void {
    if (npcKey === 'doner_chef' && dialogKey === 'doner_chef') {
      // Start doner mini-game
      this.startDonerMiniGame();
    }
  }

  private startDonerMiniGame(): void {
    // Simple timing mini-game: press keys in sequence
    const ingredients = ['MEAT', 'SAUCE', 'SALAD', 'WRAP'];
    let currentStep = 0;
    const keyMap = ['J', 'K', 'L', 'E'];

    const overlay = this.add.rectangle(240, 240, 300, 200, 0x000000, 0.9).setDepth(2000).setScrollFactor(0);
    const title = this.add.text(240, 160, '🥙 DONER TIME! 🥙', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);

    const prompt = this.add.text(240, 200, `Press [${keyMap[0]}] to add ${ingredients[0]}!`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);

    const progress = this.add.text(240, 230, '[ ][ ][ ][ ]', {
      fontSize: '10px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);

    const timer = this.add.text(240, 260, 'Time: 10', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);

    let timeLeft = 10;
    const countdown = this.time.addEvent({
      delay: 1000, repeat: 9, callback: () => {
        timeLeft--;
        timer.setText(`Time: ${timeLeft}`);
        if (timeLeft <= 0 && currentStep < ingredients.length) {
          // Failed!
          cleanup();
          this.showDialogByKey('doner_fail');
        }
      },
    });

    const checkKey = (key: string) => {
      if (currentStep >= ingredients.length) return;
      if (key === keyMap[currentStep]) {
        currentStep++;
        const bars = ingredients.map((_, i) => i < currentStep ? '[✓]' : '[ ]').join('');
        progress.setText(bars);

        if (currentStep < ingredients.length) {
          prompt.setText(`Press [${keyMap[currentStep]}] to add ${ingredients[currentStep]}!`);
        } else {
          // Success!
          countdown.destroy();
          cleanup();
          this.quest.setFlag('quest_doner_done');
          this.player.hp = this.player.maxHp;
          this.showDialogByKey('doner_success');
        }
      }
    };

    this.input.keyboard?.on('keydown-J', () => checkKey('J'));
    this.input.keyboard?.on('keydown-K', () => checkKey('K'));
    this.input.keyboard?.on('keydown-L', () => checkKey('L'));
    this.input.keyboard?.on('keydown-E', () => checkKey('E'));

    const cleanup = () => {
      overlay.destroy();
      title.destroy();
      prompt.destroy();
      progress.destroy();
      timer.destroy();
    };
  }

  protected playMusic(): void {
    this.startMusic('music_dungeon');
  }
}
