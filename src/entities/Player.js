import { MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class Player {
    constructor(scene, laneWidth, soundManager) {
        this.scene = scene;
        this.laneWidth = laneWidth;
        this.sound = soundManager;

        this.currentLane = 0;
        this.targetX = 0;

        this.baseY = GAME_CONFIG.player.baseY;
        this.slideY = GAME_CONFIG.player.slideY;
        this.velocityY = 0;
        this.gravity = GAME_CONFIG.player.gravity;
        this.jumpForce = GAME_CONFIG.player.jumpForce;
        this.isGrounded = true;

        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = GAME_CONFIG.player.slideDuration;
        this.isLocked = true;

        this.createMesh();
        this.setupControls();
    }

    createMesh() {
        this.mesh = MeshBuilder.CreateBox('player', {
            width: 1.0,
            height: 1.2,
            depth: 1.0
        }, this.scene);
        this.mesh.position.set(0, this.baseY, 0);

        const playerMat = new StandardMaterial('playerMat', this.scene);
        playerMat.diffuseColor = new Color3(1, 0.1, 0.5);
        playerMat.emissiveColor = new Color3(0.6, 0.05, 0.3);
        this.mesh.material = playerMat;
    }

    moveLeft() {
        if (this.currentLane > -1) {
            this.currentLane--;
            this.targetX = this.currentLane * this.laneWidth;
            this.sound?.playLaneSwitch();
        }
    }

    moveRight() {
        if (this.currentLane < 1) {
            this.currentLane++;
            this.targetX = this.currentLane * this.laneWidth;
            this.sound?.playLaneSwitch();
        }
    }

    jump() {
        if (this.isGrounded) {
            if (this.isSliding) this.endSlide();
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.sound?.playJump();
        }
    }

    downAction() {
        if (!this.isGrounded) {
            this.velocityY = GAME_CONFIG.player.fastDropVelocity;
        } else if (!this.isSliding) {
            this.startSlide();
            this.sound?.playSlide();
        }
    }

    startSlide() {
        this.isSliding = true;
        this.slideTimer = this.slideDuration;
        this.mesh.scaling.y = 0.45;
        this.mesh.position.y = this.slideY;
    }

    endSlide() {
        this.isSliding = false;
        this.slideTimer = 0;
        this.mesh.scaling.y = 1.0;
        if (this.isGrounded) {
            this.mesh.position.y = this.baseY;
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.isLocked) return;
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.jump();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.downAction();
                    break;
            }
        });

        let activePointerId = null;
        let touchStartX = 0;
        let touchStartY = 0;

        window.addEventListener('pointerdown', (e) => {
            if (activePointerId !== null) return;
            activePointerId = e.pointerId;
            touchStartX = e.clientX;
            touchStartY = e.clientY;
        });

        window.addEventListener('pointerup', (e) => {
            if (e.pointerId !== activePointerId) return;
            activePointerId = null;
            if (this.isLocked) return;

            const dx = e.clientX - touchStartX;
            const dy = e.clientY - touchStartY;
            const minSwipeDistance = 28;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipeDistance) {
                    dx > 0 ? this.moveRight() : this.moveLeft();
                }
            } else {
                if (Math.abs(dy) > minSwipeDistance) {
                    dy < 0 ? this.jump() : this.downAction();
                }
            }
        });

        window.addEventListener('pointercancel', (e) => {
            if (e.pointerId === activePointerId) {
                activePointerId = null;
            }
        });
    }

    // Skala sementara untuk pengecekan tabrakan agar lebih adil (forgiving hitbox)
    applyForgivingHitbox() {
        this.savedScaling = this.mesh.scaling.clone();
        const { x, y, z } = GAME_CONFIG.player.hitboxScale;
        this.mesh.scaling.x *= x;
        this.mesh.scaling.y *= y;
        this.mesh.scaling.z *= z;
        this.mesh.computeWorldMatrix(true);
    }

    restoreVisualScaling() {
        if (this.savedScaling) {
            this.mesh.scaling.copyFrom(this.savedScaling);
            this.mesh.computeWorldMatrix(true);
            this.savedScaling = null;
        }
    }

    reset() {
        this.currentLane = 0;
        this.targetX = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isLocked = false;
        this.endSlide();
        this.mesh.position.set(0, this.baseY, 0);
        this.mesh.rotation.set(0, 0, 0);
    }

    update(deltaTime) {
        const lerpSpeed = GAME_CONFIG.player.laneLerpSpeed * deltaTime;
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * Math.min(lerpSpeed, 1);
        this.mesh.rotation.z = (this.targetX - this.mesh.position.x) * -0.25;

        if (this.isSliding) {
            this.slideTimer -= deltaTime;
            if (this.slideTimer <= 0) {
                this.endSlide();
            }
        }

        if (!this.isGrounded) {
            this.velocityY += this.gravity * deltaTime;
            this.mesh.position.y += this.velocityY * deltaTime;
            this.mesh.rotation.x += 6 * deltaTime;

            if (this.mesh.position.y <= this.baseY) {
                this.mesh.position.y = this.baseY;
                this.velocityY = 0;
                this.isGrounded = true;
                this.mesh.rotation.x = 0;
            }
        }
    }
}