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
  pickle_toss: {
    key: 'pickle_toss', name: 'Pickle Toss Champion',
    description: 'Win the Pickle Toss mini-game.',
    completionFlag: 'quest_pickle_toss_done',
    reward: { zlorps: 20, item: 'mystery_pickle' },
  },
  target_practice: {
    key: 'target_practice', name: 'Target Practice',
    description: 'Hit 5 targets with the A-OK 47.',
    completionFlag: 'quest_target_done',
    reward: { item: 'ammo_upgrade' },
  },
};
