// ─────────────────────────────────────────────────────────────────────────────
//  CLASSE HAMMERSPINNER (Mécanique à un bras / Batte de Baseball)
// ─────────────────────────────────────────────────────────────────────────────

class HammerSpinner {
    /**
     * Un tourniquet avec un seul bras. Occupe physiquement 3x3 cases virtuellement,
     * mais seul le pivot central et la case occupée par le bras sont solides.
     *
     * @param {Phaser.Scene} scene
     * @param {number} gridX - Centre (pivot)
     * @param {number} gridY - Centre (pivot)
     * @param {string} orientation - 'U', 'D', 'L', 'R' (position initiale du bras)
     */
    constructor(scene, gridX, gridY, orientation = 'R') {
        this.scene = scene;
        this.gridX = gridX; // Centre
        this.gridY = gridY; // Centre
        this.isRotating = false;

        // Déterminer la direction initiale
        this.armDir = { dx: 0, dy: 0 };
        let initialAngle = 0;
        if (orientation === 'U') { this.armDir.dy = -1; initialAngle = -Math.PI / 2; }
        else if (orientation === 'D') { this.armDir.dy = 1; initialAngle = Math.PI / 2; }
        else if (orientation === 'L') { this.armDir.dx = -1; initialAngle = Math.PI; }
        else { this.armDir.dx = 1; initialAngle = 0; } // 'R'

        const p = gridToPixel(gridX, gridY);
        this.x = p.x;
        this.y = p.y;

        // Conteneur rotatif pour le bras
        this.gfx = scene.add.graphics();
        this.gfx.setPosition(this.x, this.y);
        this.gfx.setDepth(8); // Derrière entités
        this.gfx.rotation = initialAngle;

        // Pivot central (fixe)
        this.gfxCenter = scene.add.graphics();
        this.gfxCenter.setPosition(this.x, this.y);
        this.gfxCenter.setDepth(9);

        this._draw();
    }

    _draw() {
        this.gfx.clear();
        this.gfxCenter.clear();

        const s = TILE_SIZE;
        const colorMetal = 0x5a6370;
        const colorRust = 0x826456;
        const colorHighlight = 0xa3b1c6;

        // ── GFX Rotatif (L'unique Bras vers la droite [0°]) ──
        const w = s - 4; // épaisseur
        const l = s * 1.5; // longueur depuis le centre jusqu'à la case adjacente

        this.gfx.fillStyle(colorMetal, 1);
        this.gfx.fillRect(0, -w / 2, l, w);
        this.gfx.fillStyle(colorRust, 1);
        this.gfx.fillRect(4, -w / 4, l - 8, w / 2);

        // La "tête" du marteau
        this.gfx.fillStyle(colorHighlight, 1);
        this.gfx.fillRect(l - 6, -w, 8, w * 2);

        // ── GFX Fixe (Le pivot central) ──
        this.gfxCenter.fillStyle(0x2a2e35, 1);
        this.gfxCenter.fillCircle(0, 0, s * 0.4);
        this.gfxCenter.fillStyle(colorMetal, 1);
        this.gfxCenter.fillCircle(0, 0, s * 0.25);
        this.gfxCenter.lineStyle(2, colorHighlight, 1);
        this.gfxCenter.strokeCircle(0, 0, s * 0.25);
    }

    /**
     * Retourne 1 (CCW) ou -1 (CW) selon le produit vectoriel entre
     * le sens de poussée (pushDx, pushDy) et l'orientation actuelle du bras.
     * Retourne 0 si poussée frontale ou par derrière.
     */
    _getRotationSense(pushDx, pushDy) {
        // Calcul: pushDx * armDy - pushDy * armDx
        const cross = pushDx * this.armDir.dy - pushDy * this.armDir.dx;
        if (cross > 0) return 1;   // CCW (angle -- en Phaser)
        if (cross < 0) return -1;  // CW (angle ++ en Phaser)
        return 0; // Colinéaire (face-à-face ou queue)
    }

    /**
     * Le joueur pousse le bras sur le côté : rotation douce de 90° dans le sens de la poussée.
     */
    rotatePlayer(pushDx, pushDy, onComplete) {
        if (this.isRotating) return false;

        const sense = this._getRotationSense(pushDx, pushDy);
        if (sense === 0) return false; // Ne tourne pas si frontal

        this.isRotating = true;
        this.scene.playHeavyImpact(); // Son mécanique

        // En Phaser, -90 deg est CCW, +90 deg est CW.
        const angleDelta = -sense * (Math.PI / 2);

        // Mettre à jour la direction logique du bras de suite
        const ndx = sense === -1 ? -this.armDir.dy : this.armDir.dy;
        const ndy = sense === -1 ? this.armDir.dx : -this.armDir.dx;
        this.armDir.dx = ndx;
        this.armDir.dy = ndy;

        this.scene.tweens.add({
            targets: this.gfx,
            rotation: this.gfx.rotation + angleDelta,
            duration: 250,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.isRotating = false;
                if (onComplete) onComplete();
            }
        });
        return true;
    }

    /**
     * Un bloc percute le bras: Rotation rapide (270°) comme une batte de baseball,
     * puis on expulse le bloc.
     * Le bloc reste visuellement immobile (stoppé devant le bras) pendant la rotation.
     */
    catchAndRotateBlock(statue, blockDx, blockDy, onComplete) {
        if (this.isRotating) return false;

        const sense = this._getRotationSense(blockDx, blockDy);
        if (sense === 0) return false; // Frontal = Mur solide

        this.isRotating = true;
        this.scene.playHeavyImpact(); // Impact de début (cloc)

        // Rotation amplitude 270 degrés.
        const angleDelta = -sense * (Math.PI * 1.5);

        // Résultat logique pour le bras = comme -90° (inverse du mouvement).
        const finalSense = -sense;
        const oldDx = this.armDir.dx;
        const oldDy = this.armDir.dy;

        const ndx = finalSense === -1 ? -this.armDir.dy : this.armDir.dy;
        const ndy = finalSense === -1 ? this.armDir.dx : -this.armDir.dx;
        this.armDir.dx = ndx;
        this.armDir.dy = ndy;

        this.scene.tweens.add({
            targets: this.gfx,
            rotation: this.gfx.rotation + angleDelta,
            duration: 350,
            ease: 'Cubic.easeInOut', // Accélère puis décélère brutalement (effet batte)
            onComplete: () => {
                this.isRotating = false;
                this.scene.playHeavyImpact(); // Impact fin (frappe la balle !)
                this.scene.cameras.main.shake(100, 0.005); // Shake

                if (onComplete) {
                    // L'inertie renvoie le bloc toujours dans l'ancienne direction du bras
                    onComplete(oldDx, oldDy);
                }
            }
        });

        return true;
    }

    destroy() {
        this.gfx.destroy();
        this.gfxCenter.destroy();
    }
}
