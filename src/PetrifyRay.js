// ─────────────────────────────────────────────────────────────────────────────
//  [PETRIFY RAY] CLASSE PETRIFYRAY
// ─────────────────────────────────────────────────────────────────────────────

class PetrifyRay {
  /**
   * Calcule et affiche un rayon partant de (startX, startY) dans la direction (dx, dy).
   * Rebondit sur les miroirs (max MAX_RAY_BOUNCES), s'arrête sur les murs / ennemis.
   *
   * @param {Phaser.Scene} scene
   * @param {number} startX  - case source (colonne)
   * @param {number} startY  - case source (ligne)
   * @param {number} dx      - direction initiale X (-1, 0 ou 1)
   * @param {number} dy      - direction initiale Y (-1, 0 ou 1)
   */
  constructor(scene, startX, startY, dx, dy) {
    this.scene = scene;
    this.segments = [];   // liste de {x1,y1,x2,y2} en pixels

    this._trace(startX, startY, dx, dy, 0);
    this._render();

    // Auto-destruction après RAY_DISPLAY_MS
    scene.time.delayedCall(RAY_DISPLAY_MS, () => this.destroy(), [], this);
  }

  // ── Propagation récursive du rayon ──────────────────────────────────────────
  _trace(cx, cy, dx, dy, bounces) {
    const startPx = gridToPixel(cx, cy);

    let x = cx + dx;
    let y = cy + dy;

    while (true) {
      // Hors limites → stop
      if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
        const endPx = gridToPixel(x - dx, y - dy);
        this.segments.push({ x1: startPx.x, y1: startPx.y, x2: endPx.x, y2: endPx.y });
        return;
      }

      const tile = this.scene.map[y][x];

      // Mur → stop sur la case précédente
      if (tile === TILE.WALL) {
        const endPx = gridToPixel(x - dx, y - dy);
        this.segments.push({ x1: startPx.x, y1: startPx.y, x2: endPx.x, y2: endPx.y });
        return;
      }

      // Ennemi vivant → pétrifier et arrêter
      const enemy = this.scene.enemies.find(
        e => e.gridX === x && e.gridY === y && !e.petrified
      );
      if (enemy) {
        const endPx = gridToPixel(x, y);
        this.segments.push({ x1: startPx.x, y1: startPx.y, x2: endPx.x, y2: endPx.y });
        enemy.petrify();
        return;
      }

      // [MIRROR] Miroir → rebondir
      const mirror = this.scene.mirrors.find(m => m.gridX === x && m.gridY === y);
      if (mirror) {
        const endPx = gridToPixel(x, y);
        this.segments.push({ x1: startPx.x, y1: startPx.y, x2: endPx.x, y2: endPx.y });

        if (bounces < MAX_RAY_BOUNCES) {
          const r = mirror.reflect(dx, dy);
          this._trace(x, y, r.dx, r.dy, bounces + 1);
        }
        return;
      }

      x += dx;
      y += dy;
    }
  }

  // ── Rendu visuel du rayon ────────────────────────────────────────────────────
  _render() {
    // Couche glow (large, semi-transparent)
    this.gfxGlow = this.scene.add.graphics();
    this.gfxGlow.setDepth(15);
    this.gfxGlow.setAlpha(0.35);

    // Couche noyau (fine, opaque)
    this.gfxCore = this.scene.add.graphics();
    this.gfxCore.setDepth(16);

    for (const seg of this.segments) {
      // Halo large bleu
      this.gfxGlow.lineStyle(10, COLOR.RAY_GLOW, 1);
      this.gfxGlow.strokeLineShape(new Phaser.Geom.Line(seg.x1, seg.y1, seg.x2, seg.y2));

      // Noyau cyan fin
      this.gfxCore.lineStyle(3, COLOR.RAY_CORE, 1);
      this.gfxCore.strokeLineShape(new Phaser.Geom.Line(seg.x1, seg.y1, seg.x2, seg.y2));

      // Point brillant sur chaque nœud de rebond (sauf départ)
      if (seg !== this.segments[0]) {
        this.gfxCore.fillStyle(0xffffff, 1);
        this.gfxCore.fillCircle(seg.x1, seg.y1, 5);
      }
    }

    // Particules scintillantes le long des segments
    this._spawnSparkles();

    // Fondu en sortie
    this.scene.tweens.add({
      targets: [this.gfxGlow, this.gfxCore],
      alpha: 0,
      duration: RAY_DISPLAY_MS,
      ease: 'Quad.easeIn',
    });
  }

  // ── Particules scintillantes ────────────────────────────────────────────────
  _spawnSparkles() {
    for (const seg of this.segments) {
      const steps = Math.max(1, Math.round(
        (Math.abs(seg.x2 - seg.x1) + Math.abs(seg.y2 - seg.y1)) / TILE_SIZE
      ));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = seg.x1 + (seg.x2 - seg.x1) * t + Phaser.Math.Between(-6, 6);
        const py = seg.y1 + (seg.y2 - seg.y1) * t + Phaser.Math.Between(-6, 6);
        const spark = this.scene.add.graphics();
        spark.setDepth(17);
        spark.fillStyle(0xffffff, 1);
        spark.fillCircle(0, 0, Phaser.Math.Between(2, 5));
        spark.setPosition(px, py);
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: Phaser.Math.Between(200, RAY_DISPLAY_MS),
          ease: 'Quad.easeOut',
          onComplete: () => spark.destroy(),
        });
      }
    }
  }

  destroy() {
    if (this.gfxGlow) this.gfxGlow.destroy();
    if (this.gfxCore) this.gfxCore.destroy();
  }
}
