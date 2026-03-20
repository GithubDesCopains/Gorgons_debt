/**
 * LevelSelectScene.js
 * Menu de sélection de niveau avec gestion des niveaux verrouillés.
 */
class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Fond sombre
        this.add.image(width / 2, height / 2, 'title_bg_dark')
            .setDisplaySize(width, height);

        // Titre
        this.add.text(width / 2, 80, "SÉLECTION DU NIVEAU", {
            fontFamily: 'serif',
            fontSize: '48px',
            color: '#00ffcc',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Grille de niveaux (dynamique)
        const levels = Object.keys(GameLevels).map(Number).sort((a,b) => a-b);
        const startX = width / 2 - 300;
        const startY = 180;
        const spacingX = 200;
        const spacingY = 130;

        this.levelButtons = [];
        levels.forEach((lvl, index) => {
            const col = index % 4; // 4 colonnes
            const row = Math.floor(index / 4);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            const btn = this._createLevelButton(x, y, lvl);
            this.levelButtons.push(btn);
        });

        // Bouton Retour
        this.btnBack = this._createSimpleButton(width / 2, height - 80, "RETOUR", () => {
            this.scene.start('MenuScene');
        });

        this.selectedIndex = 0; // Index dans levelButtons, ou -1 pour btnBack
        this._updateVisuals();
    }

    _updateVisuals() {
        this.levelButtons.forEach((btn, index) => {
            btn.setScale(this.selectedIndex === index ? 1.1 : 1.0);
            if (this.selectedIndex === index) btn.setAlpha(1);
            else if (index >= saveData.unlockedLevels) btn.setAlpha(0.5);
            else btn.setAlpha(0.9);
        });
        this.btnBack.setScale(this.selectedIndex === -1 ? 1.2 : 1.0);
        this.btnBack.setColor(this.selectedIndex === -1 ? '#ffffff' : '#00ffcc');
    }

    update() {
        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        if (!pad) return;

        // Empêcher le déclenchement immédiat si le bouton est déjà maintenu (ex: retour de pause)
        if (this._firstGamepadUpdate === undefined) {
            this._padA = pad.buttons[0].pressed;
            this._padLeft = (pad.left || pad.axes[0].value < -0.5);
            this._padRight = (pad.right || pad.axes[0].value > 0.5);
            this._padUp = (pad.up || pad.axes[1].value < -0.5);
            this._padDown = (pad.down || pad.axes[1].value > 0.5);
            this._firstGamepadUpdate = false;
        }

        const threshold = 0.5;
        const cols = 4;
        const totalLevels = this.levelButtons.length;

        // Navigation Horizontale
        if ((pad.left || pad.axes[0].value < -threshold) && !this._padLeft) {
            if (this.selectedIndex >= 0) {
                if (this.selectedIndex % cols > 0) this.selectedIndex--;
            }
            this._updateVisuals();
        }
        this._padLeft = (pad.left || pad.axes[0].value < -threshold);

        if ((pad.right || pad.axes[0].value > threshold) && !this._padRight) {
            if (this.selectedIndex >= 0) {
                if (this.selectedIndex % cols < cols - 1 && this.selectedIndex < totalLevels - 1) this.selectedIndex++;
            }
            this._updateVisuals();
        }
        this._padRight = (pad.right || pad.axes[0].value > threshold);

        // Navigation Verticale
        if ((pad.up || pad.axes[1].value < -threshold) && !this._padUp) {
            if (this.selectedIndex === -1) {
                // Remonter vers la dernière ligne
                this.selectedIndex = totalLevels - 1;
            } else if (this.selectedIndex >= cols) {
                this.selectedIndex -= cols;
            }
            this._updateVisuals();
        }
        this._padUp = (pad.up || pad.axes[1].value < -threshold);

        if ((pad.down || pad.axes[1].value > threshold) && !this._padDown) {
            if (this.selectedIndex >= 0) {
                if (this.selectedIndex + cols < totalLevels) {
                    this.selectedIndex += cols;
                } else {
                    this.selectedIndex = -1; // Aller au bouton Retour
                }
            }
            this._updateVisuals();
        }
        this._padDown = (pad.down || pad.axes[1].value > threshold);

        // Validation
        if (pad.buttons[0].pressed && !this._padA) {
            if (this.selectedIndex === -1) {
                this.btnBack.getData('callback')();
            } else {
                const btn = this.levelButtons[this.selectedIndex];
                if (btn && btn.getData('unlocked')) {
                    btn.getData('callback')();
                }
            }
        }
        this._padA = pad.buttons[0].pressed;
    }

    _createLevelButton(x, y, level) {
        const isUnlocked = level <= saveData.unlockedLevels;
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        const color = isUnlocked ? 0x004444 : 0x222222;
        const strokeColor = isUnlocked ? 0x00ffcc : 0x444444;

        bg.fillStyle(color, 0.8);
        bg.fillRoundedRect(-60, -60, 120, 120, 15);
        bg.lineStyle(3, strokeColor, 1);
        bg.strokeRoundedRect(-60, -60, 120, 120, 15);

        const text = this.add.text(0, 0, level.toString(), {
            fontFamily: 'monospace',
            fontSize: '42px',
            color: isUnlocked ? '#00ffcc' : '#666666'
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setData('unlocked', isUnlocked);
        container.setData('callback', () => {
             this.scene.start('GameScene', { level: level });
        });

        if (isUnlocked) {
            container.setSize(120, 120);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', container.getData('callback'));
        } else {
            container.setAlpha(0.5);
            this.add.text(x, y + 40, "VERROUILLÉ", {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#ff4444'
            }).setOrigin(0.5);
        }
        return container;
    }

    _createSimpleButton(x, y, label, callback) {
        const text = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ffcc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        text.setData('callback', callback);
        text.on('pointerdown', callback);

        return text;
    }
}
