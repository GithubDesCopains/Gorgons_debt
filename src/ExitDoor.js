// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE EXITDOOR (Porte de Sortie)
// ─────────────────────────────────────────────────────────────────────────────

class ExitDoor {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.isOpen = false;   // bloqué jusqu'à ce que tous les items soient collectés

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this._drawClosed();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(9);
  }

  _drawClosed() {
    const s = TILE_SIZE;
    const hw = s / 2 - 4;
    const hh = s / 2 - 4;
    this.gfx.clear();
    // Cadre sombre (porte fermée)
    this.gfx.fillStyle(0x1a0a0a, 1);
    this.gfx.fillRect(-hw, -hh, hw * 2, hh * 2);
    this.gfx.lineStyle(3, 0x6b1a1a, 1);
    this.gfx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    // Cadenas
    this.gfx.fillStyle(0x8b0000, 1);
    this.gfx.fillCircle(0, -4, 8);
    this.gfx.fillStyle(0x6b0000, 1);
    this.gfx.fillRect(-5, -2, 10, 10);
    // X rouge
    this.gfx.lineStyle(3, 0xcc0000, 1);
    this.gfx.strokeLineShape(new Phaser.Geom.Line(-8, 10, 8, 22));
    this.gfx.strokeLineShape(new Phaser.Geom.Line(8, 10, -8, 22));
  }

  _drawOpen() {
    const s = TILE_SIZE;
    const hw = s / 2 - 4;
    const hh = s / 2 - 4;
    this.gfx.clear();
    // Cadre lumineux (porte ouverte)
    this.gfx.fillStyle(0x0a2e10, 1);
    this.gfx.fillRect(-hw, -hh, hw * 2, hh * 2);
    this.gfx.lineStyle(3, 0x27ae60, 1);
    this.gfx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    // Flèche ▶
    this.gfx.fillStyle(0x2ecc71, 1);
    this.gfx.fillTriangle(-10, -14, 16, 0, -10, 14);
    // Étoile dans les coins
    this.gfx.fillStyle(0xffd700, 1);
    this.gfx.fillCircle(-hw + 8, -hh + 8, 4);
    this.gfx.fillCircle(hw - 8, -hh + 8, 4);
  }

  /** Appelé quand tous les items sont collectés. */
  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    // Animation d'ouverture : flash doré + redessiner
    this.scene.cameras.main.flash(200, 39, 174, 96);
    this._drawOpen();

    // Pulse permanent pour attirer l'œil
    this.scene.tweens.add({
      targets: this.gfx,
      alpha: 0.7,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  destroy() { this.gfx.destroy(); }
}
