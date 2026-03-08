// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE PLAYER
// ─────────────────────────────────────────────────────────────────────────────

class Player {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.moving = false;
    this.dir = { dx: 1, dy: 0 };   // direction actuelle (pour tir)

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this._drawSprite();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(10);
  }

  _drawSprite() {
    const pad = 6;
    const s = TILE_SIZE - pad * 2;
    this.gfx.clear();
    this.gfx.fillStyle(COLOR.PLAYER, 1);
    this.gfx.fillRoundedRect(-s / 2, -s / 2, s, s, 8);
    this.gfx.fillStyle(0xffffff, 0.8);
    this.gfx.fillCircle(0, -s / 6, s / 8);
  }

  tryMove(dx, dy) {
    if (this.moving) return;
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;
    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return;

    const tile = this.scene.map[ny][nx];
    if (tile === TILE.WALL) return;
    if (tile === TILE.WATER) return;

    // Vérifier si un ennemi pétrifié occupe la case cible → le pousser
    if (this.scene.tryPushStatue(nx, ny, dx, dy)) return;

    // Vérifier si la porte est là et fermée → bloquer
    if (this.scene.exitDoor &&
      this.scene.exitDoor.gridX === nx &&
      this.scene.exitDoor.gridY === ny &&
      !this.scene.exitDoor.isOpen) return;

    // Vérifier si un HammerSpinner bloque le chemin
    const spinner = this.scene.spinners?.find(s =>
      (s.gridX + s.armDir.dx === nx && s.gridY + s.armDir.dy === ny) ||
      (s.gridX === nx && s.gridY === ny) // pivot
    );
    if (spinner) {
      if (spinner.gridX === nx && spinner.gridY === ny) {
        return; // Le pivot est un mur solide
      } else {
        // C'est le bras. Peut-on le pousser sur le côté ?
        const success = spinner.rotatePlayer(dx, dy);
        if (success) {
          this.dir = { dx, dy }; // Mémoriser direction pour les tirs
          this.moving = true; // Bloquer mouvements pendant l'animation
          this.scene.time.delayedCall(250, () => { this.moving = false; });
          return;
        } else {
          return; // Poussée frontale = mur
        }
      }
    }

    // Mémoriser la direction AVANT de bouger (pour le tir)
    this.dir = { dx, dy };
    this.gridX = nx;
    this.gridY = ny;
    this.moving = true;

    const target = gridToPixel(nx, ny);
    this.scene.tweens.add({
      targets: this.gfx,
      x: target.x,
      y: target.y,
      duration: 120,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.moving = false;
        this.scene.checkEnemyCollision();
        this.scene.checkItemPickup();
        this.scene.checkExitDoor();
      },
    });
  }

  get pixelPos() { return { x: this.gfx.x, y: this.gfx.y }; }

  reset(gridX, gridY) {
    this.moving = false;
    this.gridX = gridX;
    this.gridY = gridY;
    this.dir = { dx: 1, dy: 0 };
    const p = gridToPixel(gridX, gridY);
    this.gfx.setPosition(p.x, p.y);
  }

  // ── POUVOIR DE CRÉATION DE COLONNE ────────────────────────────────────────
  tryCreateColumn() {
    // Calculer la case ciblée
    const targetX = this.gridX + this.dir.dx;
    const targetY = this.gridY + this.dir.dy;

    // 1. Vérifier si c'est dans la grille
    if (targetX < 0 || targetX >= GRID_COLS || targetY < 0 || targetY >= GRID_ROWS) return;

    // 2. Vérifier si c'est bien du sol vide
    if (this.scene.map[targetY][targetX] !== TILE.FLOOR) return;

    // 3. Vérifier qu'il n'y a aucune entité dessus
    if (this.scene.enemies.some(e => e.gridX === targetX && e.gridY === targetY)) return;
    if (this.scene.mirrors.some(m => m.gridX === targetX && m.gridY === targetY)) return;
    if (this.scene.items.some(i => i.gridX === targetX && i.gridY === targetY)) return;
    if (this.scene.spawners.some(s => s.gridX === targetX && s.gridY === targetY)) return;
    if (this.scene.stoneColumns.some(c => c.gridX === targetX && c.gridY === targetY)) return;

    // 4. Invoquer la colonne
    const col = new StoneColumn(this.scene, targetX, targetY);
    this.scene.stoneColumns.push(col);

    // Modifier la grille de manière permanente pour que ça agisse comme un mur
    this.scene.map[targetY][targetX] = TILE.WALL;

    // Petit recul du joueur (feedback d'invocation)
    this.scene.cameras.main.shake(150, 0.005);
  }

  // ── POUVOIR DE DESTRUCTION DE COLONNE ─────────────────────────────────────
  tryDestroyColumn() {
    const targetX = this.gridX + this.dir.dx;
    const targetY = this.gridY + this.dir.dy;

    if (targetX < 0 || targetX >= GRID_COLS || targetY < 0 || targetY >= GRID_ROWS) return;

    // Chercher une colonne sur cette case
    const colIndex = this.scene.stoneColumns.findIndex(c => c.gridX === targetX && c.gridY === targetY);
    if (colIndex !== -1) {
      const col = this.scene.stoneColumns[colIndex];
      col.destroy(); // Joue l'animation et détruit le gfx
      this.scene.stoneColumns.splice(colIndex, 1);

      // Rendre la case traversable à nouveau
      this.scene.map[targetY][targetX] = TILE.FLOOR;

      // Feedback caméra
      this.scene.cameras.main.shake(150, 0.005);
    }
  }

  kill() {
    if (this.isDead) return;
    this.isDead = true;
    this.scene.cameras.main.flash(200, 255, 0, 0); // Flash rouge
    this.scene.playHeavyImpact(); // Bruit d'impact lourd
    this.scene.tweens.killTweensOf(this.gfx);

    // Fallback to player death method
    this.scene._playerDeath();
  }

  destroy() { this.gfx.destroy(); }
}
