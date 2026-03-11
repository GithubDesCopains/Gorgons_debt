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

        // Grille de niveaux (ex: 1 à 5)
        const levels = [1, 2, 3, 4, 5];
        const startX = width / 2 - 200;
        const startY = 250;
        const spacingX = 200;
        const spacingY = 150;

        levels.forEach((lvl, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            this._createLevelButton(x, y, lvl);
        });

        // Bouton Retour
        const btnBack = this._createSimpleButton(width / 2, height - 80, "RETOUR", () => {
            this.scene.start('MenuScene');
        });
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

        if (isUnlocked) {
            container.setSize(120, 120);
            container.setInteractive({ useHandCursor: true });

            container.on('pointerover', () => {
                this.tweens.add({ targets: container, scale: 1.1, duration: 150 });
            });
            container.on('pointerout', () => {
                this.tweens.add({ targets: container, scale: 1.0, duration: 150 });
            });
            container.on('pointerdown', () => {
                // Pour l'instant, on lance toujours la même scène de démo
                // On pourrait imaginer passer le numéro du niveau à GameScene
                this.scene.start('GameScene', { level: level });
            });
        } else {
            // Cadenas ou effet grisé
            container.setAlpha(0.5);
            this.add.text(x, y + 40, "VERROUILLÉ", {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#ff4444'
            }).setOrigin(0.5);
        }
    }

    _createSimpleButton(x, y, label, callback) {
        const text = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ffcc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        text.on('pointerover', () => text.setScale(1.1));
        text.on('pointerout', () => text.setScale(1.0));
        text.on('pointerdown', callback);

        return text;
    }
}
