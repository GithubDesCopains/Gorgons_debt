/**
 * OptionsScene.js
 * Menu de configuration pour régler le volume sonore et autres paramètres.
 */
class OptionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OptionsScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Overlay sombre
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        // Panneau central
        const panel = this.add.graphics();
        panel.fillStyle(0x001a1a, 0.95);
        panel.lineStyle(4, 0x00ffcc, 1);
        panel.fillRoundedRect(width / 2 - 200, height / 2 - 200, 400, 400, 20);
        panel.strokeRoundedRect(width / 2 - 200, height / 2 - 200, 400, 400, 20);

        // Titre
        this.add.text(width / 2, height / 2 - 160, "OPTIONS", {
            fontFamily: 'serif',
            fontSize: '48px',
            color: '#00ffcc'
        }).setOrigin(0.5);

        // Section Musique
        this.add.text(width / 2, height / 2 - 80, "MUSIQUE", {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.musicVolText = this.add.text(width / 2, height / 2 - 40, this._formatVol(saveData.settings.musicVolume), {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ffcc',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this._createVolControls(width / 2, height / 2 - 40, 'music');

        // Section SFX
        this.add.text(width / 2, height / 2 + 40, "EFFETS SONORES (SFX)", {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.sfxVolText = this.add.text(width / 2, height / 2 + 80, this._formatVol(saveData.settings.sfxVolume), {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ffcc',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this._createVolControls(width / 2, height / 2 + 80, 'sfx');

        // Bouton Retour
        const btnBack = this.add.text(width / 2, height / 2 + 160, "RETOUR", {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#00ffcc',
            backgroundColor: '#002222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnBack.on('pointerover', () => btnBack.setColor('#ffffff'));
        btnBack.on('pointerout', () => btnBack.setColor('#00ffcc'));
        btnBack.on('pointerdown', () => {
            saveGame();
            this.scene.stop();
        });

        // Animation d'entrée
        this.cameras.main.setAlpha(0);
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 200 });
    }

    _createVolControls(x, y, type) {
        const btnMinus = this.add.text(x - 80, y, "[-]", { fontSize: '32px', color: '#ff4444' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        const btnPlus = this.add.text(x + 80, y, "[+]", { fontSize: '32px', color: '#44ff44' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMinus.on('pointerdown', () => this._changeVol(type, -0.1));
        btnPlus.on('pointerdown', () => this._changeVol(type, 0.1));
    }

    _changeVol(type, delta) {
        if (type === 'music') {
            saveData.settings.musicVolume = Phaser.Math.Clamp(saveData.settings.musicVolume + delta, 0, 1);
            this.musicVolText.setText(this._formatVol(saveData.settings.musicVolume));
            // Appliquer immédiatement aux sons en cours
            this.sound.getAllPlaying().forEach(s => {
                if (s.key === 'titleMusic' || s.key === 'gameMusic') {
                    // Arrêter les tweens système qui pourraient écraser le volume (ex: transition de scène)
                    this.scene.manager.scenes.forEach(scene => {
                        scene.tweens.killTweensOf(s);
                    });
                    s.setVolume(saveData.settings.musicVolume);
                }
            });
        } else {
            saveData.settings.sfxVolume = Phaser.Math.Clamp(saveData.settings.sfxVolume + delta, 0, 1);
            this.sfxVolText.setText(this._formatVol(saveData.settings.sfxVolume));
            // Feedback sonore rapide
            this._playTestBeep();
        }
    }

    _formatVol(v) {
        return Math.round(v * 100) + "%";
    }

    _playTestBeep() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1 * saveData.settings.sfxVolume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }
}
