import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, IS_DEV } from '../game/constants';
import { DIALOG } from '../data/dialog';
import { DialogSystem } from '../systems/DialogSystem';
import { deleteSave } from '../game/save';

export class FinaleScene extends Phaser.Scene {
  private dialog!: DialogSystem;

  constructor() {
    super(SCENES.FINALE);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x111111);

    this.dialog = new DialogSystem(this);

    // Scene flow: Zeldor rescue → explosion → banana → Netanyahu → fish
    this.scene.stop(SCENES.UI);

    this.time.delayedCall(500, () => this.startRescueSequence());
  }

  private startRescueSequence(): void {
    // Dark room with Zeldor
    const zeldor = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'zeldor', 0).setScale(2);
    const linkler = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'linkler', 0).setScale(2);

    // Spotlight effect
    const spotlight = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);

    // Fake emotional moment
    this.dialog.show(DIALOG.zeldor_rescue, () => {
      // Zeldor starts glitching
      let glitchCount = 0;
      const glitchEvent = this.time.addEvent({
        delay: 100, repeat: 20, callback: () => {
          glitchCount++;
          zeldor.setTint(glitchCount % 2 === 0 ? 0xff0000 : 0x00ff00);
          zeldor.setPosition(
            GAME_WIDTH / 2 + (Math.random() - 0.5) * 10,
            GAME_HEIGHT / 2 - 30 + (Math.random() - 0.5) * 10
          );
        },
      });

      this.time.delayedCall(2200, () => {
        // EXPLOSION
        this.cameras.main.flash(500, 255, 255, 255);
        this.cameras.main.shake(500, 0.03);
        zeldor.setVisible(false);

        // Particles
        for (let i = 0; i < 30; i++) {
          const p = this.add.rectangle(
            GAME_WIDTH / 2 + (Math.random() - 0.5) * 100,
            GAME_HEIGHT / 2 - 30 + (Math.random() - 0.5) * 100,
            4, 4, [0xff69b4, 0x00ffff, 0xffd700, 0xff0000][Math.floor(Math.random() * 4)]
          ).setDepth(20);
          this.tweens.add({
            targets: p,
            x: p.x + (Math.random() - 0.5) * 200,
            y: p.y + (Math.random() - 0.5) * 200,
            alpha: 0, duration: 1000 + Math.random() * 500,
            onComplete: () => p.destroy(),
          });
        }

        // Show banana
        this.time.delayedCall(1500, () => {
          const banana = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'banana_zeldor').setScale(2);
          this.tweens.add({
            targets: banana, angle: 360, duration: 2000, repeat: 0,
          });

          this.dialog.show(DIALOG.zeldor_banana, () => {
            // Netanyahu cameo
            this.time.delayedCall(1000, () => {
              this.startNetanyahuCameo(banana, linkler);
            });
          });
        });
      });
    });

    // Advance dialog on key press
    this.input.keyboard?.on('keydown-SPACE', () => this.dialog.advance());
    this.input.keyboard?.on('keydown-E', () => this.dialog.advance());
    this.input.keyboard?.on('keydown-J', () => this.dialog.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.dialog.advance());
  }

  private startNetanyahuCameo(banana: Phaser.GameObjects.Image, linkler: Phaser.GameObjects.Sprite): void {
    // Fade to black briefly
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      banana.setVisible(false);
      linkler.setVisible(false);

      this.cameras.main.fadeIn(500);

      // Netanyahu appears
      const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);
      const netanyahu = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'netanyahu').setScale(3);

      this.time.delayedCall(500, () => {
        this.dialog.show(DIALOG.netanyahu_cameo, () => {
          // Brief pause
          this.time.delayedCall(1500, () => {
            // Fade out Netanyahu
            this.tweens.add({
              targets: [netanyahu, bg], alpha: 0, duration: 1000,
              onComplete: () => {
                netanyahu.destroy();
                bg.destroy();
                this.startFishEnding();
              },
            });
          });
        });
      });
    });
  }

  private startFishEnding(): void {
    // Fish ending dialog
    this.dialog.show(DIALOG.fish_ending, () => {
      this.time.delayedCall(1000, () => {
        // THE FISH
        this.cameras.main.setBackgroundColor(0x1a3a5c);

        // Destroy everything else
        this.children.removeAll();

        // Giant fish fills the screen
        const fish = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'giant_fish');
        fish.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        // Delete save (game is "complete")
        deleteSave();

        // Disable all input EXCEPT one hidden beep button
        this.input.keyboard?.removeAllListeners();

        // Dev mode: allow escape
        if (IS_DEV) {
          this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.start(SCENES.TITLE);
          });

          this.add.text(4, 4, '[DEV: ESC to exit]', {
            fontSize: '6px', fontFamily: 'monospace', color: '#ff0000',
          }).setDepth(100);
        }

        // Hidden beep on B key
        this.input.keyboard?.on('keydown-B', () => {
          // Just a beep text
          const beep = this.add.text(
            GAME_WIDTH / 2 + (Math.random() - 0.5) * 200,
            GAME_HEIGHT / 2 + (Math.random() - 0.5) * 200,
            'beep',
            { fontSize: '8px', fontFamily: 'monospace', color: '#ff4444' }
          ).setOrigin(0.5).setDepth(50);
          this.tweens.add({
            targets: beep, alpha: 0, y: beep.y - 20, duration: 1000,
            onComplete: () => beep.destroy(),
          });
        });

        // The fish stares forever
        // Player must close the tab/window
      });
    });
  }
}
