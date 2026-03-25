# Legend of Zeldor

A comedic, lovingly crafted parody retro adventure game inspired by classic 8-bit top-down fantasy games. Built with Phaser 3, TypeScript, and Vite.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

To build for production:
```bash
npm run build
npm run preview
```

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move |
| J | Attack (sword) |
| K | Shield (block) |
| L | Ranged Attack (A-OK 47 blaster) |
| E / Space | Interact / Confirm dialog |
| I | Inventory |
| Enter | Pause |
| Shift | Sprint |

## Story

You play as **Linkler**, a very short dwarf hero from the Village of Mudfork. Princess Zeldor, the AI robot princess, has been kidnapped by **Shreek**, a very stupid-looking ogre. You must retrieve the Legend Sword, travel through the Gates of Time into the Digital Realm, and rescue her.

Along the way you'll encounter **Pick the Pickle** (a philosophical cucumber merchant), **ObamaSpheres** (floating orb enemies), and a series of increasingly absurd bosses.

## Game Structure

1. **Village of Mudfork** - Learn the ropes, chase chickens, get a shield
2. **Ancient Shrine** - Defeat the Stone Idiot Sentinel, claim the Legend Sword
3. **Fields of Mild Peril** - Side quests, Pickle Toss, find the missing boot
4. **Gates of Time** - Activate switches, make a Turkish doner, defeat the Gatekeeper 2000
5. **Digital Realm** - Teleport pads, disappearing tiles, glitch aesthetics
6. **Meme Sewers** - Fight King Slop.exe, obtain the A-OK 47 blaster
7. **Fortress of Shreek** - Combat gauntlet, fight Shreek (3 phases)
8. **Finale** - Experience the ending. All of it. Including the fish.

## Dev Mode

Add `?dev=1` to the URL for:
- Scene select hotkeys on title screen (V/H/F/G/R/M/O/N)
- All weapons unlocked when jumping to a scene
- Debug hotkeys in-game:
  - 1: Full heal
  - 2: Add key
  - 3: Add 50 Zlorps
  - 4: Unlock all weapons
- ESC to exit the fish ending screen

## Tech Stack

- **Phaser 3** - Game engine
- **TypeScript** - Language (strict mode)
- **Vite** - Dev server and bundler
- **All assets generated programmatically** - No external art/audio files needed

## Project Structure

```
src/
  main.ts              # Entry point
  game/
    config.ts          # Phaser config
    constants.ts       # Game constants
    save.ts            # LocalStorage save system
    audio.ts           # Programmatic audio generation
    utils/sprites.ts   # Programmatic sprite generation
  scenes/
    BaseGameScene.ts   # Shared gameplay logic
    BootScene.ts       # Boot
    PreloadScene.ts    # Asset generation
    TitleScene.ts      # Title screen
    IntroScene.ts      # Story intro
    VillageScene.ts    # Village of Mudfork
    ShrineScene.ts     # Legend Sword shrine
    FieldsScene.ts     # Overworld fields
    GatesScene.ts      # Gates of Time
    DigitalRealmScene.ts # Digital Realm
    MemeSewersScene.ts # Meme Sewers
    FortressScene.ts   # Fortress of Shreek
    FinaleScene.ts     # Ending sequence
    UIScene.ts         # HUD overlay
  entities/
    Player.ts          # Player character
    Enemy.ts           # Enemy base
    NPC.ts             # NPCs
    Projectile.ts      # Projectiles
    Pickup.ts          # Pickups
  systems/
    CombatSystem.ts    # Damage, knockback, invulnerability
    DialogSystem.ts    # Dialog box with typewriter effect
    InventorySystem.ts # Inventory management
    QuestSystem.ts     # Quest flags
  data/
    dialog.ts          # All dialog text
    enemies.ts         # Enemy definitions
    items.ts           # Item definitions
    quests.ts          # Quest definitions
```
