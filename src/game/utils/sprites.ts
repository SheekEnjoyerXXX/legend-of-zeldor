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

  // Gobdwarf
  makeFrameTex(scene, 'gobdwarf', 16, 16, [
    (ctx) => {
      rect(ctx, 4, 8, 8, 6, 0x6b8e23); // body
      rect(ctx, 4, 3, 8, 6, 0x7cba3f); // head
      pixel(ctx, 5, 5, COLORS.RED); pixel(ctx, 9, 5, COLORS.RED); // eyes
      rect(ctx, 6, 7, 3, 2, COLORS.BLACK); // mouth
      rect(ctx, 3, 2, 10, 2, 0x5a4d2a); // helmet
      rect(ctx, 5, 14, 2, 2, 0x5a4d2a); rect(ctx, 9, 14, 2, 2, 0x5a4d2a); // feet
    },
    (ctx) => {
      rect(ctx, 4, 8, 8, 6, 0x6b8e23);
      rect(ctx, 4, 3, 8, 6, 0x7cba3f);
      pixel(ctx, 5, 5, COLORS.RED); pixel(ctx, 9, 5, COLORS.RED);
      rect(ctx, 6, 7, 3, 2, COLORS.BLACK);
      rect(ctx, 3, 2, 10, 2, 0x5a4d2a);
      rect(ctx, 4, 14, 2, 2, 0x5a4d2a); rect(ctx, 10, 14, 2, 2, 0x5a4d2a);
    }
  ]);

  // Slime modem
  makeFrameTex(scene, 'slime_modem', 16, 16, [
    (ctx) => {
      rect(ctx, 2, 8, 12, 6, 0x44cc44);
      rect(ctx, 3, 6, 10, 4, 0x55dd55);
      rect(ctx, 4, 4, 8, 3, 0x66ee66);
      pixel(ctx, 5, 7, COLORS.BLACK); pixel(ctx, 10, 7, COLORS.BLACK);
      rect(ctx, 6, 10, 4, 1, 0x338833); // mouth
      // Antenna
      rect(ctx, 7, 2, 2, 3, 0x888888);
      pixel(ctx, 7, 1, COLORS.RED);
    },
    (ctx) => {
      rect(ctx, 2, 9, 12, 5, 0x44cc44);
      rect(ctx, 3, 7, 10, 4, 0x55dd55);
      rect(ctx, 4, 5, 8, 3, 0x66ee66);
      pixel(ctx, 5, 8, COLORS.BLACK); pixel(ctx, 10, 8, COLORS.BLACK);
      rect(ctx, 6, 11, 4, 1, 0x338833);
      rect(ctx, 7, 3, 2, 3, 0x888888);
      pixel(ctx, 7, 2, 0x00ff00);
    }
  ]);

  // Error bat
  makeFrameTex(scene, 'error_bat', 16, 16, [
    (ctx) => {
      rect(ctx, 6, 5, 4, 4, 0x880088); // body
      rect(ctx, 1, 4, 5, 3, 0xaa00aa); // left wing
      rect(ctx, 10, 4, 5, 3, 0xaa00aa); // right wing
      pixel(ctx, 6, 6, COLORS.RED); pixel(ctx, 9, 6, COLORS.RED); // eyes
      rect(ctx, 5, 9, 6, 1, 0x880088); // bottom
    },
    (ctx) => {
      rect(ctx, 6, 5, 4, 4, 0x880088);
      rect(ctx, 2, 6, 4, 2, 0xaa00aa); // wings up
      rect(ctx, 10, 6, 4, 2, 0xaa00aa);
      pixel(ctx, 6, 6, COLORS.RED); pixel(ctx, 9, 6, COLORS.RED);
      rect(ctx, 5, 9, 6, 1, 0x880088);
    }
  ]);

  // Firewall skeleton
  makeFrameTex(scene, 'firewall_skeleton', 16, 16, [
    (ctx) => {
      rect(ctx, 5, 1, 6, 5, COLORS.WHITE); // skull
      pixel(ctx, 6, 3, COLORS.BLACK); pixel(ctx, 9, 3, COLORS.BLACK); // eyes
      rect(ctx, 7, 5, 2, 1, COLORS.BLACK); // nose
      rect(ctx, 6, 6, 4, 8, 0xdddddd); // body
      rect(ctx, 3, 7, 3, 2, 0xdddddd); // left arm
      rect(ctx, 10, 7, 3, 2, 0xdddddd); // right arm
      rect(ctx, 5, 14, 2, 2, 0xdddddd); rect(ctx, 9, 14, 2, 2, 0xdddddd); // feet
      // Fire effect
      pixel(ctx, 3, 6, 0xff6600); pixel(ctx, 12, 6, 0xff6600);
      pixel(ctx, 2, 7, 0xff3300); pixel(ctx, 13, 7, 0xff3300);
    },
    (ctx) => {
      rect(ctx, 5, 1, 6, 5, COLORS.WHITE);
      pixel(ctx, 6, 3, COLORS.RED); pixel(ctx, 9, 3, COLORS.RED);
      rect(ctx, 7, 5, 2, 1, COLORS.BLACK);
      rect(ctx, 6, 6, 4, 8, 0xdddddd);
      rect(ctx, 2, 8, 4, 2, 0xdddddd);
      rect(ctx, 10, 8, 4, 2, 0xdddddd);
      rect(ctx, 5, 14, 2, 2, 0xdddddd); rect(ctx, 9, 14, 2, 2, 0xdddddd);
      pixel(ctx, 2, 7, 0xff6600); pixel(ctx, 13, 7, 0xff6600);
      pixel(ctx, 3, 8, 0xff3300); pixel(ctx, 12, 8, 0xff3300);
    }
  ]);

  // Glitch crab
  makeFrameTex(scene, 'glitch_crab', 16, 16, [
    (ctx) => {
      rect(ctx, 3, 6, 10, 6, 0xff4488);
      rect(ctx, 0, 5, 3, 3, 0xff4488); // left claw
      rect(ctx, 13, 5, 3, 3, 0xff4488); // right claw
      pixel(ctx, 5, 8, COLORS.WHITE); pixel(ctx, 10, 8, COLORS.WHITE);
      rect(ctx, 4, 12, 2, 2, 0xcc3366); rect(ctx, 10, 12, 2, 2, 0xcc3366); // legs
      rect(ctx, 6, 12, 2, 2, 0xcc3366); rect(ctx, 8, 12, 2, 2, 0xcc3366);
    },
    (ctx) => {
      rect(ctx, 3, 7, 10, 5, 0xff4488);
      rect(ctx, 0, 4, 3, 3, 0xff4488);
      rect(ctx, 13, 4, 3, 3, 0xff4488);
      pixel(ctx, 5, 9, COLORS.WHITE); pixel(ctx, 10, 9, COLORS.WHITE);
      rect(ctx, 4, 12, 2, 2, 0xcc3366); rect(ctx, 10, 12, 2, 2, 0xcc3366);
      rect(ctx, 6, 12, 2, 2, 0xcc3366); rect(ctx, 8, 12, 2, 2, 0xcc3366);
    }
  ]);

  // Pickle thief
  makeFrameTex(scene, 'pickle_thief', 16, 16, [
    (ctx) => {
      // Green pickle body with mask
      rect(ctx, 5, 3, 6, 10, 0x5ea84c);
      rect(ctx, 6, 2, 4, 2, 0x5ea84c); // top
      rect(ctx, 6, 13, 4, 2, 0x5ea84c); // bottom
      // Bumps
      pixel(ctx, 4, 6, 0x4d8a3e); pixel(ctx, 11, 8, 0x4d8a3e);
      // Mask
      rect(ctx, 5, 5, 6, 2, COLORS.BLACK);
      pixel(ctx, 6, 5, COLORS.WHITE); pixel(ctx, 9, 5, COLORS.WHITE);
      // Legs
      rect(ctx, 4, 12, 2, 3, 0x4d8a3e); rect(ctx, 10, 12, 2, 3, 0x4d8a3e);
    },
    (ctx) => {
      rect(ctx, 5, 4, 6, 9, 0x5ea84c);
      rect(ctx, 6, 3, 4, 2, 0x5ea84c);
      rect(ctx, 6, 13, 4, 2, 0x5ea84c);
      pixel(ctx, 4, 7, 0x4d8a3e); pixel(ctx, 11, 9, 0x4d8a3e);
      rect(ctx, 5, 6, 6, 2, COLORS.BLACK);
      pixel(ctx, 6, 6, COLORS.WHITE); pixel(ctx, 9, 6, COLORS.WHITE);
      rect(ctx, 3, 13, 2, 3, 0x4d8a3e); rect(ctx, 11, 13, 2, 3, 0x4d8a3e);
    }
  ]);

  // Portal rat
  makeFrameTex(scene, 'portal_rat', 16, 16, [
    (ctx) => {
      rect(ctx, 4, 6, 8, 5, 0x888888); // body
      rect(ctx, 4, 4, 4, 3, 0x999999); // head
      pixel(ctx, 5, 5, COLORS.RED); // eye
      rect(ctx, 2, 3, 2, 2, 0xaaaaaa); // ear
      rect(ctx, 12, 8, 4, 1, 0x777777); // tail
      rect(ctx, 4, 11, 2, 2, 0x777777); rect(ctx, 9, 11, 2, 2, 0x777777); // feet
      // Portal glow
      pixel(ctx, 3, 7, 0x00ffff); pixel(ctx, 12, 7, 0x00ffff);
    },
    (ctx) => {
      rect(ctx, 4, 7, 8, 4, 0x888888);
      rect(ctx, 4, 5, 4, 3, 0x999999);
      pixel(ctx, 5, 6, COLORS.RED);
      rect(ctx, 2, 4, 2, 2, 0xaaaaaa);
      rect(ctx, 12, 9, 4, 1, 0x777777);
      rect(ctx, 3, 11, 2, 2, 0x777777); rect(ctx, 10, 11, 2, 2, 0x777777);
      pixel(ctx, 3, 8, 0xff00ff); pixel(ctx, 12, 8, 0xff00ff);
    }
  ]);

  // Banana ghost
  makeFrameTex(scene, 'banana_ghost', 16, 16, [
    (ctx) => {
      // Banana shape but ghostly
      rect(ctx, 5, 2, 5, 10, 0xffff44);
      rect(ctx, 4, 4, 2, 6, 0xffff44);
      rect(ctx, 10, 3, 2, 4, 0xeeee33);
      // Ghost eyes
      pixel(ctx, 6, 5, COLORS.BLACK); pixel(ctx, 9, 5, COLORS.BLACK);
      // Ghost mouth
      rect(ctx, 6, 8, 4, 1, COLORS.BLACK);
      // Wispy bottom
      rect(ctx, 5, 12, 2, 2, 0xffff88); rect(ctx, 8, 13, 2, 2, 0xffff88);
    },
    (ctx) => {
      rect(ctx, 5, 3, 5, 9, 0xffff44);
      rect(ctx, 4, 5, 2, 5, 0xffff44);
      rect(ctx, 10, 4, 2, 4, 0xeeee33);
      pixel(ctx, 6, 6, COLORS.BLACK); pixel(ctx, 9, 6, COLORS.BLACK);
      rect(ctx, 6, 9, 4, 1, COLORS.BLACK);
      rect(ctx, 4, 12, 2, 3, 0xffff88); rect(ctx, 9, 13, 2, 2, 0xffff88);
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
  // Generic villager
  const makeVillager = (key: string, bodyColor: number, headColor: number) => {
    makeFrameTex(scene, key, 16, 16, [
      (ctx) => {
        rect(ctx, 4, 8, 8, 6, bodyColor);
        rect(ctx, 4, 2, 8, 6, headColor);
        pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
        rect(ctx, 6, 6, 3, 1, 0xcc8855);
        rect(ctx, 5, 14, 2, 2, COLORS.BROWN); rect(ctx, 9, 14, 2, 2, COLORS.BROWN);
      },
      (ctx) => {
        rect(ctx, 4, 8, 8, 6, bodyColor);
        rect(ctx, 4, 2, 8, 6, headColor);
        pixel(ctx, 6, 4, COLORS.BLACK); pixel(ctx, 9, 4, COLORS.BLACK);
        rect(ctx, 6, 6, 3, 1, 0xcc8855);
        rect(ctx, 4, 14, 2, 2, COLORS.BROWN); rect(ctx, 10, 14, 2, 2, COLORS.BROWN);
      }
    ]);
  };

  makeVillager('villager1', 0x8855aa, COLORS.SKIN);
  makeVillager('villager2', 0xcc6633, COLORS.SKIN);
  makeVillager('villager3', 0x3366cc, COLORS.SKIN);
  makeVillager('villager_elder', 0xcccccc, COLORS.SKIN);

  // Pick the Pickle
  makeFrameTex(scene, 'pickle', 16, 16, [
    (ctx) => {
      rect(ctx, 4, 1, 8, 13, 0x5ea84c);
      rect(ctx, 5, 0, 6, 2, 0x5ea84c);
      rect(ctx, 5, 13, 6, 2, 0x5ea84c);
      pixel(ctx, 3, 4, 0x4d8a3e); pixel(ctx, 12, 6, 0x4d8a3e); pixel(ctx, 3, 9, 0x4d8a3e);
      pixel(ctx, 6, 5, COLORS.WHITE); pixel(ctx, 9, 5, COLORS.WHITE);
      pixel(ctx, 7, 5, COLORS.BLACK); pixel(ctx, 10, 5, COLORS.BLACK);
      rect(ctx, 6, 8, 4, 1, COLORS.WHITE); // smile
      // Top hat
      rect(ctx, 5, -2, 6, 3, COLORS.BLACK);
      rect(ctx, 4, 0, 8, 1, COLORS.BLACK);
    },
    (ctx) => {
      rect(ctx, 4, 2, 8, 12, 0x5ea84c);
      rect(ctx, 5, 1, 6, 2, 0x5ea84c);
      rect(ctx, 5, 13, 6, 2, 0x5ea84c);
      pixel(ctx, 3, 5, 0x4d8a3e); pixel(ctx, 12, 7, 0x4d8a3e);
      pixel(ctx, 6, 6, COLORS.WHITE); pixel(ctx, 9, 6, COLORS.WHITE);
      pixel(ctx, 7, 6, COLORS.BLACK); pixel(ctx, 10, 6, COLORS.BLACK);
      rect(ctx, 6, 9, 4, 2, COLORS.WHITE);
      rect(ctx, 5, -1, 6, 3, COLORS.BLACK);
      rect(ctx, 4, 1, 8, 1, COLORS.BLACK);
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

  // Merchant
  makeVillager('merchant', 0xaa8833, COLORS.SKIN);

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
  // Heart pickup
  makeTex(scene, 'heart_pickup', 12, 12, (ctx) => {
    ctx.fillStyle = hex(COLORS.HEART_RED);
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(6, 11); ctx.lineTo(11, 5); ctx.fill();
  });

  // Zlorp coin
  makeTex(scene, 'zlorp', 10, 10, (ctx) => {
    ctx.fillStyle = hex(COLORS.GOLD);
    ctx.beginPath(); ctx.arc(5, 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hex(0xccaa00);
    ctx.fillText('Z', 2, 8);
  });

  // Key
  makeTex(scene, 'key', 10, 14, (ctx) => {
    rect(ctx, 3, 0, 4, 2, COLORS.GOLD);
    rect(ctx, 2, 0, 6, 1, COLORS.GOLD);
    rect(ctx, 4, 2, 2, 8, COLORS.GOLD);
    rect(ctx, 3, 10, 4, 2, COLORS.GOLD);
    rect(ctx, 6, 10, 2, 1, COLORS.GOLD);
    rect(ctx, 6, 12, 2, 1, COLORS.GOLD);
  });

  // Ammo pickup
  makeTex(scene, 'ammo_pickup', 10, 10, (ctx) => {
    rect(ctx, 1, 2, 8, 6, 0x00cccc);
    rect(ctx, 3, 0, 4, 2, 0x00aaaa);
    rect(ctx, 3, 4, 4, 2, COLORS.WHITE);
  });

  // Legend Sword item
  makeTex(scene, 'legend_sword', 12, 20, (ctx) => {
    // Blade
    rect(ctx, 5, 0, 2, 12, 0xddddff);
    rect(ctx, 4, 0, 4, 2, 0xddddff);
    // Guard
    rect(ctx, 2, 12, 8, 2, COLORS.GOLD);
    // Handle
    rect(ctx, 5, 14, 2, 4, 0x6b4226);
    // Pommel
    rect(ctx, 4, 18, 4, 2, COLORS.RED);
    // Glow
    pixel(ctx, 3, 4, 0x8888ff); pixel(ctx, 8, 6, 0x8888ff);
  });

  // Shield item
  makeTex(scene, 'shield_item', 14, 16, (ctx) => {
    rect(ctx, 1, 0, 12, 14, 0x3498db);
    rect(ctx, 0, 2, 14, 10, 0x3498db);
    rect(ctx, 2, 14, 10, 2, 0x3498db);
    rect(ctx, 3, 3, 8, 8, 0x2980b9);
    rect(ctx, 5, 4, 4, 6, COLORS.GOLD);
    rect(ctx, 4, 6, 6, 2, COLORS.GOLD);
  });

  // Blaster weapon
  makeTex(scene, 'blaster_item', 16, 10, (ctx) => {
    rect(ctx, 0, 2, 12, 6, 0x444444);
    rect(ctx, 12, 3, 4, 4, 0x555555);
    rect(ctx, 2, 0, 4, 3, 0x555555); // scope
    rect(ctx, 3, 8, 2, 2, 0x333333); // trigger guard
    rect(ctx, 8, 3, 2, 4, 0x00cccc); // energy cell
  });

  // Banana relic
  makeTex(scene, 'banana', 12, 16, (ctx) => {
    rect(ctx, 3, 0, 4, 14, 0xffdd00);
    rect(ctx, 2, 2, 2, 10, 0xffcc00);
    rect(ctx, 7, 1, 2, 8, 0xeecc00);
    rect(ctx, 4, 14, 3, 2, 0xccaa00);
    pixel(ctx, 5, 0, 0x8b6914); // stem
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

  // Grass
  makeTex(scene, 'tile_grass', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x4a8c2a);
    pixel(ctx, 3, 5, 0x3d7a22); pixel(ctx, 10, 2, 0x3d7a22);
    pixel(ctx, 7, 12, 0x5a9c3a); pixel(ctx, 14, 8, 0x5a9c3a);
  });

  // Dirt path
  makeTex(scene, 'tile_dirt', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x8b7355);
    pixel(ctx, 3, 3, 0x7a6244); pixel(ctx, 11, 7, 0x7a6244);
    pixel(ctx, 6, 13, 0x9c8466); pixel(ctx, 14, 2, 0x9c8466);
  });

  // Stone floor
  makeTex(scene, 'tile_stone', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x777777);
    rect(ctx, 0, 0, 8, 8, 0x888888);
    rect(ctx, 8, 8, 8, 8, 0x888888);
    rect(ctx, 0, 7, S, 1, 0x666666);
    rect(ctx, 7, 0, 1, S, 0x666666);
  });

  // Wall
  makeTex(scene, 'tile_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x555555);
    rect(ctx, 1, 1, 6, 6, 0x666666);
    rect(ctx, 9, 1, 6, 6, 0x666666);
    rect(ctx, 1, 9, 6, 6, 0x666666);
    rect(ctx, 9, 9, 6, 6, 0x666666);
    rect(ctx, 0, 7, S, 2, 0x444444);
    rect(ctx, 7, 0, 2, S, 0x444444);
  });

  // Water
  makeTex(scene, 'tile_water', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x2266aa);
    rect(ctx, 2, 4, 5, 1, 0x3388cc);
    rect(ctx, 9, 10, 5, 1, 0x3388cc);
  });

  // Wood floor
  makeTex(scene, 'tile_wood', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x8b6d3c);
    for (let i = 0; i < S; i += 4) {
      rect(ctx, 0, i, S, 1, 0x7a5c2b);
    }
    pixel(ctx, 5, 3, 0x6b4d1c); pixel(ctx, 12, 11, 0x6b4d1c);
  });

  // Hut wall
  makeTex(scene, 'tile_hut', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x9e7e4e);
    rect(ctx, 0, 0, S, 2, 0x8b6d3c);
    rect(ctx, 0, 7, S, 2, 0x8b6d3c);
    rect(ctx, 0, 14, S, 2, 0x8b6d3c);
  });

  // Door
  makeTex(scene, 'tile_door', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x6b4226);
    rect(ctx, 2, 1, 12, 14, 0x7a5030);
    rect(ctx, 6, 0, 4, S, 0x6b4226);
    pixel(ctx, 11, 8, COLORS.GOLD); // handle
  });

  // Shrine mossy stone
  makeTex(scene, 'tile_shrine', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x666666);
    rect(ctx, 0, 0, 8, 8, 0x777777);
    rect(ctx, 8, 8, 8, 8, 0x777777);
    pixel(ctx, 2, 3, 0x447744); pixel(ctx, 11, 1, 0x447744);
    pixel(ctx, 5, 13, 0x447744); pixel(ctx, 14, 9, 0x447744);
  });

  // Digital realm tiles
  makeTex(scene, 'tile_digital', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x0a0a1a);
    rect(ctx, 0, 0, S, 1, 0x00ff44);
    rect(ctx, 0, 0, 1, S, 0x00ff44);
    rect(ctx, 0, 15, S, 1, 0x003311);
    rect(ctx, 15, 0, 1, S, 0x003311);
  });

  // Digital wall (neon)
  makeTex(scene, 'tile_digital_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x111133);
    rect(ctx, 0, 0, S, 2, 0x00ffff);
    rect(ctx, 0, 14, S, 2, 0x00ffff);
    rect(ctx, 7, 0, 2, S, 0xff00ff);
  });

  // Sewer floor
  makeTex(scene, 'tile_sewer', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x3d5a2e);
    pixel(ctx, 4, 3, 0x2d4a1e); pixel(ctx, 11, 9, 0x2d4a1e);
    pixel(ctx, 8, 14, 0x557744); pixel(ctx, 1, 10, 0x557744);
  });

  // Sewer wall
  makeTex(scene, 'tile_sewer_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x444433);
    rect(ctx, 0, 4, S, 2, 0x333322);
    rect(ctx, 0, 10, S, 2, 0x333322);
    pixel(ctx, 3, 7, 0x44aa33); // slime drip
    pixel(ctx, 12, 13, 0x44aa33);
  });

  // Fortress brick
  makeTex(scene, 'tile_fortress', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x4a3a2a);
    rect(ctx, 0, 0, 7, 7, 0x5a4a3a);
    rect(ctx, 8, 0, 8, 7, 0x5a4a3a);
    rect(ctx, 0, 8, 12, 8, 0x5a4a3a);
    rect(ctx, 13, 8, 3, 8, 0x5a4a3a);
    // Green tint for swamp corruption
    pixel(ctx, 2, 2, 0x446633); pixel(ctx, 13, 11, 0x446633);
  });

  // Fortress wall
  makeTex(scene, 'tile_fortress_wall', S, S, (ctx) => {
    rect(ctx, 0, 0, S, S, 0x332211);
    rect(ctx, 1, 1, 6, 6, 0x443322);
    rect(ctx, 9, 1, 6, 6, 0x443322);
    rect(ctx, 5, 9, 6, 6, 0x443322);
    pixel(ctx, 3, 3, 0x556633); pixel(ctx, 12, 12, 0x556633);
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

  // Chest
  makeTex(scene, 'chest_closed', S, S, (ctx) => {
    rect(ctx, 2, 4, 12, 10, 0x8b6d3c);
    rect(ctx, 2, 4, 12, 4, 0x9e7e4e);
    rect(ctx, 2, 4, 12, 1, 0xaa8855);
    rect(ctx, 6, 8, 4, 3, COLORS.GOLD); // lock
  });

  makeTex(scene, 'chest_open', S, S, (ctx) => {
    rect(ctx, 2, 6, 12, 8, 0x8b6d3c);
    rect(ctx, 2, 1, 12, 5, 0x9e7e4e); // lid up
    rect(ctx, 4, 7, 8, 5, 0x2a1a0a); // inside
    pixel(ctx, 7, 9, COLORS.GOLD); pixel(ctx, 9, 8, COLORS.GOLD); // sparkle
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

  // Tree
  makeTex(scene, 'tree', 16, 24, (ctx) => {
    // Trunk
    rect(ctx, 6, 16, 4, 8, 0x6b4226);
    // Canopy
    rect(ctx, 2, 4, 12, 12, 0x2d7a1e);
    rect(ctx, 4, 2, 8, 4, 0x3d8a2e);
    rect(ctx, 3, 6, 10, 8, 0x4a9c3a);
    pixel(ctx, 5, 5, 0x5aac4a); pixel(ctx, 10, 9, 0x5aac4a);
  });

  // Bush
  makeTex(scene, 'bush', S, S, (ctx) => {
    rect(ctx, 1, 4, 14, 10, 0x2d7a1e);
    rect(ctx, 3, 2, 10, 4, 0x3d8a2e);
    rect(ctx, 2, 6, 12, 6, 0x4a9c3a);
  });

  // Pot
  makeTex(scene, 'pot', S, S, (ctx) => {
    rect(ctx, 3, 3, 10, 10, 0x996644);
    rect(ctx, 4, 2, 8, 2, 0xaa7755);
    rect(ctx, 5, 1, 6, 2, 0xbb8866);
    rect(ctx, 4, 13, 8, 2, 0x885533);
  });

  // Sign
  makeTex(scene, 'sign', S, 20, (ctx) => {
    rect(ctx, 2, 0, 12, 10, 0x9e7e4e);
    rect(ctx, 3, 1, 10, 8, 0x8b6d3c);
    rect(ctx, 6, 10, 4, 10, 0x6b4226);
    // Text lines
    rect(ctx, 4, 3, 8, 1, 0x5a4d2a);
    rect(ctx, 4, 5, 6, 1, 0x5a4d2a);
    rect(ctx, 4, 7, 7, 1, 0x5a4d2a);
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
