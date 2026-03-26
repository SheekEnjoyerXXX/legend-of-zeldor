export interface QuestDef {
  key: string;
  name: string;
  description: string;
  completionFlag: string;
  reward: QuestReward;
}

export interface QuestReward {
  item?: string;
  zlorps?: number;
  health?: number;
}

export interface StoryStep {
  objective: string;
  completionFlag?: string;
  scene?: string;
}

/** Main story progression - each step unlocks the next when its flag is set */
export const STORY_STEPS: StoryStep[] = [
  { objective: 'Talk to Elder Grumbold in the village', completionFlag: 'talked_to_elder', scene: 'VillageScene' },
  { objective: 'Find the Legend Sword in the Shrine (north)', completionFlag: 'has_legend_sword', scene: 'ShrineScene' },
  { objective: 'Travel east to the Fields of Mild Peril', completionFlag: 'reached_fields', scene: 'FieldsScene' },
  { objective: 'Head north to the Gates of Time', completionFlag: 'reached_gates', scene: 'GatesScene' },
  { objective: 'Activate 3 switches and defeat the Gatekeeper', completionFlag: 'gatekeeper_defeated', scene: 'GatesScene' },
  { objective: 'Navigate the Digital Realm to the Sewers', completionFlag: 'reached_sewers', scene: 'DigitalRealmScene' },
  { objective: 'Defeat King Slop.exe in the Meme Sewers', completionFlag: 'sewer_boss_defeated', scene: 'MemeSewersScene' },
  { objective: 'Storm the Fortress and defeat Shreek!', completionFlag: 'shreek_defeated', scene: 'FortressScene' },
  { objective: 'Rescue Princess Zeldor!' },
];

export const QUESTS: Record<string, QuestDef> = {
  chicken_chase: {
    key: 'chicken_chase', name: 'Chicken Revolt',
    description: 'Chase Farmer Kluk\'s chickens back into the pen.',
    completionFlag: 'quest_chicken_done',
    reward: { item: 'shield' },
  },
  lost_boot: {
    key: 'lost_boot', name: 'The Missing Boot',
    description: 'Find Barefoot Bob\'s lost boot in the fields.',
    completionFlag: 'quest_boot_done',
    reward: { zlorps: 30 },
  },
  escort_ned: {
    key: 'escort_ned', name: 'Nervous Escort',
    description: 'Walk Nervous Ned to the merchant shack.',
    completionFlag: 'quest_escort_done',
    reward: { item: 'portal_shard' },
  },
  doner_survival: {
    key: 'doner_survival', name: 'Doner Survival',
    description: 'Make a Turkish doner to pass the Spice Gate.',
    completionFlag: 'quest_doner_done',
    reward: { health: 99 },
  },
};
