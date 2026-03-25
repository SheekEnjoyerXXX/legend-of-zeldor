import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE } from '../game/constants';
import { DIALOG } from '../data/dialog';

export class VillageScene extends BaseGameScene {
  private chickensChased = 0;
  private chickenSprites: Phaser.Physics.Arcade.Sprite[] = [];

  constructor() {
    super(SCENES.VILLAGE);
    this.mapWidth = 480;
    this.mapHeight = 400;
    this.areaName = 'Village of Mudfork';
  }

  buildMap(): void {
    const T = TILE_SIZE;

    // Floor: grass everywhere
    this.fillFloor(30, 25, 'tile_grass');

    // Dirt paths
    for (let x = 6; x < 24; x++) {
      this.add.image(x * T + T / 2, 12 * T + T / 2, 'tile_dirt').setDepth(0);
      this.add.image(x * T + T / 2, 13 * T + T / 2, 'tile_dirt').setDepth(0);
    }
    for (let y = 5; y < 20; y++) {
      this.add.image(14 * T + T / 2, y * T + T / 2, 'tile_dirt').setDepth(0);
      this.add.image(15 * T + T / 2, y * T + T / 2, 'tile_dirt').setDepth(0);
    }

    // Border walls
    this.addWallRect(0, 0, 30, 1); // top
    this.addWallRect(0, 24 * T, 30, 1); // bottom
    this.addWallRect(0, 0, 1, 25); // left
    this.addWallRect(29 * T, 0, 1, 25); // right

    // Gap in top wall for exit to shrine
    // Remove some walls, add transition
    for (let x = 13; x <= 16; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y < T) {
          sprite.destroy();
        }
      });
    }

    // Gap in right wall for exit to fields
    for (let y = 11; y <= 14; y++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (sprite.x > 28 * T && Math.abs(sprite.y - (y * T + T / 2)) < 2) {
          sprite.destroy();
        }
      });
    }

    // Huts
    this.buildHut(3, 3, 4, 3, 'Elder\'s Hut');
    this.buildHut(20, 3, 4, 3, 'Kluk\'s Farm');
    this.buildHut(3, 17, 4, 3, 'Yorb\'s Shop');
    this.buildHut(20, 17, 3, 3, 'Empty Hut');

    // Trees
    const treePositions = [
      [1.5, 6], [1.5, 10], [1.5, 15], [28, 6], [28, 10], [28, 18],
      [8, 2], [11, 2], [18, 2], [8, 23], [22, 23],
    ];
    for (const [tx, ty] of treePositions) {
      this.add.image(tx * T, ty * T, 'tree').setDepth(5);
      const treeWall = this.walls.create(tx * T, ty * T + 8, 'tile_wall') as Phaser.Physics.Arcade.Sprite;
      treeWall.setVisible(false).setSize(12, 8).refreshBody();
    }

    // Pots (smashable)
    this.addPots([[10, 8], [11, 8], [10, 9], [18, 8], [19, 8]]);

    // Save crystal near village center
    const crystal = this.add.rectangle(15 * T, 10 * T, 8, 12, 0x44aaff).setDepth(4);
    this.tweens.add({ targets: crystal, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });
    // Save on interact near crystal
    this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        if (!this.dialog.active && !this.isPaused) {
          const dist = Phaser.Math.Distance.Between(
            this.player.sprite.x, this.player.sprite.y, 15 * T, 10 * T
          );
          if (dist < 20 && this.player.isKeyJustDown('e')) {
            this.saveCheckpoint(15 * T, 10 * T + 20);
          }
        }
      },
    });

    // Transitions
    this.addTransition(SCENES.SHRINE, 13 * T, 0, 4 * T, T, 240, 380);
    this.addTransition(SCENES.FIELDS, 29 * T, 11 * T, T, 4 * T, 20, 200);
  }

  private buildHut(x: number, y: number, w: number, h: number, _name: string): void {
    const T = TILE_SIZE;
    // Walls
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (row === h - 1 && col === Math.floor(w / 2)) {
          // Door
          this.add.image((x + col) * T + T / 2, (y + row) * T + T / 2, 'tile_door').setDepth(2);
        } else {
          const wall = this.walls.create(
            (x + col) * T + T / 2, (y + row) * T + T / 2, 'tile_hut'
          ) as Phaser.Physics.Arcade.Sprite;
          wall.setImmovable(true).setDepth(2).refreshBody();
        }
      }
    }
    // Roof visual
    for (let col = -1; col <= w; col++) {
      const roofTile = this.add.rectangle(
        (x + col) * T + T / 2, (y - 1) * T + T / 2,
        T, T, 0x884422
      ).setDepth(3);
    }
  }

  private addPots(positions: number[][]): void {
    for (const [px, py] of positions) {
      const T = TILE_SIZE;
      const potSprite = this.physics.add.sprite(px * T + T / 2, py * T + T / 2, 'pot');
      potSprite.setImmovable(true).setDepth(4);
      potSprite.setSize(12, 12);

      // Make smashable by attack
      this.time.addEvent({
        delay: 100, loop: true, callback: () => {
          if (this.player.isAttacking && potSprite.active) {
            const rect = this.player.getAttackRect();
            if (Phaser.Geom.Rectangle.Contains(rect, potSprite.x, potSprite.y)) {
              this.smashPot(potSprite);
            }
          }
        },
      });
    }
  }

  private smashPot(pot: Phaser.Physics.Arcade.Sprite): void {
    // Particle effect
    for (let i = 0; i < 5; i++) {
      const p = this.add.rectangle(
        pot.x + (Math.random() - 0.5) * 10,
        pot.y + (Math.random() - 0.5) * 10,
        3, 3, 0x996644
      ).setDepth(12);
      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 30,
        y: p.y - 10 - Math.random() * 20,
        alpha: 0, duration: 400,
        onComplete: () => p.destroy(),
      });
    }
    pot.destroy();

    // Random drop
    if (Math.random() < 0.3) {
      const pickup = this.spawnPickup({
        type: Math.random() < 0.5 ? 'heart' : 'zlorp',
        spriteKey: Math.random() < 0.5 ? 'heart_pickup' : 'zlorp',
        x: pot.x, y: pot.y,
      });
      this.setupPickupOverlap(pickup);
    }
  }

  populate(): void {
    const T = TILE_SIZE;

    // NPCs
    this.spawnNPC({
      key: 'elder', spriteKey: 'villager_elder',
      x: 5 * T, y: 7 * T,
      dialogKey: 'village_elder',
    });

    this.spawnNPC({
      key: 'woman', spriteKey: 'villager2',
      x: 12 * T, y: 15 * T,
      dialogKey: 'village_woman',
    });

    this.spawnNPC({
      key: 'guard', spriteKey: 'villager3',
      x: 22 * T, y: 12 * T,
      dialogKey: 'village_guard',
    });

    this.spawnNPC({
      key: 'chicken_man', spriteKey: 'villager1',
      x: 22 * T, y: 7 * T,
      dialogKey: 'village_chicken_man',
      dialogKeyAfter: 'village_chicken_done',
      questFlag: 'quest_chicken_done',
    });

    this.spawnNPC({
      key: 'kid', spriteKey: 'villager2',
      x: 8 * T, y: 13 * T,
      dialogKey: 'village_kid',
    });

    this.spawnNPC({
      key: 'merchant', spriteKey: 'merchant',
      x: 5 * T, y: 21 * T,
      dialogKey: 'village_merchant',
    });

    // Chickens for the quest
    if (!this.quest.getFlag('quest_chicken_done')) {
      this.spawnChickens();
    }

    // Enemies - a few gobdwarfs near the edges
    this.spawnEnemy(26 * T, 5 * T, 'gobdwarf');
    this.spawnEnemy(26 * T, 20 * T, 'gobdwarf');

    // Pick the Pickle first appearance
    if (!this.quest.getFlag('met_pickle')) {
      this.spawnNPC({
        key: 'pickle_first', spriteKey: 'pickle',
        x: 10 * T, y: 10 * T,
        dialogKey: 'pickle_appear',
      });
    }

    // Heart pickup near start
    this.spawnPickup({
      type: 'heart', spriteKey: 'heart_pickup',
      x: 16 * T, y: 15 * T,
    });
  }

  private spawnChickens(): void {
    const T = TILE_SIZE;
    const chickenPositions = [[23, 5], [25, 8], [21, 10], [24, 6]];

    for (const [cx, cy] of chickenPositions) {
      const chicken = this.physics.add.sprite(cx * T, cy * T, 'linkler', 0);
      chicken.setTint(0xffffff).setScale(0.6);
      chicken.setDepth(6);

      // Chicken wander behavior
      let timer = 0;
      this.time.addEvent({
        delay: 100, loop: true, callback: () => {
          if (!chicken.active) return;
          timer++;
          if (timer % 20 === 0) {
            const a = Math.random() * Math.PI * 2;
            chicken.setVelocity(Math.cos(a) * 40, Math.sin(a) * 40);
          }

          // Check if player is close - chicken runs away
          const dist = Phaser.Math.Distance.Between(
            this.player.sprite.x, this.player.sprite.y, chicken.x, chicken.y
          );
          if (dist < 30) {
            const angle = Phaser.Math.Angle.Between(
              this.player.sprite.x, this.player.sprite.y, chicken.x, chicken.y
            );
            chicken.setVelocity(Math.cos(angle) * 80, Math.sin(angle) * 80);
          }

          // Check if in pen area (near Kluk's farm)
          if (chicken.x > 20 * T && chicken.x < 24 * T && chicken.y > 3 * T && chicken.y < 6 * T) {
            if (!chicken.getData('penned')) {
              chicken.setData('penned', true);
              this.chickensChased++;
              chicken.setVelocity(0, 0);
              chicken.setTint(0x88ff88);

              if (this.chickensChased >= 4) {
                this.quest.setFlag('quest_chicken_done');
                this.showDialogByKey('village_chicken_done', () => {
                  this.inventory.addItem('shield');
                });
              }
            }
          }
        },
      });

      this.physics.add.collider(chicken, this.walls);
      this.chickenSprites.push(chicken);
    }
  }

  protected onDialogComplete(npcKey: string, dialogKey: string): void {
    if (npcKey === 'pickle_first') {
      this.quest.setFlag('met_pickle');
      // Give a random item
      this.showDialogByKey('pickle_item', () => {
        this.inventory.addItem('rubber_duck');
        this.showDialogByKey('pickle_farewell');
      });
    }
  }

  protected playMusic(): void {
    this.startMusic('music_village');
  }
}
