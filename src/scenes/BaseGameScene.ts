import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, SCENES, IS_DEV, COLORS, BLASTER_DAMAGE, SWORD_DAMAGE } from '../game/constants';
import { Player, Direction } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { NPC, NPCConfig } from '../entities/NPC';
import { Pickup, PickupConfig } from '../entities/Pickup';
import { Projectile } from '../entities/Projectile';
import { DialogSystem } from '../systems/DialogSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { DIALOG, DialogSequence } from '../data/dialog';
import { ENEMIES, EnemyDef } from '../data/enemies';
import { saveGame, loadGame, getDefaultSave, SaveData } from '../game/save';
import { UIScene } from './UIScene';

export interface SceneTransition {
  targetScene: string;
  targetX: number;
  targetY: number;
  triggerRect: Phaser.Geom.Rectangle;
}

export abstract class BaseGameScene extends Phaser.Scene {
  protected player!: Player;
  protected enemies: Enemy[] = [];
  protected npcs: NPC[] = [];
  protected pickups: Pickup[] = [];
  protected projectiles: Projectile[] = [];
  protected dialog!: DialogSystem;
  protected inventory!: InventorySystem;
  protected quest!: QuestSystem;
  protected combat!: CombatSystem;
  protected walls!: Phaser.Physics.Arcade.StaticGroup;
  protected transitions: SceneTransition[] = [];
  protected isPaused = false;
  protected pauseOverlay?: Phaser.GameObjects.Container;
  protected currentMusic?: Phaser.Sound.BaseSound;
  protected mapWidth = GAME_WIDTH;
  protected mapHeight = GAME_HEIGHT;
  protected areaName = 'Unknown';

  // Shared state across scenes via registry
  protected saveData!: SaveData;

