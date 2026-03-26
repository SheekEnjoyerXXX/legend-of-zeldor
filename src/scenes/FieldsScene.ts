import { BaseGameScene } from './BaseGameScene';
import { SCENES, TILE_SIZE } from '../game/constants';

export class FieldsScene extends BaseGameScene {
  constructor() {
    super(SCENES.FIELDS);
    this.mapWidth = 640;
    this.mapHeight = 480;
    this.areaName = 'Fields of Mild Peril';
  }

  buildMap(): void {
    const T = TILE_SIZE;
    const cols = 40, rows = 30;

    // Grass floor
    this.fillFloor(cols, rows, 'tile_grass');

    // River (horizontal, mid-map)
    for (let x = 0; x < cols; x++) {
      for (let y = 14; y < 16; y++) {
        this.add.image(x * T + T / 2, y * T + T / 2, 'tile_water').setDepth(0);
        if (x < 16 || x > 20) { // Bridge gap
          const w = this.walls.create(x * T + T / 2, y * T + T / 2, 'tile_water') as Phaser.Physics.Arcade.Sprite;
          w.setVisible(false).refreshBody();
        }
      }
    }

    // Bridge
    for (let x = 16; x <= 20; x++) {
      for (let y = 14; y < 16; y++) {
        this.add.image(x * T + T / 2, y * T + T / 2, 'tile_wood').setDepth(1);
      }
    }

    // Dirt path
    for (let y = 0; y < rows; y++) {
      this.add.image(18 * T + T / 2, y * T + T / 2, 'tile_dirt').setDepth(0);
      this.add.image(19 * T + T / 2, y * T + T / 2, 'tile_dirt').setDepth(0);
    }

    // Border walls
    this.addWallRect(0, 0, cols, 1);
    this.addWallRect(0, (rows - 1) * T, cols, 1);
    this.addWallRect(0, 0, 1, rows);
    this.addWallRect((cols - 1) * T, 0, 1, rows);

    // Left exit (back to village)
    for (let y = 11; y <= 14; y++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (sprite.x < T && Math.abs(sprite.y - (y * T + T / 2)) < 2) sprite.destroy();
      });
    }

    // Top exit (to Gates)
    for (let x = 17; x <= 20; x++) {
      this.walls.getChildren().forEach(w => {
        const sprite = w as Phaser.Physics.Arcade.Sprite;
        if (Math.abs(sprite.x - (x * T + T / 2)) < 2 && sprite.y < T) sprite.destroy();
      });
    }

    // Trees scattered
    const treePos = [
      [3, 3], [7, 5], [12, 3], [28, 4], [34, 6], [5, 22], [10, 25],
      [30, 20], [35, 24], [25, 8], [8, 10], [32, 10],
    ];
    for (const [tx, ty] of treePos) {
      this.add.image(tx * T, ty * T, 'tree').setDepth(5);
      const tw = this.walls.create(tx * T, ty * T + 8) as Phaser.Physics.Arcade.Sprite;
      tw.setVisible(false).setSize(12, 8).refreshBody();
    }

    // Signs
    this.add.image(16 * T, 10 * T, 'sign').setDepth(4);
    this.add.image(22 * T, 18 * T, 'sign').setDepth(4);

    // Ruined watchtower
    this.addWallRect(32 * T, 2 * T, 3, 3, 'tile_stone');
    this.add.image(33 * T + T / 2, 2 * T, 'sign').setDepth(5);

    // Merchant shack
    this.addWallRect(28 * T, 20 * T, 3, 2, 'tile_hut');
    this.add.image(29 * T + T / 2, 22 * T, 'tile_door').setDepth(2);

    // Hidden cave entrance
    const caveEntrance = this.add.rectangle(5 * T, 5 * T, T * 2, T * 2, 0x333333).setDepth(0);

    // Pickle Toss mini-game area
    this.add.rectangle(35 * T, 18 * T, T * 4, T * 4, 0x8b6d3c, 0.3).setDepth(0);

    // Boot for quest (hidden)
    if (!this.quest.getFlag('quest_boot_done')) {
      this.spawnPickup({
        type: 'item', itemKey: 'boot', spriteKey: 'sock',
        x: 8 * T, y: 8 * T,
      });
    }

    // Transitions
    this.addTransition(SCENES.VILLAGE, 0, 11 * T, 2 * T, 4 * T, 460, 200);
    this.addTransition(SCENES.GATES, 17 * T, 0, 4 * T, 2 * T, 240, 380);
  }

  populate(): void {
    const T = TILE_SIZE;

    // Mark reaching fields for story progression
    this.quest.setFlag('reached_fields');

    // Barefoot Bob
    this.spawnNPC({
      key: 'bob', spriteKey: 'villager1',
      x: 12 * T, y: 12 * T,
      dialogKey: 'lost_boot_quest',
      dialogKeyAfter: 'lost_boot_done',
      questFlag: 'quest_boot_done',
    });

    // Nervous Ned
    this.spawnNPC({
      key: 'ned', spriteKey: 'villager3',
      x: 6 * T, y: 20 * T,
      dialogKey: 'escort_villager',
      dialogKeyAfter: 'escort_done',
      questFlag: 'quest_escort_done',
    });

    // Sign interactions
    this.spawnNPC({
      key: 'sign1', spriteKey: 'sign',
      x: 16 * T, y: 10 * T,
      dialogKey: 'fields_sign1',
    });

    this.spawnNPC({
      key: 'sign2', spriteKey: 'sign',
      x: 22 * T, y: 18 * T,
      dialogKey: 'fields_sign2',
    });

    // Watchtower sign
    this.spawnNPC({
      key: 'tower_sign', spriteKey: 'sign',
      x: 33 * T + T / 2, y: 2 * T,
      dialogKey: 'watchtower_sign',
    });

    // Enemies
    this.spawnEnemy(10 * T, 6 * T, 'gobdwarf');
    this.spawnEnemy(25 * T, 6 * T, 'gobdwarf');
    this.spawnEnemy(30 * T, 12 * T, 'slime_modem');
    this.spawnEnemy(8 * T, 18 * T, 'gobdwarf');
    this.spawnEnemy(15 * T, 22 * T, 'portal_rat');
    this.spawnEnemy(35 * T, 25 * T, 'gobdwarf');
    this.spawnEnemy(20 * T, 25 * T, 'slime_modem');

    // Pickups
    this.spawnPickup({ type: 'heart', spriteKey: 'heart_pickup', x: 30 * T, y: 8 * T });
    this.spawnPickup({ type: 'ammo', spriteKey: 'ammo_pickup', x: 5 * T, y: 15 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 36 * T, y: 3 * T });
    this.spawnPickup({ type: 'zlorp', spriteKey: 'zlorp', x: 37 * T, y: 3 * T });

    // Fish Slapper - reward for exploring near the ruined watchtower
    this.spawnPickup({
      type: 'item', itemKey: 'fish_slapper', spriteKey: 'heart_pickup',
      x: 34 * T, y: 4 * T,
    });

    // Pickle Toss NPC
    this.spawnNPC({
      key: 'pickle_toss', spriteKey: 'pickle',
      x: 35 * T, y: 17 * T,
      dialogKey: 'pickle_wisdom',
    });

    // Save point
    this.spawnSaveCrystal(18 * T + T / 2, 12 * T);
  }

  protected onDialogComplete(npcKey: string, dialogKey: string): void {
    if (npcKey === 'bob' && dialogKey === 'lost_boot_quest') {
      // Player needs to find the boot
    }
    if (dialogKey === 'lost_boot_done') {
      this.inventory.addZlorps(30);
    }
    if (dialogKey === 'escort_done') {
      this.inventory.addItem('portal_shard');
    }
  }

  protected playMusic(): void {
    this.startMusic('music_village');
  }
}
