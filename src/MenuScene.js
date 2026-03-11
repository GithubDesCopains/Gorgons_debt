/**
 * MenuScene.js
 * Scène d'accueil avec transition dynamique Sunny -> Dark et boutons interactifs.
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('title_bg_sunny', 'title_bg_sunny.png');
        this.load.image('title_bg_dark', 'title_bg.png');

        // Music preloading
        this.load.audio('titleMusic', 'sound/The_Oracle_s_Ascent.mp3');
        this.load.audio('gameMusic', 'sound/Echoes_of_the_Aegean_Lyre.mp3');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Fond initial (Sunny)
        this.bgSunny = this.add.image(width / 2, height / 2, 'title_bg_sunny');
        this.bgSunny.setDisplaySize(width, height);

        // 2. Fond sombre (initialement invisible)
        this.bgDark = this.add.image(width / 2, height / 2, 'title_bg_dark');
        this.bgDark.setDisplaySize(width, height);
        this.bgDark.setAlpha(0);

        // 3. Titre (invisible au début)
        this.title = this.add.text(width / 2, height * 0.3, "GORGON'S DEBT", {
            fontFamily: 'serif',
            fontSize: '84px',
            color: '#00ffcc',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffcc', blur: 20, fill: true }
        }).setOrigin(0.5).setAlpha(0);

        // 4. Groupe de boutons (invisible au début)
        this.btnContainer = this.add.container(width / 2, height * 0.65).setAlpha(0);
        this._createButtons();

        // 5. Lancer la séquence dramatique
        this.time.delayedCall(1500, () => this._triggerStorm());

        // 6. Jouer la musique du titre
        if (!this.sound.get('titleMusic')) {
            this.titleMusic = this.sound.add('titleMusic', {
                loop: true,
                volume: saveData.settings.musicVolume
            });
            this.titleMusic.play();
        } else {
            this.titleMusic = this.sound.get('titleMusic');
            this.titleMusic.setVolume(saveData.settings.musicVolume);
            if (!this.titleMusic.isPlaying) this.titleMusic.play();
        }
    }

    _triggerStorm() {
        // Effet d'éclairs (flashs blancs)
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillRect(0, 0, this.scale.width, this.scale.height);
        flash.setAlpha(0);
        flash.setDepth(100);

        // Timeline de flashs
        this.tweens.add({
            targets: flash,
            alpha: { from: 0, to: 0.8 },
            duration: 50,
            yoyo: true,
            repeat: 3,
            onRepeat: () => {
                this.cameras.main.shake(100, 0.01);
                this._playLightningSound();
            },
            onComplete: () => {
                // Transition vers le mode sombre
                this.tweens.add({
                    targets: this.bgDark,
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        this.bgSunny.destroy();
                        this._showUI();
                    }
                });
                flash.destroy();
            }
        });
    }

    _showUI() {
        // Apparition du titre
        this.tweens.add({
            targets: this.title,
            alpha: 1,
            y: this.title.y + 20,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // Animation de flottement
                this.tweens.add({
                    targets: this.title,
                    y: this.title.y - 40,
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Apparition des boutons
        this.tweens.add({
            targets: this.btnContainer,
            alpha: 1,
            y: this.btnContainer.y - 20,
            duration: 800,
            delay: 500,
            ease: 'Back.easeOut'
        });
    }

    _createButtons() {
        const btnStart = this._makeButton(0, 0, "DÉMARRER", () => this._startGame());
        const btnLevels = this._makeButton(0, 80, "NIVEAUX", () => {
            this.scene.start('LevelSelectScene');
        });

        this.btnContainer.add([btnStart, btnLevels]);
    }

    _makeButton(x, y, label, callback) {
        const bg = this.add.graphics();
        bg.fillStyle(0x002222, 0.8);
        bg.fillRoundedRect(-150, -30, 300, 60, 10);
        bg.lineStyle(2, 0x00ffcc, 1);
        bg.strokeRoundedRect(-150, -30, 300, 60, 10);

        const text = this.add.text(0, 0, label, {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#00ffcc'
        }).setOrigin(0.5);

        const container = this.add.container(x, y, [bg, text]);
        container.setSize(300, 60);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            this.tweens.add({ targets: container, scale: 1.1, duration: 200, ease: 'Back.easeOut' });
            this._playHoverSound();
        });

        container.on('pointerout', () => {
            this.tweens.add({ targets: container, scale: 1.0, duration: 200, ease: 'Power2' });
        });

        container.on('pointerdown', callback);

        return container;
    }

    _startGame() {
        // Fondu au noir avant de changer
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }

    // -- Sons synthétiques --
    _playHoverSound() {
        this._beep(440, 0.1, 'triangle');
    }

    _playLightningSound() {
        this._beep(100, 0.3, 'sawtooth', 0.5);
    }

    _beep(freq, duration, type, volume = 0.2) {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const sfxVol = saveData.settings.sfxVolume || 0.8;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(volume * sfxVol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }
}
