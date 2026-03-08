// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE STONECOLUMN (Créée par le joueur)
// ─────────────────────────────────────────────────────────────────────────────

class StoneColumn {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(9); // Même depth que les murs

    this._draw();

    // Apparition (jaillit du sol)
    this.gfx.y += TILE_SIZE;
    scene.tweens.add({
      targets: this.gfx,
      y: p.y,
      duration: 350,
      ease: 'Back.easeOut'
    });

    // Particules de poussière
    for (let i = 0; i < 6; i++) {
      const dust = scene.add.graphics();
      dust.fillStyle(0x8a7e6f, 0.8);
      dust.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      dust.setPosition(p.x + Phaser.Math.Between(-10, 10), p.y + Phaser.Math.Between(10, 20));
      dust.setDepth(10);
      scene.tweens.add({
        targets: dust,
        y: p.y - Phaser.Math.Between(10, 30),
        x: dust.x + Phaser.Math.Between(-15, 15),
        alpha: 0,
        duration: 500 + Math.random() * 300,
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy()
      });
    }
  }

  _draw() {
    const s = TILE_SIZE;
    const pad = 2; // Remplit la case presque entièrement
    const w = s - pad * 2;
    this.gfx.clear();

    // Base de la colonne
    this.gfx.fillStyle(0x3a3632, 1);
    this.gfx.fillRect(-w / 2, -w / 2, w, w);

    // Reliefs (style colonne antique)
    this.gfx.fillStyle(0x524b45, 1);
    this.gfx.fillRect(-w / 2 + 4, -w / 2 + 2, w - 8, w - 4);

    this.gfx.fillStyle(0x736961, 1);
    this.gfx.fillRect(-w / 2 + 8, -w / 2 + 4, w - 16, w - 8);

    // Ombrage sur un côté pour le volume
    this.gfx.fillStyle(0x1a1816, 0.5);
    this.gfx.fillRect(w / 2 - 6, -w / 2, 6, w);
  }

  destroy() {
    const p = gridToPixel(this.gridX, this.gridY);

    // Particules de destruction (gravats)
    for (let i = 0; i < 8; i++) {
      const rubble = this.scene.add.graphics();
      const colors = [0x3a3632, 0x524b45, 0x736961];
      rubble.fillStyle(colors[Phaser.Math.Between(0, 2)], 1);
      const size = Phaser.Math.Between(4, 8);
      rubble.fillRect(-size / 2, -size / 2, size, size);
      rubble.setPosition(p.x + Phaser.Math.Between(-10, 10), p.y + Phaser.Math.Between(-10, 10));
      rubble.setDepth(10);

      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(15, 40);

      this.scene.tweens.add({
        targets: rubble,
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist + 20, // Effet de gravité
        alpha: 0,
        rotation: Phaser.Math.Between(-5, 5),
        duration: Phaser.Math.Between(400, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => rubble.destroy()
      });
    }

    this.gfx.destroy();
  }
}
