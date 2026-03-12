// =============================================================================
//  GORGON'S DEBT – Prototype Phaser 3
//  Fichier : game.js
//
//  Architecture :
//    - Player        : déplacement tile-based + tween, direction mémorisée
//    - Enemy         : ennemi vivant (rouge) ou pétrifié (gris, poussable)
//    - Mirror        : miroir posé sur la grille (45° / 135°), reflète le rayon
//    - PetrifyRay    : rayon rectiligne avec rebonds, rendu ligne lumineuse
//    - GameScene     : scène principale (carte, caméra, collisions, eau)
//
//  Tags d'extension :
//    [MIRROR]      : logique miroir
//    [PETRIFY RAY] : propagation du rayon
//    [WATER]       : interaction eau / statue
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
//  SCÈNE PRINCIPALE : GameScene
// ─────────────────────────────────────────────────────────────────────────────

class GameScene extends Phaser.Scene {

  constructor() {
    super({ key: 'GameScene' });
    this.map = [];
    this.player = null;
    this.enemies = [];
    this.mirrors = [];    // [MIRROR]
    this.items = [];    // [ITEM] éclats à collecter
    this.spawners = [];    // [SPAWNER] points d'invocation
    this.springs = [];     // [SPRING] ressorts
    this.spinners = [];    // [HAMMERSPINNER] tourniquets 3x3
    this.stoneColumns = [];    // [COLUMNS] invoquées par le joueur
    this.exitDoor = null;  // unique porte de sortie
    this.itemsCollected = 0;
    this.itemsTotal = 0;
    this._hudItemText = null;
    this._mapGfx = null;
    this.keys = {}; // Pour stocker les touches d'input
    this.currentLevelNumber = 1; // [SAVE]
    this.levelName = "";
    this.tutorialTip = "";
  }

  // ── init ────────────────────────────────────────────────────────────────────
  init(data) {
    if (data && data.level) {
      this.currentLevelNumber = data.level;
    }
  }

  // ── preload ─────────────────────────────────────────────────────────────────
  preload() {
    this.load.image('spawner_ruins', 'spawner_ruins.png');
    this.load.spritesheet('garden_soil', 'garden_soil.png', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('bush_wall', 'bush_wall.png', { frameWidth: 160, frameHeight: 160 });
    this.load.image('pusher_enemy', 'pusher_enemy.png');
    this.load.image('basic_hero', 'basic_hero.png');

    // Préchauffage des spritesheets du joueur (Dimensions affinées sans labels)
    this.load.spritesheet('hero_idle_front', 'hero_idle_front.png', { frameWidth: 152, frameHeight: 182 });
    this.load.spritesheet('hero_idle_back', 'hero_idle_back.png', { frameWidth: 160, frameHeight: 478 });
    this.load.spritesheet('hero_idle_right', 'hero_idle_right.png', { frameWidth: 160, frameHeight: 478 });
    this.load.spritesheet('hero_idle_left', 'hero_idle_left.png', { frameWidth: 160, frameHeight: 478 });

    // Chargement dynamique du JSON du niveau
    this.load.json(`levelData${this.currentLevelNumber}`, `levels/level${this.currentLevelNumber}.json`);
  }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    this._initHeroAnimations();

    // Priorité au global GameLevels (src/Levels.js), sinon cache, sinon fallback
    const levelKey = this.currentLevelNumber.toString();
    const levelData = (typeof GameLevels !== 'undefined' && GameLevels[levelKey])
      ? GameLevels[levelKey]
      : (this.cache.json.get(`levelData${this.currentLevelNumber}`) || LEVEL_DATA);

    this._loadLevel(levelData);
    this._renderMap();

    // Lancement du HUD par-dessus le jeu
    this.scene.launch('HUDScene');

    // Initialiser le HUD avec les données du niveau
    this.time.delayedCall(10, () => {
      this.events.emit('updateHUD', {
        itemsCollected: this.itemsCollected,
        itemsTotal: this.itemsTotal,
        levelName: this.levelName,
        tutorialTip: this.tutorialTip
      });
    });

    this._setupCamera();
    this._setupInput();
    this.cameras.main.fadeIn(300);

    this._handleMusicTransition();
  }

