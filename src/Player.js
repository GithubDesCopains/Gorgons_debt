// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE PLAYER
// ─────────────────────────────────────────────────────────────────────────────

class Player {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.moving = false;
    this.dir = { dx: 0, dy: 1 };   // direction actuelle (vers le bas par défaut)

    const p = gridToPixel(gridX, gridY);

    // Placement à la base de la tuile
    this.sprite = scene.add.sprite(p.x, p.y + TILE_SIZE / 2, 'basic_hero');
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(10);

    this._updateAnimation();
  }

  /**
   * Simple mise à jour visuelle (orientation/échelle).
   */
  _updateAnimation() {
    let animKey = 'player-idle-down';
    if (this.dir.dy === -1) animKey = 'player-idle-up';
    else if (this.dir.dx === 1) animKey = 'player-idle-right';
    else if (this.dir.dx === -1) animKey = 'player-idle-left';

    if (this.moving) {
      if (this.dir.dy === -1) animKey = 'player-walk-up';
      else if (this.dir.dy === 1) animKey = 'player-walk-down';
      else if (this.dir.dx === 1) animKey = 'player-walk-right';
      else if (this.dir.dx === -1) animKey = 'player-walk-left';
    }

    this.sprite.play(animKey, true);

    // Ajustement de l'échelle pour que le héros tienne dans une tuile
    const targetHeight = TILE_SIZE * 1.2;
    const scale = targetHeight / this.sprite.height;
    this.sprite.setScale(scale);

    // Profondeur dynamique pour le tri Z (basé sur la case Y)
    this.sprite.setDepth(this.gridY * 10 + 5);
  }

  tryMove(dx, dy) {
    if (this.moving) return;

    // Mémoriser la direction AVANT tout blocage pour orienter le sprite
    this.dir = { dx, dy };
    this._updateAnimation();

    const nx = this.gridX + dx;
    const ny = this.gridY + dy;
    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return;

    const tile = this.scene.map[ny][nx];
    if (tile === TILE.WALL) return;
    if (tile === TILE.WATER) return;
    if (tile === TILE.BLOCK_ONLY) return;

    if (this.scene.tryPushStatue(nx, ny, dx, dy)) return;

    if (this.scene.exitDoor &&
      this.scene.exitDoor.gridX === nx &&
      this.scene.exitDoor.gridY === ny &&
      !this.scene.exitDoor.isOpen) return;

    const spinner = this.scene.spinners?.find(s =>
      (s.gridX + s.armDir.dx === nx && s.gridY + s.armDir.dy === ny) ||
      (s.gridX === nx && s.gridY === ny)
    );
    if (spinner) {
      if (spinner.gridX === nx && spinner.gridY === ny) {
        return;
      } else {
        const success = spinner.rotatePlayer(dx, dy);
        if (success) {
          this.moving = true;
          this._updateAnimation();
          this.scene.time.delayedCall(250, () => { this.moving = false; this._updateAnimation(); });
          return;
        } else {
          return;
        }
      }
    }

    this.gridX = nx;
    this.gridY = ny;
    this.moving = true;
    this._updateAnimation();

    const target = gridToPixel(nx, ny);
    this.scene.tweens.add({
      targets: this.sprite,
      x: target.x,
      y: target.y + TILE_SIZE / 2,
      duration: 120,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.moving = false;
        this._updateAnimation(); // Retour à l'idle
        this.scene.checkEnemyCollision();
        this.scene.checkItemPickup();
        this.scene.checkExitDoor();
      },
    });
  }

  get pixelPos() { return { x: this.sprite.x, y: this.sprite.y - TILE_SIZE / 2 }; }

  reset(gridX, gridY) {
    this.moving = false;
    this.gridX = gridX;
    this.gridY = gridY;
    this.dir = { dx: 0, dy: 1 };
    const p = gridToPixel(gridX, gridY);
    this.sprite.setPosition(p.x, p.y + TILE_SIZE / 2);
    this._updateAnimation();
  }

  tryCreateColumn() {
    const targetX = this.gridX + this.dir.dx;
    const targetY = this.gridY + this.dir.dy;
    if (targetX < 0 || targetX >= GRID_COLS || targetY < 0 || targetY >= GRID_ROWS) return;
    if (this.scene.map[targetY][targetX] !== TILE.FLOOR) return;
    if (this.scene.enemies.some(e => e.gridX === targetX && e.gridY === targetY)) return;
    if (this.scene.mirrors.some(m => m.gridX === targetX && m.gridY === targetY)) return;
    if (this.scene.items.some(i => i.gridX === targetX && i.gridY === targetY)) return;
    if (this.scene.spawners.some(s => s.gridX === targetX && s.gridY === targetY)) return;
    if (this.scene.stoneColumns.some(c => c.gridX === targetX && c.gridY === targetY)) return;

    const col = new StoneColumn(this.scene, targetX, targetY);
    this.scene.stoneColumns.push(col);
    this.scene.map[targetY][targetX] = TILE.WALL;
    this.scene._drawTile(targetX, targetY);
    this.scene.cameras.main.shake(150, 0.005);
  }

  tryDestroyColumn() {
    const targetX = this.gridX + this.dir.dx;
    const targetY = this.gridY + this.dir.dy;
    if (targetX < 0 || targetX >= GRID_COLS || targetY < 0 || targetY >= GRID_ROWS) return;
    const colIndex = this.scene.stoneColumns.findIndex(c => c.gridX === targetX && c.gridY === targetY);
    if (colIndex !== -1) {
      const col = this.scene.stoneColumns[colIndex];
      col.destroy();
      this.scene.stoneColumns.splice(colIndex, 1);
      this.scene.map[targetY][targetX] = TILE.FLOOR;
      this.scene._drawTile(targetX, targetY);
      this.scene.cameras.main.shake(150, 0.005);
    }
  }

  kill() {
    if (this.isDead) return;
    this.isDead = true;
    this.scene.cameras.main.flash(200, 255, 0, 0);
    this.scene.playHeavyImpact();
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene._playerDeath();
  }

  destroy() { this.sprite.destroy(); }
}
