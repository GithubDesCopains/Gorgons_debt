/**
 * HUDScene.js
 * Interface superposée au jeu (Portrait, Compteur, Pause).
 */
class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    preload() {
        this.load.image('hero_portrait', 'hero_portrait.png');
    }

    create() {
        // 1. Médaillon du Héros
        this.medallion = this.add.container(60, 60);

        // Cadre du médaillon
        const frame = this.add.graphics();
        frame.fillStyle(0x333333, 0.8);
        frame.fillCircle(0, 0, 50);
        frame.lineStyle(4, 0x00ffcc, 1);
        frame.strokeCircle(0, 0, 50);

        // Portrait
        const portrait = this.add.image(0, 0, 'hero_portrait');
        portrait.setDisplaySize(90, 90);

        // Masque circulaire pour le portrait
        const maskShape = this.add.graphics();
        maskShape.fillCircle(60, 60, 45);
        maskShape.setVisible(false);
        const mask = maskShape.createGeometryMask();
        portrait.setMask(mask);

        this.medallion.add([frame, portrait]);

        // 2. Infos Niveau
        this.levelNameText = this.add.text(120, 15, "NIVEAU", {
            fontFamily: 'serif',
            fontSize: '28px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.itemText = this.add.text(120, 50, "◆ ÉCLATS : 0 / 0", {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#00ffcc',
            stroke: '#000000',
            strokeThickness: 3
        });

        // 3. Conseil de Tutoriel (Bas de l'écran)
        this.tutorialText = this.add.text(this.scale.width / 2, this.scale.height - 40, "", {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // 3. Bouton Pause
        this.btnPause = this.add.container(this.scale.width - 60, 50);
        this._createPauseButton();

        // 4. Menu de Pause (caché par défaut)
        this.pauseMenu = this.add.container(this.scale.width / 2, this.scale.height / 2).setVisible(false);
        this._createPauseMenu();

        // 5. Écouteurs d'événements (depuis GameScene)
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateHUD', this._updateHUD, this);
    }

    _updateHUD(data) {
        if (data.levelName) {
            this.levelNameText.setText(data.levelName.toUpperCase());
        }
        if (data.tutorialTip !== undefined) {
            this.tutorialText.setText(data.tutorialTip);
            // Faire clignoter ou apparaître doucement ?
            this.tutorialText.setAlpha(0);
            this.tweens.add({ targets: this.tutorialText, alpha: 1, duration: 500 });
        }
        if (data.itemsCollected !== undefined) {
            this.itemText.setText(`◆ ÉCLATS : ${data.itemsCollected} / ${data.itemsTotal}`);
        }
    }

    _createPauseButton() {
        const bg = this.add.graphics();
        bg.fillStyle(0x002222, 0.8);
        bg.fillRoundedRect(-40, -20, 80, 40, 5);
        bg.lineStyle(2, 0x00ffcc, 1);
        bg.strokeRoundedRect(-40, -20, 80, 40, 5);

        const txt = this.add.text(0, 0, "PAUSE", {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#00ffcc'
        }).setOrigin(0.5);

        this.btnPause.add([bg, txt]);
        this.btnPause.setSize(80, 40);
        this.btnPause.setInteractive({ useHandCursor: true });

        this.btnPause.on('pointerover', () => this.tweens.add({ targets: this.btnPause, scale: 1.1, duration: 100 }));
        this.btnPause.on('pointerout', () => this.tweens.add({ targets: this.btnPause, scale: 1.0, duration: 100 }));
        this.btnPause.on('pointerdown', () => this._togglePause());
    }

    _createPauseMenu() {
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(-this.scale.width / 2, -this.scale.height / 2, this.scale.width, this.scale.height);

        const panel = this.add.graphics();
        panel.fillStyle(0x001a1a, 0.9);
        panel.fillRoundedRect(-150, -100, 300, 200, 15);
        panel.lineStyle(4, 0x00ffcc, 1);
        panel.strokeRoundedRect(-150, -100, 300, 200, 15);

        const title = this.add.text(0, -60, "PAUSE", {
            fontFamily: 'serif',
            fontSize: '42px',
            color: '#00ffcc'
        }).setOrigin(0.5);

        const btnResume = this._makeMenuButton(0, -10, "REPRENDRE", () => this._togglePause());
        const btnOptions = this._makeMenuButton(0, 40, "OPTIONS", () => {
            this.scene.launch('OptionsScene');
        });
        const btnQuit = this._makeMenuButton(0, 90, "QUITTER", () => this._quitGame());

        this.pauseMenu.add([bg, panel, title, btnResume, btnOptions, btnQuit]);
    }

    _makeMenuButton(x, y, label, callback) {
        const txt = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ffcc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        txt.on('pointerover', () => txt.setColor('#ffffff'));
        txt.on('pointerout', () => txt.setColor('#00ffcc'));
        txt.on('pointerdown', callback);

        return txt;
    }

    _togglePause() {
        const isPaused = this.scene.isPaused('GameScene');
        if (isPaused) {
            this.scene.resume('GameScene');
            this.pauseMenu.setVisible(false);
        } else {
            this.scene.pause('GameScene');
            this.pauseMenu.setVisible(true);
        }
    }

    _quitGame() {
        this.scene.stop('GameScene');
        this.scene.stop('HUDScene');
        this.scene.start('MenuScene');
    }
}
