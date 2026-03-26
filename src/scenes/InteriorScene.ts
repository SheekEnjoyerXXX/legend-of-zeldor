import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, SCENES, COLORS } from '../game/constants';

import { Player } from '../entities/Player';
import { DialogSystem } from '../systems/DialogSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';
import { DIALOG } from '../data/dialog';
import { ITEMS } from '../data/items';
import { loadGame, getDefaultSave, SaveData, saveGame } from '../game/save';

interface InteriorData {
  interiorKey: string;
  ownerSpriteKey: string;
  dialogKey: string;
  returnScene: string;
  returnX: number;
  returnY: number;
  isShop?: boolean;
}

interface ShopItem {
  key: string;
  name: string;
  price: number;
  description: string;
}

const SHOP_INVENTORY: ShopItem[] = [
  { key: 'doner_wrap', name: 'Perfect Doner', price: 25, description: 'Full HP restore! Yorb\'s masterpiece.' },
  { key: 'ayran', name: 'Ayran', price: 5, description: 'Yogurt drink. Heals 2 HP.' },
  { key: 'baklava', name: 'Baklava', price: 15, description: 'Honey pastry. Heals 4 HP.' },
  { key: 'mystery_meat', name: 'Mystery Meat', price: 3, description: 'Don\'t ask. Heals 1 HP.' },
  { key: 'hot_sauce', name: 'Yorb\'s Hot Sauce', price: 10, description: 'VERY hot. Temporary power.' },
  { key: 'kebab_skewer', name: 'Kebab Skewer', price: 40, description: 'Sharp skewer weapon. 2 DMG.' },
  { key: 'golden_spatula', name: 'Golden Spatula', price: 80, description: 'Yorb\'s pride. 3 DMG weapon!' },
  { key: 'stale_pide', name: 'Stale Pide', price: 1, description: 'Hard flatbread. Useless? Maybe.' },
  { key: 'rubber_duck', name: 'Rubber Duck', price: 8, description: 'Squeaks. That\'s it. That\'s the item.' },
  { key: 'single_sock', name: 'Lost Sock', price: 2, description: 'Its partner is gone forever.' },
];

const INTERIOR_DEFS: Record<string, InteriorData> = {
  elder_hut: {
    interiorKey: 'elder_hut', ownerSpriteKey: 'villager_elder',
    dialogKey: 'elder_home', returnScene: SCENES.VILLAGE, returnX: 88, returnY: 104,
  },
  kluk_hut: {
    interiorKey: 'kluk_hut', ownerSpriteKey: 'villager1',
    dialogKey: 'kluk_home', returnScene: SCENES.VILLAGE, returnX: 360, returnY: 104,
  },
  yorb_hut: {
    interiorKey: 'yorb_hut', ownerSpriteKey: 'merchant',
    dialogKey: 'yorb_home', returnScene: SCENES.VILLAGE, returnX: 88, returnY: 328,
    isShop: true,
  },
  empty_hut: {
    interiorKey: 'empty_hut', ownerSpriteKey: '',
    dialogKey: 'empty_hut', returnScene: SCENES.VILLAGE, returnX: 344, returnY: 328,
  },
};

export class InteriorScene extends Phaser.Scene {
  private player!: Player;
  private dialog!: DialogSystem;
  private inventory!: InventorySystem;
  private quest!: QuestSystem;
  private interiorData!: InteriorData;
  private saveData!: SaveData;
  private shopOpen = false;
  private shopContainer?: Phaser.GameObjects.Container;
  private shopCursor = 0;
  private shopMode: 'main' | 'buy' | 'talk' = 'main';
  private shopBuyCursor = 0;
  private talkIndex = 0;
  private doorX = 0;
  private doorY = 0;
  private leaving = false;

  constructor() {
    super(SCENES.INTERIOR);
  }

