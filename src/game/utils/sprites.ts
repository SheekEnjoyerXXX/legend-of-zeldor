// Programmatic sprite/texture generation
// All art is original placeholder pixel art generated at runtime

import { COLORS, TILE_SIZE } from '../constants';

export function generateAllTextures(scene: Phaser.Scene) {
  genPlayerTextures(scene);
  genEnemyTextures(scene);
  genNPCTextures(scene);
  genBossTextures(scene);
  genItemTextures(scene);
  genUITextures(scene);
  genTileTextures(scene);
  genEffectTextures(scene);
  genEndingTextures(scene);
}

// Helper to draw on a texture canvas
function makeTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  scene.textures.addCanvas(key, canvas);
}

function makeFrameTex(scene: Phaser.Scene, key: string, fw: number, fh: number, frames: ((ctx: CanvasRenderingContext2D) => void)[]) {
  const canvas = document.createElement('canvas');
  canvas.width = fw * frames.length;
  canvas.height = fh;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < frames.length; i++) {
    ctx.save();
    ctx.translate(i * fw, 0);
    frames[i](ctx);
    ctx.restore();
  }
  // Use addCanvas then create spritesheet config from it
  const canTex = scene.textures.addCanvas(key + '_canvas', canvas);
  if (canTex) {
    scene.textures.addSpriteSheetFromAtlas(key, {
      atlas: key + '_canvas',
      frame: '__BASE',
      frameWidth: fw,
      frameHeight: fh,
    });
  }
}

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: number) {
  ctx.fillStyle = hex(color);
  ctx.fillRect(x, y, w, h);
}

function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: number) {
  rect(ctx, x, y, 1, 1, color);
}

// ---- PLAYER (Linkler - a dwarf hero) ----
function genPlayerTextures(scene: Phaser.Scene) {
  const W = 16, H = 16;

  // Walk frames: 4 directions x 2 frames each = down0,down1,left0,left1,right0,right1,up0,up1
  const drawLinkler = (ctx: CanvasRenderingContext2D, dir: number, frame: number) => {
    // Dwarf: short, stocky, big head
    const skin = COLORS.SKIN;
    const hat = 0x228b22; // green cap
    const tunic = 0x2ecc40;
    const belt = COLORS.BROWN;
    const boots = 0x5c3317;
    const hair = 0xdaa520;

    // Boots
    const yOff = frame % 2 === 0 ? 0 : 1;
    rect(ctx, 4, 13 - yOff, 3, 3, boots);
    rect(ctx, 9, 13 + yOff, 3, 3, boots);

    // Tunic body
    rect(ctx, 4, 7, 8, 6, tunic);
    // Belt
    rect(ctx, 4, 10, 8, 1, belt);

    // Head
    rect(ctx, 4, 1, 8, 6, skin);
    // Hat
    rect(ctx, 3, 0, 10, 3, hat);
    rect(ctx, 5, 0, 6, 1, 0x1a6b1a);

    // Face details based on direction
    if (dir === 0) { // down
      pixel(ctx, 5, 3, COLORS.BLACK); pixel(ctx, 9, 3, COLORS.BLACK); // eyes
      rect(ctx, 6, 5, 3, 1, 0xcc8855); // mouth
    } else if (dir === 1) { // left
      pixel(ctx, 4, 3, COLORS.BLACK); // eye
      rect(ctx, 10, 2, 2, 4, hair); // hair on right
    } else if (dir === 2) { // right
      pixel(ctx, 10, 3, COLORS.BLACK); // eye
      rect(ctx, 4, 2, 2, 4, hair); // hair on left
    } else { // up
      rect(ctx, 4, 1, 8, 6, hair); // back of head
      rect(ctx, 3, 0, 10, 3, hat);
    }
  };

  const frames: ((ctx: CanvasRenderingContext2D) => void)[] = [];
  for (let dir = 0; dir < 4; dir++) {
    for (let f = 0; f < 2; f++) {
      frames.push((ctx) => drawLinkler(ctx, dir, f));
    }
  }
  makeFrameTex(scene, 'linkler', W, H, frames);

  // Attack frames (sword slash) - 4 directions x 2 frames
  const attackFrames: ((ctx: CanvasRenderingContext2D) => void)[] = [];
  for (let dir = 0; dir < 4; dir++) {
    for (let f = 0; f < 2; f++) {
      attackFrames.push((ctx) => {
        drawLinkler(ctx, dir, 0);
        // Draw sword
        ctx.fillStyle = hex(0xcccccc);
        const sf = f === 0 ? 0 : 1;
        if (dir === 0) { rect(ctx, 12 + sf, 8, 3, 8, 0xcccccc); rect(ctx, 12 + sf, 7, 3, 2, COLORS.GOLD); }
        else if (dir === 1) { rect(ctx, -3 - sf, 6, 7, 3, 0xcccccc); rect(ctx, 3 - sf, 6, 2, 3, COLORS.GOLD); }
        else if (dir === 2) { rect(ctx, 12 + sf, 6, 7, 3, 0xcccccc); rect(ctx, 12 + sf, 6, 2, 3, COLORS.GOLD); }
        else { rect(ctx, 5 + sf, -4, 3, 8, 0xcccccc); rect(ctx, 5 + sf, 3, 3, 2, COLORS.GOLD); }
      });
    }
  }
  makeFrameTex(scene, 'linkler_attack', W, H, attackFrames);

  // Shield sprite
  makeTex(scene, 'linkler_shield', W, H, (ctx) => {
    drawLinkler(ctx, 0, 0);
    rect(ctx, 0, 5, 4, 7, 0x3498db); // blue shield
    rect(ctx, 1, 7, 2, 3, COLORS.GOLD); // emblem
  });
}

