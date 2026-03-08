// ─────────────────────────────────────────────────────────────────────────────
//  SYSTÈME D'IA – états d'un ennemi
// ─────────────────────────────────────────────────────────────────────────────

const AI_STATE = { PATROL: 'PATROL', CHASE: 'CHASE', PETRIFIED: 'PETRIFIED' };

// Paramètres de tuning (ms)
const AI = {
  MOVE_DURATION: 320,   // durée d'un pas (tween)
  PATROL_TICK: 380,   // délai entre deux pas en patrouille
  PATROL_WAIT: 1000,  // pause quand l'ennemi frappe un mur
  CHASE_TICK: 280,   // délai entre deux pas en chasse
  CHASE_RANGE: 5,     // portée de détection (distance Manhattan)
};

class Enemy {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.petrified = false;  // [PETRIFY RAY] false = vivant, true = statue
    this.sliding = false;  // verrou de glissade (poussée continue)
    this.moving = false;  // tween IA en cours

    // ── IA ──────────────────────────────────────────────────────────────────
    this.aiState = AI_STATE.PATROL;
    this.dir = this._randomDir();
    this._aiTimer = null;

    // ── Visuel ──────────────────────────────────────────────────────────────
    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this._drawLiving(false);
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(10);

    // Démarrage décalé → évite que tous les ennemis bougent en synchronie
    this._scheduleAI(400 + Math.random() * 400);
  }

  // ── DESSIN ──────────────────────────────────────────────────────────────────

  _drawLiving(chase) {
    const pad = 8;
    const s = TILE_SIZE - pad * 2;
    this.gfx.clear();
    this.gfx.fillStyle(chase ? 0xff2200 : COLOR.ENEMY, 1);
    this.gfx.fillTriangle(0, -s / 2, s / 2, s / 2, -s / 2, s / 2);
    this.gfx.fillTriangle(0, s / 2, s / 2, -s / 2, -s / 2, -s / 2);
    if (chase) {
      // Contour doré en mode alerte
      this.gfx.lineStyle(3, 0xffd700, 1);
      this.gfx.strokeTriangle(0, -s / 2, s / 2, s / 2, -s / 2, s / 2);
      this.gfx.strokeTriangle(0, s / 2, s / 2, -s / 2, -s / 2, -s / 2);
    }
    this.gfx.fillStyle(0xffffff, 0.9);
    this.gfx.fillCircle(-6, -4, 5);
    this.gfx.fillCircle(6, -4, 5);
  }

  _drawPetrified() {
    const pad = 4;
    const s = TILE_SIZE - pad * 2;
    this.gfx.clear();
    this.gfx.fillStyle(0x6b6b6b, 1);
    this.gfx.fillRect(-s / 2, -s / 2, s, s);
    this.gfx.fillStyle(0x9c9c9c, 1);
    this.gfx.fillRect(-s / 2, -s / 2, s, 4);
    this.gfx.fillRect(-s / 2, -s / 2, 4, s);
    this.gfx.fillStyle(0x4a4a4a, 1);
    this.gfx.fillRect(s / 2 - 4, -s / 2, 4, s);
    this.gfx.fillRect(-s / 2, s / 2 - 4, s, 4);
    this.gfx.fillStyle(0x333333, 0.6);
    this.gfx.fillRect(-6, -12, 2, 18);
    this.gfx.fillRect(4, -4, 2, 12);
    this.gfx.fillRect(-10, 6, 8, 2);
  }

  // ── IA ──────────────────────────────────────────────────────────────────────

  _randomDir() {
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  _scheduleAI(delay) {
    if (this.petrified) return;
    this._aiTimer = this.scene.time.delayedCall(delay, () => this._aiTick());
  }

  _aiTick() {
    if (this.petrified) return;
    if (this.moving) { this._scheduleAI(AI.PATROL_TICK); return; }

    // ── Détection du joueur ─────────────────────────────────────────────────
    const player = this.scene.player;
    if (player) {
      const dist = Math.abs(player.gridX - this.gridX) +
        Math.abs(player.gridY - this.gridY);
      const sees = dist <= AI.CHASE_RANGE &&
        this._hasLineOfSight(player.gridX, player.gridY);

      if (sees && this.aiState !== AI_STATE.CHASE) {
        this.aiState = AI_STATE.CHASE;
        this._drawLiving(true);   // rouge vif + contour doré
      } else if (!sees && this.aiState === AI_STATE.CHASE) {
        this.aiState = AI_STATE.PATROL;
        this._drawLiving(false);  // retour couleur normale
      }
    }

    if (this.aiState === AI_STATE.CHASE) {
      this._doChase();
    } else {
      this._doPatrol();
    }
  }

  // ── PATROUILLE ─────────────────────────────────────────────────────────────

  _doPatrol() {
    const nx = this.gridX + this.dir.dx;
    const ny = this.gridY + this.dir.dy;
    if (this._canMoveTo(nx, ny)) {
      this._aiMove(nx, ny, () => this._scheduleAI(AI.PATROL_TICK));
    } else {
      // Mur ou bord : pause 1 s puis nouvelle direction
      this.dir = this._randomDir();
      this._scheduleAI(AI.PATROL_WAIT);
    }
  }

  // ── CHASSE ─────────────────────────────────────────────────────────────────

  _doChase() {
    const player = this.scene.player;
    if (!player) { this._scheduleAI(AI.CHASE_TICK); return; }

    const ax = player.gridX - this.gridX;
    const ay = player.gridY - this.gridY;

    // Axe dominant en premier, axe secondaire en fallback
    const tryDirs = Math.abs(ax) >= Math.abs(ay)
      ? [{ dx: Math.sign(ax), dy: 0 }, { dx: 0, dy: Math.sign(ay) }]
      : [{ dx: 0, dy: Math.sign(ay) }, { dx: Math.sign(ax), dy: 0 }];

    let moved = false;
    for (const d of tryDirs) {
      if (d.dx === 0 && d.dy === 0) continue;
      const nx = this.gridX + d.dx;
      const ny = this.gridY + d.dy;
      if (this._canMoveTo(nx, ny)) {
        this._aiMove(nx, ny, () => this._scheduleAI(AI.CHASE_TICK));
        moved = true;
        break;
      }
    }
    if (!moved) this._scheduleAI(AI.CHASE_TICK);
  }

  _hasLineOfSight(tx, ty) {
    let x0 = this.gridX, y0 = this.gridY;
    const x1 = tx, y1 = ty;
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      if (!(x0 === this.gridX && y0 === this.gridY)) {
        if (this.scene.map[y0]?.[x0] === TILE.WALL) return false;
        if (this.scene.spinners?.some(s => (s.gridX === x0 && s.gridY === y0) || (s.gridX + s.armDir.dx === x0 && s.gridY + s.armDir.dy === y0))) return false;
      }
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    return true;
  }

  // ── MOUVEMENT TWEEN ────────────────────────────────────────────────────────

  _aiMove(nx, ny, onComplete) {
    this.gridX = nx;
    this.gridY = ny;
    this.moving = true;
    const { x, y } = gridToPixel(nx, ny);
    this.scene.tweens.add({
      targets: this.gfx,
      x, y,
      duration: AI.MOVE_DURATION,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.moving = false;
        onComplete?.();
        // Tuer le joueur si la case est la même
        this.scene.checkEnemyCollision();
      }
    });
  }

  kill() {
    this.scene.playHeavyImpact(); // Bruit d'impact lourd

    // Stop tout mouvement
    if (this._aiTimer) { this._aiTimer.remove(false); this._aiTimer = null; }
    if (this._petrifyTimer) { this._petrifyTimer.remove(false); this._petrifyTimer = null; }
    this.scene.tweens.killTweensOf(this.gfx);

    // Détruire et retirer de la liste
    this.gfx.destroy();
    this.scene.enemies = this.scene.enemies.filter(e => e !== this);
  }

  _canMoveTo(nx, ny) {
    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return false;
    const t = this.scene.map[ny][nx];
    if (t === TILE.WALL || t === TILE.WATER) return false;
    if (this.scene.enemies.some(e => e !== this && e.gridX === nx && e.gridY === ny)) return false;
    if (this.scene.spinners?.some(s => (s.gridX === nx && s.gridY === ny) || (s.gridX + s.armDir.dx === nx && s.gridY + s.armDir.dy === ny))) return false;
    return true;
  }

  petrify() {
    if (this.petrified) return;
    this.petrified = true;
    this.aiState = AI_STATE.PETRIFIED;
    this.sunkInWater = false;

    // ── 1. Stopper immédiatement l'IA et tous les tweens ───────────────────
    if (this._aiTimer) { this._aiTimer.remove(false); this._aiTimer = null; }
    this.scene.tweens.killTweensOf(this.gfx);
    this.moving = false;

    // ── 2. Snap vers la case la plus proche ────────────────────────────────
    const snapX = Math.round(this.gfx.x / TILE_SIZE - 0.5);
    const snapY = Math.round(this.gfx.y / TILE_SIZE - 0.5);
    this.gridX = Phaser.Math.Clamp(snapX, 0, GRID_COLS - 1);
    this.gridY = Phaser.Math.Clamp(snapY, 0, GRID_ROWS - 1);
    const { x: px, y: py } = gridToPixel(this.gridX, this.gridY);

    // ── 3. Tween d'aimantation (100 ms) → transformation pierre ───────────
    this.scene.tweens.add({
      targets: this.gfx,
      x: px, y: py,
      duration: 100,
      ease: 'Linear',
      onComplete: () => {
        this._drawPetrified();
        // Flash de pétrification
        this.scene.tweens.add({
          targets: this.gfx, alpha: 0.3,
          duration: 80, yoyo: true, repeat: 2,
          onComplete: () => {
            // ── 4. Lancer le chrono : alerte dans 10 s ─────────────────
            this._petrifyTimer = this.scene.time.delayedCall(
              10000, () => this._startAlert()
            );
          },
        });
      },
    });
  }
  // ── Phase d'alerte (secondes 10→20) ────────────────────────────────────────
  _startAlert() {
    if (!this.petrified || this.sunkInWater) return;

    // Tremblement horizontal
    this._shakeTween = this.scene.tweens.add({
      targets: this.gfx,
      x: this.gfx.x + 3,
      duration: 55,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Clignotement : alterne pierre ↔ vivant toutes les 350 ms
    let stoneFrame = true;
    this._blinkEvent = this.scene.time.addEvent({
      delay: 350,
      repeat: -1,
      callback: () => {
        stoneFrame = !stoneFrame;
        if (stoneFrame) this._drawPetrified();
        else this._drawLiving(false);
      },
    });

    // Libération dans 10 s supplémentaires
    this._reviveTimer = this.scene.time.delayedCall(
      10000, () => this._revive()
    );
  }

  // ── Libération (t = 20 s) ──────────────────────────────────────────────────
  _revive() {
    if (this.sunkInWater) return;  // pont en eau → jamais de résurrection
    if (!this.petrified) return;

    this._stopAlertEffects();

    this.petrified = false;
    this.aiState = AI_STATE.PATROL;
    this.moving = false;

    // Remettre le gfx sur le centre exact de sa case
    const { x, y } = gridToPixel(this.gridX, this.gridY);
    this.gfx.setPosition(x, y);

    this._drawLiving(false);

    // Flash rouge "attention !" pour avertir le joueur
    this.scene.tweens.add({
      targets: this.gfx,
      alpha: 0.15,
      duration: 80,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        // Relancer l'IA après l'animation d'alerte
        this._scheduleAI(300);
        // Vérifier immédiatement si l'ennemi et le joueur sont sur la même case
        this.scene.checkEnemyCollision();
      },
    });
  }

  // ── Arrêter tous les effets de l'alerte ────────────────────────────────────
  _stopAlertEffects() {
    if (this._shakeTween) { this._shakeTween.stop(); this._shakeTween = null; }
    if (this._blinkEvent) { this._blinkEvent.remove(); this._blinkEvent = null; }
    if (this._petrifyTimer) { this._petrifyTimer.remove(); this._petrifyTimer = null; }
    if (this._reviveTimer) { this._reviveTimer.remove(); this._reviveTimer = null; }
  }

  // ── [WATER] Couler ──────────────────────────────────────────────────────────

  sink() {
    // Marquer comme pont en eau → jamais de résurrection
    this.sunkInWater = true;
    this._stopAlertEffects();

    this.scene.tweens.add({
      targets: this.gfx,
      alpha: 0, scaleX: 0.3, scaleY: 0.3,
      duration: 350, ease: 'Quad.easeIn',
      onComplete: () => this.gfx.destroy(),
    });
    this.scene._splashParticles(this.gridX, this.gridY);
  }

  destroy() { this.gfx.destroy(); }
}