  create(data: Record<string, unknown>): void {
    const key = (data.interiorKey as string) ?? 'empty_hut';
    this.interiorData = INTERIOR_DEFS[key] ?? INTERIOR_DEFS.empty_hut;
    this.shopOpen = false;
    this.shopContainer = undefined;
    this.shopCursor = 0;
    this.shopMode = 'main';
    this.shopBuyCursor = 0;
    this.talkIndex = 0;

    // Stop the HUD overlay so it doesn't cover the interior
    if (this.scene.isActive(SCENES.UI)) {
      this.scene.stop(SCENES.UI);
    }

    this.saveData = (this.registry.get('saveData') as SaveData) ?? loadGame() ?? getDefaultSave();

    const T = TILE_SIZE;
    const isShop = this.interiorData.isShop;
    const cols = isShop ? 10 : 8;
    const rows = isShop ? 8 : 6;
    const mapW = cols * T;
    const mapH = rows * T;

    // Extend world bounds 1 tile below the map so player can reach the door row
    this.physics.world.setBounds(0, 0, mapW, mapH + T);

    // Floor
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.add.image(c * T + T / 2, r * T + T / 2, isShop ? 'tile_stone' : 'tile_wood').setDepth(0);
      }
    }

    // Walls
    const walls = this.physics.add.staticGroup();
    for (let c = 0; c < cols; c++) {
      const w = walls.create(c * T + T / 2, T / 2, 'tile_hut') as Phaser.Physics.Arcade.Sprite;
      w.setImmovable(true).setDepth(2).refreshBody();
    }
    for (let r = 0; r < rows; r++) {
      const wl = walls.create(T / 2, r * T + T / 2, 'tile_hut') as Phaser.Physics.Arcade.Sprite;
      wl.setImmovable(true).setDepth(2).refreshBody();
      const wr = walls.create((cols - 1) * T + T / 2, r * T + T / 2, 'tile_hut') as Phaser.Physics.Arcade.Sprite;
      wr.setImmovable(true).setDepth(2).refreshBody();
    }

    // Door at bottom center — use tile center (+ T/2) not edge
    this.doorX = Math.floor(cols / 2) * T + T / 2;
    this.doorY = (rows - 1) * T + T / 2;
    this.leaving = false;
    this.add.image(this.doorX, this.doorY, 'tile_door').setDepth(2);

    // Exit prompt text that pulses near the door
    const exitPrompt = this.add.text(this.doorX, this.doorY + T, '[Walk here to EXIT]', {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffdd00',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: exitPrompt, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    // Systems
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
    this.dialog = new DialogSystem(this);

    // Player spawns 3 tiles above door (far enough to not auto-trigger exit)
    this.player = new Player(this, this.doorX, this.doorY - T * 3, this.saveData.maxHealth);
    this.player.hp = this.saveData.playerHealth;
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, walls);

    // Camera — explicitly set size to fix Phaser bug where worldView is 0x0 on scene restart
    this.cameras.main.setSize(GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, mapW, mapH + T);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    // Force-compute worldView immediately — Phaser's game loop may skip the first
    // preRender when a scene is started during SceneManager.isProcessing, leaving
    // worldView at {0,0,0,0} and causing a black screen (empty renderList).
    this.cameras.main.preRender();
    this.cameras.main.dirty = true;

    if (isShop) {
      this.buildShopInterior(T, cols, rows, walls);
    } else {
      this.buildNormalInterior(T, cols, rows, walls);
    }

    // Auto-show entry dialog then open shop if applicable
    this.time.delayedCall(300, () => {
      const seq = DIALOG[this.interiorData.dialogKey];
      if (seq) {
        this.dialog.show(seq, () => {
          if (isShop) {
            this.openShopMenu();
          }
        });
      } else if (isShop) {
        this.openShopMenu();
      }
    });

    // Player interact
    this.player.onInteract = () => {
      if (this.dialog.active) {
        this.dialog.advance();
        return;
      }
      if (isShop && !this.shopOpen) {
        if (this.player.sprite.y < 5 * T) {
          this.openShopMenu();
        }
      }
    };

    // Input
    this.input.keyboard?.on('keydown-I', () => {
      if (!this.shopOpen) this.inventory.toggle();
    });
    if (isShop) {
      this.setupShopInput();
    }

    // Manual fade-in (Phaser's camera fade is broken across scene restarts)
    this.cameras.main.visible = true;
    this.cameras.main.setAlpha(1);
    (this.cameras.main as unknown as { renderFlags: number }).renderFlags = 15;
    this.cameras.main.resetFX();
    const fadeEffect = this.cameras.main.fadeEffect as unknown as { isRunning: boolean; alpha: number };
    fadeEffect.isRunning = false;
    fadeEffect.alpha = 0;
    const fadeOverlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000
    ).setScrollFactor(0).setDepth(9999).setAlpha(1);
    this.tweens.add({
      targets: fadeOverlay, alpha: 0, duration: 300,
      onComplete: () => fadeOverlay.destroy(),
    });
  }

  private buildNormalInterior(T: number, cols: number, _rows: number, walls: Phaser.Physics.Arcade.StaticGroup): void {
    // Furniture
    this.add.rectangle(2 * T, 1.5 * T, T, T, 0x663300).setDepth(1);
    this.add.rectangle(6 * T, 1.5 * T, T / 2, T, 0x884422).setDepth(1);

    // Owner NPC
    if (this.interiorData.ownerSpriteKey) {
      const ownerSprite = this.physics.add.sprite(4 * T, 2 * T, this.interiorData.ownerSpriteKey, 0);
      ownerSprite.setImmovable(true).setDepth(8);
      this.physics.add.collider(this.player.sprite, ownerSprite);
    }
  }

  private buildShopInterior(T: number, cols: number, rows: number, walls: Phaser.Physics.Arcade.StaticGroup): void {
    // Counter (horizontal bar across the room)
    for (let c = 1; c < cols - 1; c++) {
      const counter = walls.create(c * T + T / 2, 3 * T + T / 2, 'tile_hut') as Phaser.Physics.Arcade.Sprite;
      counter.setImmovable(true).setDepth(3).refreshBody();
    }

    // Doner spit (vertical rotating meat) - decorative
    const spit = this.add.rectangle(3 * T, 1.5 * T, 6, 16, 0x8B4513).setDepth(4);
    const meat = this.add.rectangle(3 * T, 1.5 * T, 10, 14, 0xCC6633).setDepth(5);
    // Animate meat rotation illusion
    this.tweens.add({
      targets: meat, scaleX: 0.6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    // Fire under spit
    const fire1 = this.add.rectangle(3 * T - 3, 2.2 * T, 3, 4, 0xFF6600).setDepth(3);
    const fire2 = this.add.rectangle(3 * T + 3, 2.2 * T, 3, 4, 0xFF4400).setDepth(3);
    this.tweens.add({ targets: fire1, alpha: 0.3, duration: 200, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: fire2, alpha: 0.3, duration: 300, yoyo: true, repeat: -1, delay: 100 });

    // Shelves with items on back wall
    for (let c = 5; c < 9; c++) {
      this.add.rectangle(c * T + T / 2, 1.2 * T, T - 2, 3, 0x6B4226).setDepth(3);
      // Random items on shelves
      const colors = [0xFFDD00, 0xFF6644, 0x44AAFF, 0xAAFF44];
      this.add.rectangle(c * T + T / 2, 1 * T, 4, 6, colors[c - 5]).setDepth(4);
    }

    // Sign above counter
    this.add.text(cols * T / 2, 0.6 * T, 'YORB\'S DONER PALACE', {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setDepth(10);

    // Shopkeeper Yorb behind counter
    const yorb = this.physics.add.sprite(5 * T, 2 * T, 'merchant', 0);
    yorb.setImmovable(true).setDepth(8).setScale(1.3);
    // Yorb idle bob
    this.tweens.add({
      targets: yorb, y: yorb.y - 1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Decorative smoke/steam from the grill
    this.time.addEvent({
      delay: 500, loop: true, callback: () => {
        const smoke = this.add.rectangle(
          3 * T + (Math.random() - 0.5) * 8,
          1 * T,
          2, 2, 0xCCCCCC, 0.5
        ).setDepth(15);
        this.tweens.add({
          targets: smoke, y: smoke.y - 15, alpha: 0, duration: 800,
          onComplete: () => smoke.destroy(),
        });
      },
    });
  }

  private openShopMenu(): void {
    this.shopOpen = true;
    this.shopMode = 'main';
    this.shopCursor = 0;
    this.shopBuyCursor = 0;
    this.renderShopMenu();
  }

  private showShopDialog(dialogKey: string, reopenAfter = false): void {
    this.shopContainer?.setVisible(false);
    const seq = DIALOG[dialogKey];
    if (seq) {
      this.dialog.show(seq, reopenAfter ? () => {
        this.shopContainer?.setVisible(true);
        this.renderShopMenu();
      } : undefined);
    }
  }

  private closeShopMenu(): void {
    this.shopOpen = false;
    this.shopContainer?.destroy();
    this.shopContainer = undefined;
    this.showShopDialog('yorb_shop_exit');
  }

  private renderShopMenu(): void {
    this.shopContainer?.destroy();
    this.shopContainer = this.add.container(0, 0).setDepth(2000).setScrollFactor(0);

    // Full-screen dark overlay
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111111, 0.92)
      .setScrollFactor(0);
    this.shopContainer.add(bg);

    // Shopkeeper portrait area (left side)
    const portraitBg = this.add.rectangle(80, 100, 140, 160, 0x1a1a2e, 1).setScrollFactor(0);
    const portraitBorder = this.add.rectangle(80, 100, 144, 164, COLORS.UI_BORDER, 1).setScrollFactor(0).setDepth(-1);
    this.shopContainer.add([portraitBorder, portraitBg]);

    // Draw Yorb big
    const yorbPortrait = this.add.sprite(80, 90, 'merchant', 0).setScale(5).setScrollFactor(0);
    this.shopContainer.add(yorbPortrait);

    // Name under portrait
    const nameText = this.add.text(80, 155, 'Kebabi Yorb', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setScrollFactor(0);
    this.shopContainer.add(nameText);

    // Zlorps display
    const zlorpDisplay = this.add.text(80, 172, `Zlorps: ${this.inventory.getState().zlorps}`, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffdd00',
    }).setOrigin(0.5).setScrollFactor(0);
    this.shopContainer.add(zlorpDisplay);

    // Title
    const title = this.add.text(GAME_WIDTH / 2 + 40, 12, 'YORB\'S DONER PALACE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setScrollFactor(0);
    this.shopContainer.add(title);

    // Decorative line
    const line = this.add.rectangle(GAME_WIDTH / 2 + 40, 24, 200, 1, COLORS.UI_BORDER).setScrollFactor(0);
    this.shopContainer.add(line);

    if (this.shopMode === 'main') {
      this.renderMainMenu();
    } else if (this.shopMode === 'buy') {
      this.renderBuyMenu();
    } else if (this.shopMode === 'talk') {
      this.renderTalkMenu();
    }
  }

  private renderMainMenu(): void {
    const menuItems = ['Buy', 'Talk', 'Exit'];
    const startX = 220;
    const startY = 60;

    // Menu box
    const menuBg = this.add.rectangle(startX + 70, startY + 40, 160, 90, 0x1a1a2e).setScrollFactor(0);
    const menuBorder = this.add.rectangle(startX + 70, startY + 40, 164, 94, COLORS.UI_BORDER).setScrollFactor(0);
    this.shopContainer!.add([menuBorder, menuBg]);

    for (let i = 0; i < menuItems.length; i++) {
      const isSelected = i === this.shopCursor;
      const cursor = isSelected ? '> ' : '  ';
      const color = isSelected ? '#ffffff' : '#888888';
      const text = this.add.text(startX + 10, startY + 10 + i * 22, `${cursor}${menuItems[i]}`, {
        fontSize: '11px', fontFamily: 'monospace', color,
      }).setScrollFactor(0);
      this.shopContainer!.add(text);
    }

    // Flavor text at bottom
    const flavorTexts = [
      '"What would you like, friend?"',
      '"I have stories to tell!"',
      '"Leaving so soon?"',
    ];
    const flavor = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, flavorTexts[this.shopCursor], {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0);
    this.shopContainer!.add(flavor);
  }

  private renderBuyMenu(): void {
    const startX = 165;
    const startY = 32;
    const visibleItems = 7;
    const scrollOffset = Math.max(0, this.shopBuyCursor - visibleItems + 1);

    // Item list box
    const listBg = this.add.rectangle(startX + 80, startY + 62, 190, 130, 0x1a1a2e).setScrollFactor(0);
    const listBorder = this.add.rectangle(startX + 80, startY + 62, 194, 134, COLORS.UI_BORDER).setScrollFactor(0);
    this.shopContainer!.add([listBorder, listBg]);

    // Header
    const header = this.add.text(startX + 5, startY + 2, 'ITEM              PRICE', {
      fontSize: '7px', fontFamily: 'monospace', color: '#e6c619',
    }).setScrollFactor(0);
    this.shopContainer!.add(header);

    for (let i = 0; i < visibleItems && i + scrollOffset < SHOP_INVENTORY.length; i++) {
      const idx = i + scrollOffset;
      const item = SHOP_INVENTORY[idx];
      const isSelected = idx === this.shopBuyCursor;
      const cursor = isSelected ? '>' : ' ';
      const color = isSelected ? '#ffffff' : '#aaaaaa';
      const canAfford = this.inventory.getState().zlorps >= item.price;
      const priceColor = canAfford ? (isSelected ? '#44ff44' : '#44aa44') : '#ff4444';

      const nameStr = item.name.padEnd(16).substring(0, 16);
      const itemText = this.add.text(startX + 3, startY + 14 + i * 16, `${cursor}${nameStr}`, {
        fontSize: '8px', fontFamily: 'monospace', color,
      }).setScrollFactor(0);
      const priceText = this.add.text(startX + 150, startY + 14 + i * 16, `${item.price}Z`, {
        fontSize: '8px', fontFamily: 'monospace', color: priceColor,
      }).setScrollFactor(0);
      this.shopContainer!.add([itemText, priceText]);
    }

    // Scroll indicators
    if (scrollOffset > 0) {
      const upArrow = this.add.text(startX + 175, startY + 8, '▲', {
        fontSize: '8px', fontFamily: 'monospace', color: '#e6c619',
      }).setScrollFactor(0);
      this.shopContainer!.add(upArrow);
    }
    if (scrollOffset + visibleItems < SHOP_INVENTORY.length) {
      const downArrow = this.add.text(startX + 175, startY + 14 + (visibleItems - 1) * 16, '▼', {
        fontSize: '8px', fontFamily: 'monospace', color: '#e6c619',
      }).setScrollFactor(0);
      this.shopContainer!.add(downArrow);
    }

    // Description box at bottom
    const selected = SHOP_INVENTORY[this.shopBuyCursor];
    const descBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 40, GAME_WIDTH - 20, 50, 0x1a1a2e).setScrollFactor(0);
    const descBorder = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 40, GAME_WIDTH - 16, 54, COLORS.UI_BORDER).setScrollFactor(0);
    this.shopContainer!.add([descBorder, descBg]);

    const descText = this.add.text(18, GAME_HEIGHT - 58, selected.description, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffffff',
      wordWrap: { width: GAME_WIDTH - 40 },
    }).setScrollFactor(0);
    this.shopContainer!.add(descText);

    const hint = this.add.text(18, GAME_HEIGHT - 22, '[E] Buy  [ESC] Back', {
      fontSize: '7px', fontFamily: 'monospace', color: '#888888',
    }).setScrollFactor(0);
    this.shopContainer!.add(hint);
  }

  private renderTalkMenu(): void {
    const talkKeys = ['yorb_shop_talk1', 'yorb_shop_talk2', 'yorb_shop_talk3', 'yorb_shop_talk4'];
    const talkKey = talkKeys[this.talkIndex % talkKeys.length];
    this.talkIndex++;

    // Close shop overlay briefly to show dialog
    this.shopContainer?.setVisible(false);

    const seq = DIALOG[talkKey];
    if (seq) {
      this.dialog.show(seq, () => {
        this.shopContainer?.setVisible(true);
        this.shopMode = 'main';
        this.shopCursor = 0;
        this.renderShopMenu();
      });
    }
  }

  private handleShopInput(keyCode: string): void {
    if (!this.shopOpen || this.dialog.active) return;

    if (this.shopMode === 'main') {
      if (keyCode === 'UP' || keyCode === 'W') {
        this.shopCursor = Math.max(0, this.shopCursor - 1);
        this.renderShopMenu();
      } else if (keyCode === 'DOWN' || keyCode === 'S') {
        this.shopCursor = Math.min(2, this.shopCursor + 1);
        this.renderShopMenu();
      } else if (keyCode === 'E' || keyCode === 'ENTER' || keyCode === 'SPACE') {
        if (this.shopCursor === 0) {
          this.shopMode = 'buy';
          this.shopBuyCursor = 0;
          this.renderShopMenu();
        } else if (this.shopCursor === 1) {
          this.shopMode = 'talk';
          this.renderShopMenu();
        } else {
          this.closeShopMenu();
        }
      } else if (keyCode === 'ESC') {
        this.closeShopMenu();
      }
    } else if (this.shopMode === 'buy') {
      if (keyCode === 'UP' || keyCode === 'W') {
        this.shopBuyCursor = Math.max(0, this.shopBuyCursor - 1);
        this.renderShopMenu();
      } else if (keyCode === 'DOWN' || keyCode === 'S') {
        this.shopBuyCursor = Math.min(SHOP_INVENTORY.length - 1, this.shopBuyCursor + 1);
        this.renderShopMenu();
      } else if (keyCode === 'E' || keyCode === 'ENTER' || keyCode === 'SPACE') {
        this.tryBuyItem();
      } else if (keyCode === 'ESC') {
        this.shopMode = 'main';
        this.shopCursor = 0;
        this.renderShopMenu();
      }
    }
  }

  private tryBuyItem(): void {
    const item = SHOP_INVENTORY[this.shopBuyCursor];
    const state = this.inventory.getState();

    if (state.zlorps < item.price) {
      this.showShopDialog('yorb_shop_no_money', true);
      return;
    }

    // Buy the item
    this.inventory.addZlorps(-item.price);
    this.inventory.addItem(item.key);

    // Apply consumable effects immediately for food items
    const def = ITEMS[item.key];
    if (def?.type === 'consumable') {
      if (item.key === 'doner_wrap') {
        this.player.hp = this.player.maxHp;
      } else if (item.key === 'ayran') {
        this.player.heal(2);
      } else if (item.key === 'baklava') {
        this.player.heal(4);
      } else if (item.key === 'mystery_meat') {
        this.player.heal(1);
      }
    }

    this.showShopDialog('yorb_shop_thanks', true);
  }

  private persistAndLeave(): void {
    if (this.leaving) return;
    this.leaving = true;

    const invState = this.inventory.getState();
    this.saveData.playerHealth = this.player.hp;
    this.saveData.zlorps = invState.zlorps;
    this.saveData.ammo = invState.ammo;
    this.saveData.inventory = [...invState.items];
    this.saveData.hasLegendSword = invState.hasLegendSword;
    this.saveData.hasShield = invState.hasShield;
    this.saveData.hasBlaster = invState.hasBlaster;
    this.saveData.questFlags = this.quest.getFlags();
    this.registry.set('saveData', this.saveData);

    const returnScene = this.interiorData.returnScene;
    const returnData = {
      spawnX: this.interiorData.returnX,
      spawnY: this.interiorData.returnY,
    };
    try {
      this.dialog?.destroy();
      this.inventory?.destroy();
    } catch { /* cleanup errors are non-fatal */ }
    // Let Phaser's scene manager queue this transition — it will process it
    // after the current update cycle completes via processQueue().
    // Do NOT use requestAnimationFrame as it breaks Phaser's RAF game loop.
    this.scene.start(returnScene, returnData);
  }

  update(time: number): void {
    const frozen = this.dialog.active || this.inventory.opened || this.shopOpen || this.leaving;
    this.player.update(time, frozen);

    if (this.dialog.active && (this.player.isKeyJustDown('e') || this.player.isKeyJustDown('space'))) {
      this.dialog.advance();
    }

    // Exit check — walk near the door to leave (generous range)
    if (!this.dialog.active && !this.shopOpen && !this.leaving) {
      const dy = this.player.sprite.y - this.doorY;
      const dx = Math.abs(this.player.sprite.x - this.doorX);
      // Trigger when player is at or below the door row, and horizontally close
      if (dy >= -8 && dx < 24) {
        this.persistAndLeave();
      }
    }
  }

  private setupShopInput(): void {
    this.input.keyboard?.on('keydown-UP', () => this.handleShopInput('UP'));
    this.input.keyboard?.on('keydown-DOWN', () => this.handleShopInput('DOWN'));
    this.input.keyboard?.on('keydown-W', () => this.handleShopInput('UP'));
    this.input.keyboard?.on('keydown-S', () => this.handleShopInput('DOWN'));
    this.input.keyboard?.on('keydown-E', () => this.handleShopInput('E'));
    this.input.keyboard?.on('keydown-ENTER', () => this.handleShopInput('E'));
    this.input.keyboard?.on('keydown-SPACE', () => this.handleShopInput('E'));
    this.input.keyboard?.on('keydown-ESC', () => this.handleShopInput('ESC'));
  }
}
