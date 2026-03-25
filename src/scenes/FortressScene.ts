import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE, COLORS } from '../game/constants';

export class FortressScene extends BaseGameScene {
  constructor() {
    super(SCENES.FORTRESS);
    this.mapWidth = 480;
    this.mapHeight = 544;
    this.areaName = 'Fortress of Shreek';
  }

  buildMap(): void {
    const T = TILE_SIZE;
    const cols = 30, rows = 34;

    // Fortress floor
    this.fillFloor(cols, rows, 'tile_fortress');

    // Walls
    this.addWallRect(0, 0, cols, 2, 'tile_fortress_wall');
    this.addWallRect(0, (rows - 2) * T, cols, 2, 'tile_fortress_wall');
    this.addWallRect(0, 0, 2, rows, 'tile_fortress_wall');
    this.addWallRect((cols - 2) * T, 0, 2, rows, 'tile_fortress_wall');

    // Entrance (bottom)
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y > (rows - 3) * T) sprite.destroy();
      });
    }

    // Room structure - gauntlet layout
    // Room 1: bottom area (entry combat)
    this.addWallRect(4 * T, 26 * T, 22, 1, 'tile_fortress_wall');
    // Gap in middle
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && Math.abs(sprite.y - (26 * T + T / 2)) < 2) sprite.destroy();
      });
    }

    // Room 2: middle corridor
    this.addWallRect(4 * T, 18 * T, 9, 1, 'tile_fortress_wall');
    this.addWallRect(17 * T, 18 * T, 9, 1, 'tile_fortress_wall');

    // Room 3: pre-boss
    this.addWallRect(4 * T, 10 * T, 22, 1, 'tile_fortress_wall');
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && Math.abs(sprite.y - (10 * T + T / 2)) < 2) sprite.destroy();
      });
    }

    // Shreek portraits on walls
    const portraitPositions = [[5, 22], [24, 22], [5, 14], [24, 14], [5, 6], [24, 6]];
    for (const [px, py] of portraitPositions) {
      const portrait = this.add.rectangle(px * T, py * T, 12, 16, 0x5c8a2f).setDepth(3);
      // Derpy face
      this.add.rectangle(px * T - 2, py * T - 2, 2, 2, COLORS.WHITE).setDepth(4);
      this.add.rectangle(px * T + 2, py * T - 2, 2, 2, COLORS.WHITE).setDepth(4);
      this.add.rectangle(px * T, py * T + 3, 4, 2, COLORS.BLACK).setDepth(4);
    }

    // Torches along corridors
    const torchPos = [[3, 28], [26, 28], [3, 20], [26, 20], [3, 12], [26, 12], [3, 4], [26, 4]];
    for (const [tx, ty] of torchPos) {
      const torch = this.add.sprite(tx * T, ty * T, 'torch', 0).setDepth(5);
      if (this.anims.exists('torch_flicker')) {
        torch.anims.play('torch_flicker');
      }
    }

    // Slime moat visual in room 2
    for (let x = 5; x < 25; x++) {
      for (const y of [20, 24]) {
        const slime = this.add.rectangle(x * T + T / 2, y * T + T / 2, T, T, 0x44aa33, 0.3).setDepth(0);
      }
    }

    // Transitions
    this.addTransition(SCENES.SEWERS, 13 * T, (rows - 1) * T, 4 * T, T, 240, 40);
  }

  populate(): void {
    const T = TILE_SIZE;

    // Entrance text
    this.time.delayedCall(500, () => {
      this.showDialogByKey('fortress_entrance');
    });

    // Room 1 enemies (locked combat)
    this.spawnEnemy(8 * T, 30 * T, 'firewall_skeleton');
    this.spawnEnemy(22 * T, 30 * T, 'firewall_skeleton');
    this.spawnEnemy(15 * T, 28 * T, 'obamasphere_laser');

    // Room 2 enemies
    this.spawnEnemy(7 * T, 22 * T, 'obamasphere');
    this.spawnEnemy(23 * T, 22 * T, 'obamasphere');
    this.spawnEnemy(10 * T, 20 * T, 'banana_ghost');
    this.spawnEnemy(20 * T, 20 * T, 'banana_ghost');
    this.spawnEnemy(15 * T, 22 * T, 'obamasphere_laser');

    // Room 3 enemies
    this.spawnEnemy(8 * T, 14 * T, 'firewall_skeleton');
    this.spawnEnemy(22 * T, 14 * T, 'firewall_skeleton');
    this.spawnEnemy(12 * T, 12 * T, 'glitch_crab');
    this.spawnEnemy(18 * T, 12 * T, 'glitch_crab');

    // Boss room: Shreek
    this.spawnShreek();

    // Pickups throughout
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 4 * T, y: 28 * T });
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 26 * T, y: 28 * T });
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 15 * T, y: 20 * T });
    this.spawnPickup({ type: 'ammo', spriteKey: 'ammo_pickup', x: 4 * T, y: 14 * T });
    this.spawnPickup({ type: 'ammo', spriteKey: 'ammo_pickup', x: 26 * T, y: 14 * T });

    // Heart container hidden
    this.spawnPickup({
      type: 'item', itemKey: 'heart_container', spriteKey: 'heart_pickup',
      x: 27 * T, y: 8 * T,
    });

    // Save point before boss
    const crystal = this.add.rectangle(15 * T, 9 * T, 8, 12, 0x44aaff).setDepth(4);
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

    // Pick the Pickle final appearance
    this.spawnNPC({
      key: 'pickle_final', spriteKey: 'pickle',
      x: 25 * T, y: 9 * T,
      dialogKey: 'pickle_farewell',
    });
  }

  private spawnShreek(): void {
    const T = TILE_SIZE;
    const bossX = 15 * T;
    const bossY = 5 * T;

    const boss = this.physics.add.sprite(bossX, bossY, 'shreek', 0);
    boss.setDepth(10).setSize(32, 36).setOffset(8, 8);

    let bossHp = 30;
    const maxHp = 30;
    let phase = 0; // 0=waiting, 1=club, 2=spit, 3=glitch
    let bossInvuln = false;
    let introShown = false;
    let lastAttack = 0;

    const hpBg = this.add.rectangle(bossX, bossY - 34, 48, 5, 0x333333).setDepth(20);
    const hpBar = this.add.rectangle(bossX, bossY - 34, 48, 5, COLORS.RED).setDepth(21);
    const nameText = this.add.text(bossX, bossY - 42, 'SHREEK', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ff4444',
    }).setOrigin(0.5).setDepth(20);

    this.time.addEvent({
      delay: 80, loop: true, callback: () => {
        if (bossHp <= 0) return;

        const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, boss.x, boss.y);

        // Trigger intro
        if (!introShown && dist < 80) {
          introShown = true;
          this.startMusic('music_boss');
          this.showDialogByKey('shreek_intro', () => { phase = 1; });
          return;
        }
        if (phase === 0) return;

        // Phase transitions
        const hpPercent = bossHp / maxHp;
        if (hpPercent < 0.33 && phase < 3) {
          phase = 3;
          boss.setFrame(2); // glitch sprite
          this.showDialogByKey('shreek_phase3');
        } else if (hpPercent < 0.66 && phase < 2) {
          phase = 2;
          boss.setFrame(1); // spit sprite
          this.showDialogByKey('shreek_phase2');
        }

        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.sprite.x, this.player.sprite.y);
        const time = this.time.now;

        // Movement
        const speed = phase === 3 ? 50 : phase === 2 ? 35 : 25;
        boss.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        // Attacks
        if (time - lastAttack > (phase === 3 ? 1000 : 2000)) {
          lastAttack = time;

          if (phase === 1 && dist < 40) {
            // Club slam
            this.cameras.main.shake(200, 0.015);
            if (dist < 30) {
              this.combat.dealDamage(this.player, 2, { x: boss.x, y: boss.y }, 200);
            }
          } else if (phase === 2) {
            // Spit projectiles
            for (let i = 0; i < 3; i++) {
              const a = angle + (i - 1) * 0.4;
              const proj = this.physics.add.sprite(boss.x, boss.y, 'enemy_projectile');
              proj.setTint(0x44aa33);
              proj.setVelocity(Math.cos(a) * 100, Math.sin(a) * 100);
              proj.setDepth(12);
              this.time.delayedCall(3000, () => proj.destroy());
              this.physics.add.overlap(proj, this.player.sprite, () => {
                this.combat.dealDamage(this.player, 1, { x: proj.x, y: proj.y });
                proj.destroy();
              });
            }
          } else if (phase === 3) {
            // Glitch rage: 8-directional spray
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const proj = this.physics.add.sprite(boss.x, boss.y, 'enemy_projectile');
              proj.setTint(0xff00ff);
              proj.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
              proj.setDepth(12);
              this.time.delayedCall(2500, () => proj.destroy());
              this.physics.add.overlap(proj, this.player.sprite, () => {
                this.combat.dealDamage(this.player, 1, { x: proj.x, y: proj.y });
                proj.destroy();
              });
            }
            // Screen glitch
            this.cameras.main.shake(100, 0.01);
          }
        }

        // HP bar
        hpBg.setPosition(boss.x, boss.y - 34);
        hpBar.setPosition(boss.x - (1 - bossHp / maxHp) * 24, boss.y - 34);
        hpBar.setSize(48 * (bossHp / maxHp), 5);
        nameText.setPosition(boss.x, boss.y - 42);

        // Player attacks
        if (this.player.isAttacking && !bossInvuln) {
          const rect = this.player.getAttackRect();
          const bossBounds = new Phaser.Geom.Rectangle(boss.x - 16, boss.y - 18, 32, 36);
          if (Phaser.Geom.Rectangle.Overlaps(rect, bossBounds)) {
            bossHp -= 1;
            bossInvuln = true;
            boss.setTint(0xff4444);
            this.time.delayedCall(300, () => { bossInvuln = false; boss.clearTint(); });

            if (bossHp <= 0) {
              this.defeatShreek(boss, hpBg, hpBar, nameText);
            }
          }
        }

        // Contact damage
        if (dist < 24 && !this.player.invulnerable) {
          this.combat.dealDamage(this.player, 1, { x: boss.x, y: boss.y });
        }
      },
    });
  }

  private defeatShreek(
    boss: Phaser.Physics.Arcade.Sprite,
    hpBg: Phaser.GameObjects.Rectangle,
    hpBar: Phaser.GameObjects.Rectangle,
    nameText: Phaser.GameObjects.Text,
  ): void {
    boss.setVelocity(0, 0);
    this.quest.setFlag('shreek_defeated');

    this.showDialogByKey('shreek_defeat', () => {
      // Dissolution effect
      for (let i = 0; i < 30; i++) {
        const p = this.add.rectangle(
          boss.x + (Math.random() - 0.5) * 60,
          boss.y + (Math.random() - 0.5) * 60,
          4, 4, [0x5c8a2f, 0xff00ff, 0x00ffff][Math.floor(Math.random() * 3)]
        ).setDepth(30);
        this.tweens.add({
          targets: p, alpha: 0, y: p.y - 40, scaleX: 0, scaleY: 0,
          duration: 800 + Math.random() * 600,
          onComplete: () => p.destroy(),
        });
      }

      this.time.delayedCall(1000, () => {
        boss.destroy();
        hpBg.destroy();
        hpBar.destroy();
        nameText.destroy();

        this.persistState();
        this.stopMusic();
        this.cameras.main.fadeOut(1000);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.cleanup();
          this.scene.start(SCENES.FINALE);
        });
      });
    });
  }

  protected playMusic(): void {
    this.startMusic('music_dungeon');
  }
}
