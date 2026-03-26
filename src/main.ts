import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { IntroScene } from './scenes/IntroScene';
import { VillageScene } from './scenes/VillageScene';
import { ShrineScene } from './scenes/ShrineScene';
import { FieldsScene } from './scenes/FieldsScene';
import { GatesScene } from './scenes/GatesScene';
import { DigitalRealmScene } from './scenes/DigitalRealmScene';
import { MemeSewersScene } from './scenes/MemeSewersScene';
import { FortressScene } from './scenes/FortressScene';
import { FinaleScene } from './scenes/FinaleScene';
import { UIScene } from './scenes/UIScene';
import { InteriorScene } from './scenes/InteriorScene';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    IntroScene,
    VillageScene,
    ShrineScene,
    FieldsScene,
    GatesScene,
    DigitalRealmScene,
    MemeSewersScene,
    FortressScene,
    FinaleScene,
    InteriorScene,
    UIScene,
  ],
};

const game = new Phaser.Game(config);

// Expose for dev console access
// Expose for dev console access
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).game = game;
}