// ---- ENEMIES ----
function genEnemyTextures(scene: Phaser.Scene) {
  // ObamaSphere - floating orb with stylized face
  makeFrameTex(scene, 'obamasphere', 16, 16, [
    (ctx) => { // frame 0
      ctx.fillStyle = hex(0x4488cc);
      ctx.beginPath(); ctx.arc(8, 8, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0x336699);
      ctx.beginPath(); ctx.arc(8, 8, 5, 0, Math.PI * 2); ctx.fill();
      pixel(ctx, 5, 6, COLORS.WHITE); pixel(ctx, 10, 6, COLORS.WHITE);
      pixel(ctx, 6, 6, COLORS.BLACK); pixel(ctx, 11, 6, COLORS.BLACK);
      rect(ctx, 6, 10, 4, 1, COLORS.WHITE); // grin
    },
    (ctx) => { // frame 1 - bob
      ctx.fillStyle = hex(0x4488cc);
      ctx.beginPath(); ctx.arc(8, 7, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0x336699);
      ctx.beginPath(); ctx.arc(8, 7, 5, 0, Math.PI * 2); ctx.fill();
      pixel(ctx, 5, 5, COLORS.WHITE); pixel(ctx, 10, 5, COLORS.WHITE);
      pixel(ctx, 6, 5, COLORS.BLACK); pixel(ctx, 11, 5, COLORS.BLACK);
      rect(ctx, 6, 9, 4, 1, COLORS.WHITE);
    }
  ]);

  // ObamaSphere laser variant (red)
  makeFrameTex(scene, 'obamasphere_laser', 16, 16, [
    (ctx) => {
      ctx.fillStyle = hex(0xcc4444);
      ctx.beginPath(); ctx.arc(8, 8, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0x993333);
      ctx.beginPath(); ctx.arc(8, 8, 5, 0, Math.PI * 2); ctx.fill();
      pixel(ctx, 5, 6, 0xffff00); pixel(ctx, 10, 6, 0xffff00);
      rect(ctx, 6, 10, 4, 1, COLORS.WHITE);
    },
    (ctx) => {
      ctx.fillStyle = hex(0xcc4444);
      ctx.beginPath(); ctx.arc(8, 7, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0x993333);
      ctx.beginPath(); ctx.arc(8, 7, 5, 0, Math.PI * 2); ctx.fill();
      pixel(ctx, 5, 5, 0xffff00); pixel(ctx, 10, 5, 0xffff00);
      rect(ctx, 6, 9, 4, 1, COLORS.WHITE);
    }
  ]);

  // Gobdwarf - armored goblin with club, scar, shoulder pads
  makeFrameTex(scene, 'gobdwarf', 16, 16, [
    (ctx) => {
      // Feet
      rect(ctx, 5, 14, 2, 2, 0x5a4d2a); rect(ctx, 9, 14, 2, 2, 0x5a4d2a);
      // Body (darker olive armor)
      rect(ctx, 4, 8, 8, 6, 0x6b8e23);
      rect(ctx, 4, 8, 8, 1, 0x7a9e33); // armor highlight
      // Shoulder pads
      pixel(ctx, 3, 8, 0x8a7a55); pixel(ctx, 3, 9, 0x7a6a45);
      pixel(ctx, 12, 8, 0x8a7a55); pixel(ctx, 12, 9, 0x7a6a45);
      // Belt
      rect(ctx, 4, 11, 8, 1, 0x5a4d2a);
      pixel(ctx, 7, 11, 0x888888); // buckle
      // Head
      rect(ctx, 4, 3, 8, 6, 0x7cba3f);
      rect(ctx, 4, 3, 8, 1, 0x8eca4f); // head highlight
      // Scar across face
      pixel(ctx, 5, 4, 0x9a5a3a); pixel(ctx, 6, 5, 0x9a5a3a); pixel(ctx, 7, 5, 0x9a5a3a);
      // Eyes (angry red)
      pixel(ctx, 5, 5, COLORS.RED); pixel(ctx, 9, 5, COLORS.RED);
      pixel(ctx, 5, 4, 0x6b8e23); pixel(ctx, 9, 4, 0x6b8e23); // brow shadow
      // Mouth (snarling)
      rect(ctx, 6, 7, 3, 1, COLORS.BLACK);
      pixel(ctx, 6, 7, 0xeeeecc); pixel(ctx, 8, 7, 0xeeeecc); // fangs
      // Helmet
      rect(ctx, 3, 2, 10, 2, 0x5a4d2a);
      rect(ctx, 3, 2, 10, 1, 0x6b5e3a); // helmet highlight
      pixel(ctx, 7, 1, 0x888888); pixel(ctx, 8, 1, 0x888888); // spike
      // Club in hand (right side)
      rect(ctx, 13, 6, 2, 8, 0x6b4226);
      rect(ctx, 12, 4, 4, 3, 0x7a5030);
      pixel(ctx, 12, 4, 0x888888); // nail in club
      pixel(ctx, 14, 5, 0x888888);
    },
    (ctx) => {
      rect(ctx, 4, 14, 2, 2, 0x5a4d2a); rect(ctx, 10, 14, 2, 2, 0x5a4d2a);
      rect(ctx, 4, 8, 8, 6, 0x6b8e23);
      rect(ctx, 4, 8, 8, 1, 0x7a9e33);
      pixel(ctx, 3, 8, 0x8a7a55); pixel(ctx, 3, 9, 0x7a6a45);
      pixel(ctx, 12, 8, 0x8a7a55); pixel(ctx, 12, 9, 0x7a6a45);
      rect(ctx, 4, 11, 8, 1, 0x5a4d2a);
      pixel(ctx, 7, 11, 0x888888);
      rect(ctx, 4, 3, 8, 6, 0x7cba3f);
      rect(ctx, 4, 3, 8, 1, 0x8eca4f);
      pixel(ctx, 5, 4, 0x9a5a3a); pixel(ctx, 6, 5, 0x9a5a3a); pixel(ctx, 7, 5, 0x9a5a3a);
      pixel(ctx, 5, 5, COLORS.RED); pixel(ctx, 9, 5, COLORS.RED);
      pixel(ctx, 5, 4, 0x6b8e23); pixel(ctx, 9, 4, 0x6b8e23);
      rect(ctx, 6, 7, 3, 1, COLORS.BLACK);
      pixel(ctx, 6, 7, 0xeeeecc); pixel(ctx, 8, 7, 0xeeeecc);
      rect(ctx, 3, 2, 10, 2, 0x5a4d2a);
      rect(ctx, 3, 2, 10, 1, 0x6b5e3a);
      pixel(ctx, 7, 1, 0x888888); pixel(ctx, 8, 1, 0x888888);
      // Club swung to side
      rect(ctx, 14, 7, 2, 7, 0x6b4226);
      rect(ctx, 13, 5, 4, 3, 0x7a5030);
      pixel(ctx, 13, 5, 0x888888); pixel(ctx, 15, 6, 0x888888);
    }
  ]);

  // Slime modem - more drippy, glowing router lights
  makeFrameTex(scene, 'slime_modem', 16, 16, [
    (ctx) => {
      // Base slime body
      rect(ctx, 2, 8, 12, 6, 0x44cc44);
      rect(ctx, 3, 6, 10, 4, 0x55dd55);
      rect(ctx, 4, 4, 8, 3, 0x66ee66);
      // Highlight on top
      rect(ctx, 5, 4, 6, 1, 0x88ff88);
      // Drip detail (sides)
      pixel(ctx, 1, 10, 0x44cc44); pixel(ctx, 1, 11, 0x44cc44);
      pixel(ctx, 14, 9, 0x44cc44); pixel(ctx, 14, 10, 0x44cc44);
      pixel(ctx, 0, 12, 0x33bb33); // far drip
      pixel(ctx, 13, 13, 0x33bb33);
      // Drips from bottom
      pixel(ctx, 4, 14, 0x33bb33); pixel(ctx, 4, 15, 0x22aa22);
      pixel(ctx, 10, 14, 0x33bb33);
      // Body shadow
      rect(ctx, 3, 12, 10, 1, 0x338833);
      // Eyes
      pixel(ctx, 5, 7, COLORS.BLACK); pixel(ctx, 10, 7, COLORS.BLACK);
      pixel(ctx, 5, 6, 0x55dd55); pixel(ctx, 10, 6, 0x55dd55); // brow
      // Mouth
      rect(ctx, 6, 10, 4, 1, 0x228822);
      // Antenna
      rect(ctx, 7, 2, 2, 3, 0x888888);
      rect(ctx, 7, 2, 2, 1, 0xaaaaaa); // antenna highlight
      // Router lights on antenna
      pixel(ctx, 7, 1, COLORS.RED);
      pixel(ctx, 8, 1, 0x00ff00);
      // Blinking lights on body
      pixel(ctx, 4, 8, 0xff4400); pixel(ctx, 6, 8, 0x00ff00);
      pixel(ctx, 8, 8, 0x00ff00); pixel(ctx, 11, 8, 0xffaa00);
    },
    (ctx) => {
      rect(ctx, 2, 9, 12, 5, 0x44cc44);
      rect(ctx, 3, 7, 10, 4, 0x55dd55);
      rect(ctx, 4, 5, 8, 3, 0x66ee66);
      rect(ctx, 5, 5, 6, 1, 0x88ff88);
      pixel(ctx, 1, 11, 0x44cc44); pixel(ctx, 1, 12, 0x44cc44);
      pixel(ctx, 14, 10, 0x44cc44); pixel(ctx, 14, 11, 0x44cc44);
      pixel(ctx, 0, 13, 0x33bb33); pixel(ctx, 13, 14, 0x33bb33);
      pixel(ctx, 5, 14, 0x33bb33); pixel(ctx, 9, 14, 0x33bb33); pixel(ctx, 9, 15, 0x22aa22);
      rect(ctx, 3, 13, 10, 1, 0x338833);
      pixel(ctx, 5, 8, COLORS.BLACK); pixel(ctx, 10, 8, COLORS.BLACK);
      pixel(ctx, 5, 7, 0x55dd55); pixel(ctx, 10, 7, 0x55dd55);
      rect(ctx, 6, 11, 4, 1, 0x228822);
      rect(ctx, 7, 3, 2, 3, 0x888888);
      rect(ctx, 7, 3, 2, 1, 0xaaaaaa);
      pixel(ctx, 7, 2, 0x00ff00); pixel(ctx, 8, 2, COLORS.RED);
      pixel(ctx, 4, 9, 0x00ff00); pixel(ctx, 6, 9, 0xffaa00);
      pixel(ctx, 8, 9, 0xff4400); pixel(ctx, 11, 9, 0x00ff00);
    }
  ]);

  // Error bat - wing membrane detail, glowing eyes
  makeFrameTex(scene, 'error_bat', 16, 16, [
    (ctx) => {
      // Body
      rect(ctx, 6, 5, 4, 4, 0x880088);
      rect(ctx, 6, 5, 4, 1, 0x990099); // body highlight
      // Left wing (extended)
      rect(ctx, 1, 4, 5, 3, 0xaa00aa);
      pixel(ctx, 1, 4, 0xcc22cc); // wing tip highlight
      // Wing membrane lines
      pixel(ctx, 2, 5, 0x770077); pixel(ctx, 3, 5, 0x770077);
      pixel(ctx, 1, 6, 0x770077); pixel(ctx, 4, 6, 0x770077);
      // Right wing
      rect(ctx, 10, 4, 5, 3, 0xaa00aa);
      pixel(ctx, 14, 4, 0xcc22cc);
      pixel(ctx, 11, 5, 0x770077); pixel(ctx, 13, 5, 0x770077);
      pixel(ctx, 11, 6, 0x770077); pixel(ctx, 14, 6, 0x770077);
      // Glowing eyes (bright red with glow)
      pixel(ctx, 6, 6, 0xff4444); pixel(ctx, 9, 6, 0xff4444);
      pixel(ctx, 5, 5, 0xff000044); pixel(ctx, 10, 5, 0xff000044); // eye glow
      // Ears
      pixel(ctx, 6, 4, 0x990099); pixel(ctx, 9, 4, 0x990099);
      // Fangs
      pixel(ctx, 7, 9, 0xdddddd); pixel(ctx, 8, 9, 0xdddddd);
      // Bottom body
      rect(ctx, 5, 8, 6, 2, 0x880088);
      rect(ctx, 6, 9, 4, 1, 0x660066); // belly shadow
    },
    (ctx) => {
      rect(ctx, 6, 5, 4, 4, 0x880088);
      rect(ctx, 6, 5, 4, 1, 0x990099);
      // Wings up
      rect(ctx, 2, 3, 4, 3, 0xaa00aa);
      rect(ctx, 10, 3, 4, 3, 0xaa00aa);
      pixel(ctx, 2, 3, 0xcc22cc); pixel(ctx, 13, 3, 0xcc22cc);
      pixel(ctx, 3, 4, 0x770077); pixel(ctx, 4, 4, 0x770077);
      pixel(ctx, 11, 4, 0x770077); pixel(ctx, 12, 4, 0x770077);
      // Glowing eyes
      pixel(ctx, 6, 6, 0xff6666); pixel(ctx, 9, 6, 0xff6666);
      pixel(ctx, 5, 5, 0xff000044); pixel(ctx, 10, 5, 0xff000044);
      pixel(ctx, 6, 4, 0x990099); pixel(ctx, 9, 4, 0x990099);
      pixel(ctx, 7, 9, 0xdddddd); pixel(ctx, 8, 9, 0xdddddd);
      rect(ctx, 5, 8, 6, 2, 0x880088);
      rect(ctx, 6, 9, 4, 1, 0x660066);
    }
  ]);

  // Firewall skeleton - more bone detail, fire particles
  makeFrameTex(scene, 'firewall_skeleton', 16, 16, [
    (ctx) => {
      // Skull with detail
      rect(ctx, 5, 1, 6, 5, COLORS.WHITE);
      rect(ctx, 5, 1, 6, 1, 0xeeeeee); // cranium highlight
      // Eye sockets (dark with glow)
      rect(ctx, 6, 2, 2, 2, COLORS.BLACK);
      rect(ctx, 9, 2, 2, 2, COLORS.BLACK);
      pixel(ctx, 6, 2, 0xff4400); pixel(ctx, 9, 2, 0xff4400); // fire eyes
      // Nose
      pixel(ctx, 7, 4, 0xcccccc); pixel(ctx, 8, 4, 0xcccccc);
      // Teeth
      rect(ctx, 6, 5, 4, 1, 0xdddddd);
      pixel(ctx, 6, 5, COLORS.BLACK); pixel(ctx, 8, 5, COLORS.BLACK); // gaps
      // Ribcage body
      rect(ctx, 6, 6, 4, 8, 0xdddddd);
      pixel(ctx, 7, 7, 0x111111); pixel(ctx, 7, 9, 0x111111); pixel(ctx, 7, 11, 0x111111); // rib gaps
      pixel(ctx, 8, 8, 0x111111); pixel(ctx, 8, 10, 0x111111);
      // Spine highlight
      pixel(ctx, 7, 6, 0xeeeeee); pixel(ctx, 8, 6, 0xeeeeee);
      // Arms (bone)
      rect(ctx, 3, 7, 3, 2, 0xdddddd);
      rect(ctx, 10, 7, 3, 2, 0xdddddd);
      pixel(ctx, 3, 7, 0xeeeeee); pixel(ctx, 10, 7, 0xeeeeee); // bone highlights
      pixel(ctx, 3, 9, 0xcccccc); pixel(ctx, 12, 9, 0xcccccc); // hand bones
      // Leg bones
      rect(ctx, 5, 14, 2, 2, 0xdddddd); rect(ctx, 9, 14, 2, 2, 0xdddddd);
      pixel(ctx, 5, 14, 0xeeeeee); pixel(ctx, 9, 14, 0xeeeeee);
      // Fire effects (surrounding)
      pixel(ctx, 3, 5, 0xff6600); pixel(ctx, 2, 6, 0xff8800);
      pixel(ctx, 12, 5, 0xff6600); pixel(ctx, 13, 6, 0xff8800);
      pixel(ctx, 2, 7, 0xff3300); pixel(ctx, 13, 7, 0xff3300);
      // Fire particles floating
      pixel(ctx, 1, 4, 0xffaa00); pixel(ctx, 14, 3, 0xffaa00);
      pixel(ctx, 4, 1, 0xffcc00); pixel(ctx, 11, 0, 0xffcc00);
    },
    (ctx) => {
      rect(ctx, 5, 1, 6, 5, COLORS.WHITE);
      rect(ctx, 5, 1, 6, 1, 0xeeeeee);
      rect(ctx, 6, 2, 2, 2, COLORS.BLACK);
      rect(ctx, 9, 2, 2, 2, COLORS.BLACK);
      pixel(ctx, 7, 2, 0xff6600); pixel(ctx, 10, 2, 0xff6600); // shifted fire eyes
      pixel(ctx, 7, 4, 0xcccccc); pixel(ctx, 8, 4, 0xcccccc);
      rect(ctx, 6, 5, 4, 1, 0xdddddd);
      pixel(ctx, 6, 5, COLORS.BLACK); pixel(ctx, 8, 5, COLORS.BLACK);
      rect(ctx, 6, 6, 4, 8, 0xdddddd);
      pixel(ctx, 7, 7, 0x111111); pixel(ctx, 7, 9, 0x111111); pixel(ctx, 7, 11, 0x111111);
      pixel(ctx, 8, 8, 0x111111); pixel(ctx, 8, 10, 0x111111);
      pixel(ctx, 7, 6, 0xeeeeee); pixel(ctx, 8, 6, 0xeeeeee);
      rect(ctx, 2, 8, 4, 2, 0xdddddd);
      rect(ctx, 10, 8, 4, 2, 0xdddddd);
      pixel(ctx, 2, 8, 0xeeeeee); pixel(ctx, 10, 8, 0xeeeeee);
      pixel(ctx, 2, 10, 0xcccccc); pixel(ctx, 13, 10, 0xcccccc);
      rect(ctx, 5, 14, 2, 2, 0xdddddd); rect(ctx, 9, 14, 2, 2, 0xdddddd);
      pixel(ctx, 2, 6, 0xff8800); pixel(ctx, 13, 6, 0xff8800);
      pixel(ctx, 3, 7, 0xff3300); pixel(ctx, 12, 7, 0xff3300);
      pixel(ctx, 0, 5, 0xffaa00); pixel(ctx, 15, 4, 0xffaa00);
      pixel(ctx, 5, 0, 0xffcc00); pixel(ctx, 10, 0, 0xffcc00);
    }
  ]);

  // Glitch crab - shell pattern, sharper claws
  makeFrameTex(scene, 'glitch_crab', 16, 16, [
    (ctx) => {
      // Shell body
      rect(ctx, 3, 6, 10, 6, 0xff4488);
      rect(ctx, 3, 6, 10, 1, 0xff66aa); // shell highlight
      // Shell pattern (darker segments)
      rect(ctx, 4, 8, 3, 3, 0xee3377); rect(ctx, 9, 8, 3, 3, 0xee3377);
      pixel(ctx, 7, 7, 0xee3377); pixel(ctx, 8, 7, 0xee3377); // center segment
      // Shell ridge
      rect(ctx, 6, 6, 4, 1, 0xff88bb);
      // Left claw (sharper, pincer shape)
      rect(ctx, 0, 5, 3, 2, 0xff4488);
      pixel(ctx, 0, 4, 0xff66aa); pixel(ctx, 0, 7, 0xff66aa); // pincer tips
      pixel(ctx, 0, 5, 0xcc2266); // claw shadow
      // Right claw
      rect(ctx, 13, 5, 3, 2, 0xff4488);
      pixel(ctx, 15, 4, 0xff66aa); pixel(ctx, 15, 7, 0xff66aa);
      pixel(ctx, 15, 5, 0xcc2266);
      // Eyes (on stalks)
      pixel(ctx, 5, 5, 0xff4488); pixel(ctx, 10, 5, 0xff4488); // stalk
      pixel(ctx, 5, 4, COLORS.WHITE); pixel(ctx, 10, 4, COLORS.WHITE); // eyes
      pixel(ctx, 5, 4, 0xffffff); pixel(ctx, 10, 4, 0xffffff);
      // Legs
      rect(ctx, 4, 12, 2, 2, 0xcc3366); rect(ctx, 10, 12, 2, 2, 0xcc3366);
      rect(ctx, 6, 12, 2, 2, 0xcc3366); rect(ctx, 8, 12, 2, 2, 0xcc3366);
      // Leg highlights
      pixel(ctx, 4, 12, 0xdd4477); pixel(ctx, 6, 12, 0xdd4477);
      pixel(ctx, 8, 12, 0xdd4477); pixel(ctx, 10, 12, 0xdd4477);
      // Glitch pixels
      pixel(ctx, 7, 10, 0x00ffff); pixel(ctx, 12, 7, 0xff00ff);
    },
    (ctx) => {
      rect(ctx, 3, 7, 10, 5, 0xff4488);
      rect(ctx, 3, 7, 10, 1, 0xff66aa);
      rect(ctx, 4, 9, 3, 2, 0xee3377); rect(ctx, 9, 9, 3, 2, 0xee3377);
      pixel(ctx, 7, 8, 0xee3377); pixel(ctx, 8, 8, 0xee3377);
      rect(ctx, 6, 7, 4, 1, 0xff88bb);
      rect(ctx, 0, 4, 3, 2, 0xff4488);
      pixel(ctx, 0, 3, 0xff66aa); pixel(ctx, 0, 6, 0xff66aa);
      pixel(ctx, 0, 4, 0xcc2266);
      rect(ctx, 13, 4, 3, 2, 0xff4488);
      pixel(ctx, 15, 3, 0xff66aa); pixel(ctx, 15, 6, 0xff66aa);
      pixel(ctx, 15, 4, 0xcc2266);
      pixel(ctx, 5, 6, 0xff4488); pixel(ctx, 10, 6, 0xff4488);
      pixel(ctx, 5, 5, COLORS.WHITE); pixel(ctx, 10, 5, COLORS.WHITE);
      rect(ctx, 4, 12, 2, 2, 0xcc3366); rect(ctx, 10, 12, 2, 2, 0xcc3366);
      rect(ctx, 6, 12, 2, 2, 0xcc3366); rect(ctx, 8, 12, 2, 2, 0xcc3366);
      pixel(ctx, 4, 12, 0xdd4477); pixel(ctx, 6, 12, 0xdd4477);
      pixel(ctx, 8, 12, 0xdd4477); pixel(ctx, 10, 12, 0xdd4477);
      pixel(ctx, 8, 9, 0xff00ff); pixel(ctx, 3, 8, 0x00ffff);
    }
  ]);

  // Pickle thief - bandana, stolen pickle visible
  makeFrameTex(scene, 'pickle_thief', 16, 16, [
    (ctx) => {
      // Green pickle body
      rect(ctx, 5, 3, 6, 10, 0x5ea84c);
      rect(ctx, 6, 2, 4, 2, 0x5ea84c);
      rect(ctx, 6, 13, 4, 2, 0x5ea84c);
      // Body highlight (left)
      pixel(ctx, 5, 5, 0x6bba58); pixel(ctx, 5, 7, 0x6bba58);
      // Bumps
      pixel(ctx, 4, 6, 0x4d8a3e); pixel(ctx, 11, 8, 0x4d8a3e);
      pixel(ctx, 4, 10, 0x4d8a3e); pixel(ctx, 11, 5, 0x4d8a3e);
      // Bandana (red, covering top)
      rect(ctx, 5, 2, 6, 2, 0xcc3333);
      rect(ctx, 5, 2, 6, 1, 0xdd4444); // bandana highlight
      pixel(ctx, 11, 3, 0xcc3333); pixel(ctx, 12, 4, 0xcc3333); // bandana tails
      pixel(ctx, 12, 3, 0xdd4444);
      // Mask
      rect(ctx, 5, 4, 6, 2, COLORS.BLACK);
      pixel(ctx, 6, 4, COLORS.WHITE); pixel(ctx, 9, 4, COLORS.WHITE);
      pixel(ctx, 6, 5, 0x333333); pixel(ctx, 9, 5, 0x333333); // mask shadow
      // Sneaky grin
      pixel(ctx, 7, 7, COLORS.WHITE); pixel(ctx, 8, 7, COLORS.WHITE);
      // Legs
      rect(ctx, 4, 12, 2, 3, 0x4d8a3e); rect(ctx, 10, 12, 2, 3, 0x4d8a3e);
      // Stolen mini pickle (carried)
      rect(ctx, 0, 7, 3, 6, 0x72c060);
      pixel(ctx, 0, 8, 0x5ea84c); pixel(ctx, 2, 10, 0x5ea84c);
    },
    (ctx) => {
      rect(ctx, 5, 4, 6, 9, 0x5ea84c);
      rect(ctx, 6, 3, 4, 2, 0x5ea84c);
      rect(ctx, 6, 13, 4, 2, 0x5ea84c);
      pixel(ctx, 5, 6, 0x6bba58); pixel(ctx, 5, 8, 0x6bba58);
      pixel(ctx, 4, 7, 0x4d8a3e); pixel(ctx, 11, 9, 0x4d8a3e);
      pixel(ctx, 4, 11, 0x4d8a3e); pixel(ctx, 11, 6, 0x4d8a3e);
      rect(ctx, 5, 3, 6, 2, 0xcc3333);
      rect(ctx, 5, 3, 6, 1, 0xdd4444);
      pixel(ctx, 11, 4, 0xcc3333); pixel(ctx, 12, 5, 0xcc3333);
      pixel(ctx, 12, 4, 0xdd4444);
      rect(ctx, 5, 5, 6, 2, COLORS.BLACK);
      pixel(ctx, 6, 5, COLORS.WHITE); pixel(ctx, 9, 5, COLORS.WHITE);
      pixel(ctx, 6, 6, 0x333333); pixel(ctx, 9, 6, 0x333333);
      pixel(ctx, 7, 8, COLORS.WHITE); pixel(ctx, 8, 8, COLORS.WHITE);
      rect(ctx, 3, 13, 2, 3, 0x4d8a3e); rect(ctx, 11, 13, 2, 3, 0x4d8a3e);
      rect(ctx, 0, 8, 3, 5, 0x72c060);
      pixel(ctx, 0, 9, 0x5ea84c); pixel(ctx, 2, 11, 0x5ea84c);
    }
  ]);

  // Portal rat - fur texture, portal sparks
  makeFrameTex(scene, 'portal_rat', 16, 16, [
    (ctx) => {
      // Body with fur texture
      rect(ctx, 4, 6, 8, 5, 0x888888);
      pixel(ctx, 5, 7, 0x777777); pixel(ctx, 7, 8, 0x999999);
      pixel(ctx, 9, 7, 0x777777); pixel(ctx, 6, 9, 0x999999);
      pixel(ctx, 10, 9, 0x777777); pixel(ctx, 8, 6, 0x999999);
      // Belly (lighter)
      rect(ctx, 6, 8, 4, 2, 0x9a9a9a);
      // Head
      rect(ctx, 4, 4, 4, 3, 0x999999);
      rect(ctx, 3, 4, 1, 2, 0x999999); // snout
      pixel(ctx, 3, 5, 0xff8888); // nose
      // Eye (red, glowing)
      pixel(ctx, 5, 5, 0xff3333);
      pixel(ctx, 6, 4, 0xff000044); // eye glow
      // Ear (pink inside)
      rect(ctx, 2, 3, 2, 2, 0xaaaaaa);
      pixel(ctx, 2, 3, 0xffaaaa); // inner ear pink
      // Whiskers
      pixel(ctx, 2, 5, 0xcccccc); pixel(ctx, 1, 4, 0xcccccc);
      pixel(ctx, 2, 6, 0xcccccc);
      // Tail (longer, curvy)
      rect(ctx, 12, 7, 2, 1, 0x777777);
      pixel(ctx, 14, 6, 0x777777); pixel(ctx, 15, 5, 0x777777);
      pixel(ctx, 15, 6, 0x888888);
      // Feet
      rect(ctx, 4, 11, 2, 2, 0x777777); rect(ctx, 9, 11, 2, 2, 0x777777);
      pixel(ctx, 4, 12, 0xffaaaa); pixel(ctx, 9, 12, 0xffaaaa); // pink toes
      // Portal sparks
      pixel(ctx, 3, 7, 0x00ffff); pixel(ctx, 12, 6, 0x00ffff);
      pixel(ctx, 1, 9, 0xff00ff); pixel(ctx, 14, 9, 0x00ffff);
      pixel(ctx, 6, 3, 0xaa55ff); // spark above
    },
    (ctx) => {
      rect(ctx, 4, 7, 8, 4, 0x888888);
      pixel(ctx, 5, 8, 0x777777); pixel(ctx, 7, 9, 0x999999);
      pixel(ctx, 9, 8, 0x777777); pixel(ctx, 10, 10, 0x777777);
      rect(ctx, 6, 9, 4, 1, 0x9a9a9a);
      rect(ctx, 4, 5, 4, 3, 0x999999);
      rect(ctx, 3, 5, 1, 2, 0x999999);
      pixel(ctx, 3, 6, 0xff8888);
      pixel(ctx, 5, 6, 0xff3333);
      pixel(ctx, 6, 5, 0xff000044);
      rect(ctx, 2, 4, 2, 2, 0xaaaaaa);
      pixel(ctx, 2, 4, 0xffaaaa);
      pixel(ctx, 2, 6, 0xcccccc); pixel(ctx, 1, 5, 0xcccccc);
      pixel(ctx, 2, 7, 0xcccccc);
      rect(ctx, 12, 8, 2, 1, 0x777777);
      pixel(ctx, 14, 7, 0x777777); pixel(ctx, 15, 6, 0x777777);
      rect(ctx, 3, 11, 2, 2, 0x777777); rect(ctx, 10, 11, 2, 2, 0x777777);
      pixel(ctx, 3, 12, 0xffaaaa); pixel(ctx, 10, 12, 0xffaaaa);
      pixel(ctx, 3, 8, 0xff00ff); pixel(ctx, 12, 7, 0xff00ff);
      pixel(ctx, 0, 10, 0x00ffff); pixel(ctx, 15, 8, 0xaa55ff);
      pixel(ctx, 7, 4, 0x00ffff);
    }
  ]);

  // Banana ghost - translucent effect, spooky eyes
  makeFrameTex(scene, 'banana_ghost', 16, 16, [
    (ctx) => {
      // Banana shape but ghostly - semi-transparent layers
      // Outer glow (faint)
      pixel(ctx, 3, 5, 0xffff99); pixel(ctx, 3, 8, 0xffff99);
      pixel(ctx, 11, 4, 0xffff99); pixel(ctx, 12, 6, 0xffff99);
      // Main banana body
      rect(ctx, 5, 2, 5, 10, 0xffff44);
      rect(ctx, 4, 4, 2, 6, 0xffff44);
      rect(ctx, 10, 3, 2, 4, 0xeeee33);
      // Inner highlight (lighter = more ghostly)
      rect(ctx, 6, 3, 3, 7, 0xffff88);
      pixel(ctx, 7, 3, 0xffffaa); pixel(ctx, 7, 4, 0xffffaa); // bright center
      // Dark banana edge
      pixel(ctx, 4, 9, 0xdddd22); pixel(ctx, 9, 2, 0xdddd22);
      pixel(ctx, 11, 5, 0xcccc11);
      // Spooky hollow eyes (dark with glow ring)
      rect(ctx, 5, 5, 2, 2, COLORS.BLACK);
      rect(ctx, 9, 5, 2, 2, COLORS.BLACK);
      pixel(ctx, 5, 4, 0xdddd33); pixel(ctx, 6, 4, 0xdddd33); // brow ridge
      pixel(ctx, 9, 4, 0xdddd33); pixel(ctx, 10, 4, 0xdddd33);
      // Ghost pupils (tiny white dots)
      pixel(ctx, 5, 5, 0xffffff); pixel(ctx, 9, 5, 0xffffff);
      // Ghost mouth (wavy)
      pixel(ctx, 6, 8, COLORS.BLACK); pixel(ctx, 8, 9, COLORS.BLACK);
      pixel(ctx, 7, 8, COLORS.BLACK); pixel(ctx, 9, 8, COLORS.BLACK);
      // Wispy bottom (ragged ghostly tail)
      rect(ctx, 5, 12, 2, 2, 0xffff88);
      pixel(ctx, 5, 14, 0xffff66);
      rect(ctx, 8, 13, 2, 2, 0xffff88);
      pixel(ctx, 8, 15, 0xffff66);
      pixel(ctx, 7, 12, 0xffff66); // gap in wisps
      // Floating particles
      pixel(ctx, 3, 2, 0xffff66); pixel(ctx, 12, 9, 0xffff66);
    },
    (ctx) => {
      pixel(ctx, 3, 6, 0xffff99); pixel(ctx, 3, 9, 0xffff99);
      pixel(ctx, 11, 5, 0xffff99); pixel(ctx, 12, 7, 0xffff99);
      rect(ctx, 5, 3, 5, 9, 0xffff44);
      rect(ctx, 4, 5, 2, 5, 0xffff44);
      rect(ctx, 10, 4, 2, 4, 0xeeee33);
      rect(ctx, 6, 4, 3, 6, 0xffff88);
      pixel(ctx, 7, 4, 0xffffaa); pixel(ctx, 7, 5, 0xffffaa);
      pixel(ctx, 4, 9, 0xdddd22); pixel(ctx, 9, 3, 0xdddd22);
      rect(ctx, 5, 6, 2, 2, COLORS.BLACK);
      rect(ctx, 9, 6, 2, 2, COLORS.BLACK);
      pixel(ctx, 5, 5, 0xdddd33); pixel(ctx, 6, 5, 0xdddd33);
      pixel(ctx, 9, 5, 0xdddd33); pixel(ctx, 10, 5, 0xdddd33);
      pixel(ctx, 6, 6, 0xffffff); pixel(ctx, 10, 6, 0xffffff);
      pixel(ctx, 6, 9, COLORS.BLACK); pixel(ctx, 8, 10, COLORS.BLACK);
      pixel(ctx, 7, 9, COLORS.BLACK); pixel(ctx, 9, 9, COLORS.BLACK);
      rect(ctx, 4, 12, 2, 3, 0xffff88);
      pixel(ctx, 4, 14, 0xffff66);
      rect(ctx, 9, 13, 2, 2, 0xffff88);
      pixel(ctx, 9, 15, 0xffff66);
      pixel(ctx, 2, 4, 0xffff66); pixel(ctx, 13, 10, 0xffff66);
    }
  ]);

  // Projectile (enemy)
  makeTex(scene, 'enemy_projectile', 6, 6, (ctx) => {
    rect(ctx, 1, 1, 4, 4, 0xff4444);
    rect(ctx, 2, 2, 2, 2, 0xffaaaa);
  });

  // Player projectile (blaster)
  makeTex(scene, 'blaster_projectile', 8, 4, (ctx) => {
    rect(ctx, 0, 0, 8, 4, 0x00ffff);
    rect(ctx, 2, 1, 4, 2, COLORS.WHITE);
  });
}

