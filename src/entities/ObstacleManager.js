import { MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class ObstacleManager {
    constructor(scene, laneWidth) {
        this.scene = scene;
        this.laneWidth = laneWidth;
        this.lanes = [-laneWidth, 0, laneWidth];

        this.obstaclePool = [];
        this.coinPool = [];

        this.spawnZ = GAME_CONFIG.spawn.zPosition;
        this.distanceSinceLastSpawn = 0;

        this.initMaterials();
        this.initPools();
    }

    initMaterials() {
        this.obsMat = new StandardMaterial('obsMat', this.scene);
        this.obsMat.diffuseColor = new Color3(1.0, 0.15, 0.1);
        this.obsMat.emissiveColor = new Color3(0.75, 0.08, 0.05);

        this.coinMat = new StandardMaterial('coinMat', this.scene);
        this.coinMat.diffuseColor = new Color3(1.0, 0.85, 0.0);
        this.coinMat.emissiveColor = new Color3(0.7, 0.55, 0.0);
    }

    initPools() {
        const types = ['LOW', 'HIGH_BAR', 'FULL'];
        types.forEach((type) => {
            for (let i = 0; i < 6; i++) {
                const mesh = this.createObstacleMesh(type, `${type}_${i}`);
                mesh.setEnabled(false);
                this.obstaclePool.push({ mesh, type, active: false });
            }
        });

        for (let i = 0; i < 20; i++) {
            const coin = MeshBuilder.CreateCylinder(`coin_${i}`, {
                diameter: 0.75,
                height: 0.18,
                tessellation: 16
            }, this.scene);
            coin.rotation.x = Math.PI / 2;
            coin.material = this.coinMat;
            coin.setEnabled(false);
            this.coinPool.push({ mesh: coin, active: false });
        }
    }

    createObstacleMesh(type, name) {
        let mesh;
        if (type === 'LOW') {
            mesh = MeshBuilder.CreateBox(name, { width: 1.7, height: 0.9, depth: 0.9 }, this.scene);
            mesh.userData = { baseY: 0.45 };
        } else if (type === 'HIGH_BAR') {
            mesh = MeshBuilder.CreateBox(name, { width: 1.8, height: 1.2, depth: 0.7 }, this.scene);
            mesh.userData = { baseY: 1.35 };
        } else {
            mesh = MeshBuilder.CreateBox(name, { width: 1.7, height: 2.4, depth: 1.0 }, this.scene);
            mesh.userData = { baseY: 1.2 };
        }
        mesh.material = this.obsMat;
        return mesh;
    }

    getFromPool(type) {
        return this.obstaclePool.find((item) => !item.active && item.type === type);
    }

    getCoinFromPool() {
        return this.coinPool.find((item) => !item.active);
    }

    // Menghitung jarak antar gelombang berdasarkan kecepatan saat ini
    getAdaptiveSpawnInterval(currentSpeed) {
        const { base, max } = GAME_CONFIG.speed;
        const { baseInterval, maxInterval } = GAME_CONFIG.spawn;
        const ratio = Math.min(Math.max((currentSpeed - base) / (max - base), 0), 1);
        return baseInterval + ratio * (maxInterval - baseInterval);
    }

    spawnWave() {
        const safeLaneIndex = Math.floor(Math.random() * 3);
        const obstacleTypes = ['LOW', 'HIGH_BAR', 'FULL'];

        for (let laneIdx = 0; laneIdx < 3; laneIdx++) {
            const xPos = this.lanes[laneIdx];

            if (laneIdx === safeLaneIndex) {
                if (Math.random() < GAME_CONFIG.spawn.coinRowChance) {
                    for (let c = 0; c < 3; c++) {
                        const coinObj = this.getCoinFromPool();
                        if (coinObj) {
                            coinObj.active = true;
                            coinObj.mesh.setEnabled(true);
                            coinObj.mesh.position.set(xPos, 0.8, this.spawnZ + c * 2.2);
                        }
                    }
                }
            } else {
                if (Math.random() < GAME_CONFIG.spawn.obstacleChance) {
                    const randType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
                    const obsObj = this.getFromPool(randType);
                    if (obsObj) {
                        obsObj.active = true;
                        obsObj.mesh.setEnabled(true);
                        obsObj.mesh.position.set(xPos, obsObj.mesh.userData.baseY, this.spawnZ);

                        if (randType === 'LOW' && Math.random() < GAME_CONFIG.spawn.bonusCoinChance) {
                            const coinObj = this.getCoinFromPool();
                            if (coinObj) {
                                coinObj.active = true;
                                coinObj.mesh.setEnabled(true);
                                coinObj.mesh.position.set(xPos, 2.1, this.spawnZ);
                            }
                        }
                    }
                }
            }
        }
    }

    reset() {
        this.distanceSinceLastSpawn = 0;
        for (const obs of this.obstaclePool) {
            obs.active = false;
            obs.mesh.setEnabled(false);
        }
        for (const coin of this.coinPool) {
            coin.active = false;
            coin.mesh.setEnabled(false);
        }
    }

    update(deltaTime, speed, player, onCollision, onCollectCoin) {
        const moveStep = speed * deltaTime;
        this.distanceSinceLastSpawn += moveStep;

        const currentInterval = this.getAdaptiveSpawnInterval(speed);
        if (this.distanceSinceLastSpawn >= currentInterval) {
            this.distanceSinceLastSpawn = 0;
            this.spawnWave();
        }

        const playerMesh = player.mesh;
        let hasNearbyObstacle = false;

        for (const obs of this.obstaclePool) {
            if (!obs.active) continue;
            obs.mesh.position.z -= moveStep;

            if (obs.mesh.position.z > -1.5 && obs.mesh.position.z < 1.5) {
                if (!hasNearbyObstacle) {
                    player.applyForgivingHitbox();
                    hasNearbyObstacle = true;
                }
                obs.mesh.computeWorldMatrix(true);

                if (playerMesh.intersectsMesh(obs.mesh, false)) {
                    player.restoreVisualScaling();
                    onCollision(obs.mesh.position);
                    return;
                }
            }

            if (obs.mesh.position.z < -10) {
                obs.active = false;
                obs.mesh.setEnabled(false);
            }
        }

        if (hasNearbyObstacle) {
            player.restoreVisualScaling();
        }

        for (const coin of this.coinPool) {
            if (!coin.active) continue;
            coin.mesh.position.z -= moveStep;
            coin.mesh.rotation.y += 4 * deltaTime;

            if (coin.mesh.position.z > -1.5 && coin.mesh.position.z < 1.5) {
                if (playerMesh.intersectsMesh(coin.mesh, false)) {
                    const hitPos = coin.mesh.position.clone();
                    coin.active = false;
                    coin.mesh.setEnabled(false);
                    onCollectCoin(hitPos);
                    continue;
                }
            }

            if (coin.mesh.position.z < -10) {
                coin.active = false;
                coin.mesh.setEnabled(false);
            }
        }
    }
}