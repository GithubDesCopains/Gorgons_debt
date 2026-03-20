// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE PUSHERENEMY
// ─────────────────────────────────────────────────────────────────────────────

class PusherEnemy extends Enemy {
    constructor(scene, gridX, gridY) {
        super(scene, gridX, gridY);
        this.isPusher = true;
    }

    // PusherEnemy utilise maintenant les méthodes de dessin de la classe de base Enemy
    // avec le flag this.isPusher filtré dans _drawLiving/_drawPetrified.

    _aiTick() {
        if (this.petrified) return;
        if (this.moving) { this._scheduleAI(AI.PATROL_TICK); return; }

        const player = this.scene.player;
        if (player) {
            // 1. Tactique : Est-ce que je peux écraser le joueur avec un bloc ?
            const opportunity = this._checkCrushOpportunity();
            if (opportunity) {
                this.dir = opportunity.dir;
                this._pushStatueTactical(opportunity.statue);
                return;
            }

            // 2. Chasse standard
            const dist = Math.abs(player.gridX - this.gridX) + Math.abs(player.gridY - this.gridY);
            const sees = dist <= AI.CHASE_RANGE && this._hasLineOfSight(player.gridX, player.gridY);

            if (sees && this.aiState !== AI_STATE.CHASE) {
                this.aiState = AI_STATE.CHASE;
                this._drawLiving(true);
            } else if (!sees && this.aiState === AI_STATE.CHASE) {
                this.aiState = AI_STATE.PATROL;
                this._drawLiving(false);
            }
        }

        if (this.aiState === AI_STATE.CHASE) {
            this._doChasePusher();
        } else {
            this._doPatrolPusher();
        }
    }

    _doPatrolPusher() {
        const nx = this.gridX + this.dir.dx;
        const ny = this.gridY + this.dir.dy;

        // Si bloc devant, on le pousse au lieu de faire demi-tour
        const statue = this.scene.enemies.find(e => e.petrified && e.gridX === nx && e.gridY === ny);
        if (statue && !statue.sliding) {
            this._pushStatueTactical(statue);
            return;
        }

        if (this._canMoveTo(nx, ny)) {
            this._aiMove(nx, ny, () => this._scheduleAI(AI.PATROL_TICK));
        } else {
            this.dir = this._randomDir();
            this._scheduleAI(AI.PATROL_WAIT);
        }
    }

    _doChasePusher() {
        const player = this.scene.player;
        if (!player) { this._scheduleAI(AI.CHASE_TICK); return; }

        const ax = player.gridX - this.gridX;
        const ay = player.gridY - this.gridY;

        const tryDirs = Math.abs(ax) >= Math.abs(ay)
            ? [{ dx: Math.sign(ax), dy: 0 }, { dx: 0, dy: Math.sign(ay) }]
            : [{ dx: 0, dy: Math.sign(ay) }, { dx: Math.sign(ax), dy: 0 }];

        for (const d of tryDirs) {
            if (d.dx === 0 && d.dy === 0) continue;
            const nx = this.gridX + d.dx;
            const ny = this.gridY + d.dy;

            const statue = this.scene.enemies.find(e => e.petrified && e.gridX === nx && e.gridY === ny);
            if (statue && !statue.sliding) {
                this.dir = d;
                this._pushStatueTactical(statue);
                return;
            }

            if (this._canMoveTo(nx, ny)) {
                this.dir = d;
                this._aiMove(nx, ny, () => this._scheduleAI(AI.CHASE_TICK));
                return;
            }
        }
        this._scheduleAI(AI.CHASE_TICK);
    }

    _checkCrushOpportunity() {
        const player = this.scene.player;
        if (!player) return null;

        const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        for (const d of dirs) {
            // On regarde sur une ligne : Moi -> Bloc -> Joueur
            let tx = this.gridX + d.dx;
            let ty = this.gridY + d.dy;

            const statue = this.scene.enemies.find(e => e.petrified && e.gridX === tx && e.gridY === ty);
            if (statue && !statue.sliding) {
                // Il y a un bloc juste devant. Est-ce que le joueur est sur la trajectoire ?
                let px = tx + d.dx;
                let py = ty + d.dy;
                // On check sur quelques cases de distance
                for (let dist = 1; dist < 6; dist++) {
                    if (px < 0 || px >= GRID_COLS || py < 0 || py >= GRID_ROWS) break;
                    if (px === player.gridX && py === player.gridY) {
                        return { statue, dir: d };
                    }
                    const tile = this.scene.map[py][px];
                    if (tile === TILE.WALL || tile === TILE.WATER || tile === TILE.SACRED) break;
                    px += d.dx;
                    py += d.dy;
                }
            }
        }
        return null;
    }

    _pushStatueTactical(statue) {
        this.moving = true;
        // Animation de poussée
        this.scene.tweens.add({
            targets: this.gfx,
            x: this.gfx.x + this.dir.dx * 10,
            y: this.gfx.y + this.dir.dy * 10,
            duration: 250,
            yoyo: true,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.moving = false;
                this.scene.tryPushStatue(statue.gridX, statue.gridY, this.dir.dx, this.dir.dy);
                this._scheduleAI(700); // Délai après poussée - augmenté de 500 à 700
            }
        });
    }

}