// ---- NPCs ----
function genNPCTextures(scene: Phaser.Scene) {
  // Villager 1 - purple shirt, brown hair, red scarf
  makeFrameTex(scene, 'villager1', 16, 16, [
    (ctx) => {
      // Boots
      rect(ctx, 5, 14, 2, 2, COLORS.BROWN); rect(ctx, 9, 14, 2, 2, COLORS.BROWN);
      // Body (purple shirt)
      rect(ctx, 4, 8, 8, 6, 0x8855aa);
      rect(ctx, 4, 8, 8, 1, 0x9966bb); // shirt highlight
      // Belt
      rect(ctx, 4, 11, 8, 1, 0x5a3a20);
      pixel(ctx, 7, 11, COLORS.GOLD); // belt buckle
      // Head
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      // Hair (brown, parted)
      rect(ctx, 4, 1, 8, 2, 0x6b3a1a);
      pixel(ctx, 3, 2, 0x6b3a1a); pixel(ctx, 12, 2, 0x6b3a1a); // side hair
      pixel(ctx, 4, 3, 0x6b3a1a); pixel(ctx, 11, 3, 0x6b3a1a);
      // Eyes
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      pixel(ctx, 6, 3, 0xddb088); pixel(ctx, 9, 3, 0xddb088); // brow shadow
      // Mouth
      rect(ctx, 6, 6, 3, 1, 0xcc8855);
      // Scarf detail
      pixel(ctx, 4, 7, 0xcc3333); pixel(ctx, 5, 7, 0xcc3333);
      pixel(ctx, 4, 8, 0xaa2222);
    },
    (ctx) => {
      rect(ctx, 4, 14, 2, 2, COLORS.BROWN); rect(ctx, 10, 14, 2, 2, COLORS.BROWN);
      rect(ctx, 4, 8, 8, 6, 0x8855aa);
      rect(ctx, 4, 8, 8, 1, 0x9966bb);
      rect(ctx, 4, 11, 8, 1, 0x5a3a20);
      pixel(ctx, 7, 11, COLORS.GOLD);
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      rect(ctx, 4, 1, 8, 2, 0x6b3a1a);
      pixel(ctx, 3, 2, 0x6b3a1a); pixel(ctx, 12, 2, 0x6b3a1a);
      pixel(ctx, 4, 3, 0x6b3a1a); pixel(ctx, 11, 3, 0x6b3a1a);
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      pixel(ctx, 6, 3, 0xddb088); pixel(ctx, 9, 3, 0xddb088);
      rect(ctx, 6, 6, 3, 1, 0xcc8855);
      pixel(ctx, 4, 7, 0xcc3333); pixel(ctx, 5, 7, 0xcc3333);
      pixel(ctx, 4, 8, 0xaa2222);
    }
  ]);

  // Villager 2 - orange dress, blonde hair up, apron
  makeFrameTex(scene, 'villager2', 16, 16, [
    (ctx) => {
      rect(ctx, 5, 14, 2, 2, COLORS.BROWN); rect(ctx, 9, 14, 2, 2, COLORS.BROWN);
      // Orange dress
      rect(ctx, 4, 8, 8, 6, 0xcc6633);
      rect(ctx, 3, 10, 10, 4, 0xcc6633); // flared bottom
      rect(ctx, 4, 8, 8, 1, 0xdd7744); // dress highlight
      // Apron (white)
      rect(ctx, 5, 9, 6, 5, 0xeeeecc);
      rect(ctx, 6, 8, 4, 1, 0xeeeecc); // apron top
      pixel(ctx, 5, 9, 0xddddbb); pixel(ctx, 10, 9, 0xddddbb); // apron shadow
      // Head
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      // Blonde hair (bun on top)
      rect(ctx, 4, 1, 8, 2, 0xdaa520);
      rect(ctx, 5, 0, 6, 2, 0xdaa520); // bun
      rect(ctx, 6, 0, 4, 1, 0xc89418); // bun shadow
      pixel(ctx, 3, 2, 0xdaa520); pixel(ctx, 12, 2, 0xdaa520);
      // Eyes
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      // Blush
      pixel(ctx, 5, 5, 0xffaa88); pixel(ctx, 10, 5, 0xffaa88);
      // Mouth
      rect(ctx, 7, 6, 2, 1, 0xcc8855);
    },
    (ctx) => {
      rect(ctx, 4, 14, 2, 2, COLORS.BROWN); rect(ctx, 10, 14, 2, 2, COLORS.BROWN);
      rect(ctx, 4, 8, 8, 6, 0xcc6633);
      rect(ctx, 3, 10, 10, 4, 0xcc6633);
      rect(ctx, 4, 8, 8, 1, 0xdd7744);
      rect(ctx, 5, 9, 6, 5, 0xeeeecc);
      rect(ctx, 6, 8, 4, 1, 0xeeeecc);
      pixel(ctx, 5, 9, 0xddddbb); pixel(ctx, 10, 9, 0xddddbb);
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      rect(ctx, 4, 1, 8, 2, 0xdaa520);
      rect(ctx, 5, 0, 6, 2, 0xdaa520);
      rect(ctx, 6, 0, 4, 1, 0xc89418);
      pixel(ctx, 3, 2, 0xdaa520); pixel(ctx, 12, 2, 0xdaa520);
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      pixel(ctx, 5, 5, 0xffaa88); pixel(ctx, 10, 5, 0xffaa88);
      rect(ctx, 7, 6, 2, 1, 0xcc8855);
    }
  ]);

  // Villager 3 - guard-like, blue uniform, helmet hint
  makeFrameTex(scene, 'villager3', 16, 16, [
    (ctx) => {
      rect(ctx, 5, 14, 2, 2, 0x444444); rect(ctx, 9, 14, 2, 2, 0x444444); // dark boots
      // Blue uniform
      rect(ctx, 4, 8, 8, 6, 0x3366cc);
      rect(ctx, 4, 8, 8, 1, 0x4477dd); // highlight
      // Shoulder pads
      pixel(ctx, 3, 8, 0x4477dd); pixel(ctx, 12, 8, 0x4477dd);
      pixel(ctx, 3, 9, 0x3366cc); pixel(ctx, 12, 9, 0x3366cc);
      // Belt with sword hint
      rect(ctx, 4, 11, 8, 1, 0x5a3a20);
      pixel(ctx, 11, 10, 0xaaaaaa); pixel(ctx, 11, 11, 0xaaaaaa); // sword pommel
      // Head
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      // Helmet (iron)
      rect(ctx, 3, 0, 10, 3, 0x777777);
      rect(ctx, 3, 0, 10, 1, 0x999999); // helmet highlight
      rect(ctx, 3, 2, 10, 1, 0x555555); // helmet shadow
      pixel(ctx, 7, 0, 0xaaaaaa); pixel(ctx, 8, 0, 0xaaaaaa); // crest
      // Nose guard
      pixel(ctx, 7, 2, 0x666666); pixel(ctx, 8, 2, 0x666666);
      // Eyes
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      // Stern mouth
      rect(ctx, 6, 6, 4, 1, 0xcc8855);
      // Spear (held to the right)
      rect(ctx, 13, 2, 1, 12, 0x6b4226);
      pixel(ctx, 13, 1, 0xaaaaaa); pixel(ctx, 13, 0, 0xcccccc); // spear tip
    },
    (ctx) => {
      rect(ctx, 4, 14, 2, 2, 0x444444); rect(ctx, 10, 14, 2, 2, 0x444444);
      rect(ctx, 4, 8, 8, 6, 0x3366cc);
      rect(ctx, 4, 8, 8, 1, 0x4477dd);
      pixel(ctx, 3, 8, 0x4477dd); pixel(ctx, 12, 8, 0x4477dd);
      pixel(ctx, 3, 9, 0x3366cc); pixel(ctx, 12, 9, 0x3366cc);
      rect(ctx, 4, 11, 8, 1, 0x5a3a20);
      pixel(ctx, 11, 10, 0xaaaaaa); pixel(ctx, 11, 11, 0xaaaaaa);
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      rect(ctx, 3, 0, 10, 3, 0x777777);
      rect(ctx, 3, 0, 10, 1, 0x999999);
      rect(ctx, 3, 2, 10, 1, 0x555555);
      pixel(ctx, 7, 0, 0xaaaaaa); pixel(ctx, 8, 0, 0xaaaaaa);
      pixel(ctx, 7, 2, 0x666666); pixel(ctx, 8, 2, 0x666666);
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      rect(ctx, 6, 6, 4, 1, 0xcc8855);
      rect(ctx, 14, 2, 1, 12, 0x6b4226);
      pixel(ctx, 14, 1, 0xaaaaaa); pixel(ctx, 14, 0, 0xcccccc);
    }
  ]);

  // Villager elder - white hair/beard, robe, walking stick
  makeFrameTex(scene, 'villager_elder', 16, 16, [
    (ctx) => {
      rect(ctx, 5, 14, 2, 2, COLORS.BROWN); rect(ctx, 9, 14, 2, 2, COLORS.BROWN);
      // Long robe (gray/white)
      rect(ctx, 3, 8, 10, 7, 0xbbbbbb);
      rect(ctx, 3, 8, 10, 1, 0xcccccc); // robe highlight
      rect(ctx, 3, 14, 10, 1, 0x999999); // robe shadow
      // Robe folds
      pixel(ctx, 5, 10, 0xaaaaaa); pixel(ctx, 10, 12, 0xaaaaaa);
      // Sash
      rect(ctx, 5, 9, 6, 1, 0x8855aa);
      // Head
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      // White hair (flowing)
      rect(ctx, 4, 1, 8, 2, 0xeeeeee);
      pixel(ctx, 3, 2, 0xeeeeee); pixel(ctx, 3, 3, 0xdddddd); // side hair
      pixel(ctx, 12, 2, 0xeeeeee); pixel(ctx, 12, 3, 0xdddddd);
      pixel(ctx, 3, 4, 0xdddddd); pixel(ctx, 12, 4, 0xdddddd); // longer hair
      // Eyebrows (bushy white)
      pixel(ctx, 5, 3, 0xdddddd); pixel(ctx, 6, 3, 0xdddddd);
      pixel(ctx, 9, 3, 0xdddddd); pixel(ctx, 10, 3, 0xdddddd);
      // Eyes (small, wise)
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      // White beard
      rect(ctx, 5, 6, 6, 2, 0xeeeeee);
      rect(ctx, 6, 7, 4, 2, 0xdddddd);
      pixel(ctx, 7, 8, 0xdddddd); pixel(ctx, 8, 8, 0xdddddd);
      // Walking stick
      rect(ctx, 1, 5, 1, 11, 0x6b4226);
      pixel(ctx, 1, 4, 0x8b6d3c); // stick top knob
      pixel(ctx, 0, 4, 0x8b6d3c);
    },
    (ctx) => {
      rect(ctx, 4, 14, 2, 2, COLORS.BROWN); rect(ctx, 10, 14, 2, 2, COLORS.BROWN);
      rect(ctx, 3, 8, 10, 7, 0xbbbbbb);
      rect(ctx, 3, 8, 10, 1, 0xcccccc);
      rect(ctx, 3, 14, 10, 1, 0x999999);
      pixel(ctx, 5, 10, 0xaaaaaa); pixel(ctx, 10, 12, 0xaaaaaa);
      rect(ctx, 5, 9, 6, 1, 0x8855aa);
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      rect(ctx, 4, 1, 8, 2, 0xeeeeee);
      pixel(ctx, 3, 2, 0xeeeeee); pixel(ctx, 3, 3, 0xdddddd);
      pixel(ctx, 12, 2, 0xeeeeee); pixel(ctx, 12, 3, 0xdddddd);
      pixel(ctx, 3, 4, 0xdddddd); pixel(ctx, 12, 4, 0xdddddd);
      pixel(ctx, 5, 3, 0xdddddd); pixel(ctx, 6, 3, 0xdddddd);
      pixel(ctx, 9, 3, 0xdddddd); pixel(ctx, 10, 3, 0xdddddd);
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      rect(ctx, 5, 6, 6, 2, 0xeeeeee);
      rect(ctx, 6, 7, 4, 2, 0xdddddd);
      pixel(ctx, 7, 8, 0xdddddd); pixel(ctx, 8, 8, 0xdddddd);
      rect(ctx, 2, 5, 1, 11, 0x6b4226);
      pixel(ctx, 2, 4, 0x8b6d3c);
      pixel(ctx, 1, 4, 0x8b6d3c);
    }
  ]);

  // Pick the Pickle - more bumps and detail
  makeFrameTex(scene, 'pickle', 16, 16, [
    (ctx) => {
      // Main body
      rect(ctx, 4, 1, 8, 13, 0x5ea84c);
      rect(ctx, 5, 0, 6, 2, 0x5ea84c);
      rect(ctx, 5, 13, 6, 2, 0x5ea84c);
      // Lighter belly
      rect(ctx, 6, 3, 4, 8, 0x6bba58);
      // Bumps (varied greens)
      pixel(ctx, 3, 4, 0x4d8a3e); pixel(ctx, 3, 7, 0x4d8a3e); pixel(ctx, 3, 10, 0x4d8a3e);
      pixel(ctx, 12, 5, 0x4d8a3e); pixel(ctx, 12, 8, 0x4d8a3e); pixel(ctx, 12, 11, 0x4d8a3e);
      pixel(ctx, 5, 2, 0x4d8a3e); pixel(ctx, 10, 12, 0x4d8a3e);
      // Highlight bumps
      pixel(ctx, 4, 3, 0x72c060); pixel(ctx, 11, 6, 0x72c060);
      pixel(ctx, 4, 9, 0x72c060); pixel(ctx, 11, 10, 0x72c060);
      // Eyes
      pixel(ctx, 6, 5, COLORS.WHITE); pixel(ctx, 9, 5, COLORS.WHITE);
      pixel(ctx, 7, 5, COLORS.BLACK); pixel(ctx, 10, 5, COLORS.BLACK);
      // Smile
      rect(ctx, 6, 8, 4, 1, COLORS.WHITE);
      pixel(ctx, 5, 7, COLORS.WHITE); pixel(ctx, 10, 7, COLORS.WHITE); // smile corners
      // Top hat
      rect(ctx, 5, -2, 6, 3, COLORS.BLACK);
      rect(ctx, 4, 0, 8, 1, COLORS.BLACK);
      rect(ctx, 5, -2, 6, 1, 0x222222); // hat highlight
      // Hat band
      pixel(ctx, 5, 0, 0xcc3333); pixel(ctx, 6, 0, 0xcc3333);
      pixel(ctx, 7, 0, 0xcc3333); pixel(ctx, 8, 0, 0xcc3333);
      pixel(ctx, 9, 0, 0xcc3333); pixel(ctx, 10, 0, 0xcc3333);
      // Legs
      rect(ctx, 4, 12, 2, 3, 0x4d8a3e); rect(ctx, 10, 12, 2, 3, 0x4d8a3e);
    },
    (ctx) => {
      rect(ctx, 4, 2, 8, 12, 0x5ea84c);
      rect(ctx, 5, 1, 6, 2, 0x5ea84c);
      rect(ctx, 5, 13, 6, 2, 0x5ea84c);
      rect(ctx, 6, 4, 4, 7, 0x6bba58);
      pixel(ctx, 3, 5, 0x4d8a3e); pixel(ctx, 3, 8, 0x4d8a3e); pixel(ctx, 3, 11, 0x4d8a3e);
      pixel(ctx, 12, 6, 0x4d8a3e); pixel(ctx, 12, 9, 0x4d8a3e);
      pixel(ctx, 4, 4, 0x72c060); pixel(ctx, 11, 7, 0x72c060);
      pixel(ctx, 6, 6, COLORS.WHITE); pixel(ctx, 9, 6, COLORS.WHITE);
      pixel(ctx, 7, 6, COLORS.BLACK); pixel(ctx, 10, 6, COLORS.BLACK);
      rect(ctx, 6, 9, 4, 2, COLORS.WHITE);
      pixel(ctx, 5, 8, COLORS.WHITE); pixel(ctx, 10, 8, COLORS.WHITE);
      rect(ctx, 5, -1, 6, 3, COLORS.BLACK);
      rect(ctx, 4, 1, 8, 1, COLORS.BLACK);
      rect(ctx, 5, -1, 6, 1, 0x222222);
      pixel(ctx, 5, 1, 0xcc3333); pixel(ctx, 6, 1, 0xcc3333);
      pixel(ctx, 7, 1, 0xcc3333); pixel(ctx, 8, 1, 0xcc3333);
      pixel(ctx, 9, 1, 0xcc3333); pixel(ctx, 10, 1, 0xcc3333);
      rect(ctx, 3, 13, 2, 3, 0x4d8a3e); rect(ctx, 11, 13, 2, 3, 0x4d8a3e);
    }
  ]);

  // Princess Zeldor (robot princess)
  makeFrameTex(scene, 'zeldor', 16, 16, [
    (ctx) => {
      // Dress
      rect(ctx, 3, 8, 10, 7, 0xff69b4);
      rect(ctx, 4, 7, 8, 2, 0xff69b4);
      // Metallic body
      rect(ctx, 5, 6, 6, 3, 0xc0c0c0);
      // Head
      rect(ctx, 4, 1, 8, 5, 0xc0c0c0);
      // Crown
      rect(ctx, 3, 0, 10, 2, COLORS.GOLD);
      pixel(ctx, 4, -1, COLORS.GOLD); pixel(ctx, 8, -1, COLORS.GOLD); pixel(ctx, 12, -1, COLORS.GOLD);
      // Eyes (glowing)
      pixel(ctx, 6, 3, 0x00ffff); pixel(ctx, 9, 3, 0x00ffff);
      // Mouth
      rect(ctx, 6, 5, 4, 1, 0x00ffff);
    },
    (ctx) => {
      rect(ctx, 3, 9, 10, 6, 0xff69b4);
      rect(ctx, 4, 8, 8, 2, 0xff69b4);
      rect(ctx, 5, 7, 6, 3, 0xc0c0c0);
      rect(ctx, 4, 2, 8, 5, 0xc0c0c0);
      rect(ctx, 3, 1, 10, 2, COLORS.GOLD);
      pixel(ctx, 4, 0, COLORS.GOLD); pixel(ctx, 8, 0, COLORS.GOLD); pixel(ctx, 12, 0, COLORS.GOLD);
      pixel(ctx, 6, 4, 0xff00ff); pixel(ctx, 9, 4, 0xff00ff);
      rect(ctx, 6, 6, 4, 1, 0xff00ff);
    }
  ]);

  // Merchant - hat, bigger build, coin pouch
  makeFrameTex(scene, 'merchant', 16, 16, [
    (ctx) => {
      rect(ctx, 5, 14, 2, 2, COLORS.BROWN); rect(ctx, 9, 14, 2, 2, COLORS.BROWN);
      // Bigger body (merchant belly)
      rect(ctx, 3, 8, 10, 6, 0xaa8833);
      rect(ctx, 3, 8, 10, 1, 0xbb9944); // shirt highlight
      // Belly highlight
      rect(ctx, 5, 10, 6, 2, 0xbb9944);
      // Belt
      rect(ctx, 3, 12, 10, 1, 0x5a3a20);
      // Coin pouch on belt
      rect(ctx, 10, 11, 3, 2, 0x8b5e3c);
      pixel(ctx, 11, 11, COLORS.GOLD); // coin peeking out
      // Head
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      // Big hat (merchant cap)
      rect(ctx, 3, 0, 10, 3, 0x993322);
      rect(ctx, 2, 2, 12, 1, 0x993322); // wide brim
      rect(ctx, 3, 0, 10, 1, 0xaa4433); // hat highlight
      // Mustache
      pixel(ctx, 5, 5, 0x5a3a1a); pixel(ctx, 6, 6, 0x5a3a1a);
      pixel(ctx, 10, 5, 0x5a3a1a); pixel(ctx, 9, 6, 0x5a3a1a);
      // Eyes
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      // Smile
      rect(ctx, 7, 6, 2, 1, 0xcc8855);
    },
    (ctx) => {
      rect(ctx, 4, 14, 2, 2, COLORS.BROWN); rect(ctx, 10, 14, 2, 2, COLORS.BROWN);
      rect(ctx, 3, 8, 10, 6, 0xaa8833);
      rect(ctx, 3, 8, 10, 1, 0xbb9944);
      rect(ctx, 5, 10, 6, 2, 0xbb9944);
      rect(ctx, 3, 12, 10, 1, 0x5a3a20);
      rect(ctx, 10, 11, 3, 2, 0x8b5e3c);
      pixel(ctx, 11, 11, COLORS.GOLD);
      rect(ctx, 4, 2, 8, 6, COLORS.SKIN);
      rect(ctx, 3, 0, 10, 3, 0x993322);
      rect(ctx, 2, 2, 12, 1, 0x993322);
      rect(ctx, 3, 0, 10, 1, 0xaa4433);
      pixel(ctx, 5, 5, 0x5a3a1a); pixel(ctx, 6, 6, 0x5a3a1a);
      pixel(ctx, 10, 5, 0x5a3a1a); pixel(ctx, 9, 6, 0x5a3a1a);
      pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
      rect(ctx, 7, 6, 2, 1, 0xcc8855);
    }
  ]);

  // Netanyahu cameo sprite
  makeTex(scene, 'netanyahu', 16, 20, (ctx) => {
    // Simple suited figure
    rect(ctx, 4, 8, 8, 10, 0x222244); // suit
    rect(ctx, 6, 9, 4, 2, COLORS.WHITE); // shirt
    rect(ctx, 7, 9, 2, 1, COLORS.RED); // tie
    rect(ctx, 4, 2, 8, 7, COLORS.SKIN); // head
    rect(ctx, 3, 1, 10, 2, 0x444444); // hair
    pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK); // eyes
    rect(ctx, 6, 6, 4, 1, 0xcc9977); // mouth
    rect(ctx, 5, 18, 2, 2, COLORS.BLACK); rect(ctx, 9, 18, 2, 2, COLORS.BLACK); // shoes
  });
}

