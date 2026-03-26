// All NPC and event dialog in the game

export interface DialogLine {
  speaker: string;
  text: string;
}

export type DialogSequence = DialogLine[];

export const DIALOG: Record<string, DialogSequence> = {
  // === VILLAGE OF MUDFORK ===
  village_elder: [
    { speaker: 'Elder Grumbold', text: 'Ah, Linkler! The shortest hero in all of Mudfork!' },
    { speaker: 'Elder Grumbold', text: 'Princess Zeldor has been captured by the ogre Shreek!' },
    { speaker: 'Elder Grumbold', text: 'You must retrieve the Legend Sword from the shrine...' },
    { speaker: 'Elder Grumbold', text: 'Then pass through the Gates of Time!' },
    { speaker: 'Linkler', text: '...' },
    { speaker: 'Elder Grumbold', text: 'Such wisdom in your silence.' },
  ],
  village_woman: [
    { speaker: 'Dorma', text: 'My husband went to the shrine and never came back.' },
    { speaker: 'Dorma', text: 'Actually he went to the tavern. Forget I said anything.' },
  ],
  village_guard: [
    { speaker: 'Guard', text: 'I would help but I have a very bad knee situation.' },
    { speaker: 'Guard', text: 'Also I am scared of basically everything.' },
  ],
  village_chicken_man: [
    { speaker: 'Farmer Kluk', text: 'My chickens are REVOLTING! Not ugly — actually revolting!' },
    { speaker: 'Farmer Kluk', text: 'Chase them back into the pen and I will give you a shield!' },
  ],
  village_chicken_done: [
    { speaker: 'Farmer Kluk', text: 'You did it! Here, take this shield I found in a ditch!' },
  ],
  village_kid: [
    { speaker: 'Small Child', text: 'When I grow up I want to be a pot.' },
  ],
  village_merchant: [
    { speaker: 'Merchant Yorb', text: 'Welcome to Yorb\'s Ye Olde Shoppe of Mild Value!' },
  ],
  pot_smash: [
    { speaker: '', text: 'You smashed a pot. The pottery council will hear about this.' },
  ],

  // === SHRINE ===
  shrine_entrance: [
    { speaker: '', text: 'Ancient Shrine of the Legend Sword' },
    { speaker: '', text: 'ENTER IF YOU DARE... or if you have nothing better to do.' },
  ],
  shrine_plaque: [
    { speaker: '', text: 'Only a hero of truly short stature may claim the blade.' },
    { speaker: '', text: 'This is incredibly convenient for you specifically.' },
  ],
  legend_sword_get: [
    { speaker: '', text: 'You got the LEGEND SWORD!' },
    { speaker: '', text: '♪ Da da da daaaaa! ♪' },
    { speaker: 'Linkler', text: '...nice.' },
    { speaker: '', text: 'The sword is slightly warm. Is that normal?' },
  ],
  stone_sentinel_intro: [
    { speaker: 'Stone Idiot Sentinel', text: 'WHO DARES ENTER MY—' },
    { speaker: 'Stone Idiot Sentinel', text: 'wait hold on I forgot my line' },
    { speaker: 'Stone Idiot Sentinel', text: 'WHO DARES— yeah that was it. Prepare to fight!' },
  ],
  stone_sentinel_defeat: [
    { speaker: 'Stone Idiot Sentinel', text: 'Impossible... defeated by a dwarf...' },
    { speaker: 'Stone Idiot Sentinel', text: 'Tell my wife... I was... moderately tall...' },
  ],

  // === FIELDS ===
  fields_sign1: [
    { speaker: '', text: 'Sign reads: "FIELDS OF MILD PERIL - Danger Level: Meh"' },
  ],
  fields_sign2: [
    { speaker: '', text: 'Sign reads: "Gates of Time: NORTH. Certain doom: ALSO NORTH."' },
  ],
  lost_boot_quest: [
    { speaker: 'Barefoot Bob', text: 'I lost my boot somewhere in these fields!' },
    { speaker: 'Barefoot Bob', text: 'It\'s a left boot. Brown. Smells terrible. Can\'t miss it.' },
  ],
  lost_boot_done: [
    { speaker: 'Barefoot Bob', text: 'MY BOOT! You found it!' },
    { speaker: 'Barefoot Bob', text: 'Here, take these Zlorps. I am so happy right now.' },
  ],
  escort_villager: [
    { speaker: 'Nervous Ned', text: 'C-can you walk me to the merchant shack?' },
    { speaker: 'Nervous Ned', text: 'I\'m scared of grass. And air. And also you.' },
  ],
  escort_done: [
    { speaker: 'Nervous Ned', text: 'We made it! Here, take this portal shard I found!' },
    { speaker: 'Nervous Ned', text: 'I have no idea what it does but it was glowing and warm.' },
  ],
  watchtower_sign: [
    { speaker: '', text: 'Ruined Watchtower. Someone carved "SHREEK WUZ HERE" into the stone.' },
  ],

  // === DONER MINI-GAME ===
  doner_chef: [
    { speaker: 'Chef Kebabi', text: 'Halt! You cannot pass the Spice Gate without proper sustenance!' },
    { speaker: 'Chef Kebabi', text: 'You must prepare a TURKISH DONER to survive the journey ahead!' },
    { speaker: 'Chef Kebabi', text: 'Stack the meat, add the sauce, wrap the bread! Time is ticking!' },
  ],
  doner_success: [
    { speaker: 'Chef Kebabi', text: 'MAGNIFICENT! A doner worthy of the Digital Realm!' },
    { speaker: 'Chef Kebabi', text: 'Your health is fully restored! The spices protect you!' },
    { speaker: '', text: 'HP fully restored! You smell delicious.' },
  ],
  doner_fail: [
    { speaker: 'Chef Kebabi', text: 'That is NOT a doner! That is a CRIME against cuisine!' },
    { speaker: 'Chef Kebabi', text: 'Try again! The gate remains sealed to the hungry!' },
  ],

  // === GATES OF TIME ===
  gates_plaque: [
    { speaker: '', text: 'THE GATES OF TIME' },
    { speaker: '', text: 'Beyond this portal lies the Digital Realm.' },
    { speaker: '', text: 'Warning: may contain glitches, errors, and existential dread.' },
  ],
  gatekeeper_intro: [
    { speaker: 'Gatekeeper 2000', text: 'BZZT... INTRUDER DETECTED...' },
    { speaker: 'Gatekeeper 2000', text: 'RUNNING THREAT_ASSESSMENT.exe...' },
    { speaker: 'Gatekeeper 2000', text: 'RESULT: LAUGHABLY SHORT. ENGAGING COMBAT PROTOCOL.' },
  ],
  gatekeeper_defeat: [
    { speaker: 'Gatekeeper 2000', text: 'CRITICAL ERROR... DIGNITY.dll NOT FOUND...' },
    { speaker: '', text: 'The Gates of Time shudder open!' },
  ],
  portal_enter: [
    { speaker: '', text: 'You step through the portal...' },
    { speaker: '', text: 'Reality bends. Pixels scramble. You smell burning WiFi.' },
    { speaker: '', text: 'Welcome to the Digital Realm.' },
  ],

  // === DIGITAL REALM ===
  digital_glitch_sign: [
    { speaker: '', text: 'ERROR 404: Sign Not Fo█nd' },
  ],
  captcha_intro: [
    { speaker: '', text: 'CAPTCHA DUNGEON: Prove you are not a bot.' },
    { speaker: '', text: 'Select all images containing PICKLES.' },
  ],
  captcha_success: [
    { speaker: '', text: 'CAPTCHA VERIFIED. You are probably human.' },
  ],

  // === MEME SEWERS ===
  sewer_entrance: [
    { speaker: '', text: 'You descend into the Meme Sewers.' },
    { speaker: '', text: 'It smells like old JPEGs and regret.' },
  ],
  king_slop_intro: [
    { speaker: 'King Slop.exe', text: 'GLRRRBB! I am King Slop! Lord of the Sewer Data!' },
    { speaker: 'King Slop.exe', text: 'I have eaten SO MANY corrupt files!' },
    { speaker: 'King Slop.exe', text: 'And now... I will eat YOU! GLRRRBB!' },
  ],
  king_slop_defeat: [
    { speaker: 'King Slop.exe', text: 'GLRRRBB... I\'m... decomposing...' },
    { speaker: 'King Slop.exe', text: 'Tell my children... all 47,000 of them... daddy loves—' },
    { speaker: '', text: 'King Slop.exe has stopped responding.' },
  ],
  blaster_get: [
    { speaker: '', text: 'You found the A-OK 47! A ridiculous pixelated blaster!' },
    { speaker: '', text: 'It fires chunky energy bolts. Very tactical. Very nonsense.' },
  ],

  // === FORTRESS OF SHREEK ===
  fortress_entrance: [
    { speaker: '', text: 'FORTRESS OF SHREEK' },
    { speaker: '', text: 'A massive portrait of Shreek greets you. He looks... confident.' },
  ],
  shreek_portrait: [
    { speaker: '', text: 'A painting of Shreek. Caption reads: "Handsomest Ogre 2024"' },
  ],
  shreek_intro: [
    { speaker: 'Shreek', text: 'WELL WELL WELL! A tiny dwarf in MY swamp fortress!' },
    { speaker: 'Shreek', text: 'I am SHREEK! The most beautiful ogre in the Digital Realm!' },
    { speaker: 'Shreek', text: 'Princess Zeldor is MINE! She tells me I am handsome!' },
    { speaker: 'Linkler', text: '...' },
    { speaker: 'Shreek', text: 'STOP JUDGING ME WITH YOUR SILENCE!' },
  ],
  shreek_phase2: [
    { speaker: 'Shreek', text: 'OW! That actually hurt!' },
    { speaker: 'Shreek', text: 'Time for my SPECIAL MOVE! *spits aggressively*' },
  ],
  shreek_phase3: [
    { speaker: 'Shreek', text: 'NO NO NO! I\'m going FULL GLITCH MODE!' },
    { speaker: 'Shreek', text: 'AAAAA█AAAGH██!' },
  ],
  shreek_defeat: [
    { speaker: 'Shreek', text: 'Im... impossible...' },
    { speaker: 'Shreek', text: 'I was supposed to be... the main character...' },
    { speaker: '', text: 'Shreek dissolves into pixels.' },
  ],

  // === FINALE ===
  zeldor_rescue: [
    { speaker: 'Princess Zeldor', text: 'Oh brave hero! You have rescued me!' },
    { speaker: 'Princess Zeldor', text: 'I am Princess Zeldor, AI of the Digital Realm!' },
    { speaker: 'Princess Zeldor', text: 'Now we can finally—' },
    { speaker: 'Princess Zeldor', text: 'Wait. Something is wrong. My circuits are—' },
    { speaker: '', text: '*BZZZZT*' },
    { speaker: 'Princess Zeldor', text: 'I am experiencing a FATAL ERR—' },
  ],
  zeldor_banana: [
    { speaker: '', text: 'Princess Zeldor explodes in a shower of sparks!' },
    { speaker: '', text: '...' },
    { speaker: '', text: 'She has turned into a banana.' },
    { speaker: 'Linkler', text: '...' },
    { speaker: '', text: 'The banana says nothing. It is a banana.' },
  ],
  netanyahu_cameo: [
    { speaker: 'Benjamin Netanyahu', text: 'Congratulations, player.' },
    { speaker: 'Benjamin Netanyahu', text: 'You have completed Legend of Zeldor.' },
    { speaker: 'Benjamin Netanyahu', text: 'I have no idea why I am here.' },
    { speaker: 'Benjamin Netanyahu', text: 'Goodbye.' },
  ],
  fish_ending: [
    { speaker: '', text: 'And so, the legend ends...' },
    { speaker: '', text: 'Not with a bang, but with a fish.' },
  ],

  // === PICK THE PICKLE ===
  pickle_appear: [
    { speaker: 'Pick the Pickle', text: 'Greetings, small warrior! I am Pick the Pickle!' },
    { speaker: 'Pick the Pickle', text: 'Philosopher. Merchant. Cucumber of mystery.' },
  ],
  pickle_item: [
    { speaker: 'Pick the Pickle', text: 'Take this. I found it in the void between worlds.' },
    { speaker: 'Pick the Pickle', text: 'Or maybe it was behind a dumpster. Hard to say.' },
  ],
  pickle_wisdom: [
    { speaker: 'Pick the Pickle', text: 'Remember: every pickle was once a cucumber with dreams.' },
  ],
  pickle_farewell: [
    { speaker: 'Pick the Pickle', text: 'Until we meet again, in this life or the next brine.' },
  ],

  // === HOME INTERIORS ===
  elder_home: [
    { speaker: 'Elder Grumbold', text: 'What— You just WALKED into my house?!' },
    { speaker: 'Elder Grumbold', text: 'In my day we had LOCKS. And MANNERS.' },
    { speaker: 'Elder Grumbold', text: 'Fine. Look around. Don\'t touch my turnip collection.' },
  ],
  kluk_home: [
    { speaker: 'Farmer Kluk', text: 'Hey! This is my private chicken-free sanctuary!' },
    { speaker: 'Farmer Kluk', text: 'Do you people not understand DOORS?!' },
    { speaker: 'Farmer Kluk', text: 'Whatever. Wipe your boots.' },
  ],
  yorb_home: [
    { speaker: 'Kebabi Yorb', text: 'HOSGELDINIZ! Welcome to Yorb\'s Legendary Doner Palace!' },
    { speaker: 'Kebabi Yorb', text: 'Best doner in all of Mudfork! Also the only doner! Also I sell weapons sometimes!' },
  ],
  yorb_shop_talk1: [
    { speaker: 'Kebabi Yorb', text: 'I used to be an adventurer like you. Then I discovered spices.' },
    { speaker: 'Kebabi Yorb', text: 'Now I spit-roast meat on a vertical rotisserie of DESTINY.' },
  ],
  yorb_shop_talk2: [
    { speaker: 'Kebabi Yorb', text: 'My great-grandfather invented the doner kebab in 1856.' },
    { speaker: 'Kebabi Yorb', text: 'Or was it 1972? History is confusing. The point is: MEAT.' },
  ],
  yorb_shop_talk3: [
    { speaker: 'Kebabi Yorb', text: 'That ogre Shreek ordered 40 doners once. Never paid.' },
    { speaker: 'Kebabi Yorb', text: 'If you defeat him, tell him he owes me 200 Zlorps.' },
  ],
  yorb_shop_talk4: [
    { speaker: 'Kebabi Yorb', text: 'The secret ingredient? Love. And also an unreasonable amount of garlic sauce.' },
  ],
  yorb_shop_buy: [
    { speaker: 'Kebabi Yorb', text: 'What catches your eye, little warrior? Everything is fresh! ...mostly!' },
  ],
  yorb_shop_sell: [
    { speaker: 'Kebabi Yorb', text: 'You want to SELL things? To ME? At MY doner restaurant?' },
    { speaker: 'Kebabi Yorb', text: 'I only accept meat-based currencies. And Zlorps. Fine, show me.' },
  ],
  yorb_shop_no_money: [
    { speaker: 'Kebabi Yorb', text: 'You don\'t have enough Zlorps! Come back when you have real money!' },
    { speaker: 'Kebabi Yorb', text: 'Or defeat some monsters! They drop coins! It\'s a whole economy!' },
  ],
  yorb_shop_thanks: [
    { speaker: 'Kebabi Yorb', text: 'Excellent purchase! May the spices guide your blade!' },
  ],
  yorb_shop_exit: [
    { speaker: 'Kebabi Yorb', text: 'Come back soon! And tell your friends! I accept group bookings!' },
  ],
  empty_hut: [
    { speaker: '', text: 'The hut is abandoned. Cobwebs everywhere.' },
    { speaker: '', text: 'Someone scratched "SHREEK SUCKS" into the wall.' },
  ],

  // === STORY HINTS (stage-aware) ===
  elder_after_sword: [
    { speaker: 'Elder Grumbold', text: 'You have the Legend Sword! Now head EAST to the Fields!' },
    { speaker: 'Elder Grumbold', text: 'Beyond the Fields lie the Gates of Time. Zeldor awaits!' },
  ],
  elder_after_gates: [
    { speaker: 'Elder Grumbold', text: 'You braved the Gates? Incredible!' },
    { speaker: 'Elder Grumbold', text: 'Navigate the Digital Realm, defeat whatever lurks below.' },
  ],

  // === GENERIC ===
  locked_door: [
    { speaker: '', text: 'The door is locked. You need a key.' },
  ],
  empty_chest: [
    { speaker: '', text: 'The chest is empty. Someone got here first. Rude.' },
  ],
  save_point: [
    { speaker: '', text: 'Progress saved! If you die, you\'ll respawn here.' },
    { speaker: '', text: '(That\'s not a threat. Just information.)' },
  ],
};
