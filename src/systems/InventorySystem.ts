import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/constants';
import { ITEMS, ItemDef } from '../data/items';

export interface InventoryState {
  items: string[];
  zlorps: number;
  ammo: number;
  keys: number;
  hasLegendSword: boolean;
  hasShield: boolean;
  hasBlaster: boolean;
  selectedWeapon: 'sword' | 'blaster';
}

export class InventorySystem {
  private scene: Phaser.Scene;
  private state: InventoryState;
  private container: Phaser.GameObjects.Container;
  private isOpen = false;

  constructor(scene: Phaser.Scene, initialState?: Partial<InventoryState>) {
    this.scene = scene;
    this.state = {
      items: [],
      zlorps: 0,
      ammo: 0,
      keys: 0,
      hasLegendSword: false,
      hasShield: false,
      hasBlaster: false,
      selectedWeapon: 'sword',
      ...initialState,
    };

    this.container = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    this.buildUI();
  }

  private buildUI(): void {
    // Background overlay
    const bg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40, 0x111122, 0.95)
      .setScrollFactor(0);
    const border = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 36, GAME_HEIGHT - 36)
      .setStrokeStyle(2, COLORS.UI_BORDER).setFillStyle(0x000000, 0).setScrollFactor(0);

    const title = this.scene.add.text(GAME_WIDTH / 2, 28, 'INVENTORY', {
      fontSize: '12px', fontFamily: 'monospace', color: '#e6c619',
    }).setOrigin(0.5).setScrollFactor(0);

    this.container.add([bg, border, title]);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.refresh();
    }
    this.container.setVisible(this.isOpen);
  }

  close(): void {
    this.isOpen = false;
    this.container.setVisible(false);
  }

  private refresh(): void {
    // Remove old dynamic content
    this.container.list.filter(
      (obj): obj is Phaser.GameObjects.Text => obj instanceof Phaser.GameObjects.Text && obj.getData('dynamic')
    ).forEach(obj => obj.destroy());

    const x = 30;
    let y = 50;
    const addLine = (text: string) => {
      const t = this.scene.add.text(x, y, text, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
      }).setScrollFactor(0).setData('dynamic', true);
      this.container.add(t);
      y += 14;
    };

    addLine(`Zlorps: ${this.state.zlorps}`);
    addLine(`Keys: ${this.state.keys}`);
    addLine(`Ammo: ${this.state.ammo}`);
    addLine('');
    addLine('-- Weapons --');
    if (this.state.hasLegendSword) addLine(`  Legend Sword ${this.state.selectedWeapon === 'sword' ? '[EQUIPPED]' : ''}`);
    if (this.state.hasShield) addLine('  Ditch Shield');
    if (this.state.hasBlaster) addLine(`  A-OK 47 ${this.state.selectedWeapon === 'blaster' ? '[EQUIPPED]' : ''}`);
    addLine('');
    addLine('-- Items --');
    const itemCounts = new Map<string, number>();
    for (const itemKey of this.state.items) {
      itemCounts.set(itemKey, (itemCounts.get(itemKey) ?? 0) + 1);
    }
    for (const [itemKey, count] of itemCounts) {
      const def: ItemDef | undefined = ITEMS[itemKey];
      if (def) {
        addLine(`  ${def.name}${count > 1 ? ` x${count}` : ''} - ${def.description}`);
      }
    }
    if (this.state.items.length === 0) addLine('  (empty)');

    addLine('');
    addLine('[I] Close   [J/K] Switch Weapon');
  }

  addItem(key: string): void {
    if (key === 'legend_sword') { this.state.hasLegendSword = true; return; }
    if (key === 'shield') { this.state.hasShield = true; return; }
    if (key === 'blaster') { this.state.hasBlaster = true; return; }
    if (key === 'zlorp') { this.state.zlorps += 1; return; }
    if (key === 'key') { this.state.keys += 1; return; }
    if (key === 'ammo') { this.state.ammo += 5; return; }
    this.state.items.push(key);
  }

  removeItem(key: string): boolean {
    const idx = this.state.items.indexOf(key);
    if (idx >= 0) { this.state.items.splice(idx, 1); return true; }
    return false;
  }

  hasItem(key: string): boolean {
    if (key === 'legend_sword') return this.state.hasLegendSword;
    if (key === 'shield') return this.state.hasShield;
    if (key === 'blaster') return this.state.hasBlaster;
    return this.state.items.includes(key);
  }

  useKey(): boolean {
    if (this.state.keys > 0) { this.state.keys--; return true; }
    return false;
  }

  useAmmo(): boolean {
    if (this.state.ammo > 0) { this.state.ammo--; return true; }
    return false;
  }

  addZlorps(amount: number): void { this.state.zlorps += amount; }

  switchWeapon(): void {
    if (this.state.hasBlaster && this.state.hasLegendSword) {
      this.state.selectedWeapon = this.state.selectedWeapon === 'sword' ? 'blaster' : 'sword';
    }
  }

  getState(): InventoryState { return this.state; }
  get opened(): boolean { return this.isOpen; }

  destroy(): void { this.container.destroy(); }
}
