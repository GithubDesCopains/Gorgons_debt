// ─────────────────────────────────────────────────────────────────────────────
//  [MIRROR] CLASSE MIRROR
// ─────────────────────────────────────────────────────────────────────────────

class Mirror {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} gridX
   * @param {number} gridY
   * @param {'/' | '\\'} type  - '/' = montant (45°), '\\' = descendant (135°)
   */
  constructor(scene, gridX, gridY, type) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;  // '/' ou '\\'

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this._draw();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(8);
  }

  _draw() {
    const h = TILE_SIZE / 2 - 6;
    this.gfx.clear();
    // Halo doré
    this.gfx.fillStyle(COLOR.MIRROR, 0.15);
    this.gfx.fillCircle(0, 0, h + 4);
    // Ligne du miroir
    this.gfx.lineStyle(4, COLOR.MIRROR, 1);
    if (this.type === '/') {
      this.gfx.strokeLineShape(new Phaser.Geom.Line(-h, h, h, -h));
    } else {
      this.gfx.strokeLineShape(new Phaser.Geom.Line(-h, -h, h, h));
    }
    // Reflet brillant
    this.gfx.lineStyle(2, 0xfffacd, 0.7);
    if (this.type === '/') {
      this.gfx.strokeLineShape(new Phaser.Geom.Line(-h + 4, h - 4, h - 4, -h + 4));
    } else {
      this.gfx.strokeLineShape(new Phaser.Geom.Line(-h + 4, -h + 4, h - 4, h - 4));
    }
  }

  /**
   * [PETRIFY RAY] Calcule la nouvelle direction du rayon après réflexion.
   * Lois de réflexion sur grille :
   *   '/' : (dx,dy) → (-dy, -dx)
   *   '\': (dx,dy) → ( dy,  dx)
   */
  reflect(dx, dy) {
    if (this.type === '/') return { dx: -dy, dy: -dx };
    else return { dx: dy, dy: dx };
  }

  destroy() { this.gfx.destroy(); }
}
