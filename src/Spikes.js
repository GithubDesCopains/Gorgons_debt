class Spikes {
  constructor(scene, gridX, gridY, config = {}) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.retracted = false; // Par défaut, sorties (dangereux)
    
    const p = gridToPixel(gridX, gridY);
    this.gfx = scene.add.graphics();
    this.idx = 13;

    this._draw();
    this.gfx.setPosition(p.x, p.y);
    this.gfx.setDepth(2);
  }

  _draw() {
    this.gfx.clear();
    const s = TILE_SIZE - 12;
    
    // Base du piège
    this.gfx.fillStyle(0x2c3e50, 1);
    this.gfx.fillRect(-s/2, -s/2, s, s);
    
    if (!this.retracted) {
        // Pics sortis (Triangles gris)
        this.gfx.fillStyle(0xbdc3c7, 1);
        const pts = [-16, 16, 0, -16, 16, 16];
        // 4 petits pics
        for(let i=0; i<4; i++) {
            const ox = (i % 2 === 0 ? -12 : 12);
            const oy = (i < 2 ? -12 : 12);
            this.gfx.fillTriangle(ox-6, oy+6, ox, oy-10, ox+6, oy+6);
        }
        this.gfx.lineStyle(1, 0xecf0f1, 1);
        for(let i=0; i<4; i++) {
             const ox = (i % 2 === 0 ? -12 : 12);
             const oy = (i < 2 ? -12 : 12);
             this.gfx.strokeTriangle(ox-6, oy+6, ox, oy-10, ox+6, oy+6);
        }
    } else {
        // Trous (petits cercles noirs)
        this.gfx.fillStyle(0x1a1a1a, 1);
        for(let i=0; i<4; i++) {
            const ox = (i % 2 === 0 ? -10 : 10);
            const oy = (i < 2 ? -10 : 10);
            this.gfx.fillCircle(ox, oy, 4);
        }
    }
  }

  setRetracted(isRetracted) {
    if (this.retracted === isRetracted) return;
    this.retracted = isRetracted;
    this._draw();
  }

  destroy() {
    this.gfx.destroy();
  }
}
