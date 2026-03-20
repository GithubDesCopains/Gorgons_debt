// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE SPAWNER
// ─────────────────────────────────────────────────────────────────────────────

class Spawner {
  /**
   * Point d'invocation invisible placé via le JSON.
   * Surveille son ennemi associé et en recrée un nouveau 3 s après sa mort.
   */
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.currentEnemy = null;
    this._checkTimer = null;

    const p = gridToPixel(gridX, gridY);
    // ── Image de la ruine (Spawner) ─────────────────────────────────────────
    this.gfx = scene.add.sprite(p.x, p.y, 'spawner_ruins');
    this.gfx.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.gfx.setDepth(9); // Devant le sol (0), derrière les entités (10)

    // Le spawner agit physiquement comme un MUR
    if (this.scene.map[gridY] && this.scene.map[gridY][gridX] !== undefined) {
      this.scene.map[gridY][gridX] = TILE.WALL;
    }

    // Premier check : pas de délai initial
    this._scheduleCheck(500);
  }

  // ── Logique de vérification ─────────────────────────────────────────────────

  _scheduleCheck(delay = 1000) {
    this._checkTimer = this.scene.time.delayedCall(delay, () => this._check());
  }

  _check() {
    if (this._enemyIsGone()) {
      // Ennemi perdu → attendre 3 s puis invoquer
      this._scheduleSpawn(3000);
    } else {
      // Ennemi vivant → re-vérifier dans 1 s
      this._scheduleCheck(1000);
    }
  }

  _enemyIsGone() {
    if (this.currentEnemy === null) return true;
    if (this.currentEnemy.sunkInWater === true) return true;
    return false;
  }

  _scheduleSpawn(delay) {
    this._checkTimer = this.scene.time.delayedCall(delay, () => this._summonEffect());
  }

  // ── Animation d'invocation ──────────────────────────────────────────────────

  _summonEffect() {
    const targetY = this.gridY + 1;
    // Vérifier si la case DEVANT le spawner est libre pour invoquer
    if (targetY >= GRID_ROWS || this.scene.map[targetY]?.[this.gridX] === TILE.WALL || this.scene.map[targetY]?.[this.gridX] === TILE.WATER || this.scene.map[targetY]?.[this.gridX] === TILE.SACRED) {
      // Case bloquée → réessayer plus tard
      this._scheduleCheck(2000);
      return;
    }

    const p = gridToPixel(this.gridX, this.gridY);

    // Animation de portail magique sombre devant l'entrée
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0x220022, 0.8);
        ring.strokeCircle(0, 0, 12);
        ring.setPosition(p.x, p.y + 12); // Positionné vers l'entrée (en bas de la case)
        ring.setDepth(11); // Passe devant le spawner (9) et l'ennemi (10)
        this.scene.tweens.add({
          targets: ring,
          scaleX: 2.5,
          scaleY: 2.5,
          alpha: 0,
          duration: 600,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
      });
    }

    // Créer l'ennemi pendant l'animation du portail
    this.scene.time.delayedCall(300, () => this._spawnEnemy(targetY));
  }

  _spawnEnemy(targetY) {
    // Revérifier au cas où la case aurait été occupée entre-temps
    if (this.scene.map[targetY]?.[this.gridX] === TILE.WALL || this.scene.map[targetY]?.[this.gridX] === TILE.WATER || this.scene.map[targetY]?.[this.gridX] === TILE.SACRED) {
      this._scheduleCheck(1000);
      return;
    }

    const enemy = new Enemy(this.scene, this.gridX, targetY);
    this.scene.enemies.push(enemy);
    this.currentEnemy = enemy;

    // Apparition dramatique : sort de la ruine (glisse vers le bas)
    const startP = gridToPixel(this.gridX, this.gridY);
    const endP = gridToPixel(this.gridX, targetY);

    enemy.gfx.setPosition(startP.x, startP.y);
    enemy.gfx.setScale(0.5);
    enemy.gfx.setAlpha(0);

    this.scene.tweens.add({
      targets: enemy.gfx,
      x: endP.x,
      y: endP.y,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 500,
      ease: 'Quad.easeOut',
    });

    // Reprendre la surveillance
    this._scheduleCheck(1000);
  }

  destroy() {
    if (this._checkTimer) { this._checkTimer.remove(); this._checkTimer = null; }
    this.gfx.destroy();
  }
}