// ---- BOSSES ----
function genBossTextures(scene: Phaser.Scene) {
  // Stone Idiot Sentinel (shrine miniboss) 32x32
  makeTex(scene, 'stone_sentinel', 32, 32, (ctx) => {
    // Stone body
    rect(ctx, 6, 8, 20, 20, 0x888888);
    rect(ctx, 8, 4, 16, 8, 0x999999);
    // Head
    rect(ctx, 10, 0, 12, 8, 0xaaaaaa);
    // Derpy eyes
    rect(ctx, 12, 2, 3, 3, COLORS.WHITE);
    rect(ctx, 18, 2, 3, 3, COLORS.WHITE);
    pixel(ctx, 13, 3, COLORS.BLACK);
    pixel(ctx, 20, 4, COLORS.BLACK); // one eye looking wrong way
    // Dumb mouth
    rect(ctx, 13, 6, 6, 2, COLORS.BLACK);
    // Arms
    rect(ctx, 1, 12, 5, 10, 0x888888);
    rect(ctx, 26, 12, 5, 10, 0x888888);
    // Legs
    rect(ctx, 8, 28, 6, 4, 0x777777);
    rect(ctx, 18, 28, 6, 4, 0x777777);
    // Moss
    pixel(ctx, 7, 10, 0x44aa44); pixel(ctx, 22, 15, 0x44aa44);
    pixel(ctx, 10, 20, 0x44aa44);
  });

  // Gatekeeper 2000 (gates boss) 32x32
  makeTex(scene, 'gatekeeper', 32, 32, (ctx) => {
    // Machine body
    rect(ctx, 4, 6, 24, 22, 0x445566);
    rect(ctx, 6, 4, 20, 4, 0x556677);
    // Screen face
    rect(ctx, 8, 8, 16, 10, 0x002200);
    rect(ctx, 9, 9, 14, 8, 0x003300);
    // Digital eyes on screen
    rect(ctx, 11, 10, 3, 3, 0x00ff00);
    rect(ctx, 19, 10, 3, 3, 0x00ff00);
    // Pixel mouth
    rect(ctx, 12, 14, 2, 1, 0x00ff00); rect(ctx, 15, 14, 2, 1, 0x00ff00); rect(ctx, 18, 14, 2, 1, 0x00ff00);
    // Arms
    rect(ctx, 0, 10, 4, 14, 0x445566);
    rect(ctx, 28, 10, 4, 14, 0x445566);
    // Claws
    rect(ctx, 0, 24, 3, 3, 0xff4400);
    rect(ctx, 29, 24, 3, 3, 0xff4400);
    // Legs
    rect(ctx, 8, 28, 5, 4, 0x334455);
    rect(ctx, 19, 28, 5, 4, 0x334455);
    // Lights
    pixel(ctx, 6, 5, COLORS.RED); pixel(ctx, 16, 5, 0x00ff00); pixel(ctx, 25, 5, 0x0088ff);
  });

  // King Slop.exe (sewers boss) 32x32
  makeTex(scene, 'king_slop', 32, 32, (ctx) => {
    // Blobby green mass
    ctx.fillStyle = hex(0x44aa33);
    ctx.beginPath(); ctx.arc(16, 18, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hex(0x55cc44);
    ctx.beginPath(); ctx.arc(16, 16, 10, 0, Math.PI * 2); ctx.fill();
    // Eyes
    rect(ctx, 9, 12, 4, 4, COLORS.WHITE);
    rect(ctx, 19, 12, 4, 4, COLORS.WHITE);
    pixel(ctx, 10, 13, COLORS.BLACK); pixel(ctx, 11, 13, COLORS.BLACK);
    pixel(ctx, 20, 13, COLORS.BLACK); pixel(ctx, 21, 13, COLORS.BLACK);
    // Gross mouth
    rect(ctx, 10, 20, 12, 3, 0x225511);
    rect(ctx, 12, 21, 2, 1, 0xaaff88); rect(ctx, 17, 21, 2, 1, 0xaaff88); // teeth
    // Crown of garbage
    pixel(ctx, 8, 6, 0x888888); pixel(ctx, 14, 4, 0xcccc00); pixel(ctx, 20, 5, 0x884400);
    pixel(ctx, 12, 3, 0xff4488);
    // Drips
    rect(ctx, 5, 28, 2, 4, 0x33aa22); rect(ctx, 25, 28, 2, 4, 0x33aa22);
  });

  // SHREEK (final boss) 48x48
  const canvas = document.createElement('canvas');
  canvas.width = 48 * 3; // 3 phases
  canvas.height = 48;
  const sctx = canvas.getContext('2d')!;
  sctx.imageSmoothingEnabled = false;

  const drawShreek = (ox: number, phase: number) => {
    // Body - big ugly green ogre
    const bodyGreen = phase === 2 ? 0x33ff33 : 0x5c8a2f;
    const darkGreen = phase === 2 ? 0x22cc22 : 0x4a7023;

    // Body
    rect(sctx, ox + 10, 16, 28, 26, bodyGreen);
    // Head
    rect(sctx, ox + 12, 2, 24, 18, bodyGreen);
    // Ears (tube-like)
    rect(sctx, ox + 8, 6, 5, 6, darkGreen);
    rect(sctx, ox + 35, 6, 5, 6, darkGreen);
    // Eyes
    rect(sctx, ox + 16, 8, 5, 4, COLORS.WHITE);
    rect(sctx, ox + 27, 8, 5, 4, COLORS.WHITE);
    if (phase === 2) {
      rect(sctx, ox + 17, 9, 3, 2, COLORS.RED);
      rect(sctx, ox + 28, 9, 3, 2, COLORS.RED);
    } else {
      rect(sctx, ox + 18, 9, 2, 2, COLORS.BLACK);
      rect(sctx, ox + 29, 9, 2, 2, COLORS.BLACK);
    }
    // Mouth
    rect(sctx, ox + 16, 14, 16, 4, COLORS.BLACK);
    rect(sctx, ox + 18, 14, 2, 2, COLORS.WHITE); // teeth
    rect(sctx, ox + 24, 14, 2, 2, COLORS.WHITE);
    rect(sctx, ox + 28, 14, 2, 2, COLORS.WHITE);
    // Vest
    rect(sctx, ox + 12, 20, 24, 8, 0x5a3810);
    // Arms
    rect(sctx, ox + 4, 18, 6, 16, bodyGreen);
    rect(sctx, ox + 38, 18, 6, 16, bodyGreen);
    // Legs
    rect(sctx, ox + 14, 42, 8, 6, darkGreen);
    rect(sctx, ox + 26, 42, 8, 6, darkGreen);
    // Club (phase 0)
    if (phase === 0) {
      rect(sctx, ox + 40, 10, 6, 20, 0x6b4226);
      rect(sctx, ox + 38, 6, 10, 6, 0x7a5030);
    }
    // Spit particles (phase 1)
    if (phase === 1) {
      pixel(sctx, ox + 20, 18, 0xaaff44);
      pixel(sctx, ox + 26, 20, 0xaaff44);
      pixel(sctx, ox + 14, 19, 0xaaff44);
    }
    // Glitch effects (phase 2)
    if (phase === 2) {
      for (let i = 0; i < 8; i++) {
        rect(sctx, ox + (i * 5) % 40, (i * 7) % 40 + 4, 3, 1, 0xff00ff);
      }
    }
  };

  drawShreek(0, 0);
  drawShreek(48, 1);
  drawShreek(96, 2);
  scene.textures.addSpriteSheet('shreek', canvas as unknown as HTMLImageElement, { frameWidth: 48, frameHeight: 48 });
}

// ---- ITEMS / PICKUPS ----
function genItemTextures(scene: Phaser.Scene) {
  // Heart pickup - with highlight/shine
  makeTex(scene, 'heart_pickup', 12, 12, (ctx) => {
    // Base heart
    ctx.fillStyle = hex(COLORS.HEART_RED);
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(6, 11); ctx.lineTo(11, 5); ctx.fill();
    // Darker shadow (bottom-right)
    pixel(ctx, 8, 8, 0xc0392b); pixel(ctx, 7, 9, 0xc0392b);
    pixel(ctx, 9, 6, 0xc0392b); pixel(ctx, 10, 5, 0xc0392b);
    // Highlight shine (top-left)
    pixel(ctx, 3, 2, 0xff8888); pixel(ctx, 4, 2, 0xff8888);
    pixel(ctx, 2, 3, 0xff7777);
    // Bright specular
    pixel(ctx, 3, 3, 0xffaaaa);
  });

  // Zlorp coin - proper coin with rim and Z
  makeTex(scene, 'zlorp', 10, 10, (ctx) => {
    // Outer rim (darker gold)
    ctx.fillStyle = hex(0xccaa00);
    ctx.beginPath(); ctx.arc(5, 5, 4, 0, Math.PI * 2); ctx.fill();
    // Inner face (bright gold)
    ctx.fillStyle = hex(COLORS.GOLD);
    ctx.beginPath(); ctx.arc(5, 5, 3, 0, Math.PI * 2); ctx.fill();
    // Highlight arc (top)
    pixel(ctx, 4, 2, 0xffee55); pixel(ctx, 5, 2, 0xffee55);
    pixel(ctx, 3, 3, 0xffee55);
    // Shadow arc (bottom)
    pixel(ctx, 5, 7, 0xbb9900); pixel(ctx, 6, 7, 0xbb9900);
    pixel(ctx, 7, 6, 0xbb9900);
    // Z letter (dark gold)
    rect(ctx, 3, 3, 4, 1, 0x997700);
    pixel(ctx, 6, 4, 0x997700);
    pixel(ctx, 5, 5, 0x997700);
    pixel(ctx, 4, 6, 0x997700);
    rect(ctx, 3, 7, 4, 1, 0x997700);
  });

  // Key - ornate head with shaft detail
  makeTex(scene, 'key', 10, 14, (ctx) => {
    // Key head (ornate ring shape)
    rect(ctx, 2, 0, 6, 5, COLORS.GOLD);
    rect(ctx, 3, 1, 4, 3, 0x111111); // hole in head
    rect(ctx, 3, 1, 4, 1, 0x222222); // slightly lighter top of hole
    // Head highlights
    rect(ctx, 2, 0, 6, 1, 0xffee55); // top highlight
    pixel(ctx, 2, 1, 0xffee55); pixel(ctx, 2, 2, 0xffee55); // left highlight
    // Head shadows
    pixel(ctx, 7, 3, 0xccaa00); pixel(ctx, 7, 2, 0xccaa00);
    rect(ctx, 2, 4, 6, 1, 0xccaa00); // bottom shadow
    // Shaft
    rect(ctx, 4, 5, 2, 7, COLORS.GOLD);
    pixel(ctx, 4, 5, 0xffee55); // shaft highlight
    pixel(ctx, 5, 11, 0xccaa00); // shaft shadow
    // Teeth (bottom, two notches)
    rect(ctx, 3, 10, 1, 2, COLORS.GOLD);
    rect(ctx, 6, 10, 2, 1, COLORS.GOLD);
    rect(ctx, 6, 12, 2, 1, COLORS.GOLD);
    // Teeth shadows
    pixel(ctx, 7, 10, 0xccaa00); pixel(ctx, 7, 12, 0xccaa00);
  });

  // Ammo pickup - energy cell with glow
  makeTex(scene, 'ammo_pickup', 10, 10, (ctx) => {
    // Cell casing
    rect(ctx, 1, 2, 8, 6, 0x008888);
    rect(ctx, 1, 2, 8, 1, 0x009999); // top highlight
    rect(ctx, 1, 7, 8, 1, 0x006666); // bottom shadow
    // Cap
    rect(ctx, 3, 0, 4, 2, 0x00aaaa);
    rect(ctx, 3, 0, 4, 1, 0x00cccc); // cap highlight
    // Energy window (glowing)
    rect(ctx, 3, 3, 4, 3, 0x00ffff);
    rect(ctx, 3, 3, 4, 1, 0x88ffff); // bright top
    pixel(ctx, 4, 4, COLORS.WHITE); // specular
    // Glow pixels around cell
    pixel(ctx, 0, 4, 0x004444); pixel(ctx, 9, 4, 0x004444);
    pixel(ctx, 0, 5, 0x004444); pixel(ctx, 9, 5, 0x004444);
  });

  // Legend Sword item - sparkle, blade gradient
  makeTex(scene, 'legend_sword', 12, 20, (ctx) => {
    // Blade with gradient (lighter at edge, darker at center)
    rect(ctx, 5, 0, 2, 12, 0xccccee); // blade core
    rect(ctx, 4, 0, 1, 12, 0xddddff); // left edge (bright)
    rect(ctx, 7, 0, 1, 12, 0xaaaacc); // right edge (shadow)
    // Blade tip
    rect(ctx, 4, 0, 4, 1, 0xeeeeff);
    pixel(ctx, 5, 0, 0xffffff); // tip highlight
    // Blade texture
    pixel(ctx, 5, 3, 0xddddff); pixel(ctx, 6, 6, 0xbbbbdd);
    pixel(ctx, 5, 8, 0xddddff); pixel(ctx, 6, 10, 0xbbbbdd);
    // Fuller (central groove)
    pixel(ctx, 5, 2, 0xbbbbdd); pixel(ctx, 5, 4, 0xbbbbdd);
    pixel(ctx, 5, 6, 0xbbbbdd); pixel(ctx, 5, 8, 0xbbbbdd);
    pixel(ctx, 5, 10, 0xbbbbdd);
    // Guard
    rect(ctx, 2, 12, 8, 2, COLORS.GOLD);
    rect(ctx, 2, 12, 8, 1, 0xffee55); // guard highlight
    pixel(ctx, 9, 13, 0xccaa00); // guard shadow
    // Handle (wrapped)
    rect(ctx, 5, 14, 2, 4, 0x6b4226);
    pixel(ctx, 5, 15, 0x553318); pixel(ctx, 6, 16, 0x553318); // wrap detail
    // Pommel (red gem)
    rect(ctx, 4, 18, 4, 2, COLORS.RED);
    pixel(ctx, 4, 18, 0xff4444); // gem highlight
    pixel(ctx, 7, 19, 0xaa0000); // gem shadow
    // Sparkle effects
    pixel(ctx, 3, 2, 0xaaaaff); pixel(ctx, 8, 5, 0xaaaaff);
    pixel(ctx, 2, 7, 0x8888ff); pixel(ctx, 9, 9, 0x8888ff);
    pixel(ctx, 1, 1, 0xffffff); // bright sparkle
    pixel(ctx, 10, 4, 0xffffff);
  });

  // Shield item - emblem, highlight edge
  makeTex(scene, 'shield_item', 14, 16, (ctx) => {
    // Shield shape
    rect(ctx, 1, 0, 12, 14, 0x3498db);
    rect(ctx, 0, 2, 14, 10, 0x3498db);
    rect(ctx, 2, 14, 10, 2, 0x3498db);
    // Highlight edge (top and left)
    rect(ctx, 1, 0, 12, 1, 0x5dade2); // top highlight
    pixel(ctx, 0, 2, 0x5dade2); pixel(ctx, 0, 3, 0x5dade2);
    pixel(ctx, 0, 4, 0x5dade2); pixel(ctx, 1, 1, 0x5dade2);
    // Shadow edge (bottom and right)
    rect(ctx, 3, 15, 8, 1, 0x2471a3);
    pixel(ctx, 13, 6, 0x2471a3); pixel(ctx, 13, 7, 0x2471a3);
    pixel(ctx, 13, 8, 0x2471a3); pixel(ctx, 13, 9, 0x2471a3);
    // Inner panel
    rect(ctx, 3, 3, 8, 8, 0x2980b9);
    rect(ctx, 3, 3, 8, 1, 0x3090c9); // panel highlight
    // Cross emblem
    rect(ctx, 5, 4, 4, 6, COLORS.GOLD);
    rect(ctx, 4, 6, 6, 2, COLORS.GOLD);
    // Emblem highlight
    pixel(ctx, 5, 4, 0xffee55); pixel(ctx, 6, 4, 0xffee55);
    pixel(ctx, 4, 6, 0xffee55);
    // Emblem shadow
    pixel(ctx, 8, 9, 0xccaa00); pixel(ctx, 9, 7, 0xccaa00);
    // Rivet details
    pixel(ctx, 2, 2, 0x85c1e9); pixel(ctx, 11, 2, 0x85c1e9);
    pixel(ctx, 2, 12, 0x1a5276); pixel(ctx, 11, 12, 0x1a5276);
  });

  // Blaster weapon - sci-fi detail, vents
  makeTex(scene, 'blaster_item', 16, 10, (ctx) => {
    // Main body
    rect(ctx, 0, 2, 12, 6, 0x444444);
    rect(ctx, 0, 2, 12, 1, 0x555555); // body highlight
    rect(ctx, 0, 7, 12, 1, 0x333333); // body shadow
    // Barrel
    rect(ctx, 12, 3, 4, 4, 0x555555);
    rect(ctx, 12, 3, 4, 1, 0x666666); // barrel highlight
    pixel(ctx, 15, 4, 0x666666); // barrel mouth highlight
    pixel(ctx, 15, 6, 0x444444); // barrel shadow
    // Barrel mouth glow
    pixel(ctx, 15, 5, 0x00ffff);
    // Scope
    rect(ctx, 2, 0, 4, 3, 0x555555);
    rect(ctx, 2, 0, 4, 1, 0x666666); // scope highlight
    pixel(ctx, 5, 1, 0x00aaaa); // scope lens
    // Trigger guard
    rect(ctx, 3, 8, 2, 2, 0x333333);
    pixel(ctx, 3, 8, 0x444444);
    // Energy cell (glowing)
    rect(ctx, 8, 3, 2, 4, 0x00cccc);
    rect(ctx, 8, 3, 2, 1, 0x00ffff); // cell top glow
    pixel(ctx, 8, 4, COLORS.WHITE); // bright spot
    // Vents
    pixel(ctx, 1, 4, 0x333333); pixel(ctx, 1, 5, 0x555555);
    pixel(ctx, 1, 6, 0x333333);
    // Panel lines
    rect(ctx, 6, 3, 1, 4, 0x3a3a3a);
    rect(ctx, 10, 3, 1, 4, 0x3a3a3a);
  });

  // Banana relic - proper curve, brown spots
  makeTex(scene, 'banana', 12, 16, (ctx) => {
    // Main banana body (curved)
    rect(ctx, 4, 1, 4, 12, 0xffdd00);
    rect(ctx, 3, 3, 2, 8, 0xffdd00);
    rect(ctx, 8, 2, 2, 6, 0xeecc00);
    // Inner curve (lighter)
    rect(ctx, 5, 2, 2, 10, 0xffee44);
    // Outer edge shadow (right)
    pixel(ctx, 9, 3, 0xddbb00); pixel(ctx, 9, 5, 0xddbb00);
    pixel(ctx, 7, 11, 0xddbb00); pixel(ctx, 7, 12, 0xddbb00);
    // Top highlight
    pixel(ctx, 4, 1, 0xffee66); pixel(ctx, 5, 1, 0xffee66);
    // Bottom (darker end)
    rect(ctx, 4, 13, 3, 2, 0xccaa00);
    pixel(ctx, 5, 14, 0xbb9900);
    // Stem
    pixel(ctx, 5, 0, 0x8b6914); pixel(ctx, 6, 0, 0x6b4d0e);
    // Brown spots
    pixel(ctx, 4, 5, 0xaa8800); pixel(ctx, 6, 9, 0xaa8800);
    pixel(ctx, 3, 7, 0xbb9900);
    // Subtle ridges
    pixel(ctx, 5, 4, 0xeedd33); pixel(ctx, 5, 7, 0xeedd33);
  });

  // Portal shard
  makeTex(scene, 'portal_shard', 10, 14, (ctx) => {
    rect(ctx, 3, 0, 4, 14, 0x9966ff);
    rect(ctx, 1, 4, 8, 6, 0xaa77ff);
    rect(ctx, 4, 2, 2, 10, 0xcc99ff);
    pixel(ctx, 5, 6, COLORS.WHITE);
  });

  // Joke items
  makeTex(scene, 'rubber_duck', 12, 12, (ctx) => {
    ctx.fillStyle = hex(0xffdd00);
    ctx.beginPath(); ctx.arc(6, 7, 5, 0, Math.PI * 2); ctx.fill();
    rect(ctx, 3, 3, 5, 4, 0xffdd00); // head
    pixel(ctx, 4, 4, COLORS.BLACK); // eye
    rect(ctx, 7, 5, 3, 2, 0xff8800); // beak
  });

  makeTex(scene, 'sock', 10, 14, (ctx) => {
    rect(ctx, 3, 0, 4, 8, 0xcc8866);
    rect(ctx, 1, 8, 8, 4, 0xcc8866);
    rect(ctx, 0, 10, 4, 4, 0xcc8866);
    pixel(ctx, 4, 2, 0xaa6644); pixel(ctx, 5, 5, 0xaa6644); // holes
  });
}

// ---- UI ELEMENTS ----
function genUITextures(scene: Phaser.Scene) {
  // Heart full
  makeTex(scene, 'heart_full', 12, 12, (ctx) => {
    ctx.fillStyle = hex(COLORS.HEART_RED);
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(6, 11); ctx.lineTo(11, 5); ctx.fill();
  });

  // Heart half
  makeTex(scene, 'heart_half', 12, 12, (ctx) => {
    ctx.fillStyle = hex(COLORS.HEART_EMPTY);
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(6, 11); ctx.lineTo(11, 5); ctx.fill();
    // Left half red
    ctx.fillStyle = hex(COLORS.HEART_RED);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 6, 12); ctx.clip();
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(6, 11); ctx.lineTo(11, 5); ctx.fill();
    ctx.restore();
  });

  // Heart empty
  makeTex(scene, 'heart_empty', 12, 12, (ctx) => {
    ctx.fillStyle = hex(COLORS.HEART_EMPTY);
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(6, 11); ctx.lineTo(11, 5); ctx.fill();
  });

  // Dialog box background
  makeTex(scene, 'dialog_bg', 400, 80, (ctx) => {
    rect(ctx, 0, 0, 400, 80, 0x111122);
    rect(ctx, 2, 2, 396, 76, 0x1a1a2e);
    // Border
    rect(ctx, 0, 0, 400, 2, COLORS.UI_BORDER);
    rect(ctx, 0, 78, 400, 2, COLORS.UI_BORDER);
    rect(ctx, 0, 0, 2, 80, COLORS.UI_BORDER);
    rect(ctx, 398, 0, 2, 80, COLORS.UI_BORDER);
  });

  // Menu cursor
  makeTex(scene, 'cursor', 10, 10, (ctx) => {
    ctx.fillStyle = hex(COLORS.WHITE);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(10, 5); ctx.lineTo(0, 10);
    ctx.fill();
  });

  // Inventory slot
  makeTex(scene, 'inv_slot', 24, 24, (ctx) => {
    rect(ctx, 0, 0, 24, 24, 0x222233);
    rect(ctx, 1, 1, 22, 22, 0x333344);
    rect(ctx, 0, 0, 24, 1, COLORS.UI_BORDER);
    rect(ctx, 0, 23, 24, 1, COLORS.UI_BORDER);
    rect(ctx, 0, 0, 1, 24, COLORS.UI_BORDER);
    rect(ctx, 23, 0, 1, 24, COLORS.UI_BORDER);
  });
}