  create(data?: Record<string, unknown>): void {
    // Load or create save data
    this.saveData = (this.registry.get('saveData') as SaveData) ?? loadGame() ?? getDefaultSave();

    // Apply dev mode overrides
    if (data?.devMode) {
      this.saveData.hasLegendSword = true;
      this.saveData.hasShield = true;
      this.saveData.hasBlaster = true;
      this.saveData.ammo = 30;
      this.saveData.playerHealth = this.saveData.maxHealth;
    }

    // Physics world bounds
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // Systems
    this.combat = new CombatSystem(this);
    this.quest = new QuestSystem();
    this.quest.loadFlags(this.saveData.questFlags);
    this.inventory = new InventorySystem(this, {
      items: [...this.saveData.inventory],
      zlorps: this.saveData.zlorps,
      ammo: this.saveData.ammo,
      keys: 0,
      hasLegendSword: this.saveData.hasLegendSword,
      hasShield: this.saveData.hasShield,
      hasBlaster: this.saveData.hasBlaster,
    });

    // Walls group
    this.walls = this.physics.add.staticGroup();

    // Build the map (implemented by subclasses)
    this.buildMap();

    // Player
    const spawnX = (data?.spawnX as number) ?? this.saveData.checkpointX;
    const spawnY = (data?.spawnY as number) ?? this.saveData.checkpointY;
    this.player = new Player(this, spawnX, spawnY, this.saveData.maxHealth);
    this.player.hp = this.saveData.playerHealth;

    // Player callbacks
    this.player.onAttack = (dir) => this.handleAttack(dir);
    this.player.onShoot = (dir) => this.handleShoot(dir);
    this.player.onInteract = () => this.handleInteract();

    // Camera
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setRoundPixels(true);

    // Collisions
    this.physics.add.collider(this.player.sprite, this.walls);

    // Dialog system
    this.dialog = new DialogSystem(this);

    // Populate (implemented by subclasses)
    this.populate();

    // Setup enemy collisions
    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy.sprite, this.walls);
      this.setupEnemyOverlap(enemy);
    }

    // Setup pickup collisions
    for (const pickup of this.pickups) {
      this.setupPickupOverlap(pickup);
    }

    // Launch UI scene
    if (!this.scene.isActive(SCENES.UI)) {
      this.scene.launch(SCENES.UI);
    }

    // Show area name
    this.time.delayedCall(200, () => {
      this.getUI()?.showAreaName(this.areaName);
    });

    // Pause input
    this.input.keyboard?.on('keydown-ENTER', () => this.togglePause());
    this.input.keyboard?.on('keydown-I', () => this.toggleInventory());

    // Dev hotkeys
    if (IS_DEV) {
      this.input.keyboard?.on('keydown-ONE', () => { this.player.hp = this.player.maxHp; });
      this.input.keyboard?.on('keydown-TWO', () => { this.inventory.addItem('key'); });
      this.input.keyboard?.on('keydown-THREE', () => { this.inventory.addZlorps(50); });
      this.input.keyboard?.on('keydown-FOUR', () => {
        this.inventory.addItem('legend_sword');
        this.inventory.addItem('shield');
        this.inventory.addItem('blaster');
      });
    }

    // Play scene music
    this.playMusic();
  }

  abstract buildMap(): void;
  abstract populate(): void;

  protected playMusic(): void {
    // Override in subclasses
  }

  protected startMusic(key: string, volume = 0.3): void {
    this.currentMusic?.stop();
    try {
      if (this.cache.audio.exists(key)) {
        this.currentMusic = this.sound.add(key, { loop: true, volume });
        this.currentMusic.play();
      }
    } catch {
      // Audio not available
    }
  }

  protected stopMusic(): void {
    this.currentMusic?.stop();
  }

  protected playSfx(key: string, volume = 0.4): void {
    try {
      if (this.cache.audio.exists(key)) {
        this.sound.play(key, { volume });
      }
    } catch {
      // Audio not available
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.inventory.opened) return;

    const frozen = this.dialog.active;
    this.player.update(time, frozen);

    // Dialog advance
    if (frozen && (this.player.isKeyJustDown('e') || this.player.isKeyJustDown('space'))) {
      this.dialog.advance();
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        enemy.update(time, this.player.sprite.x, this.player.sprite.y);
      }
    }

    // Check transitions
    if (!frozen) {
      this.checkTransitions();
    }

    // Update UI
    this.updateUI();

    // Check player death
    if (this.player.hp <= 0) {
      this.handleDeath();
    }
  }

  protected handleAttack(dir: Direction): void {
    this.playSfx('sfx_sword');
    const rect = this.player.getAttackRect();

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const eb = enemy.sprite.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(rect, eb)) {
        const damaged = this.combat.dealDamage(
          enemy,
          this.combat.getSwordDamage(),
          { x: this.player.sprite.x, y: this.player.sprite.y }
        );
        if (damaged && enemy.hp <= 0) {
          this.onEnemyDeath(enemy);
          enemy.die();
        }
      }
    }
  }

  protected handleShoot(dir: Direction): void {
    if (!this.inventory.getState().hasBlaster) return;
    if (!this.inventory.useAmmo()) return;

    this.playSfx('sfx_blaster');

    const angles: Record<Direction, number> = {
      right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2,
    };
    const angle = angles[dir];
    const proj = new Projectile(
      this,
      this.player.sprite.x + Math.cos(angle) * 12,
      this.player.sprite.y + Math.sin(angle) * 12,
      angle, 200, BLASTER_DAMAGE, true, 'blaster_projectile'
    );
    this.projectiles.push(proj);

    // Check hits
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      this.physics.add.overlap(proj.sprite, enemy.sprite, () => {
        const damaged = this.combat.dealDamage(
          enemy, BLASTER_DAMAGE,
          { x: proj.sprite.x, y: proj.sprite.y }
        );
        if (damaged && enemy.hp <= 0) {
          this.onEnemyDeath(enemy);
          enemy.die();
        }
        proj.destroy();
      });
    }
  }

  protected handleInteract(): void {
    if (this.dialog.active) {
      this.dialog.advance();
      return;
    }

    const point = this.player.getInteractPoint();
    const interactRange = 20;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(point.x, point.y, npc.sprite.x, npc.sprite.y);
      if (dist < interactRange) {
        const questDone = npc.config.questFlag ? this.quest.getFlag(npc.config.questFlag) : false;
        const dialogKey = npc.getDialogKey(questDone);
        const seq = DIALOG[dialogKey];
        if (seq) {
          this.dialog.show(seq, () => this.onDialogComplete(npc.config.key, dialogKey));
        }
        return;
      }
    }
  }

  protected onDialogComplete(npcKey: string, dialogKey: string): void {
    // Override in subclasses for quest progression
  }

  protected onEnemyDeath(enemy: Enemy): void {
    // Spawn drops
    for (const drop of enemy.def.drops) {
      if (Math.random() < drop.chance) {
        const pickup = this.spawnPickup({
          type: drop.item as 'heart' | 'zlorp' | 'ammo',
          spriteKey: drop.item === 'heart' ? 'heart_pickup' :
                     drop.item === 'zlorp' ? 'zlorp' :
                     drop.item === 'ammo' ? 'ammo_pickup' : 'zlorp',
          x: enemy.sprite.x + (Math.random() - 0.5) * 10,
          y: enemy.sprite.y + (Math.random() - 0.5) * 10,
        });
        this.setupPickupOverlap(pickup);
      }
    }
  }

  protected setupEnemyOverlap(enemy: Enemy): void {
    this.physics.add.overlap(this.player.sprite, enemy.sprite, () => {
      if (enemy.isDead) return;

      // Shield check
      if (this.player.isShielding) {
        const angle = Phaser.Math.Angle.Between(
          this.player.sprite.x, this.player.sprite.y,
          enemy.sprite.x, enemy.sprite.y
        );
        // Rough frontal check
        const playerAngle = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[this.player.direction];
        const diff = Math.abs(Phaser.Math.Angle.Wrap(angle - playerAngle));
        if (diff > Math.PI / 2) {
          // Blocked!
          const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(
            Math.cos(angle) * 100,
            Math.sin(angle) * 100
          );
          return;
        }
      }

      this.combat.dealDamage(
        this.player,
        enemy.def.damage,
        { x: enemy.sprite.x, y: enemy.sprite.y }
      );
    });

    // Enemy shoots callback
    enemy.onShoot = (e, angle) => {
      const proj = new Projectile(
        this, e.sprite.x, e.sprite.y, angle,
        e.def.projectileSpeed ?? 100, e.def.damage, false
      );
      this.projectiles.push(proj);
      this.physics.add.overlap(proj.sprite, this.player.sprite, () => {
        this.combat.dealDamage(this.player, proj.damage, { x: proj.sprite.x, y: proj.sprite.y });
        proj.destroy();
      });
    };
  }

  protected setupPickupOverlap(pickup: Pickup): void {
    this.physics.add.overlap(this.player.sprite, pickup.sprite, () => {
      if (pickup.collected) return;
      pickup.collect();
      this.playSfx('sfx_pickup');

      switch (pickup.config.type) {
        case 'heart':
          this.player.heal(2);
          break;
        case 'zlorp':
          this.inventory.addZlorps(1);
          break;
        case 'ammo':
          this.inventory.addItem('ammo');
          break;
        case 'key':
          this.inventory.addItem('key');
          break;
        case 'item':
          if (pickup.config.itemKey) {
            this.inventory.addItem(pickup.config.itemKey);
          }
          break;
      }
    });
  }

  protected spawnEnemy(x: number, y: number, type: string): Enemy {
    const def = ENEMIES[type];
    if (!def) throw new Error(`Unknown enemy type: ${type}`);
    const enemy = new Enemy(this, x, y, def);
    this.enemies.push(enemy);
    this.physics.add.collider(enemy.sprite, this.walls);
    this.setupEnemyOverlap(enemy);
    return enemy;
  }

  protected spawnNPC(config: NPCConfig): NPC {
    const npc = new NPC(this, config);
    this.npcs.push(npc);
    this.physics.add.collider(npc.sprite, this.walls);
    return npc;
  }

  protected spawnPickup(config: PickupConfig): Pickup {
    const pickup = new Pickup(this, config);
    this.pickups.push(pickup);
    return pickup;
  }

  protected addTransition(targetScene: string, triggerX: number, triggerY: number, triggerW: number, triggerH: number, targetX: number, targetY: number): void {
    this.transitions.push({
      targetScene,
      targetX, targetY,
      triggerRect: new Phaser.Geom.Rectangle(triggerX, triggerY, triggerW, triggerH),
    });
  }

  protected checkTransitions(): void {
    for (const t of this.transitions) {
      if (Phaser.Geom.Rectangle.ContainsPoint(t.triggerRect, this.player.sprite.getCenter())) {
        this.transitionTo(t.targetScene, t.targetX, t.targetY);
        return;
      }
    }
  }

  protected transitionTo(sceneKey: string, spawnX: number, spawnY: number): void {
    this.persistState();
    this.stopMusic();
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cleanup();
      this.scene.start(sceneKey, { spawnX, spawnY });
    });
  }

  protected persistState(): void {
    const invState = this.inventory.getState();
    this.saveData.playerHealth = this.player.hp;
    this.saveData.maxHealth = this.player.maxHp;
    this.saveData.zlorps = invState.zlorps;
    this.saveData.ammo = invState.ammo;
    this.saveData.inventory = [...invState.items];
    this.saveData.questFlags = this.quest.getFlags();
    this.saveData.hasLegendSword = invState.hasLegendSword;
    this.saveData.hasShield = invState.hasShield;
    this.saveData.hasBlaster = invState.hasBlaster;
    this.saveData.currentScene = this.scene.key;
    this.registry.set('saveData', this.saveData);
  }

  protected saveCheckpoint(x?: number, y?: number): void {
    this.persistState();
    this.saveData.checkpointX = x ?? this.player.sprite.x;
    this.saveData.checkpointY = y ?? this.player.sprite.y;
    saveGame(this.saveData);
    this.dialog.show(DIALOG.save_point);
  }

  protected handleDeath(): void {
    this.stopMusic();
    this.cameras.main.shake(500, 0.02);
    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.cleanup();
        // Respawn at checkpoint
        this.player.hp = this.player.maxHp;
        this.persistState();
        this.scene.start(this.saveData.currentScene, {
          spawnX: this.saveData.checkpointX,
          spawnY: this.saveData.checkpointY,
        });
      });
    });
  }

  protected togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);
      const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setScrollFactor(0);
      const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED\n\n[ENTER] Resume\n[ESC] Save & Quit', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffffff', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0);
      this.pauseOverlay.add([bg, text]);
      this.input.keyboard?.on('keydown-ESC', () => {
        this.persistState();
        saveGame(this.saveData);
        this.stopMusic();
        this.cleanup();
        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.TITLE);
      });
    } else {
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
    }
  }

  protected toggleInventory(): void {
    this.inventory.toggle();
  }

  protected updateUI(): void {
    const ui = this.getUI();
    if (!ui) return;
    const invState = this.inventory.getState();
    ui.updateHealth(this.player.hp, this.player.maxHp);
    ui.updateZlorps(invState.zlorps);
    ui.updateKeys(invState.keys);
    ui.updateAmmo(invState.ammo, invState.hasBlaster);
    ui.updateWeapon(invState.hasLegendSword
      ? (invState.selectedWeapon === 'sword' ? '[Sword]' : '[A-OK47]')
      : 'Unarmed');
  }

  protected getUI(): UIScene | undefined {
    return this.scene.get(SCENES.UI) as UIScene | undefined;
  }

  protected cleanup(): void {
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.npcs.forEach(n => n.destroy());
    this.npcs = [];
    this.pickups.forEach(p => p.destroy());
    this.pickups = [];
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    this.dialog?.destroy();
    this.inventory?.destroy();
  }

  // Utility: build a simple tilemap from a 2D array
  protected buildTilemap(
    map: number[][],
    tileMapping: Record<number, { texture: string; solid: boolean }>,
    offsetX = 0, offsetY = 0
  ): void {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tileId = map[row][col];
        const tileDef = tileMapping[tileId];
        if (!tileDef) continue;
        const x = offsetX + col * TILE_SIZE + TILE_SIZE / 2;
        const y = offsetY + row * TILE_SIZE + TILE_SIZE / 2;

        if (tileDef.solid) {
          const wall = this.walls.create(x, y, tileDef.texture) as Phaser.Physics.Arcade.Sprite;
          wall.setImmovable(true);
          wall.setDepth(2);
          wall.refreshBody();
        } else {
          this.add.image(x, y, tileDef.texture).setDepth(0);
        }
      }
    }
  }

  protected showDialogByKey(key: string, onComplete?: () => void): void {
    const seq = DIALOG[key];
    if (seq) {
      this.dialog.show(seq, onComplete);
    }
  }

  protected addWallRect(x: number, y: number, w: number, h: number, texture = 'tile_wall'): void {
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const wx = x + col * TILE_SIZE + TILE_SIZE / 2;
        const wy = y + row * TILE_SIZE + TILE_SIZE / 2;
        const wall = this.walls.create(wx, wy, texture) as Phaser.Physics.Arcade.Sprite;
        wall.setImmovable(true);
        wall.setDepth(2);
        wall.refreshBody();
      }
    }
  }

  protected fillFloor(w: number, h: number, texture = 'tile_grass', offsetX = 0, offsetY = 0): void {
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        this.add.image(
          offsetX + col * TILE_SIZE + TILE_SIZE / 2,
          offsetY + row * TILE_SIZE + TILE_SIZE / 2,
          texture
        ).setDepth(0);
      }
    }
  }
}
