// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE ITEM (Éclat de Miroir)
// ─────────────────────────────────────────────────────────────────────────────

class Item {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.collected = false;

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this._draw();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(8);

    // Flottement vertical
    scene.tweens.add({
      targets: this.gfx,
      y: p.y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Scintillement alpha
    scene.tweens.add({
      targets: this.gfx,
      alpha: 0.7,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });
  }

  _draw() {
    const r = TILE_SIZE * 0.22;   // rayon du cristal
    this.gfx.clear();
    // Halo extérieur doux
    this.gfx.fillStyle(0x00eeff, 0.2);
    this.gfx.fillCircle(0, 0, r + 8);
    // Corps du cristal (losange cyan)
    this.gfx.fillStyle(0x00d4ff, 1);
    this.gfx.fillTriangle(0, -r, r * 0.6, r * 0.4, -r * 0.6, r * 0.4);
    this.gfx.fillTriangle(0, r, r * 0.6, -r * 0.3, -r * 0.6, -r * 0.3);
    // Reflet blanc
    this.gfx.fillStyle(0xffffff, 0.9);
    this.gfx.fillTriangle(0, -r * 0.9, r * 0.2, -r * 0.2, -r * 0.1, -r * 0.3);
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    // Éclat de lumière puis disparition
    this.scene.tweens.killTweensOf(this.gfx);
    this.scene.tweens.add({
      targets: this.gfx,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => this.gfx.destroy(),
    });
    // Particules de collecte
    const { x, y } = gridToPixel(this.gridX, this.gridY);
    for (let i = 0; i < 8; i++) {
      const s = this.scene.add.graphics();
      s.fillStyle(0x00d4ff, 1);
      s.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      s.setPosition(x, y);
      s.setDepth(20);
      const angle = (i / 8) * Math.PI * 2;
      this.scene.tweens.add({
        targets: s,
        x: x + Math.cos(angle) * 32,
        y: y + Math.sin(angle) * 32,
        alpha: 0,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => s.destroy(),
      });
    }
  }

  destroy() { this.gfx.destroy(); }
}
