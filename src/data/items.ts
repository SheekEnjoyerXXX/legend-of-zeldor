export interface ItemDef {
  key: string;
  name: string;
  description: string;
  type: 'weapon' | 'key_item' | 'consumable' | 'currency' | 'joke';
  spriteKey: string;
  stackable: boolean;
  damage?: number;
}

export const ITEMS: Record<string, ItemDef> = {
  legend_sword: {
    key: 'legend_sword', name: 'Legend Sword', description: 'A slightly warm legendary blade.',
    type: 'weapon', spriteKey: 'legend_sword', stackable: false, damage: 2,
  },
  shield: {
    key: 'shield', name: 'Ditch Shield', description: 'Found in a ditch. Still blocks stuff.',
    type: 'weapon', spriteKey: 'shield_item', stackable: false, damage: 0,
  },
  blaster: {
    key: 'blaster', name: 'A-OK 47', description: 'Pixel blaster. Very tactical. Very nonsense.',
    type: 'weapon', spriteKey: 'blaster_item', stackable: false, damage: 2,
  },
  banana_sword: {
    key: 'banana_sword', name: 'Banana Blade', description: 'A sword made from an ancient banana. Smells heroic.',
    type: 'weapon', spriteKey: 'banana', stackable: false, damage: 1,
  },
  fish_slapper: {
    key: 'fish_slapper', name: 'Fish Slapper', description: 'A large wet fish. Deals bonus embarrassment damage.',
    type: 'weapon', spriteKey: 'heart_pickup', stackable: false, damage: 3,
  },
  pixel_hammer: {
    key: 'pixel_hammer', name: 'Pixel Hammer', description: 'So pixelated it hurts. Literally.',
    type: 'weapon', spriteKey: 'pushblock', stackable: false, damage: 4,
  },
  cursed_spoon: {
    key: 'cursed_spoon', name: 'Cursed Spoon', description: 'Stolen from a wizard cafeteria. Very slightly magical.',
    type: 'weapon', spriteKey: 'key', stackable: false, damage: 1,
  },
  toilet_plunger: {
    key: 'toilet_plunger', name: 'Toilet Plunger of Destiny', description: 'The chosen plunger. Foretold by prophecy. Smells bad.',
    type: 'weapon', spriteKey: 'torch', stackable: false, damage: 2,
  },
  key: {
    key: 'key', name: 'Key', description: 'Opens locked things.',
    type: 'key_item', spriteKey: 'key', stackable: true,
  },
  portal_shard: {
    key: 'portal_shard', name: 'Portal Shard', description: 'Glowing fragment of time energy.',
    type: 'key_item', spriteKey: 'portal_shard', stackable: true,
  },
  banana_relic: {
    key: 'banana_relic', name: 'Banana Relic', description: 'An ancient banana of mysterious power.',
    type: 'key_item', spriteKey: 'banana', stackable: false,
  },
  heart_container: {
    key: 'heart_container', name: 'Heart Container', description: '+2 max HP!',
    type: 'consumable', spriteKey: 'heart_pickup', stackable: false,
  },
  rubber_duck: {
    key: 'rubber_duck', name: 'Rubber Duck', description: 'Squeaks when you squeeze it. That is all.',
    type: 'joke', spriteKey: 'rubber_duck', stackable: false,
  },
  single_sock: {
    key: 'single_sock', name: 'Single Sock', description: 'Its partner is lost forever. Tragic.',
    type: 'joke', spriteKey: 'sock', stackable: false,
  },
  cursed_coin: {
    key: 'cursed_coin', name: 'Cursed Coin', description: 'Makes your screen shake slightly. Why.',
    type: 'joke', spriteKey: 'zlorp', stackable: false,
  },
  mystery_pickle: {
    key: 'mystery_pickle', name: 'Mystery Pickle', description: 'Is it a pickle? Is it a cucumber? Nobody knows.',
    type: 'consumable', spriteKey: 'pickle', stackable: false,
  },
  boot: {
    key: 'boot', name: 'Smelly Boot', description: 'A terrible left boot. Belongs to Bob.',
    type: 'key_item', spriteKey: 'sock', stackable: false,
  },
  doner_wrap: {
    key: 'doner_wrap', name: 'Perfect Doner', description: 'A magnificent Turkish doner kebab. Restores all HP.',
    type: 'consumable', spriteKey: 'heart_pickup', stackable: false,
  },
  ayran: {
    key: 'ayran', name: 'Ayran', description: 'A cold yogurt drink. Refreshing! Heals 2 HP.',
    type: 'consumable', spriteKey: 'ammo_pickup', stackable: true,
  },
  baklava: {
    key: 'baklava', name: 'Baklava', description: 'Flaky pastry dripping with honey. Heals 4 HP.',
    type: 'consumable', spriteKey: 'zlorp', stackable: true,
  },
  kebab_skewer: {
    key: 'kebab_skewer', name: 'Kebab Skewer', description: 'A sharpened skewer. Pokes enemies effectively.',
    type: 'weapon', spriteKey: 'torch', stackable: false, damage: 2,
  },
  hot_sauce: {
    key: 'hot_sauce', name: 'Yorb\'s Hot Sauce', description: 'EXTREMELY hot. Temporary +1 damage... and tears.',
    type: 'consumable', spriteKey: 'heart_pickup', stackable: true,
  },
  stale_pide: {
    key: 'stale_pide', name: 'Stale Pide', description: 'A Turkish flatbread. Hard as a brick. Could be a weapon?',
    type: 'joke', spriteKey: 'pushblock', stackable: false,
  },
  mystery_meat: {
    key: 'mystery_meat', name: 'Mystery Meat', description: 'Don\'t ask what it is. Just don\'t. Heals 1 HP.',
    type: 'consumable', spriteKey: 'sock', stackable: true,
  },
  golden_spatula: {
    key: 'golden_spatula', name: 'Golden Spatula', description: 'Yorb\'s prized possession. Flips enemies AND burgers.',
    type: 'weapon', spriteKey: 'key', stackable: false, damage: 3,
  },
};

// Items Pick the Pickle can give
export const PICKLE_GIFT_POOL: string[] = [
  'heart_container', 'rubber_duck', 'single_sock', 'cursed_coin', 'mystery_pickle',
  'key', 'portal_shard',
];