  _handleMusicTransition() {
    const titleMusic = this.sound.get('titleMusic');
    if (titleMusic && titleMusic.isPlaying) {
      this.tweens.add({
        targets: titleMusic,
        volume: 0,
        duration: 2000,
        onComplete: () => titleMusic.stop()
      });
    }

    let gameMusic = this.sound.get('gameMusic');
    const targetVolume = saveData.settings.musicVolume;

    if (!gameMusic) {
      gameMusic = this.sound.add('gameMusic', { loop: true, volume: 0 });
    } else {
      gameMusic.volume = 0;
    }

    if (!gameMusic.isPlaying) gameMusic.play({ loop: true });

    this.tweens.add({
      targets: gameMusic,
      volume: targetVolume,
      duration: 2000
    });
  }

  _initHeroAnimations() {
    // Création des 4 animations d'attente
    const anims = [
      { key: 'player-idle-down', texture: 'hero_idle_front' },
      { key: 'player-idle-up', texture: 'hero_idle_back' },
      { key: 'player-idle-right', texture: 'hero_idle_right' },
      { key: 'player-idle-left', texture: 'hero_idle_left' },
    ];

    anims.forEach(anim => {
      if (!this.anims.exists(anim.key)) {
        this.anims.create({
          key: anim.key,
          frames: this.anims.generateFrameNumbers(anim.texture, { start: 0, end: 3 }),
          frameRate: 6,
          repeat: -1
        });
      }
    });
  }

