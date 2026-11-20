import { ParticleSystem, Color4, Vector3 } from '@babylonjs/core';

export class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.coinSystem = this.createCoinParticles();
        this.crashSystem = this.createCrashParticles();
    }

    createCoinParticles() {
        const ps = new ParticleSystem('coinParticles', 40, this.scene);
        ps.minSize = 0.12;
        ps.maxSize = 0.28;
        ps.minLifeTime = 0.2;
        ps.maxLifeTime = 0.45;
        ps.emitRate = 0;
        ps.color1 = new Color4(1, 0.85, 0, 1);
        ps.color2 = new Color4(1, 0.5, 0, 1);
        ps.colorDead = new Color4(1, 0.85, 0, 0);
        ps.minEmitPower = 3;
        ps.maxEmitPower = 7;
        ps.gravity = new Vector3(0, -12, 0);
        ps.start();
        return ps;
    }

    createCrashParticles() {
        const ps = new ParticleSystem('crashParticles', 80, this.scene);
        ps.minSize = 0.18;
        ps.maxSize = 0.45;
        ps.minLifeTime = 0.3;
        ps.maxLifeTime = 0.7;
        ps.emitRate = 0;
        ps.color1 = new Color4(1, 0.1, 0.4, 1);
        ps.color2 = new Color4(0, 0.95, 1, 1);
        ps.colorDead = new Color4(0.2, 0, 0.2, 0);
        ps.minEmitPower = 5;
        ps.maxEmitPower = 13;
        ps.gravity = new Vector3(0, -18, 0);
        ps.start();
        return ps;
    }

    emitCoinBurst(position) {
        this.coinSystem.emitter = position.clone();
        this.coinSystem.manualEmitCount = 14;
    }

    emitCrashBurst(position) {
        this.crashSystem.emitter = position.clone();
        this.crashSystem.manualEmitCount = 36;
    }
}