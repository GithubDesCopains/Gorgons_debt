/**
 * HecatonchireBoss.js
 * Boss with two phases: Rotating (Invincible) and Dizzy (Vulnerable).
 * Takes 3 hits from petrified minions to defeat.
 */
class HecatonchireBoss extends Phaser.GameObjects.Sprite {
    constructor(scene, gridX, gridY) {
        const { x, y } = gridToPixel(gridX, gridY);
        super(scene, x, y, 'pusher_enemy');
        scene.add.existing(this);
        
        this.gridX = gridX;
        this.gridY = gridY;
        this.setScale(2); // Boss is twice the size
        this.setDepth(15);
        
        this.hp = 3;
        this.maxHp = 3;
        this.state = 'ROTATING'; // 'ROTATING' or 'DIZZY'
        
        this.rotationTween = null;
        this.attackTimer = null;
        this.phaseTimer = null;
        this.isDead = false;

        this._startRotation();
    }

    _startRotation() {
        if (this.isDead) return;
        this.state = 'ROTATING';
        this.setTint(0xffffff);
        
        // Visual feedback: Rotating fast
        this.rotationTween = this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 500, // Ralenti de 400 à 500
            repeat: -1
        });

        // Attack: Throw 3 rocks every 2 seconds
        this.attackTimer = this.scene.time.addEvent({
            delay: 2500, // Ralenti de 2000 à 2500
            callback: this._throwRocks,
            callbackScope: this,
            loop: true
        });

        // Phase duration: 10 seconds
        this.phaseTimer = this.scene.time.delayedCall(10000, () => this._startFatigue(), [], this);
        
        // Update HUD
        this.scene.events.emit('updateHUD', { bossVisible: true, bossHP: this.hp / this.maxHp });
    }

    _startFatigue() {
        if (this.isDead) return;
        this.state = 'DIZZY';
        
        // Stop rotation and attacks
        if (this.rotationTween) {
            this.rotationTween.stop();
            this.rotationTween = null;
        }
        if (this.attackTimer) {
            this.attackTimer.remove();
            this.attackTimer = null;
        }
        
        this.setAngle(0);
        this.setTint(0x8888ff); // Dazed look
        
        // Dazed animation: wobble
        this.scene.tweens.add({
            targets: this,
            x: this.x + 8,
            duration: 50,
            yoyo: true,
            repeat: -1
        });

        // Stay dizzy for a while or until hit
        this.phaseTimer = this.scene.time.delayedCall(5000, () => {
            if (this.state === 'DIZZY') {
                this.scene.tweens.killTweensOf(this);
                const { x, y } = gridToPixel(this.gridX, this.gridY);
                this.setPosition(x, y);
                this._startRotation();
            }
        }, [], this);
    }

    _throwRocks() {
        if (this.isDead || this.state !== 'ROTATING') return;
        
        const player = this.scene.player;
        if (!player) return;

        // Throw 3 rocks with slight delay
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 300, () => {
                if (this.isDead || !this.scene) return;
                this._createRock(player.sprite.x, player.sprite.y);
            });
        }
    }

    _createRock(targetX, targetY) {
        const rock = this.scene.add.graphics();
        rock.fillStyle(0x8c7b75, 1);
        rock.fillCircle(0, 0, 12);
        rock.lineStyle(2, 0x000000, 1);
        rock.strokeCircle(0, 0, 12);
        rock.setPosition(this.x, this.y);
        rock.setDepth(20);

        // Movement
        this.scene.tweens.add({
            targets: rock,
            x: targetX,
            y: targetY,
            duration: 1000, // Ralenti de 800 à 1000
            onUpdate: () => {
                // Collision with player
                const p = this.scene.player;
                if (p && !p.isDead) {
                    const dist = Phaser.Math.Distance.Between(rock.x, rock.y, p.sprite.x, p.sprite.y);
                    if (dist < 20) {
                        p.kill();
                        rock.destroy();
                    }
                }
            },
            onComplete: () => {
                if (rock.active) {
                    // Small explosion effect?
                    rock.destroy();
                }
            }
        });
    }

    takeDamage() {
        if (this.state !== 'DIZZY' || this.isDead) return;

        this.hp--;
        this.scene.events.emit('updateHUD', { bossHP: this.hp / this.maxHp });
        
        // Damage feedback
        this.scene.cameras.main.shake(200, 0.01);
        this.scene.playHeavyImpact();
        
        this.scene.tweens.killTweensOf(this);
        const { x, y } = gridToPixel(this.gridX, this.gridY);
        this.setPosition(x, y);

        if (this.hp <= 0) {
            this._die();
        } else {
            // Flash red then back to rotating
            this.setTint(0xff0000);
            this.scene.time.delayedCall(500, () => {
                this._startRotation();
            });
        }
    }

    _die() {
        this.isDead = true;
        this.state = 'DEAD';
        if (this.rotationTween) this.rotationTween.stop();
        if (this.attackTimer) this.attackTimer.remove();
        if (this.phaseTimer) this.phaseTimer.remove();
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 4,
            angle: 720,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.scene.events.emit('updateHUD', { bossVisible: false });
                this.scene.onBossDefeated();
                this.destroy();
            }
        });
    }

    update() {
        if (this.isDead) return;
        
        // Player collision in ROTATING phase
        if (this.state === 'ROTATING') {
            const p = this.scene.player;
            if (p && !p.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, p.sprite.x, p.sprite.y);
                if (dist < TILE_SIZE * 1.5) {
                    p.kill();
                }
            }
        }
    }
}