  // ── Chargement d'un niveau depuis un objet JSON ─────────────────────────────
  /**
   * Remplace _buildMap(). Lit le JSON de l'éditeur et initialise :
   *   - les dimensions (GRID_COLS / GRID_ROWS / WORLD_W / WORLD_H)
   *   - la grille this.map
   *   - les entités : Player, Enemy, Mirror, Exit
   *
   * Pour changer de niveau : modifiez LEVEL_DATA en haut du fichier.
   */
  _loadLevel(data) {
    // ── Reset complet (scene.restart ne rappelle pas le constructeur) ─────────
    this.enemies = [];
    this.mirrors = [];
    this.items = [];
    this.spawners = [];
    this.springs = [];
    this.spinners = [];
    this.stoneColumns = [];
    this.tileSprites = []; // Grille pour stocker les références aux sprites de fond
    this.exitDoor = null;
    this.itemsCollected = 0;
    this.itemsTotal = 0;
    this._victoryShown = false;
    this.levelName = data.name || `NIVEAU ${this.currentLevelNumber}`;
    this.tutorialTip = data.tutorial_tip || "";

    // ── Dimensions ──────────────────────────────────────────────────────────
    if (data.mapData) {
      // Format matriciel (User)
      GRID_ROWS = data.mapData.length;
      GRID_COLS = data.mapData[0].length;
    } else {
      // Format original
      GRID_COLS = data.width || 20;
      GRID_ROWS = data.height || 20;
    }

    WORLD_W = GRID_COLS * TILE_SIZE;
    WORLD_H = GRID_ROWS * TILE_SIZE;

    // Initialiser la grille de sprites vide
    for (let r = 0; r < GRID_ROWS; r++) {
      this.tileSprites[r] = new Array(GRID_COLS).fill(null);
    }

    // ── Construction de la carte et des entités ─────────────────────────────
    let playerSpawn = { x: 1, y: 1 };

    if (data.mapData) {
      // Parsing du matriciel : 0=sol, 1=mur, 2=eau, 3=ennemi, 4=gemme, 5=joueur, 6=porte
      this.map = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        this.map[r] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const val = data.mapData[r][c];
          if (val <= 2) {
            this.map[r][c] = val;
          } else {
            this.map[r][c] = TILE.FLOOR;
            if (val === 3) this.enemies.push(new Enemy(this, c, r));
            else if (val === 4) this.items.push(new Item(this, c, r));
            else if (val === 5) playerSpawn = { x: c, y: r };
            else if (val === 6) this.exitDoor = new ExitDoor(this, c, r);
          }
        }
      }
    } else {
      // Parsing original
      this.map = data.map.map(row => [...row]);
      for (const e of data.entities) {
        switch (e.type) {
          case 'player':
            playerSpawn = { x: e.x, y: e.y };
            break;
          case 'enemy':
            this.enemies.push(new Enemy(this, e.x, e.y));
            break;
          case 'mirror':
          case 'mirrorA':
            this.mirrors.push(new Mirror(this, e.x, e.y, (e.orientation === '\\') ? '\\' : '/'));
            break;
          case 'mirrorB':
            this.mirrors.push(new Mirror(this, e.x, e.y, '\\'));
            break;
          case 'item':
          case 'shard':
            this.items.push(new Item(this, e.x, e.y));
            break;
          case 'exit':
            this.exitDoor = new ExitDoor(this, e.x, e.y);
            break;
          case 'spawner':
            this.spawners.push(new Spawner(this, e.x, e.y));
            break;
          case 'spring':
            this.springs.push(new Spring(this, e.x, e.y, e.orientation));
            break;
          case 'hammer':
            this.spinners.push(new HammerSpinner(this, e.x, e.y, e.orientation));
            break;
          case 'pusher_enemy':
            this.enemies.push(new PusherEnemy(this, e.x, e.y));
            break;
          case 'statue': {
            const enemy = new Enemy(this, e.x, e.y);
            enemy.petrify();
            this.enemies.push(enemy);
            break;
          }
        }
      }
    }

    // Gestion de gemsRequired ou itemsTotal
    if (data.gemsRequired !== undefined) {
      this.itemsTotal = data.gemsRequired;
    } else {
      this.itemsTotal = this.items.length;
    }
    this.itemsCollected = 0;
    if (this.itemsTotal === 0 && this.exitDoor) this.exitDoor.open();

    // Créer le joueur en dernier (depth supérieure)
    this.player = new Player(this, playerSpawn.x, playerSpawn.y);
  }

  // ── Rendu global de la carte (initial) ──────────────────────────────────────
  _renderMap() {
    // Fond global Noir (pour éviter les trous si la grille a des espaces)
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, WORLD_W, WORLD_H);
    bg.setDepth(0);

    // Référence pour les mises à jour tile par tile
    this._mapGfx = this.add.graphics();
    this._mapGfx.setDepth(1);

    this._redrawAllTiles();
  }

  // Redessine toutes les tuiles (utile lors d'un changement de tile)
  _redrawAllTiles() {
    this._mapGfx.clear();
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        this._drawTile(c, r);
  }

  // Dessine une tuile individuelle
  _drawTile(c, r) {
    const x = c * TILE_SIZE;
    const y = r * TILE_SIZE;
    const t = this.map[r][c];
    const g = this._mapGfx;

    // Nettoyage du sprite existant à cette position
    if (this.tileSprites[r][c]) {
      this.tileSprites[r][c].destroy();
      this.tileSprites[r][c] = null;
    }

    if (t === TILE.WALL) {
      const img = this.add.image(x, y, 'bush_wall', 5);
      img.setOrigin(0, 0);
      img.setDisplaySize(TILE_SIZE, TILE_SIZE);
      img.setDepth(0.4);
      this.tileSprites[r][c] = img;
    } else if (t === TILE.WATER) {
      // [WATER] - On utilise Graphics pour l'eau pour l'instant (ou un sprite si on en génère un)
      g.fillStyle(COLOR.WATER, 1);
      g.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      g.fillStyle(0x1565c0, 0.5);
      g.fillRect(x + 4, y + 4, TILE_SIZE / 2, 4);
    } else {
      // Une tuile sol = un sprite (Frame 5 = Row 2, Col 2)
      const floorImg = this.add.image(x, y, 'garden_soil', 5);
      floorImg.setOrigin(0, 0);
      floorImg.setDisplaySize(TILE_SIZE, TILE_SIZE);
      floorImg.setDepth(0.1);
      this.tileSprites[r][c] = floorImg;

      // Lignes de grille optionnelles
      g.fillStyle(COLOR.GRID_LINE, 0.1);
      g.fillRect(x, y, TILE_SIZE, 1);
      g.fillRect(x, y, 1, TILE_SIZE);
    }
  }

  // HUD déplacé dans HUDScene.js (piloté par événements)


  // ── Caméra ─────────────────────────────────────────────────────────────────
  _setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.10, 0.10);
    this.cameras.main.setZoom(1.0);
  }

  // ── Inputs ─────────────────────────────────────────────────────────────────
  _setupInput() {
    this.keys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      C: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      V: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
    };
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update() {
    if (!this.player) return;

    const keys = this.keys;
    if (!keys) return;

    // [PETRIFY RAY] Tir rayon
    if (Phaser.Input.Keyboard.JustDown(keys.SPACE)) {
      this._fireRay();
    }

    // [STONE COLUMN] Invoquer colonne
    if (Phaser.Input.Keyboard.JustDown(keys.C)) {
      this.player.tryCreateColumn();
    }

    // [STONE COLUMN] Détruire colonne
    if (Phaser.Input.Keyboard.JustDown(keys.V)) {
      this.player.tryDestroyColumn();
    }

    if (this.player.moving) return;   // déplacement en cours → bloquer

    if (keys.left.isDown || keys.A.isDown) this.player.tryMove(-1, 0);
    else if (keys.right.isDown || keys.D.isDown) this.player.tryMove(1, 0);
    else if (keys.up.isDown || keys.W.isDown) this.player.tryMove(0, -1);
    else if (keys.down.isDown || keys.S.isDown) this.player.tryMove(0, 1);
  }

  // ── [PETRIFY RAY] Tirer le rayon ───────────────────────────────────────────
  _fireRay() {
    const { dx, dy } = this.player.dir;
    // Flash cyan sur le joueur
    this.cameras.main.flash(80, 0, 200, 255);
    new PetrifyRay(
      this,
      this.player.gridX,
      this.player.gridY,
      dx, dy
    );
  }

  // ── Pousser une statue (glissade continue avec rebonds) ───────────────
  /**
   * Calcule la trajectoire de la statue incluant de multiples segments
   * si elle rebondit sur un ressort.
   */
  tryPushStatue(nx, ny, initDx, initDy) {
    const statue = this.enemies.find(e => e.petrified && e.gridX === nx && e.gridY === ny);
    if (!statue) return false;

    // ── Verrou par statue
    if (statue.sliding) return true;

    statue.sliding = true; // Block further pushes

    const path = []; // array of { cx, cy, destX, destY, dx, dy, hitWall, hitWater, hitSpring, hitInertiaTarget }
    let cx = nx;
    let cy = ny;
    let dx = initDx;
    let dy = initDy;

    // Simulation de la glissade
    while (true) {
      let tx = cx + dx;
      let ty = cy + dy;
      let hitWall = false;
      let hitWater = false;
      let hitSpring = null;
      let hitInertiaTarget = null;
      let hitSpinner = null;
      let destX = cx;
      let destY = cy;

      while (true) {
        // Out of bounds = Wall
        if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) {
          destX = tx - dx;
          destY = ty - dy;
          hitWall = true; break;
        }

        const tile = this.map[ty][tx];
        // 1. Water
        if (tile === TILE.WATER) { destX = tx; destY = ty; hitWater = true; break; }

        // 2. Unbreakable obstacles
        let isUnbreakable = false;
        if (tile === TILE.WALL) isUnbreakable = true;
        if (this.stoneColumns?.some(c => c.gridX === tx && c.gridY === ty)) isUnbreakable = true;
        if (this.spawners?.some(s => s.gridX === tx && s.gridY === ty)) isUnbreakable = true;
        if (this.mirrors?.some(m => m.gridX === tx && m.gridY === ty)) isUnbreakable = true;
        if (this.exitDoor?.gridX === tx && this.exitDoor?.gridY === ty && !this.exitDoor.isOpen) isUnbreakable = true;

        if (isUnbreakable) {
          destX = tx - dx;
          destY = ty - dy;
          hitWall = true; break;
        }

        // 3. Petrified Enemy (Inertia Transfer)
        const blocker = this.enemies.find(e => e !== statue && e.gridX === tx && e.gridY === ty);
        if (blocker && blocker.petrified) {
          hitInertiaTarget = blocker;
          destX = tx - dx; destY = ty - dy;
          hitWall = true; // Agit comme un mur pour stopper cette simulation
          break;
        }

        // Notes communes : Les cibles mobiles (Player, Enemy vivant) ne stoppent pas le mouvement,
        // l'écrasement se fait "à la volée" pendant le tween (onUpdate).

        // 4. Spring (Bouncing)
        const spring = this.springs.find(s => s.gridX === tx && s.gridY === ty);
        if (spring) {
          // Verify orientation : the block must hit the spring from the "bouncy" side.
          // e.g. If spring points U (dir.dy = -1), block must move D (dy = 1).
          if (spring.dir.dx === -dx && spring.dir.dy === -dy) {
            hitSpring = spring;
            destX = tx - dx; destY = ty - dy;
            break;
          } else {
            // Treat as a wall if hit from side or behind
            destX = tx - dx; destY = ty - dy;
            hitWall = true;
            break;
          }
        }

        // 5. HammerSpinner (Redirect)
        for (const spinner of this.spinners) {
          // Collision on the pivot (center) is always solid
          if (tx === spinner.gridX && ty === spinner.gridY) {
            isUnbreakable = true;
            hitWall = true;
            destX = tx - dx; destY = ty - dy;
            break;
          }

          // Collision on the active arm
          const armX = spinner.gridX + spinner.armDir.dx;
          const armY = spinner.gridY + spinner.armDir.dy;
          if (tx === armX && ty === armY) {
            if (spinner.isRotating) {
              isUnbreakable = true;
              hitWall = true;
              destX = tx - dx; destY = ty - dy;
              break;
            } else {
              // Verify it's not a frontal hit
              const sense = spinner._getRotationSense(dx, dy);
              if (sense === 0) {
                hitWall = true;
                destX = tx - dx; destY = ty - dy;
                break;
              } else {
                hitSpinner = spinner;
                destX = tx - dx; destY = ty - dy; // Stop right BEFORE the arm
                break;
              }
            }
          }
        }

        if (hitWall) break;
        if (hitSpinner) break;

        destX = tx; destY = ty;
        tx += dx; ty += dy;
      }

      const dist = Math.abs(destX - cx) + Math.abs(destY - cy);
      if (dist > 0 || hitSpring || hitInertiaTarget || hitSpinner) {
        path.push({ cx, cy, destX, destY, dx, dy, hitWall, hitWater, hitSpring, hitInertiaTarget, hitSpinner });
        // Failsafe to prevent game freeze from infinite bounces between two springs:
        if (path.length > 25) {
          break;
        }
      } else {
        if (path.length === 0) {
          statue.sliding = false;
        }
        break;
      }

      if (hitWall || hitWater || (!hitSpring && !hitInertiaTarget && !hitSpinner)) {
        break; // Trajectoire terminée
      }

      if (hitInertiaTarget || hitSpinner) {
        break; // Trajectoire de CELLE-CI terminée
      }

      // Prepare for next segment (bouncing back on spring)
      cx = destX;
      cy = destY;
      dx = -dx;
      dy = -dy;
    }

    if (path.length > 0) {
      this._slideStatueSegments(statue, path, 0);
    }
    return true;
  }

  // ── Exécution de l'animation de glissade par segments ─────────────────────
  _slideStatueSegments(statue, segments, index) {
    if (index >= segments.length) {
      statue.sliding = false;
      return;
    }

    const seg = segments[index];
    const dist = Math.abs(seg.destX - seg.cx) + Math.abs(seg.destY - seg.cy);

    statue.gridX = seg.destX;
    statue.gridY = seg.destY;

    // Vitesse constante : 70 ms par case
    const SPEED_MS_PER_TILE = 70;
    // Minimiser la durée si distance=0 mais qu'il y a un rebond instantané
    const duration = Math.max(20, dist * SPEED_MS_PER_TILE);

    const { x: px, y: py } = gridToPixel(seg.destX, seg.destY);

    this.tweens.add({
      targets: statue.gfx,
      x: px,
      y: py,
      duration: duration,
      ease: 'Linear',
      onUpdate: () => {
        // Crush detection
        this.enemies.forEach(e => {
          if (!e.petrified && e.gfx && !e.isDead) {
            const dist = Phaser.Math.Distance.Between(statue.gfx.x, statue.gfx.y, e.gfx.x, e.gfx.y);
            if (dist < TILE_SIZE * 0.5) {
              e.kill();
            }
          }
        });
        if (this.player && this.player.gfx && !this.player.isDead) {
          const dist = Phaser.Math.Distance.Between(statue.gfx.x, statue.gfx.y, this.player.gfx.x, this.player.gfx.y);
          if (dist < TILE_SIZE * 0.5) {
            this.player.kill();
          }
        }
      },
      onComplete: () => {
        if (seg.hitSpring) {
          seg.hitSpring.bounce();
        }

        if (seg.hitWall && !seg.hitInertiaTarget) {
          this.cameras.main.shake(100, 0.005);
        }

        if (seg.hitWater) {
          this.enemies = this.enemies.filter(e => e !== statue);
          statue.sink();
          this.map[seg.destY][seg.destX] = TILE.FLOOR;
          this._redrawAllTiles();
          this._splashParticles(seg.destX, seg.destY);
          return; // The statue is destroyed, don't continue segments
        }

        if (seg.hitInertiaTarget) {
          statue.sliding = false;
          // Transfer inertia (Statue stops here, the next one starts sliding)
          this.tryPushStatue(seg.hitInertiaTarget.gridX, seg.hitInertiaTarget.gridY, seg.dx, seg.dy);
        } else if (seg.hitSpinner) {
          statue.sliding = false; // Permet de relancer une nouvelle poussée à la sortie
          // Attraper et tourner le bloc
          seg.hitSpinner.catchAndRotateBlock(statue, seg.dx, seg.dy, (newDx, newDy) => {
            // Quand la rotation est terminée, reprendre la poussée !
            this.tryPushStatue(statue.gridX, statue.gridY, newDx, newDy);
          });
        } else {
          // Lancer segment suivant
          this._slideStatueSegments(statue, segments, index + 1);
        }
      }
    });
  }

  playHeavyImpact() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const sfxVol = saveData.settings.sfxVolume || 0.8;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    // Use an oscillator to generate a low frequency thump
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.15); // Drop frequency fast

    gain.gain.setValueAtTime(0.8 * sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); // Fade out fast

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playBoing() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const sfxVol = saveData.settings.sfxVolume || 0.8;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5 * sfxVol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // ── Collision joueur / ennemi vivant ───────────────────────────────────────
  checkEnemyCollision() {
    if (!this.player) return;
    for (const enemy of this.enemies) {
      if (enemy.petrified) continue;
      if (enemy.gridX === this.player.gridX && enemy.gridY === this.player.gridY) {
        this._playerDeath();
        return;
      }
    }
  }

  // ── Ramassage des éclats ────────────────────────────────────────────
  checkItemPickup() {
    if (!this.player) return;
    for (const item of this.items) {
      if (item.collected) continue;
      if (item.gridX === this.player.gridX && item.gridY === this.player.gridY) {
        item.collect();
        this.onItemCollected();
        return;
      }
    }
  }

  onItemCollected() {
    this.itemsCollected++;
    this.events.emit('updateHUD', {
      itemsCollected: this.itemsCollected,
      itemsTotal: this.itemsTotal
    });
    this.cameras.main.flash(80, 0, 212, 255);  // flash cyan
    if (this.itemsCollected >= this.itemsTotal && this.exitDoor) {
      this.exitDoor.open();
    }
  }

  // ── Vérification porte de sortie ──────────────────────────────────────
  checkExitDoor() {
    if (!this.player || !this.exitDoor) return;
    if (!this.exitDoor.isOpen) return;
    if (this.exitDoor.gridX === this.player.gridX &&
      this.exitDoor.gridY === this.player.gridY) {
      this._victoryScreen();
    }
  }

  // ── Écran de victoire (2 s avant reload) ─────────────────────────────
  _victoryScreen() {
    if (this._victoryShown) return;
    this._victoryShown = true;
    if (this.player) this.player.moving = true;  // bloquer les inputs

    const cam = this.cameras.main;
    cam.flash(300, 255, 215, 0);

    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.65);
    panel.fillRoundedRect(cx - 220, cy - 55, 440, 110, 16);
    panel.setDepth(200).setAlpha(0);

    const title = this.add.text(cx, cy - 14, 'NIVEAU TERMINÉ !', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffd700',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(201).setAlpha(0);

    const sub = this.add.text(cx, cy + 26, 'Chargement du prochain niveau...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#d0d0d0',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(201).setAlpha(0);

    this.tweens.add({ targets: [panel, title, sub], alpha: 1, duration: 400, ease: 'Quad.easeOut' });

    // ── Sauvegarde de la progression ──
    if (saveData.unlockedLevels <= this.currentLevelNumber) {
      saveData.unlockedLevels = this.currentLevelNumber + 1;
    }
    saveData.totalGems += this.itemsCollected;
    saveGame();

    this.time.delayedCall(2000, () => {
      cam.fadeOut(500, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        // Passer au niveau suivant (limité à 5 pour l'instant)
        if (this.currentLevelNumber < 5) {
          this.scene.start('GameScene', { level: this.currentLevelNumber + 1 });
        } else {
          this.scene.start('MenuScene');
          this.scene.stop('HUDScene');
        }
      });
    });
  }

  // ── Mort du joueur ─────────────────────────────────────────────────────────
  _playerDeath() {
    this.cameras.main.flash(200, 180, 0, 0);
    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart();
      });
    });
  }

  // ── [WATER] Particules d'éclaboussure ──────────────────────────────────────
  _splashParticles(gx, gy) {
    const { x, y } = gridToPixel(gx, gy);
    for (let i = 0; i < 12; i++) {
      const drop = this.add.graphics();
      drop.setDepth(20);
      drop.fillStyle(0x42a5f5, 1);
      drop.fillCircle(0, 0, Phaser.Math.Between(3, 7));
      drop.setPosition(x, y);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(15, TILE_SIZE);
      this.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Quad.easeOut',
        onComplete: () => drop.destroy(),
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION PHASER ET LANCEMENT
// ─────────────────────────────────────────────────────────────────────────────

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#050505',
  physics: { default: 'arcade' },
  scene: [MenuScene, LevelSelectScene, GameScene, HUDScene, OptionsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
};

const game = new Phaser.Game(config);
