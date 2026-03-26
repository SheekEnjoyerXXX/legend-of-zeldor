import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, SCENES, IS_DEV, COLORS, BLASTER_DAMAGE } from '../game/constants';
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
  protected doorZones: { x: number; y: number; sceneKey: string; data: Record<string, unknown>; range: number }[] = [];
  private doorTransitioning = false;
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

    // Camera — explicitly set size to fix Phaser bug where worldView is 0x0 on scene restart
    this.cameras.main.setSize(GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setRoundPixels(true);
    // Force-compute worldView immediately — Phaser's game loop may skip the first
    // preRender when a scene is started during SceneManager.isProcessing, leaving
    // worldView at {0,0,0,0} and causing a black screen (empty renderList).
    this.cameras.main.preRender();
    this.cameras.main.dirty = true;

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

    // Weapon cycling (J/K when inventory is open, or quick-switch with Tab)
    const cycleWeaponInInventory = () => {
      if (this.inventory.opened) {
        this.inventory.cycleWeapon();
        this.inventory.toggle(); // refresh
        this.inventory.toggle();
      }
    };
    this.input.keyboard?.on('keydown-J', cycleWeaponInInventory);
    this.input.keyboard?.on('keydown-K', cycleWeaponInInventory);
    this.input.keyboard?.on('keydown-TAB', () => {
      if (!this.isPaused && !this.dialog.active) {
        this.inventory.cycleWeapon();
        this.showWeaponSwitch();
      }
    });

    // Dev hotkeys
    if (IS_DEV) {
      this.input.keyboard?.on('keydown-ONE', () => { this.player.hp = this.player.maxHp; });
      this.input.keyboard?.on('keydown-TWO', () => { this.inventory.addItem('key'); });
      this.input.keyboard?.on('keydown-THREE', () => { this.inventory.addZlorps(50); });
      this.input.keyboard?.on('keydown-FOUR', () => {
        this.inventory.addItem('legend_sword');
        this.inventory.addItem('shield');
        this.inventory.addItem('blaster');
        this.inventory.addItem('banana_sword');
        this.inventory.addItem('fish_slapper');
        this.inventory.addItem('pixel_hammer');
        this.inventory.addItem('cursed_spoon');
        this.inventory.addItem('toilet_plunger');
      });
    }

    // Cleanup on shutdown
    this.events.on('shutdown', () => this.cleanup());

    // Play scene music
    this.playMusic();

    // Manual fade-in using overlay rectangle (Phaser's camera fade is broken
    // across scene restarts — it corrupts renderFlags and leaves stale fadeOut)
    this.cameras.main.visible = true;
    this.cameras.main.setAlpha(1);
    (this.cameras.main as unknown as { renderFlags: number }).renderFlags = 15;
    // Kill any stale camera effects completely
    this.cameras.main.resetFX();
    const fadeEffect = this.cameras.main.fadeEffect as unknown as { isRunning: boolean; alpha: number };
    fadeEffect.isRunning = false;
    fadeEffect.alpha = 0;
    // Use an overlay rect for fade-in instead
    const fadeOverlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000
    ).setScrollFactor(0).setDepth(9999).setAlpha(1);
    this.tweens.add({
      targets: fadeOverlay, alpha: 0, duration: 300,
      onComplete: () => fadeOverlay.destroy(),
    });
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

    // Check door zones BEFORE player update (so E press isn't consumed by NPC interact)
    if (!frozen && !this.doorTransitioning) {
      this.checkDoorZones();
    }

    this.player.update(time, frozen || this.doorTransitioning);

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

    // NPC interact prompts
    if (!frozen) {
      for (const npc of this.npcs) {
        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y, npc.sprite.x, npc.sprite.y
        );
        npc.showPrompt(dist < 24);
      }
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
    this.showSwordSwing(dir);
    const rect = this.player.getAttackRect();

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const eb = enemy.sprite.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(rect, eb)) {
        const damaged = this.combat.dealDamage(
          enemy,
          this.inventory.getWeaponDamage(),
          { x: this.player.sprite.x, y: this.player.sprite.y }
        );
        if (damaged) {
          this.spawnHitParticles(enemy.sprite.x, enemy.sprite.y, 0xff4444);
          if (enemy.hp <= 0) {
            this.onEnemyDeath(enemy);
            enemy.die();
          }
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
        const dialogKey = npc.getDialogKey(questDone, this.quest.getFlags());
        const seq = DIALOG[dialogKey];
        if (seq) {
          // Store original NPC state
          const origX = npc.sprite.x;
          const origY = npc.sprite.y;
          const origScaleX = npc.sprite.scaleX;
          const origScaleY = npc.sprite.scaleY;
          const origDepth = npc.sprite.depth;

          // Calculate target position (near top-left of dialog box in world coords)
          const cam = this.cameras.main;
          const targetScreenX = 36;
          const targetScreenY = GAME_HEIGHT - 90;
          const targetWorldX = targetScreenX + cam.scrollX;
          const targetWorldY = targetScreenY + cam.scrollY;

          // Zoom NPC up to dialog area
          npc.sprite.setDepth(999);
          this.tweens.add({
            targets: npc.sprite,
            x: targetWorldX,
            y: targetWorldY,
            scaleX: 2.5,
            scaleY: 2.5,
            duration: 300,
            ease: 'Back.easeOut',
          });

          this.dialog.show(seq, () => {
            // Shrink back to original position
            this.tweens.add({
              targets: npc.sprite,
              x: origX,
              y: origY,
              scaleX: origScaleX,
              scaleY: origScaleY,
              duration: 300,
              ease: 'Back.easeIn',
              onComplete: () => {
                npc.sprite.setDepth(origDepth);
              },
            });
            this.onDialogComplete(npc.config.key, dialogKey);
          });
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
      if (this.dialog?.active) return;

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
          this.playSfx('sfx_pickup');
          this.spawnHitParticles(this.player.sprite.x, this.player.sprite.y, 0x3498db, 4);
          this.player.sprite.setTint(0x6688ff);
          this.time.delayedCall(100, () => this.player.sprite.clearTint());
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
        if (this.dialog?.active) return;
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
    if (this.player) {
      this.physics.add.collider(this.player.sprite, npc.sprite);
    }
    return npc;
  }

  protected spawnPickup(config: PickupConfig): Pickup {
    const pickup = new Pickup(this, config);
    this.pickups.push(pickup);
    return pickup;
  }

  /** Register a door zone that transitions to another scene on E press */
  protected addDoorZone(x: number, y: number, sceneKey: string, sceneData: Record<string, unknown>, range = 18): void {
    this.doorZones.push({ x, y, sceneKey, data: sceneData, range });
  }

  private checkDoorZones(): void {
    if (this.doorTransitioning) return;

    // First check if player is near any door before consuming E press
    let nearestDoor: typeof this.doorZones[0] | undefined;
    for (const door of this.doorZones) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, door.x, door.y
      );
      if (dist < door.range) {
        nearestDoor = door;
        break;
      }
    }
    if (!nearestDoor) return;

    // Only consume E press if we're actually near a door
    if (!this.player.isKeyJustDown('e')) return;

    this.doorTransitioning = true;
    this.persistState();
    this.stopMusic();
    this.cleanup();
    // Let Phaser's scene manager queue the transition — do NOT use
    // requestAnimationFrame as it breaks Phaser's RAF game loop.
    this.scene.start(nearestDoor!.sceneKey, nearestDoor!.data);
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
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000
    ).setScrollFactor(0).setDepth(9999).setAlpha(0);
    this.tweens.add({
      targets: overlay, alpha: 1, duration: 250,
      onComplete: () => {
        this.cleanup();
        this.scene.start(sceneKey, { spawnX, spawnY });
      },
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
      const overlay = this.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000
      ).setScrollFactor(0).setDepth(9999).setAlpha(0);
      this.tweens.add({
        targets: overlay, alpha: 1, duration: 400,
        onComplete: () => {
          this.cleanup();
          this.player.hp = this.player.maxHp;
          this.persistState();
          this.scene.start(this.saveData.currentScene, { spawnX: this.saveData.checkpointX, spawnY: this.saveData.checkpointY });
        },
      });
    });
  }

  protected togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);
      const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setScrollFactor(0);
      const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
        'PAUSED\n\n[ENTER] Resume\n[S] Save Game\n[ESC] Save & Quit', {
          fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', align: 'center',
        }).setOrigin(0.5).setScrollFactor(0);
      const savedMsg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '', {
        fontSize: '9px', fontFamily: 'monospace', color: '#44ff44', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0);
      this.pauseOverlay.add([bg, text, savedMsg]);

      const onSave = () => {
        this.persistState();
        saveGame(this.saveData);
        savedMsg.setText('Game saved!');
        this.time.delayedCall(1500, () => savedMsg.setText(''));
      };
      const onQuit = () => {
        this.persistState();
        saveGame(this.saveData);
        this.stopMusic();
        this.cleanup();
        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.TITLE);
      };
      this.input.keyboard?.on('keydown-S', onSave);
      this.input.keyboard?.on('keydown-ESC', onQuit);
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
    // UIScene must be fully active (not pending re-launch) before we update it
    if (!ui || !this.scene.isActive(SCENES.UI)) return;
    const invState = this.inventory.getState();
    ui.updateHealth(this.player.hp, this.player.maxHp);
    ui.updateZlorps(invState.zlorps);
    ui.updateKeys(invState.keys);
    ui.updateAmmo(invState.ammo, invState.hasBlaster);
    ui.updateWeapon(`[${this.inventory.getWeaponName()}]`);
    ui.updateQuestObjective(this.quest.getObjectiveText());
  }

  protected getUI(): UIScene | undefined {
    return this.scene.get(SCENES.UI) as UIScene | undefined;
  }

  protected cleanup(): void {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.npcs.forEach(n => n.destroy());
    this.npcs = [];
    this.pickups.forEach(p => p.destroy());
    this.pickups = [];
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    this.doorZones = [];
    this.doorTransitioning = false;
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

  /** Spawn a save crystal with pulse animation and interact check */
  protected spawnSaveCrystal(x: number, y: number): void {
    const crystal = this.add.rectangle(x, y, 8, 12, 0x44aaff).setDepth(4);
    this.tweens.add({ targets: crystal, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });
    // Sparkle particles around crystal
    this.time.addEvent({
      delay: 600, loop: true, callback: () => {
        const spark = this.add.rectangle(
          x + (Math.random() - 0.5) * 12,
          y + (Math.random() - 0.5) * 16,
          2, 2, 0x88ccff
        ).setDepth(5).setAlpha(0.8);
        this.tweens.add({
          targets: spark, alpha: 0, y: spark.y - 8, duration: 500,
          onComplete: () => spark.destroy(),
        });
      },
    });
    this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        if (!this.dialog.active && !this.isPaused) {
          const dist = Phaser.Math.Distance.Between(
            this.player.sprite.x, this.player.sprite.y, x, y
          );
          if (dist < 20 && this.player.isKeyJustDown('e')) {
            this.saveCheckpoint(x, y + 20);
          }
        }
      },
    });
  }

  /** Show weapon switch popup */
  private showWeaponSwitch(): void {
    const name = this.inventory.getWeaponName();
    const popup = this.add.text(
      this.player.sprite.x, this.player.sprite.y - 20,
      `[${name}]`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#e6c619',
      }
    ).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: popup, alpha: 0, y: popup.y - 15, duration: 1000,
      onComplete: () => popup.destroy(),
    });
  }

  /** Show a visual sword swing arc in the attack direction */
  private showSwordSwing(dir: Direction): void {
    const offsets: Record<Direction, { x: number; y: number; angle: number }> = {
      right: { x: 14, y: 0, angle: 0 },
      down: { x: 0, y: 14, angle: 90 },
      left: { x: -14, y: 0, angle: 180 },
      up: { x: 0, y: -14, angle: 270 },
    };
    const o = offsets[dir];
    const sx = this.player.sprite.x + o.x;
    const sy = this.player.sprite.y + o.y;

    // Sword arc - a small colored arc shape
    const arc = this.add.graphics().setDepth(15);
    arc.fillStyle(0xcccccc, 0.8);
    arc.slice(sx, sy, 12, Phaser.Math.DegToRad(o.angle - 60), Phaser.Math.DegToRad(o.angle + 60), false);
    arc.fillPath();

    this.tweens.add({
      targets: arc, alpha: 0, duration: 200,
      onComplete: () => arc.destroy(),
    });
  }

  /** Spawn hit/impact particles at a location */
  protected spawnHitParticles(x: number, y: number, color = 0xffffff, count = 6): void {
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        2 + Math.random() * 2, 2 + Math.random() * 2, color
      ).setDepth(20).setAlpha(0.9);
      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 24,
        y: p.y + (Math.random() - 0.5) * 24,
        alpha: 0, duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

}
