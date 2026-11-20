import { MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class TrackManager {
    constructor(scene) {
        this.scene = scene;
        this.laneWidth = GAME_CONFIG.track.laneWidth;
        this.segmentLength = GAME_CONFIG.track.segmentLength;
        this.poolSize = GAME_CONFIG.track.poolSize;
        this.segments = [];
        this.speed = GAME_CONFIG.speed.base;

        this.initMaterials();
        this.initPool();
    }

    initMaterials() {
        this.groundMat = new StandardMaterial('groundMat', this.scene);
        this.groundMat.diffuseColor = new Color3(0.08, 0.09, 0.16);
        this.groundMat.specularColor = new Color3(0.1, 0.1, 0.2);

        this.lineMat = new StandardMaterial('lineMat', this.scene);
        this.lineMat.emissiveColor = new Color3(0.0, 0.85, 1.0);
        this.lineMat.disableLighting = true;
    }

    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const zPos = i * this.segmentLength;
            const segment = this.createSegment(i, zPos);
            this.segments.push(segment);
        }
    }

    createSegment(index, zPos) {
        const ground = MeshBuilder.CreateBox(`ground_${index}`, {
            width: this.laneWidth * 3.2,
            height: 0.4,
            depth: this.segmentLength - 0.1
        }, this.scene);
        ground.position.set(0, -0.2, zPos);
        ground.material = this.groundMat;

        const leftDivider = MeshBuilder.CreateBox(`divL_${index}`, {
            width: 0.08,
            height: 0.05,
            depth: this.segmentLength
        }, this.scene);
        leftDivider.position.set(-this.laneWidth / 2, 0.21, 0);
        leftDivider.material = this.lineMat;
        leftDivider.parent = ground;

        const rightDivider = MeshBuilder.CreateBox(`divR_${index}`, {
            width: 0.08,
            height: 0.05,
            depth: this.segmentLength
        }, this.scene);
        rightDivider.position.set(this.laneWidth / 2, 0.21, 0);
        rightDivider.material = this.lineMat;
        rightDivider.parent = ground;

        return ground;
    }

    update(deltaTime) {
        const moveStep = this.speed * deltaTime;

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            seg.position.z -= moveStep;

            if (seg.position.z < -this.segmentLength) {
                let maxZ = -Infinity;
                for (const s of this.segments) {
                    if (s.position.z > maxZ) maxZ = s.position.z;
                }
                seg.position.z = maxZ + this.segmentLength;
            }
        }
    }
}