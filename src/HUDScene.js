/**
 * HUDScene.js
 * Interface superposée au jeu (Portrait, Compteur, Pause).
 */
class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    preload() {
        // Portrait retiré pour libérer l'espace visuel
    }

    create() {
        // 1. Boss Life Bar (Hidden by default)
        this.bossBar = this.add.container(this.scale.width / 2, 80).setVisible(false);
        this._createBossHealthUI();

        // 2. Infos Niveau (Repositionnées en haut à gauche)
        this.levelNameText = this.add.text(20, 20, "NIVEAU", {
            fontFamily: 'serif',
            fontSize: '28px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.itemText = this.add.text(20, 55, "◆ ÉCLATS : 0 / 0", {
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
        if (data.bossVisible !== undefined) {
            this.bossBar.setVisible(data.bossVisible);
        }
        if (data.bossHP !== undefined) {
            this._updateBossBar(data.bossHP);
        }
    }

    _createBossHealthUI() {
        const width = 400;
        const height = 24;

        // Shadow/Glow
        const glow = this.add.graphics();
        glow.fillStyle(0x00ffcc, 0.2);
        glow.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 4);

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 0.8);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
        bg.lineStyle(2, 0x00ffcc, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);

        // Bar
        this.bossInnerBar = this.add.graphics();
        this._updateBossBar(1.0);

        const label = this.add.text(0, -25, "HECATONCHIRE", {
            fontFamily: 'serif',
            fontSize: '20px',
            color: '#00ffcc',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.bossBar.add([glow, bg, this.bossInnerBar, label]);
    }

    _updateBossBar(pct) {
        const width = 396;
        const height = 20;
        this.bossInnerBar.clear();
        
        // Gradient or Color-based on status
        const color = pct > 0.4 ? 0x00ffcc : 0xff3300;
        this.bossInnerBar.fillStyle(color, 1);
        this.bossInnerBar.fillRoundedRect(-width / 2, -height / 2, width * pct, height, 2);
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

        this.pauseButtons = [
            this._makeMenuButton(0, -10, "REPRENDRE", () => this._togglePause()),
            this._makeMenuButton(0, 40, "OPTIONS", () => this.scene.launch('OptionsScene')),
            this._makeMenuButton(0, 90, "QUITTER", () => this._quitGame())
        ];

        this.pauseMenu.add([bg, panel, title, ...this.pauseButtons]);
        this.pauseSelectedIndex = 0;
    }

    _updatePauseVisuals() {
        this.pauseButtons.forEach((btn, index) => {
            const isSelected = index === this.pauseSelectedIndex;
            btn.setColor(isSelected ? '#ffffff' : '#00ffcc');
            btn.setScale(isSelected ? 1.2 : 1.0);
        });
    }

    update() {
        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        if (!pad) return;

        // Toggle Pause (Bouton Options/Start = 9 sur une manette Xbox standard)
        if (pad.buttons[9].pressed && !this._padStartPressed) {
            this._togglePause();
        }
        this._padStartPressed = pad.buttons[9].pressed;

        // Si le menu est ouvert, gérer la navigation
        if (this.pauseMenu.visible) {
            const threshold = 0.5;

            if ((pad.up || pad.axes[1].value < -threshold) && !this._padUp) {
                this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + 3) % 3;
                this._updatePauseVisuals();
            }
            this._padUp = (pad.up || pad.axes[1].value < -threshold);

            if ((pad.down || pad.axes[1].value > threshold) && !this._padDown) {
                this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % 3;
                this._updatePauseVisuals();
            }
            this._padDown = (pad.down || pad.axes[1].value > threshold);

            if (pad.buttons[0].pressed && !this._padA) {
                const btn = this.pauseButtons[this.pauseSelectedIndex];
                if (btn && btn.getData('callback')) btn.getData('callback')();
            }
            this._padA = pad.buttons[0].pressed;
        }
    }

    _makeMenuButton(x, y, label, callback) {
        const txt = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ffcc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        txt.setData('callback', callback);
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
        console.log("HUDScene _quitGame called");
        const gameMusic = this.sound.get('gameMusic');
        if (gameMusic && gameMusic.isPlaying) {
            this.tweens.add({
                targets: gameMusic,
                volume: 0,
                duration: 500,
                onComplete: () => gameMusic.stop()
            });
        }
        this.scene.stop('GameScene');
        this.scene.stop('HUDScene');
        this.scene.start('MenuScene');
    }
}
