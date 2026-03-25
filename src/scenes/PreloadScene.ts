import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../game/constants';
import { generateAllTextures } from '../game/utils/sprites';
import { audioGen } from '../game/audio';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  create(): void {
    // Generate all textures programmatically
    generateAllTextures(this);

    // Generate audio
    this.generateAudio();

    // Progress text
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Generating assets...', {
      fontSize: '10px', fontFamily: 'monospace', color: '#e6c619',
    }).setOrigin(0.5);

    // Small delay to let canvas render
    this.time.delayedCall(100, () => {
      text.setText('Ready!');
      this.time.delayedCall(200, () => {
        this.scene.start(SCENES.TITLE);
      });
    });
  }

  private generateAudio(): void {
    const sounds: Record<string, Float32Array> = {
      sfx_sword: audioGen.generateSwordSwing(),
      sfx_hit: audioGen.generateHit(),
      sfx_pickup: audioGen.generatePickup(),
      sfx_blaster: audioGen.generateBlasterShot(),
      sfx_portal: audioGen.generatePortal(),
      music_title: audioGen.generateMusicLoop('title'),
      music_village: audioGen.generateMusicLoop('village'),
      music_dungeon: audioGen.generateMusicLoop('dungeon'),
      music_digital: audioGen.generateMusicLoop('digital'),
      music_boss: audioGen.generateMusicLoop('boss'),
      music_victory: audioGen.generateMusicLoop('victory'),
    };

    // Store data URIs for lazy loading and use as audio sources
    const audioData: Record<string, string> = {};
    for (const [key, samples] of Object.entries(sounds)) {
      audioData[key] = audioGen.samplesToWavBase64(samples);
    }
    this.registry.set('audioData', audioData);

    // Load audio via Phaser's loader
    for (const [key, dataUri] of Object.entries(audioData)) {
      this.cache.audio.add(key, dataUri);
    }
  }
}