// ---- TILE TEXTURES ----
function genTileTextures(scene: Phaser.Scene) {
  const S = TILE_SIZE;

  // Grass - lush varied meadow with tufts, flowers, dirt specks
  makeTex(scene, 'tile_grass', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x4a8c2a); // base green
    // Varied shade patches (dithered)
    for (let y = 0; y < S; y += 2) {
      for (let x = (y % 4 === 0 ? 0 : 1); x < S; x += 4) {
        pixel(ctx, x, y, 0x438125);
      }
    }
    // Lighter grass blades
    pixel(ctx, 1, 3, 0x5ea84c); pixel(ctx, 2, 2, 0x5ea84c);
    pixel(ctx, 6, 1, 0x5ea84c); pixel(ctx, 7, 0, 0x5ea84c);
    pixel(ctx, 12, 5, 0x5ea84c); pixel(ctx, 13, 4, 0x5ea84c);
    pixel(ctx, 3, 10, 0x5ea84c); pixel(ctx, 4, 9, 0x5ea84c);
    pixel(ctx, 10, 12, 0x5ea84c); pixel(ctx, 11, 11, 0x5ea84c);
    // Dark grass tufts
    pixel(ctx, 0, 7, 0x3d7a22); pixel(ctx, 1, 7, 0x3d7a22);
    pixel(ctx, 8, 3, 0x3d7a22); pixel(ctx, 9, 3, 0x3d7a22);
    pixel(ctx, 14, 10, 0x3d7a22); pixel(ctx, 15, 10, 0x3d7a22);
    pixel(ctx, 5, 14, 0x3d7a22); pixel(ctx, 6, 14, 0x3d7a22);
    // Dirt specks
    pixel(ctx, 4, 6, 0x8b7355); pixel(ctx, 11, 14, 0x8b7355);
    pixel(ctx, 14, 1, 0x7a6244);
    // Tiny flowers
    pixel(ctx, 2, 12, 0xffdd44); // yellow flower
    pixel(ctx, 13, 7, 0xff6688); // pink flower
    pixel(ctx, 9, 0, 0xffffff); // white flower
  });

  // Dirt path - textured with pebbles and cracks
  makeTex(scene, 'tile_dirt', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x8b7355); // base
    // Shade variation dithering
    for (let y = 0; y < S; y += 2) {
      for (let x = (y % 4 === 0 ? 1 : 0); x < S; x += 3) {
        pixel(ctx, x, y, 0x826a4e);
      }
    }
    // Lighter patches
    rect(ctx, 2, 2, 3, 2, 0x9c8466);
    rect(ctx, 10, 8, 3, 2, 0x9c8466);
    rect(ctx, 6, 12, 4, 2, 0x9c8466);
    // Dark cracks
    pixel(ctx, 1, 5, 0x6b5535); pixel(ctx, 2, 6, 0x6b5535); pixel(ctx, 3, 6, 0x6b5535);
    pixel(ctx, 9, 3, 0x6b5535); pixel(ctx, 10, 4, 0x6b5535);
    pixel(ctx, 12, 13, 0x6b5535); pixel(ctx, 13, 14, 0x6b5535);
    // Pebbles (small lighter ovals)
    pixel(ctx, 5, 4, 0xa89070); pixel(ctx, 6, 4, 0xa89070);
    pixel(ctx, 11, 11, 0xa89070); pixel(ctx, 12, 11, 0xa89070);
    pixel(ctx, 1, 13, 0x9a8060); pixel(ctx, 14, 6, 0x9a8060);
    // Deep shadow specks
    pixel(ctx, 7, 9, 0x5c4428); pixel(ctx, 0, 0, 0x5c4428);
    pixel(ctx, 15, 15, 0x5c4428);
  });

  // Stone floor - proper brick pattern with mortar, highlight/shadow per brick
  makeTex(scene, 'tile_stone', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x606060); // mortar base
    // Top row bricks
    rect(ctx, 1, 1, 6, 6, 0x808080);
    rect(ctx, 9, 1, 6, 6, 0x808080);
    // Bottom row bricks (offset)
    rect(ctx, 1, 9, 6, 6, 0x7a7a7a);
    rect(ctx, 9, 9, 6, 6, 0x7a7a7a);
    // Top-edge highlights on each brick
    rect(ctx, 1, 1, 6, 1, 0x999999);
    rect(ctx, 9, 1, 6, 1, 0x999999);
    rect(ctx, 1, 9, 6, 1, 0x909090);
    rect(ctx, 9, 9, 6, 1, 0x909090);
    // Left-edge highlights
    pixel(ctx, 1, 2, 0x909090); pixel(ctx, 1, 3, 0x909090);
    pixel(ctx, 9, 2, 0x909090); pixel(ctx, 9, 3, 0x909090);
    pixel(ctx, 1, 10, 0x888888); pixel(ctx, 9, 10, 0x888888);
    // Bottom-edge shadows
    rect(ctx, 1, 6, 6, 1, 0x585858);
    rect(ctx, 9, 6, 6, 1, 0x585858);
    rect(ctx, 1, 14, 6, 1, 0x585858);
    rect(ctx, 9, 14, 6, 1, 0x585858);
    // Right-edge shadows
    pixel(ctx, 6, 4, 0x686868); pixel(ctx, 6, 5, 0x686868);
    pixel(ctx, 14, 4, 0x686868); pixel(ctx, 14, 5, 0x686868);
    // Surface noise
    pixel(ctx, 3, 3, 0x8a8a8a); pixel(ctx, 11, 4, 0x727272);
    pixel(ctx, 4, 11, 0x727272); pixel(ctx, 12, 12, 0x8a8a8a);
  });

  // Wall - defined brick pattern with strong highlights and shadows
  makeTex(scene, 'tile_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x4a4a4a); // mortar
    // Row 1: two bricks
    rect(ctx, 1, 1, 6, 6, 0x666666);
    rect(ctx, 9, 1, 6, 6, 0x666666);
    // Row 2: offset bricks
    rect(ctx, 1, 9, 10, 6, 0x5e5e5e);
    rect(ctx, 13, 9, 2, 6, 0x5e5e5e);
    // Top highlights per brick
    rect(ctx, 1, 1, 6, 1, 0x7a7a7a);
    rect(ctx, 9, 1, 6, 1, 0x7a7a7a);
    rect(ctx, 1, 9, 10, 1, 0x727272);
    rect(ctx, 13, 9, 2, 1, 0x727272);
    // Left highlights
    pixel(ctx, 1, 2, 0x747474); pixel(ctx, 1, 3, 0x747474);
    pixel(ctx, 9, 2, 0x747474); pixel(ctx, 9, 3, 0x747474);
    pixel(ctx, 1, 10, 0x6c6c6c); pixel(ctx, 13, 10, 0x6c6c6c);
    // Bottom shadows
    rect(ctx, 1, 6, 6, 1, 0x444444);
    rect(ctx, 9, 6, 6, 1, 0x444444);
    rect(ctx, 1, 14, 10, 1, 0x3e3e3e);
    rect(ctx, 13, 14, 2, 1, 0x3e3e3e);
    // Right shadows
    pixel(ctx, 6, 4, 0x505050); pixel(ctx, 6, 5, 0x505050);
    pixel(ctx, 14, 4, 0x505050); pixel(ctx, 14, 5, 0x505050);
    pixel(ctx, 10, 12, 0x484848); pixel(ctx, 10, 13, 0x484848);
    // Surface cracks
    pixel(ctx, 3, 3, 0x5a5a5a); pixel(ctx, 11, 11, 0x545454);
  });

  // Water - wave patterns, depth gradient, shimmer
  makeTex(scene, 'tile_water', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x2266aa); // base blue
    // Depth gradient: edges darker
    rect(ctx, 0, 0, S, 1, 0x1d5a96); rect(ctx, 0, 15, S, 1, 0x1d5a96);
    rect(ctx, 0, 0, 1, S, 0x1d5a96); rect(ctx, 15, 0, 1, S, 0x1d5a96);
    rect(ctx, 0, 1, S, 1, 0x1f5f9e); rect(ctx, 0, 14, S, 1, 0x1f5f9e);
    // Wave highlights
    rect(ctx, 2, 4, 4, 1, 0x3399cc); pixel(ctx, 1, 4, 0x2d8abb);
    rect(ctx, 9, 10, 4, 1, 0x3399cc); pixel(ctx, 8, 10, 0x2d8abb);
    rect(ctx, 5, 7, 3, 1, 0x3399cc);
    rect(ctx, 11, 2, 3, 1, 0x3399cc);
    // Darker wave troughs
    rect(ctx, 2, 5, 4, 1, 0x1b5588);
    rect(ctx, 9, 11, 4, 1, 0x1b5588);
    // Shimmer pixels (bright white/cyan)
    pixel(ctx, 3, 3, 0x66ccee); pixel(ctx, 10, 9, 0x66ccee);
    pixel(ctx, 7, 6, 0x88ddff);
    pixel(ctx, 13, 3, 0xaaeeff); // bright shimmer
    pixel(ctx, 1, 12, 0x77ccdd);
    // Subtle foam
    pixel(ctx, 6, 4, 0x55aacc); pixel(ctx, 13, 10, 0x55aacc);
  });

  // Wood floor - plank lines, grain, knots, highlight/shadow edges
  makeTex(scene, 'tile_wood', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x8b6d3c); // base wood
    // Plank divisions (horizontal)
    rect(ctx, 0, 0, S, 1, 0x9a7c4b); // plank 1 top highlight
    rect(ctx, 0, 3, S, 1, 0x7a5c2b); // plank 1 bottom shadow
    rect(ctx, 0, 4, S, 1, 0x9a7c4b); // plank 2 top highlight
    rect(ctx, 0, 7, S, 1, 0x7a5c2b);
    rect(ctx, 0, 8, S, 1, 0x9a7c4b);
    rect(ctx, 0, 11, S, 1, 0x7a5c2b);
    rect(ctx, 0, 12, S, 1, 0x9a7c4b);
    rect(ctx, 0, 15, S, 1, 0x7a5c2b);
    // Grain lines (subtle)
    pixel(ctx, 2, 1, 0x7f6135); pixel(ctx, 3, 2, 0x7f6135); pixel(ctx, 4, 2, 0x7f6135);
    pixel(ctx, 9, 5, 0x7f6135); pixel(ctx, 10, 6, 0x7f6135); pixel(ctx, 11, 6, 0x7f6135);
    pixel(ctx, 1, 9, 0x7f6135); pixel(ctx, 2, 10, 0x7f6135);
    pixel(ctx, 12, 13, 0x7f6135); pixel(ctx, 13, 14, 0x7f6135);
    // Knots
    pixel(ctx, 5, 2, 0x6b4d1c); pixel(ctx, 6, 2, 0x6b4d1c);
    pixel(ctx, 5, 1, 0x6b4d1c); pixel(ctx, 6, 1, 0x745528);
    pixel(ctx, 12, 10, 0x6b4d1c); pixel(ctx, 13, 10, 0x745528);
    // Vertical plank edge at center
    rect(ctx, 7, 0, 1, S, 0x7a5c2b);
    rect(ctx, 8, 0, 1, S, 0x9a7c4b);
  });

  // Hut wall - log cabin with wood texture and mortar
  makeTex(scene, 'tile_hut', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x9e7e4e); // base
    // Log rows with highlight/shadow
    rect(ctx, 0, 0, S, 1, 0xb08e5e); // log 1 highlight
    rect(ctx, 0, 1, S, 3, 0x9e7e4e);
    rect(ctx, 0, 4, S, 1, 0x7a6238); // log 1 shadow
    rect(ctx, 0, 5, S, 1, 0x887050); // mortar
    rect(ctx, 0, 6, S, 1, 0xb08e5e); // log 2 highlight
    rect(ctx, 0, 7, S, 3, 0x9e7e4e);
    rect(ctx, 0, 10, S, 1, 0x7a6238);
    rect(ctx, 0, 11, S, 1, 0x887050); // mortar
    rect(ctx, 0, 12, S, 1, 0xb08e5e); // log 3 highlight
    rect(ctx, 0, 13, S, 2, 0x9e7e4e);
    rect(ctx, 0, 15, S, 1, 0x7a6238);
    // Wood grain on logs
    pixel(ctx, 3, 2, 0x8a6e40); pixel(ctx, 4, 3, 0x8a6e40);
    pixel(ctx, 10, 8, 0x8a6e40); pixel(ctx, 11, 9, 0x8a6e40);
    pixel(ctx, 6, 14, 0x8a6e40); pixel(ctx, 7, 13, 0x8a6e40);
    // Knot detail
    pixel(ctx, 12, 2, 0x6b5230); pixel(ctx, 13, 2, 0x6b5230);
    pixel(ctx, 4, 8, 0x6b5230); pixel(ctx, 5, 8, 0x6b5230);
  });

  // Door - wood grain, hinges, proper frame
  makeTex(scene, 'tile_door', S, S, (ctx) => {
    // Door frame
    rect(ctx, 0, 0, S, S, 0x5a3820); // dark frame
    rect(ctx, 0, 0, 2, S, 0x4a2810); // left frame
    rect(ctx, 14, 0, 2, S, 0x4a2810); // right frame
    rect(ctx, 0, 0, S, 1, 0x4a2810); // top frame
    // Door panels
    rect(ctx, 2, 1, 12, 14, 0x7a5030);
    // Center split
    rect(ctx, 7, 1, 2, 14, 0x6b4226);
    // Panel highlights (top-left of each panel)
    rect(ctx, 3, 2, 4, 1, 0x8a6040);
    rect(ctx, 9, 2, 4, 1, 0x8a6040);
    // Panel shadows (bottom)
    rect(ctx, 3, 7, 4, 1, 0x5a3820);
    rect(ctx, 9, 7, 4, 1, 0x5a3820);
    rect(ctx, 3, 13, 4, 1, 0x5a3820);
    rect(ctx, 9, 13, 4, 1, 0x5a3820);
    // Wood grain
    pixel(ctx, 4, 4, 0x6b4226); pixel(ctx, 5, 5, 0x6b4226);
    pixel(ctx, 11, 10, 0x6b4226); pixel(ctx, 12, 11, 0x6b4226);
    // Iron hinges
    rect(ctx, 2, 3, 2, 2, 0x555555); pixel(ctx, 2, 3, 0x777777);
    rect(ctx, 2, 11, 2, 2, 0x555555); pixel(ctx, 2, 11, 0x777777);
    // Gold handle
    pixel(ctx, 11, 8, COLORS.GOLD); pixel(ctx, 12, 8, COLORS.GOLD);
    pixel(ctx, 11, 9, 0xccaa00);
  });

  // Shrine mossy stone - cracked stone with visible moss patches
  makeTex(scene, 'tile_shrine', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x606060); // mortar
    // Stone bricks
    rect(ctx, 1, 1, 6, 6, 0x757575);
    rect(ctx, 9, 1, 6, 6, 0x727272);
    rect(ctx, 1, 9, 6, 6, 0x707070);
    rect(ctx, 9, 9, 6, 6, 0x757575);
    // Top highlights
    rect(ctx, 1, 1, 6, 1, 0x888888);
    rect(ctx, 9, 1, 6, 1, 0x858585);
    rect(ctx, 1, 9, 6, 1, 0x838383);
    rect(ctx, 9, 9, 6, 1, 0x888888);
    // Bottom shadows
    rect(ctx, 1, 6, 6, 1, 0x525252);
    rect(ctx, 9, 6, 6, 1, 0x525252);
    rect(ctx, 1, 14, 6, 1, 0x525252);
    rect(ctx, 9, 14, 6, 1, 0x525252);
    // Cracks
    pixel(ctx, 3, 3, 0x4a4a4a); pixel(ctx, 4, 4, 0x4a4a4a); pixel(ctx, 5, 4, 0x4a4a4a);
    pixel(ctx, 11, 12, 0x4a4a4a); pixel(ctx, 12, 13, 0x4a4a4a);
    // Moss patches (various greens)
    pixel(ctx, 1, 2, 0x447744); pixel(ctx, 2, 3, 0x447744); pixel(ctx, 2, 2, 0x3a6638);
    pixel(ctx, 11, 1, 0x4d8840); pixel(ctx, 12, 1, 0x447744);
    pixel(ctx, 5, 13, 0x447744); pixel(ctx, 6, 13, 0x3a6638); pixel(ctx, 6, 14, 0x4d8840);
    pixel(ctx, 14, 9, 0x447744); pixel(ctx, 14, 10, 0x3a6638);
    pixel(ctx, 9, 5, 0x4d8840); pixel(ctx, 10, 6, 0x447744);
    // Small lichen dot
    pixel(ctx, 3, 11, 0x55aa55);
  });

  // Digital realm tiles - circuit board with traces and LED dots
  makeTex(scene, 'tile_digital', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x0a0a1a); // dark base
    // Grid lines (subtle green)
    rect(ctx, 0, 0, S, 1, 0x00441a);
    rect(ctx, 0, 0, 1, S, 0x00441a);
    rect(ctx, 0, 15, S, 1, 0x003311);
    rect(ctx, 15, 0, 1, S, 0x003311);
    rect(ctx, 0, 8, S, 1, 0x002a0e);
    rect(ctx, 8, 0, 1, S, 0x002a0e);
    // Circuit traces (brighter green lines)
    rect(ctx, 3, 3, 5, 1, 0x00cc44);
    rect(ctx, 7, 3, 1, 4, 0x00cc44);
    rect(ctx, 7, 6, 4, 1, 0x00cc44);
    pixel(ctx, 10, 6, 0x00ff44); // node
    rect(ctx, 12, 10, 1, 4, 0x00cc44);
    rect(ctx, 9, 13, 4, 1, 0x00cc44);
    pixel(ctx, 12, 13, 0x00ff44); // node
    // LED dots
    pixel(ctx, 3, 3, 0x00ff88); // bright LED
    pixel(ctx, 14, 2, 0xff3300); // red LED
    pixel(ctx, 1, 12, 0x00aaff); // blue LED
    // Faint circuit detail
    pixel(ctx, 2, 7, 0x003a14); pixel(ctx, 5, 10, 0x003a14);
    pixel(ctx, 13, 5, 0x003a14); pixel(ctx, 10, 11, 0x003a14);
  });

  // Digital wall (neon) with scanline effect
  makeTex(scene, 'tile_digital_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x111133); // dark base
    // Scanlines (horizontal, alternating dark)
    for (let y = 0; y < S; y += 2) {
      rect(ctx, 0, y, S, 1, 0x0d0d28);
    }
    // Neon glow - cyan top/bottom
    rect(ctx, 0, 0, S, 2, 0x00cccc);
    rect(ctx, 0, 0, S, 1, 0x00ffff);
    rect(ctx, 0, 14, S, 2, 0x00cccc);
    rect(ctx, 0, 15, S, 1, 0x00ffff);
    // Neon vertical - magenta
    rect(ctx, 7, 2, 2, 12, 0xcc00cc);
    rect(ctx, 7, 2, 1, 12, 0xff00ff);
    // Glow halos
    pixel(ctx, 6, 3, 0x440044); pixel(ctx, 9, 3, 0x440044);
    pixel(ctx, 6, 8, 0x440044); pixel(ctx, 9, 8, 0x440044);
    pixel(ctx, 6, 13, 0x440044); pixel(ctx, 9, 13, 0x440044);
    // Corner glow overlap
    pixel(ctx, 7, 0, 0xff88ff); pixel(ctx, 8, 0, 0xff88ff);
    pixel(ctx, 7, 15, 0xff88ff); pixel(ctx, 8, 15, 0xff88ff);
  });

  // Sewer floor - grimy wet stone with slime, drain grate hint
  makeTex(scene, 'tile_sewer', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x3d5a2e); // base grimy green
    // Damp variation
    for (let y = 1; y < S; y += 3) {
      for (let x = (y % 6 === 1 ? 0 : 2); x < S; x += 4) {
        pixel(ctx, x, y, 0x354f28);
      }
    }
    // Lighter wet patches
    pixel(ctx, 4, 3, 0x4a6838); pixel(ctx, 5, 3, 0x4a6838);
    pixel(ctx, 11, 9, 0x4a6838); pixel(ctx, 12, 9, 0x4a6838);
    // Slime streaks
    pixel(ctx, 2, 5, 0x55aa33); pixel(ctx, 2, 6, 0x55aa33); pixel(ctx, 3, 7, 0x55aa33);
    pixel(ctx, 13, 11, 0x55aa33); pixel(ctx, 13, 12, 0x55aa33);
    // Drain grate hint (center)
    rect(ctx, 6, 6, 4, 4, 0x2d4a1e);
    rect(ctx, 7, 6, 1, 4, 0x222222); rect(ctx, 9, 6, 1, 4, 0x222222);
    rect(ctx, 6, 7, 4, 1, 0x222222); rect(ctx, 6, 9, 4, 1, 0x222222);
    // Dark grout
    pixel(ctx, 8, 14, 0x2a4420); pixel(ctx, 1, 10, 0x2a4420);
    pixel(ctx, 14, 2, 0x2a4420);
  });

  // Sewer wall - industrial pipe look with rust
  makeTex(scene, 'tile_sewer_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x444433); // grimy base
    // Pipe-like horizontal bands
    rect(ctx, 0, 0, S, 1, 0x555544); // top highlight
    rect(ctx, 0, 3, S, 2, 0x3a3a2c); // groove
    rect(ctx, 0, 5, S, 1, 0x555544); // highlight after groove
    rect(ctx, 0, 8, S, 3, 0x3e3e30);  // wide band
    rect(ctx, 0, 8, S, 1, 0x505040);  // band highlight
    rect(ctx, 0, 10, S, 1, 0x333325);  // band shadow
    rect(ctx, 0, 13, S, 2, 0x3a3a2c); // bottom groove
    rect(ctx, 0, 15, S, 1, 0x333325);
    // Bolt/rivet details
    pixel(ctx, 2, 1, 0x666655); pixel(ctx, 2, 2, 0x333325);
    pixel(ctx, 13, 1, 0x666655); pixel(ctx, 13, 2, 0x333325);
    pixel(ctx, 5, 11, 0x666655); pixel(ctx, 10, 11, 0x666655);
    // Rust spots
    pixel(ctx, 4, 4, 0x884422); pixel(ctx, 5, 4, 0x773318);
    pixel(ctx, 11, 14, 0x884422); pixel(ctx, 12, 14, 0x773318);
    pixel(ctx, 8, 6, 0x774420);
    // Slime drips
    pixel(ctx, 3, 6, 0x44aa33); pixel(ctx, 3, 7, 0x44aa33);
    pixel(ctx, 12, 12, 0x44aa33); pixel(ctx, 12, 13, 0x55bb44);
  });

  // Fortress brick - dark heavy bricks with mortar, scorch marks
  makeTex(scene, 'tile_fortress', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x3a2a1a); // dark mortar
    // Row 1 bricks
    rect(ctx, 1, 1, 6, 6, 0x5a4a3a);
    rect(ctx, 9, 1, 6, 6, 0x564638);
    // Row 2 bricks (offset)
    rect(ctx, 1, 9, 10, 6, 0x524234);
    rect(ctx, 13, 9, 2, 6, 0x5a4a3a);
    // Top highlights
    rect(ctx, 1, 1, 6, 1, 0x6a5a4a);
    rect(ctx, 9, 1, 6, 1, 0x665646);
    rect(ctx, 1, 9, 10, 1, 0x625242);
    // Bottom shadows
    rect(ctx, 1, 6, 6, 1, 0x2e2018);
    rect(ctx, 9, 6, 6, 1, 0x2e2018);
    rect(ctx, 1, 14, 10, 1, 0x2a1c14);
    rect(ctx, 13, 14, 2, 1, 0x2a1c14);
    // Surface texture
    pixel(ctx, 3, 3, 0x4a3a2a); pixel(ctx, 11, 4, 0x4e3e2e);
    pixel(ctx, 5, 11, 0x4a3a2a); pixel(ctx, 8, 12, 0x4e3e2e);
    // Torch scorch marks (dark soot)
    pixel(ctx, 2, 2, 0x222222); pixel(ctx, 3, 2, 0x2a2a2a);
    pixel(ctx, 2, 3, 0x2a2a2a);
    // Green swamp corruption
    pixel(ctx, 13, 11, 0x446633); pixel(ctx, 14, 12, 0x3a5528);
    pixel(ctx, 10, 3, 0x446633);
  });

  // Fortress wall - heavy dark stone with iron bolt details
  makeTex(scene, 'tile_fortress_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x2a1a0e); // very dark mortar
    // Large stone blocks
    rect(ctx, 1, 1, 6, 6, 0x443322);
    rect(ctx, 9, 1, 6, 6, 0x403020);
    rect(ctx, 5, 9, 6, 6, 0x443322);
    rect(ctx, 0, 9, 4, 6, 0x3c2c1c);
    rect(ctx, 12, 9, 3, 6, 0x3c2c1c);
    // Top highlights
    rect(ctx, 1, 1, 6, 1, 0x554433);
    rect(ctx, 9, 1, 6, 1, 0x504030);
    rect(ctx, 5, 9, 6, 1, 0x554433);
    // Bottom shadows
    rect(ctx, 1, 6, 6, 1, 0x1a1008);
    rect(ctx, 9, 6, 6, 1, 0x1a1008);
    rect(ctx, 5, 14, 6, 1, 0x1a1008);
    // Iron bolt details (corners of stones)
    pixel(ctx, 1, 1, 0x666666); pixel(ctx, 6, 1, 0x666666);
    pixel(ctx, 1, 6, 0x555555); pixel(ctx, 6, 6, 0x555555);
    pixel(ctx, 9, 1, 0x666666); pixel(ctx, 14, 1, 0x666666);
    pixel(ctx, 5, 9, 0x666666); pixel(ctx, 10, 9, 0x666666);
    // Bolt shadow
    pixel(ctx, 2, 2, 0x333333); pixel(ctx, 10, 2, 0x333333);
    pixel(ctx, 6, 10, 0x333333);
    // Green corruption
    pixel(ctx, 3, 4, 0x556633); pixel(ctx, 12, 12, 0x556633);
    pixel(ctx, 8, 14, 0x445522);
  });

  // Pushable block
  makeTex(scene, 'pushblock', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x888899);
    rect(ctx, 1, 1, S - 2, S - 2, 0x9999aa);
    rect(ctx, 3, 3, S - 6, S - 6, 0x888899);
    // Arrow hints
    rect(ctx, 7, 2, 2, 2, 0xbbbbcc);
    rect(ctx, 7, 12, 2, 2, 0xbbbbcc);
    rect(ctx, 2, 7, 2, 2, 0xbbbbcc);
    rect(ctx, 12, 7, 2, 2, 0xbbbbcc);
  });

  // Chest closed - wood planks, metal bands, ornate lock
  makeTex(scene, 'chest_closed', S, S, (ctx) => {
    // Body
    rect(ctx, 2, 4, 12, 10, 0x8b6d3c);
    // Lid (top portion, lighter)
    rect(ctx, 2, 4, 12, 4, 0x9e7e4e);
    // Top edge highlight
    rect(ctx, 2, 4, 12, 1, 0xb08e5e);
    // Metal bands
    rect(ctx, 2, 7, 12, 1, 0x666666); // band between lid and body
    rect(ctx, 2, 7, 12, 1, 0x777777);
    // Vertical metal bands
    rect(ctx, 3, 4, 1, 10, 0x606060); pixel(ctx, 3, 4, 0x787878);
    rect(ctx, 12, 4, 1, 10, 0x606060); pixel(ctx, 12, 4, 0x787878);
    // Wood grain on lid
    pixel(ctx, 5, 5, 0x8a6e3a); pixel(ctx, 8, 6, 0x8a6e3a);
    // Wood grain on body
    pixel(ctx, 6, 10, 0x7a5c2b); pixel(ctx, 9, 12, 0x7a5c2b);
    // Lock plate
    rect(ctx, 6, 8, 4, 3, 0x555555);
    rect(ctx, 7, 9, 2, 1, COLORS.GOLD);
    pixel(ctx, 6, 8, 0x777777); // highlight
    pixel(ctx, 9, 10, 0x444444); // shadow
    // Bottom shadow edge
    rect(ctx, 2, 13, 12, 1, 0x6b4d1c);
  });

  makeTex(scene, 'chest_open', S, S, (ctx) => {
    // Body
    rect(ctx, 2, 6, 12, 8, 0x8b6d3c);
    // Lid (open, tilted back)
    rect(ctx, 2, 1, 12, 5, 0x9e7e4e);
    rect(ctx, 2, 1, 12, 1, 0xb08e5e); // lid highlight
    // Lid metal band
    rect(ctx, 3, 1, 1, 5, 0x606060);
    rect(ctx, 12, 1, 1, 5, 0x606060);
    // Inside (dark)
    rect(ctx, 3, 6, 10, 6, 0x2a1a0a);
    // Treasure sparkles inside
    pixel(ctx, 5, 8, COLORS.GOLD); pixel(ctx, 7, 7, COLORS.GOLD);
    pixel(ctx, 9, 9, 0xffffff); pixel(ctx, 10, 8, COLORS.GOLD);
    pixel(ctx, 6, 10, 0xccaa00);
    // Body metal bands
    rect(ctx, 3, 6, 1, 8, 0x606060);
    rect(ctx, 12, 6, 1, 8, 0x606060);
    // Bottom shadow
    rect(ctx, 2, 13, 12, 1, 0x6b4d1c);
  });

  // Portal
  makeFrameTex(scene, 'portal', 24, 32, [
    (ctx) => {
      ctx.fillStyle = hex(0x6633cc);
      ctx.beginPath(); ctx.ellipse(12, 16, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0x9966ff);
      ctx.beginPath(); ctx.ellipse(12, 16, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0xcc99ff);
      ctx.beginPath(); ctx.ellipse(12, 16, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
    },
    (ctx) => {
      ctx.fillStyle = hex(0x7744dd);
      ctx.beginPath(); ctx.ellipse(12, 16, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0xaa77ff);
      ctx.beginPath(); ctx.ellipse(12, 16, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(0xddaaff);
      ctx.beginPath(); ctx.ellipse(12, 16, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
  ]);

  // Switch
  makeTex(scene, 'switch_off', S, S, (ctx) => {
    rect(ctx, 3, 3, 10, 10, 0x666666);
    rect(ctx, 4, 4, 8, 8, 0x444444);
    rect(ctx, 6, 6, 4, 4, 0x883333);
  });

  makeTex(scene, 'switch_on', S, S, (ctx) => {
    rect(ctx, 3, 3, 10, 10, 0x666666);
    rect(ctx, 4, 4, 8, 8, 0x444444);
    rect(ctx, 6, 6, 4, 4, 0x33aa33);
  });

  // Tree - fuller canopy with leaf clusters, bark texture
  makeTex(scene, 'tree', 16, 24, (ctx) => {
    // Trunk with bark texture
    rect(ctx, 6, 16, 4, 8, 0x6b4226);
    rect(ctx, 6, 16, 1, 8, 0x7a5030); // left bark highlight
    rect(ctx, 9, 16, 1, 8, 0x5a3218); // right bark shadow
    // Bark detail
    pixel(ctx, 7, 18, 0x5a3218); pixel(ctx, 8, 20, 0x5a3218);
    pixel(ctx, 7, 22, 0x7a5030); pixel(ctx, 8, 17, 0x7a5030);
    // Roots
    pixel(ctx, 5, 23, 0x6b4226); pixel(ctx, 10, 23, 0x6b4226);
    // Canopy base (dark)
    rect(ctx, 2, 4, 12, 12, 0x2d7a1e);
    rect(ctx, 4, 2, 8, 2, 0x2d7a1e);
    // Middle layer
    rect(ctx, 3, 5, 10, 9, 0x3a8a2a);
    rect(ctx, 4, 3, 8, 3, 0x3a8a2a);
    // Highlight clusters (top-left lighting)
    rect(ctx, 4, 3, 4, 2, 0x4a9c3a);
    rect(ctx, 3, 5, 3, 3, 0x4a9c3a);
    rect(ctx, 8, 4, 3, 2, 0x4a9c3a);
    // Bright leaf highlights
    pixel(ctx, 5, 3, 0x5aac4a); pixel(ctx, 4, 5, 0x5aac4a);
    pixel(ctx, 6, 7, 0x5aac4a); pixel(ctx, 3, 6, 0x5aac4a);
    pixel(ctx, 9, 4, 0x5aac4a);
    // Dark leaf shadows (bottom-right)
    pixel(ctx, 11, 12, 0x1d6a10); pixel(ctx, 12, 11, 0x1d6a10);
    pixel(ctx, 10, 13, 0x1d6a10); pixel(ctx, 13, 10, 0x1d6a10);
    pixel(ctx, 8, 14, 0x1d6a10); pixel(ctx, 7, 13, 0x226e14);
    // Leaf texture pixels
    pixel(ctx, 6, 9, 0x2d7a1e); pixel(ctx, 9, 7, 0x2d7a1e);
    pixel(ctx, 4, 11, 0x2d7a1e); pixel(ctx, 11, 6, 0x2d7a1e);
  });

  // Bush - rounder shape with leaf highlights and shadow
  makeTex(scene, 'bush', S, S, (ctx) => {
    // Base dark shape
    rect(ctx, 2, 5, 12, 9, 0x2d7a1e);
    rect(ctx, 3, 3, 10, 2, 0x2d7a1e);
    rect(ctx, 4, 2, 8, 2, 0x2d7a1e);
    rect(ctx, 3, 13, 10, 1, 0x2d7a1e);
    // Middle layer
    rect(ctx, 3, 4, 10, 8, 0x3a8a2a);
    rect(ctx, 4, 3, 8, 1, 0x3a8a2a);
    // Highlight cluster (top-left)
    rect(ctx, 4, 3, 4, 3, 0x4a9c3a);
    pixel(ctx, 5, 3, 0x5aac4a); pixel(ctx, 6, 4, 0x5aac4a);
    pixel(ctx, 3, 5, 0x4a9c3a);
    // More highlight dots
    pixel(ctx, 9, 5, 0x4a9c3a); pixel(ctx, 7, 7, 0x4a9c3a);
    // Dark shadows (bottom-right)
    pixel(ctx, 11, 11, 0x1d6a10); pixel(ctx, 12, 10, 0x1d6a10);
    pixel(ctx, 10, 12, 0x1d6a10);
    // Leaf texture
    pixel(ctx, 5, 8, 0x2d7a1e); pixel(ctx, 8, 6, 0x2d7a1e);
    pixel(ctx, 10, 9, 0x2d7a1e);
  });

  // Pot - clay pot with rim, highlight, shadow, subtle crack
  makeTex(scene, 'pot', S, S, (ctx) => {
    // Base pot body
    rect(ctx, 4, 5, 8, 7, 0x996644);
    rect(ctx, 3, 6, 10, 5, 0x996644);
    // Rim
    rect(ctx, 4, 3, 8, 2, 0xaa7755);
    rect(ctx, 5, 2, 6, 1, 0xbb8866);
    // Rim highlight
    rect(ctx, 5, 2, 6, 1, 0xcc9977);
    rect(ctx, 4, 3, 8, 1, 0xbb8866);
    // Body highlight (left side)
    rect(ctx, 4, 5, 2, 6, 0xaa7755);
    pixel(ctx, 4, 6, 0xbb8866); pixel(ctx, 4, 7, 0xbb8866);
    // Body shadow (right side)
    rect(ctx, 11, 6, 2, 5, 0x885533);
    pixel(ctx, 12, 7, 0x774422); pixel(ctx, 12, 8, 0x774422);
    // Bottom
    rect(ctx, 5, 12, 6, 2, 0x885533);
    rect(ctx, 6, 13, 4, 1, 0x774422); // bottom shadow
    // Crack detail
    pixel(ctx, 8, 6, 0x7a5530); pixel(ctx, 9, 7, 0x7a5530);
    pixel(ctx, 9, 8, 0x7a5530);
    // Surface highlight dot
    pixel(ctx, 5, 5, 0xccaa77);
  });

  // Sign - weathered wood with text scratches and post
  makeTex(scene, 'sign', S, 20, (ctx) => {
    // Sign board
    rect(ctx, 2, 0, 12, 10, 0x9e7e4e);
    // Board face
    rect(ctx, 3, 1, 10, 8, 0x8b6d3c);
    // Top edge highlight
    rect(ctx, 2, 0, 12, 1, 0xb08e5e);
    // Bottom edge shadow
    rect(ctx, 2, 9, 12, 1, 0x6b5230);
    // Left/right edges
    pixel(ctx, 2, 1, 0xaa8855); pixel(ctx, 2, 2, 0xaa8855);
    pixel(ctx, 13, 8, 0x6b5230); pixel(ctx, 13, 7, 0x6b5230);
    // Weathered wood grain
    pixel(ctx, 4, 2, 0x7a5c2b); pixel(ctx, 5, 3, 0x7a5c2b);
    pixel(ctx, 10, 6, 0x7a5c2b); pixel(ctx, 11, 7, 0x7a5c2b);
    // Text scratches (darker lines suggesting text)
    rect(ctx, 4, 3, 7, 1, 0x5a4d2a);
    rect(ctx, 4, 5, 5, 1, 0x5a4d2a);
    rect(ctx, 4, 7, 6, 1, 0x5a4d2a);
    // Nail heads
    pixel(ctx, 3, 1, 0x666666); pixel(ctx, 12, 1, 0x666666);
    pixel(ctx, 3, 8, 0x555555); pixel(ctx, 12, 8, 0x555555);
    // Post
    rect(ctx, 6, 10, 4, 10, 0x6b4226);
    rect(ctx, 6, 10, 1, 10, 0x7a5030); // post highlight
    rect(ctx, 9, 10, 1, 10, 0x5a3218); // post shadow
    // Post grain
    pixel(ctx, 7, 14, 0x5a3218); pixel(ctx, 8, 17, 0x5a3218);
  });

  // Torch
  makeFrameTex(scene, 'torch', 8, 16, [
    (ctx) => {
      rect(ctx, 3, 6, 2, 10, 0x6b4226); // stick
      rect(ctx, 2, 2, 4, 5, 0xff6600); // flame
      rect(ctx, 3, 1, 2, 3, 0xffaa00);
      pixel(ctx, 3, 0, 0xffdd00);
    },
    (ctx) => {
      rect(ctx, 3, 6, 2, 10, 0x6b4226);
      rect(ctx, 1, 3, 5, 4, 0xff6600);
      rect(ctx, 2, 1, 3, 4, 0xffaa00);
      pixel(ctx, 4, 0, 0xffdd00);
    }
  ]);
}

// ---- EFFECTS ----
function genEffectTextures(scene: Phaser.Scene) {
  // Explosion particles
  makeTex(scene, 'particle', 4, 4, (ctx) => {
    rect(ctx, 0, 0, 4, 4, COLORS.WHITE);
  });

  makeTex(scene, 'particle_red', 4, 4, (ctx) => {
    rect(ctx, 0, 0, 4, 4, COLORS.RED);
  });

  makeTex(scene, 'particle_yellow', 4, 4, (ctx) => {
    rect(ctx, 0, 0, 4, 4, COLORS.GOLD);
  });

  // Sword slash effect
  makeTex(scene, 'slash_effect', 20, 20, (ctx) => {
    ctx.strokeStyle = hex(COLORS.WHITE);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(10, 10, 8, -0.5, 1.5);
    ctx.stroke();
  });

  // Damage flash overlay
  makeTex(scene, 'flash_white', 16, 16, (ctx) => {
    rect(ctx, 0, 0, 16, 16, COLORS.WHITE);
  });
}

// ---- ENDING TEXTURES ----
function genEndingTextures(scene: Phaser.Scene) {
  // Giant fish image for the ending
  makeTex(scene, 'giant_fish', 480, 320, (ctx) => {
    // Blue background
    rect(ctx, 0, 0, 480, 320, 0x1a3a5c);
    // Waves
    for (let x = 0; x < 480; x += 30) {
      ctx.fillStyle = hex(0x2255aa);
      ctx.beginPath();
      ctx.arc(x + 15, 280, 20, Math.PI, 0);
      ctx.fill();
    }
    // GIANT FISH
    ctx.fillStyle = hex(0xff8844);
    ctx.beginPath();
    ctx.ellipse(240, 150, 180, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly
    ctx.fillStyle = hex(0xffbb77);
    ctx.beginPath();
    ctx.ellipse(230, 170, 140, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = hex(COLORS.WHITE);
    ctx.beginPath(); ctx.arc(340, 120, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hex(COLORS.BLACK);
    ctx.beginPath(); ctx.arc(345, 120, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hex(COLORS.WHITE);
    ctx.beginPath(); ctx.arc(350, 115, 5, 0, Math.PI * 2); ctx.fill();
    // Mouth
    ctx.fillStyle = hex(0xcc3333);
    ctx.beginPath();
    ctx.ellipse(390, 160, 30, 15, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.fillStyle = hex(0xff6633);
    ctx.beginPath();
    ctx.moveTo(60, 150);
    ctx.lineTo(10, 80);
    ctx.lineTo(30, 150);
    ctx.lineTo(10, 220);
    ctx.closePath();
    ctx.fill();
    // Fins
    ctx.fillStyle = hex(0xff7744);
    ctx.beginPath();
    ctx.moveTo(200, 80);
    ctx.lineTo(220, 30);
    ctx.lineTo(260, 80);
    ctx.closePath();
    ctx.fill();
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(180, 220);
    ctx.lineTo(200, 260);
    ctx.lineTo(230, 220);
    ctx.closePath();
    ctx.fill();
    // Scales
    for (let x = 100; x < 350; x += 25) {
      for (let y = 100; y < 200; y += 20) {
        ctx.strokeStyle = hex(0xee7733);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0.5, 2.5);
        ctx.stroke();
      }
    }
    // Text
    ctx.fillStyle = hex(COLORS.WHITE);
    ctx.font = 'bold 24px monospace';
    ctx.fillText('THE FISH COMMANDS YOU TO CLOSE THE GAME', 30, 300);
    ctx.font = '14px monospace';
    ctx.fillText('(this is the end. close the tab. seriously.)', 100, 315);
  });

  // Banana Zeldor (explosion result)
  makeTex(scene, 'banana_zeldor', 24, 32, (ctx) => {
    // Big banana with crown
    rect(ctx, 7, 4, 10, 24, 0xffdd00);
    rect(ctx, 5, 8, 4, 16, 0xffcc00);
    rect(ctx, 17, 6, 3, 14, 0xeecc00);
    rect(ctx, 9, 28, 6, 3, 0xccaa00);
    pixel(ctx, 11, 3, 0x8b6914);
    // Crown from Zeldor
    rect(ctx, 6, 0, 12, 4, COLORS.GOLD);
    pixel(ctx, 7, 0, COLORS.GOLD);
    pixel(ctx, 12, 0, COLORS.GOLD);
    pixel(ctx, 17, 0, COLORS.GOLD);
    // Googly eyes
    rect(ctx, 9, 10, 3, 3, COLORS.WHITE);
    rect(ctx, 14, 10, 3, 3, COLORS.WHITE);
    pixel(ctx, 10, 11, COLORS.BLACK);
    pixel(ctx, 15, 11, COLORS.BLACK);
  });
}
