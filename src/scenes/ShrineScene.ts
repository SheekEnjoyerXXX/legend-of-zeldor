import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE, COLORS } from '../game/constants';
import { DIALOG } from '../data/dialog';

export class ShrineScene extends BaseGameScene {
  private bossDefeated = false;
  private swordClaimed = false;
  private pushBlock?: Phaser.Physics.Arcade.Sprite;

  constructor() {
    super(SCENES.SHRINE);
    this.mapWidth = 480;
    this.mapHeight = 480;
    this.areaName = 'Ancient Shrine';
  }

  buildMap(): void {
    const T = TILE_SIZE;
    const cols = 30, rows = 30;

    // Floor
    this.fillFloor(cols, rows, 'tile_shrine');

    // Outer walls
    this.addWallRect(0, 0, cols, 2, 'tile_wall');
    this.addWallRect(0, (rows - 2) * T, cols, 2, 'tile_wall');
    this.addWallRect(0, 0, 2, rows, 'tile_wall');
    this.addWallRect((cols - 2) * T, 0, 2, rows, 'tile_wall');

    // Entrance gap at bottom
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y > (rows - 3) * T) {
          sprite.destroy();
        }
      });
    }

    // Room dividers - create corridors
    // Horizontal divider at row 10
    this.addWallRect(2 * T, 10 * T, 10, 1, 'tile_wall');
    this.addWallRect(18 * T, 10 * T, 10, 1, 'tile_wall');

    // Horizontal divider at row 20
    this.addWallRect(2 * T, 20 * T, 12, 1, 'tile_wall');
    this.addWallRect(18 * T, 20 * T, 10, 1, 'tile_wall');

    // Torch decorations
    const torchPositions = [[3, 3], [26, 3], [3, 26], [26, 26], [14, 5], [15, 5], [14, 15], [15, 15]];
    for (const [tx, ty] of torchPositions) {
      const torch = this.add.sprite(tx * T, ty * T, 'torch', 0).setDepth(5);
      if (this.anims.exists('torch_flicker')) {
        torch.anims.play('torch_flicker');
      } else {
        this.anims.create({
          key: 'torch_flicker',
          frames: this.anims.generateFrameNumbers('torch', { start: 0, end: 1 }),
          frameRate: 4, repeat: -1,
        });
        torch.anims.play('torch_flicker');
      }
    }

    // Pushable block puzzle in first room
    this.pushBlock = this.physics.add.sprite(14 * T, 16 * T, 'pushblock');
    this.pushBlock.setImmovable(true).setDepth(4);
    this.pushBlock.setSize(T, T);
    this.physics.add.collider(this.player?.sprite || this.pushBlock, this.pushBlock);

    // Pressure plate
    const plate = this.add.rectangle(14 * T, 18 * T, T - 2, T - 2, 0x888833).setDepth(1);
    let plateTriggered = false;

    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (plateTriggered) return;
        if (this.pushBlock && Math.abs(this.pushBlock.x - plate.x) < 8 && Math.abs(this.pushBlock.y - plate.y) < 8) {
          plateTriggered = true;
          plate.setFillStyle(0x33aa33);
          // Open path to boss room
          this.showDialogByKey('shrine_plaque');
        }
      },
    });

    // Transitions
    this.addTransition(SCENES.VILLAGE, 13 * T, (rows - 2) * T, 4 * T, 2 * T, 240, 20);

    // Entrance plaque
    const plaqueZone = this.add.zone(15 * T, 26 * T, 3 * T, 2 * T);
    this.physics.add.existing(plaqueZone, true);
    let plaqueDone = false;
    this.physics.add.overlap(this.add.zone(0, 0, 0, 0), plaqueZone, () => {}); // just setup

    this.time.delayedCall(500, () => {
      if (!plaqueDone) {
        plaqueDone = true;
        this.showDialogByKey('shrine_entrance');
      }
    });
  }

  populate(): void {
    const T = TILE_SIZE;

    // Enemies in shrine
    this.spawnEnemy(6 * T, 6 * T, 'gobdwarf');
    this.spawnEnemy(22 * T, 6 * T, 'gobdwarf');
    this.spawnEnemy(8 * T, 14 * T, 'slime_modem');
    this.spawnEnemy(22 * T, 14 * T, 'slime_modem');
    this.spawnEnemy(6 * T, 24 * T, 'gobdwarf');

    // Boss room: Stone Idiot Sentinel
    if (!this.quest.getFlag('shrine_boss_defeated')) {
      this.spawnBoss();
    } else {
      // Sword pedestal available
      this.createSwordPedestal();
    }

    // Pickups
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 4 * T, y: 8 * T });
    this.spawnPickup({ type: 'key', spriteKey: 'key', x: 25 * T, y: 8 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 10 * T, y: 22 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 20 * T, y: 22 * T });
  }

  private spawnBoss(): void {
    const T = TILE_SIZE;
    const bossX = 15 * T;
    const bossY = 5 * T;

    // Stone Idiot Sentinel - custom boss using a sprite
    const boss = this.physics.add.sprite(bossX, bossY, 'stone_sentinel');
    boss.setImmovable(false).setDepth(10);
    boss.setSize(24, 24).setOffset(4, 8);

    let bossHp = 10;
    const maxHp = 10;
    let bossPhase: 'idle' | 'intro' | 'fighting' | 'dead' = 'idle';
    let lastAttackTime = 0;
    let bossInvuln = false;

    // HP bar
    const hpBg = this.add.rectangle(bossX, bossY - 24, 32, 4, 0x333333).setDepth(20);
    const hpBar = this.add.rectangle(bossX, bossY - 24, 32, 4, COLORS.RED).setDepth(21);

    // Trigger zone
    const triggerZone = this.add.zone(15 * T, 8 * T, 8 * T, 4 * T);
    this.physics.add.existing(triggerZone, true);
    let introShown = false;

    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (bossPhase === 'dead') return;

        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y, boss.x, boss.y
        );

        // Trigger intro
        if (!introShown && dist < 80) {
          introShown = true;
          bossPhase = 'intro';
          this.showDialogByKey('stone_sentinel_intro', () => {
            bossPhase = 'fighting';
          });
          return;
        }

        if (bossPhase !== 'fighting') return;

        // Update HP bar
        hpBg.setPosition(boss.x, boss.y - 24);
        hpBar.setPosition(boss.x - (1 - bossHp / maxHp) * 16, boss.y - 24);
        hpBar.setSize(32 * (bossHp / maxHp), 4);

        // Boss AI: slow chase + periodic slam
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.sprite.x, this.player.sprite.y);
        boss.setVelocity(Math.cos(angle) * 30, Math.sin(angle) * 30);

        const now = this.time.now;
        if (dist < 40 && now - lastAttackTime > 2000) {
          lastAttackTime = now;
          // Slam attack
          boss.setVelocity(0, 0);
          this.cameras.main.shake(200, 0.01);
          // Damage player if close
          if (dist < 25) {
            this.combat.dealDamage(this.player, 2, { x: boss.x, y: boss.y });
          }
        }

        // Check if player attacks boss
        if (this.player.isAttacking && !bossInvuln) {
          const rect = this.player.getAttackRect();
          if (Phaser.Geom.Rectangle.Contains(rect, boss.x, boss.y)) {
            bossHp -= 1;
            bossInvuln = true;
            boss.setTint(0xff8888);
            this.time.delayedCall(500, () => { bossInvuln = false; boss.clearTint(); });

            if (bossHp <= 0) {
              bossPhase = 'dead';
              boss.setVelocity(0, 0);
              this.showDialogByKey('stone_sentinel_defeat', () => {
                this.quest.setFlag('shrine_boss_defeated');
                boss.destroy();
                hpBg.destroy();
                hpBar.destroy();
                this.createSwordPedestal();
              });
            }
          }
        }

        // Contact damage
        if (dist < 16 && !this.player.invulnerable) {
          this.combat.dealDamage(this.player, 1, { x: boss.x, y: boss.y });
        }
      },
    });
  }

  private createSwordPedestal(): void {
    const T = TILE_SIZE;
    if (this.swordClaimed || this.saveData.hasLegendSword) return;

    const sword = this.add.image(15 * T, 4 * T, 'legend_sword').setDepth(10);
    // Glow effect
    this.tweens.add({
      targets: sword, alpha: 0.7, duration: 800, yoyo: true, repeat: -1,
    });

    // Interact to claim
    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (this.swordClaimed) return;
        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y, sword.x, sword.y
        );
        if (dist < 20 && this.player.isKeyJustDown('e')) {
          this.swordClaimed = true;
          sword.destroy();
          this.playSfx('sfx_pickup');
          this.inventory.addItem('legend_sword');
          this.quest.setFlag('has_legend_sword');
          this.showDialogByKey('legend_sword_get');
        }
      },
    });
  }

  protected playMusic(): void {
    this.startMusic('music_dungeon');
  }
}
