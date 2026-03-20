class PressurePlate {
  constructor(scene, gridX, gridY, config = {}) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.pressed = false;
    this.toggle = config.toggle || false;
    this.target = config.target || null; // 'ExitDoor' ou 'Spikes'

    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this.idx = 12; // ID pour l'éditeur/debug

    this._draw();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(1); // Sous les entités
  }

  _draw() {
    this.gfx.clear();
    const s = TILE_SIZE - 8;
    const color = this.pressed ? 0x27ae60 : 0x7f8c8d;
    const stroke = this.pressed ? 0x2ecc71 : 0x95a5a6;
    
    // Base
    this.gfx.fillStyle(0x34495e, 1);
    this.gfx.fillRect(-s/2, -s/2, s, s);
    
    // Plaque mobile
    const offset = this.pressed ? 2 : 0;
    this.gfx.fillStyle(color, 1);
    this.gfx.fillRect(-s/2 + 4, -s/2 + 4 + offset, s - 8, s - 8);
    
    this.gfx.lineStyle(2, stroke, 1);
    this.gfx.strokeRect(-s/2 + 4, -s/2 + 4 + offset, s - 8, s - 8);

    // Icône selon la cible
    if (this.target) {
        // Optionnel : dessiner un symbole ici avec this.gfx
    }
  }

  setPressed(isPressed) {
    if (this.pressed === isPressed) return;
    
    if (this.toggle && this.pressed && !isPressed) {
        // En mode toggle, on ne relâche pas si on quitte la plaque
        return;
    }

    this.pressed = isPressed;
    this._draw();
    
    // Feedback sonore (clic mécanique lourd)
    this._playClickSound();
  }

  _playClickSound() {
    const sfxVol = saveData.settings.sfxVolume || 0.8;
    if (!this.scene.audioCtx) {
      this.scene.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const now = this.scene.audioCtx.currentTime;
    const osc = this.scene.audioCtx.createOscillator();
    const gain = this.scene.audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.pressed ? 120 : 150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    gain.gain.setValueAtTime(0.3 * sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.scene.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  destroy() {
    this.gfx.destroy();
  }
}
