// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE SPRING (Ressort)
// ─────────────────────────────────────────────────────────────────────────────

class Spring {
  constructor(scene, gridX, gridY, orientation) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.orientation = orientation; // 'U', 'D', 'L', 'R'

    this.dir = { dx: 0, dy: 0 };
    if (orientation === 'U') this.dir.dy = -1;
    if (orientation === 'D') this.dir.dy = 1;
    if (orientation === 'L') this.dir.dx = -1;
    if (orientation === 'R') this.dir.dx = 1;

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(2); // Sous les entités
    this._draw();
  }

  _draw() {
    this.gfx.clear();
    const s = Math.floor(TILE_SIZE * 0.7);
    this.gfx.fillStyle(0x2e1e0a, 1);
    this.gfx.fillRoundedRect(-s / 2, -s / 2, s, s, 8);
    this.gfx.lineStyle(2, 0xe67e22, 1);
    this.gfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 8);

    // Dessin du ressort selon orientation
    this.gfx.lineStyle(3, 0xffa500, 1);
    this.gfx.beginPath();

    let angle = 0;
    if (this.orientation === 'D') angle = Math.PI / 2;
    if (this.orientation === 'L') angle = Math.PI;
    if (this.orientation === 'U') angle = -Math.PI / 2;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rx = (x, y) => x * cos - y * sin;
    const ry = (x, y) => x * sin + y * cos;

    // Scale pour que la flèche s'adapte à la taille visuelle (s)
    // Coordonnées de base internes : x = [-10, 10], y = [-5, 5]
    // On multiplie par (s / 24) pour bien l'inscrire dans le rectangle s
    const sc = s / 24;

    // Draw spring pointing RIGHT (dx=1, dy=0)
    this.gfx.moveTo(rx(-10 * sc, 0), ry(-10 * sc, 0));
    this.gfx.lineTo(rx(-5 * sc, -5 * sc), ry(-5 * sc, -5 * sc));
    this.gfx.lineTo(rx(0, 5 * sc), ry(0, 5 * sc));
    this.gfx.lineTo(rx(5 * sc, -5 * sc), ry(5 * sc, -5 * sc));
    this.gfx.lineTo(rx(10 * sc, 0), ry(10 * sc, 0));
    // Arrow head
    this.gfx.moveTo(rx(10 * sc, 0), ry(10 * sc, 0));
    this.gfx.lineTo(rx(5 * sc, -4 * sc), ry(5 * sc, -4 * sc));
    this.gfx.moveTo(rx(10 * sc, 0), ry(10 * sc, 0));
    this.gfx.lineTo(rx(5 * sc, 4 * sc), ry(5 * sc, 4 * sc));

    this.gfx.strokePath();
  }

  bounce() {
    // Jouer son "Boing" synthé
    this.scene.playBoing();
    // Animation compression/extension
    this.scene.tweens.add({
      targets: this.gfx,
      scaleX: 0.6,
      scaleY: 1.4,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.gfx,
          scaleX: 1.2,
          scaleY: 0.8,
          duration: 100,
          yoyo: true,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            this.scene.tweens.add({
              targets: this.gfx,
              scaleX: 1,
              scaleY: 1,
              duration: 50,
              ease: 'Linear'
            });
          }
        });
      }
    });
  }

  destroy() {
    this.gfx.destroy();
  }
}
