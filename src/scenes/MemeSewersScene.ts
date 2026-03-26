import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE } from '../game/constants';

export class MemeSewersScene extends BaseGameScene {
  private bossDefeated = false;
  private toxicZoneObjects: Phaser.GameObjects.Zone[] = [];

  constructor() {
    super(SCENES.SEWERS);
    this.mapWidth = 480;
    this.mapHeight = 480;
    this.areaName = 'The Meme Sewers';
  }

  buildMap(): void {
    const T = TILE_SIZE;
    const cols = 30, rows = 30;

    // Sewer floor
    this.fillFloor(cols, rows, 'tile_sewer');

    // Border walls
    this.addWallRect(0, 0, cols, 2, 'tile_sewer_wall');
    this.addWallRect(0, (rows - 2) * T, cols, 2, 'tile_sewer_wall');
    this.addWallRect(0, 0, 2, rows, 'tile_sewer_wall');
    this.addWallRect((cols - 2) * T, 0, 2, rows, 'tile_sewer_wall');

    // Entrance from digital (bottom)
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y > (rows - 3) * T) sprite.destroy();
      });
    }

    // Exit to fortress (top) - locked until boss defeated
    // Will open after boss

    // Internal sewer corridors
    // Horizontal pipes (walls)
    this.addWallRect(3 * T, 8 * T, 8, 1, 'tile_sewer_wall');
    this.addWallRect(15 * T, 8 * T, 10, 1, 'tile_sewer_wall');
    this.addWallRect(5 * T, 15 * T, 6, 1, 'tile_sewer_wall');
    this.addWallRect(19 * T, 15 * T, 6, 1, 'tile_sewer_wall');
    this.addWallRect(8 * T, 22 * T, 14, 1, 'tile_sewer_wall');

    // Toxic pools (damage zones)
    const toxicZones = [
      [4, 10, 3, 2], [22, 10, 4, 2], [12, 17, 6, 2], [4, 24, 4, 2], [22, 24, 4, 2],
    ];
    for (const [tx, ty, tw, th] of toxicZones) {
      for (let r = 0; r < th; r++) {
        for (let c = 0; c < tw; c++) {
          const toxTile = this.add.rectangle(
            (tx + c) * T + T / 2, (ty + r) * T + T / 2,
            T, T, 0x33aa22, 0.5
          ).setDepth(1);
          this.tweens.add({
            targets: toxTile, alpha: 0.2, duration: 1000 + Math.random() * 500,
            yoyo: true, repeat: -1,
          });
        }
      }
      // Damage zone - overlap registered in populate() after player exists
      const zone = this.add.zone(
        (tx + tw / 2) * T, (ty + th / 2) * T, tw * T, th * T
      );
      this.physics.add.existing(zone, true);
      this.toxicZoneObjects.push(zone);
    }

    // Garbage pixel decorations
    for (let i = 0; i < 20; i++) {
      const g = this.add.rectangle(
        3 * T + Math.random() * (cols - 6) * T,
        3 * T + Math.random() * (rows - 6) * T,
        2 + Math.random() * 4, 2 + Math.random() * 4,
        [0x888888, 0xcccc00, 0x884400, 0xff4488][Math.floor(Math.random() * 4)]
      ).setDepth(0).setAlpha(0.4);
    }

    // Boss arena in top area
    this.addWallRect(6 * T, 3 * T, 1, 4, 'tile_sewer_wall');
    this.addWallRect(23 * T, 3 * T, 1, 4, 'tile_sewer_wall');

    // Transitions
    this.addTransition(SCENES.DIGITAL, 13 * T, (rows - 2) * T, 4 * T, 2 * T, 240, 40);
  }

  populate(): void {
    const T = TILE_SIZE;

    // Mark reaching sewers for story progression
    this.quest.setFlag('reached_sewers');

    // Register toxic zone overlaps now that player exists
    for (const zone of this.toxicZoneObjects) {
      this.physics.add.overlap(this.player.sprite, zone, () => {
        if (!this.player.invulnerable) {
          this.combat.dealDamage(this.player, 1, { x: zone.x, y: zone.y });
        }
      });
    }

    // Entrance dialog
    this.time.delayedCall(500, () => {
      this.showDialogByKey('sewer_entrance');
    });

    // Enemies - dense population
    this.spawnEnemy(6 * T, 6 * T, 'slime_modem');
    this.spawnEnemy(24 * T, 6 * T, 'slime_modem');
    this.spawnEnemy(10 * T, 12 * T, 'obamasphere');
    this.spawnEnemy(20 * T, 12 * T, 'obamasphere');
    this.spawnEnemy(6 * T, 18 * T, 'pickle_thief');
    this.spawnEnemy(24 * T, 18 * T, 'pickle_thief');
    this.spawnEnemy(15 * T, 20 * T, 'obamasphere_laser');
    this.spawnEnemy(8 * T, 26 * T, 'glitch_crab');
    this.spawnEnemy(22 * T, 26 * T, 'glitch_crab');
    this.spawnEnemy(15 * T, 26 * T, 'portal_rat');

    // Boss
    if (!this.quest.getFlag('sewer_boss_defeated')) {
      this.spawnKingSlop();
    } else {
      this.openExitToFortress();
      // Blaster if not already obtained
      if (!this.saveData.hasBlaster) {
        this.spawnPickup({
          type: 'item', itemKey: 'blaster', spriteKey: 'blaster_item',
          x: 15 * T, y: 4 * T,
        });
      }
    }

    // Pickups
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 4 * T, y: 14 * T });
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 26 * T, y: 14 * T });
    this.spawnPickup({ type: 'ammo', spriteKey: 'ammo_pickup', x: 15 * T, y: 12 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 8 * T, y: 10 * T });

    // Toilet Plunger of Destiny - deep in the sewers
    this.spawnPickup({
      type: 'item', itemKey: 'toilet_plunger', spriteKey: 'torch',
      x: 26 * T, y: 26 * T,
    });

    // Save point
    this.spawnSaveCrystal(15 * T, 24 * T);
  }

  private spawnKingSlop(): void {
    const T = TILE_SIZE;
    const bossX = 15 * T;
    const bossY = 5 * T;

    const boss = this.physics.add.sprite(bossX, bossY, 'king_slop');
    boss.setDepth(10).setSize(24, 24).setOffset(4, 4);

    let bossHp = 20;
    const maxHp = 20;
    let bossInvuln = false;
    let introShown = false;
    let lastSpawn = 0;
    let lastSpit = 0;

    const hpBg = this.add.rectangle(bossX, bossY - 24, 40, 4, 0x333333).setDepth(20);
    const hpBar = this.add.rectangle(bossX, bossY - 24, 40, 4, 0x44aa33).setDepth(21);
    const nameText = this.add.text(bossX, bossY - 32, 'King Slop.exe', {
      fontSize: '7px', fontFamily: 'monospace', color: '#44ff44',
    }).setOrigin(0.5).setDepth(20);

    this.time.addEvent({
      delay: 80, loop: true, callback: () => {
        if (bossHp <= 0) return;

        const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, boss.x, boss.y);

        if (!introShown && dist < 100) {
          introShown = true;
          this.startMusic('music_boss');
          this.showDialogByKey('king_slop_intro');
          return;
        }

        if (!introShown) return;

        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.sprite.x, this.player.sprite.y);
        const time = this.time.now;

        // Slow movement
        boss.setVelocity(Math.cos(angle) * 20, Math.sin(angle) * 20);

        // Area denial: spit projectiles in circle
        if (time - lastSpit > 2500) {
          lastSpit = time;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const proj = this.physics.add.sprite(boss.x, boss.y, 'enemy_projectile');
            proj.setTint(0x44aa33);
            proj.setVelocity(Math.cos(a) * 80, Math.sin(a) * 80);
            proj.setDepth(12);
            this.time.delayedCall(3000, () => proj.destroy());
            this.physics.add.overlap(proj, this.player.sprite, () => {
              this.combat.dealDamage(this.player, 1, { x: proj.x, y: proj.y });
              proj.destroy();
            });
          }
        }

        // Spawn mini slimes
        if (time - lastSpawn > 5000 && bossHp < maxHp * 0.6) {
          lastSpawn = time;
          const sx = boss.x + (Math.random() - 0.5) * 40;
          const sy = boss.y + (Math.random() - 0.5) * 40;
          this.spawnEnemy(sx, sy, 'slime_modem');
        }

        // Update HP bar
        hpBg.setPosition(boss.x, boss.y - 24);
        hpBar.setPosition(boss.x - (1 - bossHp / maxHp) * 20, boss.y - 24);
        hpBar.setSize(40 * (bossHp / maxHp), 4);
        nameText.setPosition(boss.x, boss.y - 32);

        // Player melee
        if (this.player.isAttacking && !bossInvuln) {
          const rect = this.player.getAttackRect();
          if (Phaser.Geom.Rectangle.Contains(rect, boss.x, boss.y)) {
            bossHp -= 1;
            bossInvuln = true;
            boss.setTint(0xff8888);
            this.time.delayedCall(400, () => { bossInvuln = false; boss.clearTint(); });

            if (bossHp <= 0) {
              this.defeatKingSlop(boss, hpBg, hpBar, nameText);
            }
          }
        }

        // Contact damage
        if (dist < 20 && !this.player.invulnerable) {
          this.combat.dealDamage(this.player, 2, { x: boss.x, y: boss.y });
        }
      },
    });
  }

  private defeatKingSlop(
    boss: Phaser.Physics.Arcade.Sprite,
    hpBg: Phaser.GameObjects.Rectangle,
    hpBar: Phaser.GameObjects.Rectangle,
    nameText: Phaser.GameObjects.Text,
  ): void {
    const T = TILE_SIZE;
    boss.setVelocity(0, 0);
    this.quest.setFlag('sewer_boss_defeated');

    this.showDialogByKey('king_slop_defeat', () => {
      for (let i = 0; i < 20; i++) {
        const p = this.add.rectangle(
          boss.x + (Math.random() - 0.5) * 50,
          boss.y + (Math.random() - 0.5) * 50,
          5, 5, 0x44aa33
        ).setDepth(30);
        this.tweens.add({
          targets: p, alpha: 0, y: p.y - 30, duration: 600 + Math.random() * 400,
          onComplete: () => p.destroy(),
        });
      }

      boss.destroy();
      hpBg.destroy();
      hpBar.destroy();
      nameText.destroy();

      // Drop blaster
      if (!this.inventory.getState().hasBlaster) {
        this.showDialogByKey('blaster_get', () => {
          this.inventory.addItem('blaster');
          this.inventory.addItem('ammo');
          this.inventory.addItem('ammo');
          this.inventory.addItem('ammo');
        });
      }

      this.openExitToFortress();
      this.startMusic('music_dungeon');
    });
  }

  private openExitToFortress(): void {
    const T = TILE_SIZE;
    // Open top exit
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y < 2 * T) sprite.destroy();
      });
    }
    this.addTransition(SCENES.FORTRESS, 13 * T, 0, 4 * T, 2 * T, 240, 440);
  }

  protected playMusic(): void {
    this.startMusic('music_dungeon');

    // Dripping toxic particles from ceiling
    this.time.addEvent({
      delay: 800, loop: true, callback: () => {
        const dx = 3 * TILE_SIZE + Math.random() * 24 * TILE_SIZE;
        const drop = this.add.rectangle(dx, 2 * TILE_SIZE, 2, 2, 0x44ff44, 0.7).setDepth(15);
        this.tweens.add({
          targets: drop, y: drop.y + 40 + Math.random() * 60, alpha: 0,
          duration: 800, ease: 'Quad.easeIn',
          onComplete: () => drop.destroy(),
        });
      },
    });
  }
}
