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
    this.pressurePlates = [];
    this.spikes = [];
    this.boss = null;      // [BOSS] Hecatonchire
    this.exitDoor = null;  // unique porte de sortie
    this.itemsCollected = 0;
    this.itemsTotal = 0;
    this._hudItemText = null;
    this._mapGfx = null;
    this.keys = {}; // Pour stocker les touches d'input
    this.currentLevelNumber = 1; // [SAVE]
    this.levelName = "";
    this.tutorialTip = "";
    this.canFireRay = true; // [PETRIFY RAY] Cooldown
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
    this.load.image('sacred_tile', 'sacred_tile.png');
    this.load.spritesheet('garden_soil', 'garden.png', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('bush_wall', 'bush.png', { frameWidth: 160, frameHeight: 160 });
    this.load.image('pusher_enemy', 'pusher_enemy.png');

    // Préchauffage des spritesheets du joueur (Dimensions affinées sans labels)
    //  this.load.spritesheet('hero_idle_front', 'hero_idle_front.png', { frameWidth: 152, frameHeight: 182 });
    // this.load.spritesheet('hero_idle_back', 'hero_idle_back.png', { frameWidth: 160, frameHeight: 478 });
    //  this.load.spritesheet('hero_idle_right', 'hero_idle_right.png', { frameWidth: 160, frameHeight: 478 });
    //  this.load.spritesheet('hero_idle_left', 'hero_idle_left.png', { frameWidth: 160, frameHeight: 478 });

    // Nouvelles animations de marche (64x64, 13 frames par ligne)
    this.load.spritesheet('hero', 'character-spritesheet.png', { frameWidth: 64, frameHeight: 64 });

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
    }

    // Si on est déjà en fondu ou si le volume est déjà bon, on ne fait rien de brusque
    if (gameMusic.isPlaying) {
      if (Math.abs(gameMusic.volume - targetVolume) < 0.05) return;

      this.tweens.killTweensOf(gameMusic);
      this.tweens.add({
        targets: gameMusic,
        volume: targetVolume,
        duration: 1000
      });
    } else {
      gameMusic.setVolume(0);
      gameMusic.play();
      this.tweens.killTweensOf(gameMusic);
      this.tweens.add({
        targets: gameMusic,
        volume: targetVolume,
        duration: 2000
      });
    }
  }

  _initHeroAnimations() {
    // Création des 4 animations d'attente
    const framesPerRow = 26;
    const anims = [
      { key: 'player-idle-up', start: 0 * framesPerRow, end: 0 * framesPerRow + 1 },
      { key: 'player-idle-left', start: 1 * framesPerRow, end: 1 * framesPerRow + 1 },
      { key: 'player-idle-down', start: 2 * framesPerRow, end: 2 * framesPerRow + 1 },
      { key: 'player-idle-right', start: 3 * framesPerRow, end: 3 * framesPerRow + 1 },
      { key: 'player-walk-up', start: 8 * framesPerRow, end: 8 * framesPerRow + 8 },    // 9e ligne
      { key: 'player-walk-left', start: 9 * framesPerRow, end: 9 * framesPerRow + 8 },  // 10e ligne
      { key: 'player-walk-down', start: 10 * framesPerRow, end: 10 * framesPerRow + 8 }, // 11e ligne
      { key: 'player-walk-right', start: 11 * framesPerRow, end: 11 * framesPerRow + 8 } // 12e ligne
    ];

    anims.forEach(anim => {
      const isWalk = anim.key.includes('walk');
      const frameRate = isWalk ? 9 : 2; // Plus rapide pour la marche

      // Supprimer l'animation existante pour forcer la mise à jour si nécessaire
      if (this.anims.exists(anim.key)) {
        this.anims.remove(anim.key);
      }

      this.anims.create({
        key: anim.key,
        frames: this.anims.generateFrameNumbers('hero', { start: anim.start, end: anim.end }),
        frameRate: frameRate,
        repeat: -1
      });
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
    this.boss = null;
    this.mirrors = [];
    this.items = [];
    this.spawners = [];
    this.springs = [];
    this.spinners = [];
    this.stoneColumns = [];
    this.pressurePlates = [];
    this.spikes = [];
    this.tileSprites = []; // Grille pour stocker les références aux sprites de fond
    this.exitDoor = null;
    this.itemsCollected = 0;
    this.itemsTotal = 0;
    this._victoryShown = false;
    this.levelName = data.name || `NIVEAU ${this.currentLevelNumber}`;
    this.tutorialTip = data.tutorial_tip || data.tip || "";

    // ── Dimensions ──────────────────────────────────────────────────────────
    const gridData = data.mapData || data.grid;
    if (gridData) {
      // Format matriciel (User)
      GRID_ROWS = gridData.length;
      GRID_COLS = gridData[0].length;
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

    if (gridData) {
      // Parsing du matriciel : 0=sol, 1=mur, 2=eau, 3=ennemi, 4=gemme, 5=joueur, 6=porte, 7=plaque, 8=porte(alt), 9=ressort, 10=marteau, 11=pousseur
      this.map = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        this.map[r] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const val = gridData[r][c];
          if (val <= 2 || val === 20 || val === 21) { // 0, 1, 2 sont des tuiles, 20=sacrée, 21=bloc uniquement
            this.map[r][c] = val;
          } else {
            this.map[r][c] = TILE.FLOOR; // Par défaut, sol sous une entité
            if (val === 3) this.enemies.push(new Enemy(this, c, r));
            else if (val === 4) this.items.push(new Item(this, c, r));
            else if (val === 5) playerSpawn = { x: c, y: r };
            else if (val === 6 || val === 8) this.exitDoor = new ExitDoor(this, c, r);
            else if (val === 7 || val === 12 || val === 14) this.pressurePlates.push(new PressurePlate(this, c, r, { target: 'ExitDoor' }));
            else if (val === 13 || val === 15) this.pressurePlates.push(new PressurePlate(this, c, r, { target: 'Spikes' }));
            else if (val === 13) this.spikes.push(new Spikes(this, c, r));
            else if (val === 9) {
                // Orientation intelligente du ressort selon le bord
                let orient = 'D';
                if (r === 0) orient = 'D';
                else if (r === GRID_ROWS - 1) orient = 'U';
                else if (c === 0) orient = 'R';
                else if (c === GRID_COLS - 1) orient = 'L';
                this.springs.push(new Spring(this, c, r, orient));
            }
            else if (val === 10) this.spinners.push(new HammerSpinner(this, c, r, 'CW'));
            else if (val === 11) this.enemies.push(new PusherEnemy(this, c, r));
            else if (val === 16) this.spawners.push(new Spawner(this, c, r));
            else if (val === 17) this.mirrors.push(new Mirror(this, c, r, '/'));
            else if (val === 18) this.mirrors.push(new Mirror(this, c, r, '\\'));
            else if (val === 19) {
                const enemy = new Enemy(this, c, r);
                enemy.petrify();
                this.enemies.push(enemy);
            }
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
          case 'hecatonchire':
            this.boss = new HecatonchireBoss(this, e.x, e.y);
            break;
          case 'pressure_plate':
            this.pressurePlates.push(new PressurePlate(this, e.x, e.y, { toggle: e.toggle, target: e.target }));
            break;
          case 'spikes':
            this.spikes.push(new Spikes(this, e.x, e.y));
            break;
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

    // ── LIAISON SPAWNER-ENNEMI ───────────────────────────────────────────
    // Si un ennemi est placé adjacente à un spawner, ils sont liés.
    for (const spawner of this.spawners) {
      for (const enemy of this.enemies) {
        const dist = Math.abs(spawner.gridX - enemy.gridX) + Math.abs(spawner.gridY - enemy.gridY);
        if (dist === 1) { // Adjacence cardinale
          spawner.setInitialEnemy(enemy);
          break; // Un ennemi par spawner suffit pour définir la règle
        }
      }
    }

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
      const img = this.add.image(x, y, 'bush_wall');
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
    } else if (t === TILE.SACRED) {
      const floorImg = this.add.image(x, y, 'sacred_tile');
      floorImg.setOrigin(0, 0);
      floorImg.setDisplaySize(TILE_SIZE, TILE_SIZE);
      floorImg.setDepth(0.1);
      this.tileSprites[r][c] = floorImg;

      // Lignes de grille optionnelles
      g.fillStyle(COLOR.GRID_LINE, 0.1);
      g.fillRect(x, y, TILE_SIZE, 1);
      g.fillRect(x, y, 1, TILE_SIZE);
    } else if (t === TILE.BLOCK_ONLY) {
      // Tuile "bloc uniquement" : un fond sombre avec un motif de "grillage" ou "barreaux"
      g.fillStyle(COLOR.BLOCK_ONLY, 1);
      g.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      // Motif de barreaux horizontaux
      g.lineStyle(2, 0x222222, 1);
      for (let i = 1; i < 4; i++) {
        const offset = i * (TILE_SIZE / 4);
        g.lineBetween(x + 4, y + offset, x + TILE_SIZE - 4, y + offset);
      }
      
      // Lignes de contour
      g.lineStyle(1, 0x555555, 0.5);
      g.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    } else {
      // Une tuile sol = un sprite (Frame 5 = Row 2, Col 2)
      const floorImg = this.add.image(x, y, 'garden_soil');
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

    // Centrage de la zone de jeu si elle est plus petite que l'écran
    if (WORLD_W < this.scale.width) {
      this.cameras.main.x = (this.scale.width - WORLD_W) / 2;
    }
    if (WORLD_H < this.scale.height) {
      this.cameras.main.y = (this.scale.height - WORLD_H) / 2;
    }
  }

  // ── Inputs ─────────────────────────────────────────────────────────────────
  _setupInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      C: Phaser.Input.Keyboard.KeyCodes.C,
      V: Phaser.Input.Keyboard.KeyCodes.V,
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update() {
    if (!this.player || this.player.dead) return;

    const keys = this.keys;
    if (!keys) return;

    if (this.boss) this.boss.update();
    this.checkPressurePlates();
    this.checkSpikes();

    // ── GESTION GAMEPAD ──────────────────────────────────────────────────────
    const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
    let padUp = false, padDown = false, padLeft = false, padRight = false;
    let padSpace = false, padC = false, padV = false;

    if (pad) {
      // Seuils pour les sticks analogiques
      const threshold = 0.5;
      padLeft = pad.left || pad.axes[0].value < -threshold;
      padRight = pad.right || pad.axes[0].value > threshold;
      padUp = pad.up || pad.axes[1].value < -threshold;
      padDown = pad.down || pad.axes[1].value > threshold;

      // Boutons d'action (A = 0, B = 1, X = 2, Y = 3 sur Xbox)
      // On utilise JustDown manuel pour les actions "one-shot"
      if (pad.buttons[0].pressed && !this._pad0Down) { padSpace = true; }
      this._pad0Down = pad.buttons[0].pressed;

      if (pad.buttons[2].pressed && !this._pad2Down) { padC = true; }
      this._pad2Down = pad.buttons[2].pressed;

      if (pad.buttons[1].pressed && !this._pad1Down) { padV = true; }
      this._pad1Down = pad.buttons[1].pressed;
    }

    // [PETRIFY RAY] Tir rayon (Espace ou Bouton A)
    if (Phaser.Input.Keyboard.JustDown(keys.SPACE) || padSpace) {
      this._fireRay();
    }

    // [STONE COLUMN] Invoquer colonne (C ou Bouton X)
    if (Phaser.Input.Keyboard.JustDown(keys.C) || padC) {
      this.player.tryCreateColumn();
    }

    // [STONE COLUMN] Détruire colonne (V ou Bouton B)
    if (Phaser.Input.Keyboard.JustDown(keys.V) || padV) {
      this.player.tryDestroyColumn();
    }

    if (this.player.moving) return;   // déplacement en cours → bloquer

    if (keys.left.isDown || keys.A.isDown || padLeft) this.player.tryMove(-1, 0);
    else if (keys.right.isDown || keys.D.isDown || padRight) this.player.tryMove(1, 0);
    else if (keys.up.isDown || keys.W.isDown || padUp) this.player.tryMove(0, -1);
    else if (keys.down.isDown || keys.S.isDown || padDown) this.player.tryMove(0, 1);
  }

  // ── [PETRIFY RAY] Tirer le rayon ───────────────────────────────────────────
  _fireRay() {
    if (!this.canFireRay) return;
    this.canFireRay = false;
    this.time.delayedCall(1000, () => { this.canFireRay = true; });

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
        
        // Note: TILE.BLOCK_ONLY (21) n'est PAS unbreakable, donc la statue peut passer dessus.

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
        // Boss damage detection (during slide)
        if (this.boss && this.boss.state === 'DIZZY') {
          const dist = Phaser.Math.Distance.Between(statue.gfx.x, statue.gfx.y, this.boss.x, this.boss.y);
          if (dist < TILE_SIZE * 1.2) {
            this.boss.takeDamage();
            // Stop the statue?
            // For now let's keep it sliding or destroy it?
            // User says "le pousser sur le boss au moment où il s'arrête"
            // but also "profiter de la phase de rotation pour pétrifier... et le pousser".
            // If it hits the boss, it should probably stop or be destroyed.
            statue.sliding = false; 
            this.tweens.killTweensOf(statue.gfx);
            statue.gfx.destroy();
            this.enemies = this.enemies.filter(e => e !== statue);
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
      // Vérifier aussi les plaques de pression liées à la porte
      if (this.areAllTargetedPlatesActive('ExitDoor')) {
        this.exitDoor.open();
      }
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

    // ── Stopper tout mouvement et IA ──
    this.enemies.forEach(e => {
        if (e._aiTimer) e._aiTimer.remove();
        if (e._petrifyTimer) e._petrifyTimer.remove();
        if (e._reviveTimer) e._reviveTimer.remove();
        if (e._blinkEvent) e._blinkEvent.remove();
        this.tweens.killTweensOf(e.gfx);
    });
    this.spawners.forEach(s => {
        if (s._checkTimer) s._checkTimer.remove();
    });
    if (this.boss) {
        if (this.boss.rotationTween) this.boss.rotationTween.stop();
        if (this.boss.attackTimer) this.boss.attackTimer.remove();
        if (this.boss.phaseTimer) this.boss.phaseTimer.remove();
        this.tweens.killTweensOf(this.boss);
    }

    const cam = this.cameras.main;
    cam.flash(300, 255, 215, 0);

    // Centrer par rapport à l'écran en tenant compte de la position de la caméra
    const cx = cam.scrollX + (this.scale.width / 2) - cam.x;
    const cy = cam.scrollY + (this.scale.height / 2) - cam.y;

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
        // Passer au niveau suivant dynamiquement
        const totalLevels = Object.keys(GameLevels).length;
        if (this.currentLevelNumber < totalLevels) {
          this.scene.start('GameScene', { level: this.currentLevelNumber + 1 });
        } else {
          this.scene.start('MenuScene');
          this.scene.stop('HUDScene');
        }
      });
    });
  }

  onBossDefeated() {
    this.cameras.main.flash(500, 255, 255, 255);
    this.time.delayedCall(1000, () => {
      this._victoryScreen();
    });
  }

  // ── Plaques de pression ──────────────────────────────────────────────
  checkPressurePlates() {
    for (const plate of this.pressurePlates) {
      let isOccupied = false;
      
      // Joueur ?
      if (this.player && this.player.gridX === plate.gridX && this.player.gridY === plate.gridY) {
        isOccupied = true;
      }
      
      // Ennemis ou Statues ?
      if (!isOccupied) {
        for (const enemy of this.enemies) {
          if (enemy.gridX === plate.gridX && enemy.gridY === plate.gridY) {
            isOccupied = true;
            break;
          }
        }
      }
      
      // Boss ?
      if (!isOccupied && this.boss) {
        // Le boss peut être imposant, mais ici on check son centre
        if (this.boss.gridX === plate.gridX && this.boss.gridY === plate.gridY) {
          isOccupied = true;
        }
      }
      
      plate.setPressed(isOccupied);
    }

    // Mise à jour des cibles (Pics, Porte)
    this._updateLinkedEntities();
  }

  _updateLinkedEntities() {
    // 1. Pics
    for (const spike of this.spikes) {
      // On cherche s'il y a une plaque qui cible 'Spikes'
      // Optionnel : on pourrait cibler des pics spécifiques par ID, 
      // mais ici on simplifie : si n'importe quelle plaque ciblée 'Spikes' est pressée, les pics se rétractent.
      // Ou plus logiquement : si UNE plaque cible spécifiquement CE groupe de pics.
      // Pour l'instant, on fait global pour le niveau :
      const shouldRetract = this.areAnyTargetedPlatesActive('Spikes');
      spike.setRetracted(shouldRetract);
    }

    // 2. Porte (si tous les items sont déjà là)
    if (this.exitDoor && !this.exitDoor.isOpen && this.itemsCollected >= this.itemsTotal) {
      if (this.areAllTargetedPlatesActive('ExitDoor')) {
        this.exitDoor.open();
      }
    }
  }

  areAnyTargetedPlatesActive(target) {
    // On prend les plaques qui ciblent explicitement 'target'
    // OU les plaques sans cible (null) s'il n'y a pas de plaques spécifiques pour cette cible
    const specificPlates = this.pressurePlates.filter(p => p.target === target);
    const genericPlates = this.pressurePlates.filter(p => !p.target);
    
    const relevantPlates = specificPlates.length > 0 ? specificPlates : genericPlates;
    
    if (relevantPlates.length === 0) return false;
    return relevantPlates.some(p => p.pressed);
  }

  areAllTargetedPlatesActive(target) {
    const specificPlates = this.pressurePlates.filter(p => p.target === target);
    const genericPlates = this.pressurePlates.filter(p => !p.target);
    
    const relevantPlates = specificPlates.length > 0 ? specificPlates : genericPlates;

    if (relevantPlates.length === 0) return true; // Pas de plaques = condition remplie
    return relevantPlates.every(p => p.pressed);
  }

  // ── Pics ─────────────────────────────────────────────────────────────
  checkSpikes() {
    if (!this.player || this.player.dead) return;
    for (const spike of this.spikes) {
      if (!spike.retracted) {
        if (spike.gridX === this.player.gridX && spike.gridY === this.player.gridY) {
          this._playerDeath();
          return;
        }
      }
    }
  }

  // ── Mort du joueur ─────────────────────────────────────────────────────────
  _playerDeath() {
    if (this.player.dead) return;
    this.player.dead = true;
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
  input: { gamepad: true },
  scene: [MenuScene, LevelSelectScene, GameScene, HUDScene, OptionsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
};

const game = new Phaser.Game(config);
