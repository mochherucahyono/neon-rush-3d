import {
    Engine,
    Scene,
    UniversalCamera,
    HemisphericLight,
    DirectionalLight,
    Vector3,
    Color4,
    Color3,
    GlowLayer
} from '@babylonjs/core';
import { GAME_CONFIG } from './config/gameConfig.js';
import { GameState, STATES } from './core/GameState.js';
import { SoundManager } from './core/SoundManager.js';
import { TrackManager } from './entities/TrackManager.js';
import { Player } from './entities/Player.js';
import { ObstacleManager } from './entities/ObstacleManager.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { EffectManager } from './systems/EffectManager.js';
import { HudController } from './ui/HudController.js';

const canvas = document.getElementById('renderCanvas');
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);

const createScene = () => {
    const scene = new Scene(engine);

    const bgColor = new Color3(0.035, 0.04, 0.08);
    scene.clearColor = new Color4(bgColor.r, bgColor.g, bgColor.b, 1);
    scene.fogMode = Scene.FOGMODE_LINEAR;
    scene.fogColor = bgColor;
    scene.fogStart = GAME_CONFIG.track.fogStart;
    scene.fogEnd = GAME_CONFIG.track.fogEnd;

    const camera = new UniversalCamera('mainCam', new Vector3(0, 4.5, -7.5), scene);
    const playCamPos = new Vector3(0, 4.5, -7.5);
    const playCamTarget = new Vector3(0, 1.2, 8);
    camera.setTarget(playCamTarget);

    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.7;

    const dirLight = new DirectionalLight('dirLight', new Vector3(-0.5, -1, 0.5), scene);
    dirLight.position = new Vector3(10, 20, -10);
    dirLight.intensity = 0.8;

    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.65;

    const gameState = new GameState(STATES.MENU);
    const soundManager = new SoundManager();
    const trackManager = new TrackManager(scene);
    const player = new Player(scene, trackManager.laneWidth, soundManager);
    const obstacleManager = new ObstacleManager(scene, trackManager.laneWidth);
    const effectManager = new EffectManager(scene);

    let hud;
    const scoreManager = new ScoreManager(null);

    let currentSpeed = GAME_CONFIG.speed.base;
    let idleAngle = 0;
    let shakeTimer = 0;

    const startOrRestartGame = () => {
        currentSpeed = GAME_CONFIG.speed.base;
        trackManager.speed = GAME_CONFIG.speed.base;
        shakeTimer = 0;
        player.reset();
        obstacleManager.reset();
        scoreManager.reset();
        camera.position.copyFrom(playCamPos);
        camera.setTarget(playCamTarget);
        gameState.set(STATES.PLAYING);
    };

    const togglePause = () => {
        if (gameState.is(STATES.PLAYING)) {
            player.isLocked = true;
            gameState.set(STATES.PAUSED);
        } else if (gameState.is(STATES.PAUSED)) {
            player.isLocked = false;
            gameState.set(STATES.PLAYING);
        }
    };

    const triggerGameOver = (hitPos) => {
        if (!gameState.is(STATES.PLAYING)) return;
        player.isLocked = true;
        shakeTimer = GAME_CONFIG.camera.shakeDuration;
        soundManager.playCrash();
        effectManager.emitCrashBurst(hitPos || player.mesh.position);
        scoreManager.saveHighScore();
        gameState.set(STATES.GAMEOVER);
    };

    hud = new HudController({
        onPlay: startOrRestartGame,
        onPause: togglePause,
        onResume: togglePause,
        onOpenAbout: () => gameState.set(STATES.ABOUT),
        onCloseAbout: () => gameState.set(STATES.MENU),
        onRestart: startOrRestartGame,
        onToggleMute: () => {
            const muted = soundManager.toggleMute();
            hud.setMuteLabel(muted);
        }
    });
    scoreManager.hud = hud;
    scoreManager.syncUI();
    hud.setMuteLabel(soundManager.muted);

    gameState.onChange((nextState) => {
        hud.onStateChange(nextState, scoreManager.score);
    });
    hud.onStateChange(gameState.current, scoreManager.score);

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (gameState.is(STATES.ABOUT)) {
                gameState.set(STATES.MENU);
                return;
            }
            togglePause();
        } else if (e.code === 'KeyP') {
            togglePause();
        } else if (gameState.is(STATES.GAMEOVER) && (e.code === 'Space' || e.code === 'Enter')) {
            startOrRestartGame();
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const deltaTime = Math.min(engine.getDeltaTime() / 1000, 0.05);

        // Update screen shake meski sudah masuk state GAMEOVER
        if (shakeTimer > 0) {
            shakeTimer = Math.max(0, shakeTimer - deltaTime);
            const mag = GAME_CONFIG.camera.shakeMagnitude * (shakeTimer / GAME_CONFIG.camera.shakeDuration);
            camera.position.set(
                playCamPos.x + (Math.random() * 2 - 1) * mag,
                playCamPos.y + (Math.random() * 2 - 1) * mag,
                playCamPos.z + (Math.random() * 2 - 1) * mag
            );
        } else if (gameState.is(STATES.MENU) || gameState.is(STATES.ABOUT)) {
            trackManager.speed = 10;
            trackManager.update(deltaTime);
            idleAngle += 0.45 * deltaTime;
            camera.position.x = Math.sin(idleAngle) * 6.5;
            camera.position.y = 3.8 + Math.sin(idleAngle * 1.5) * 0.4;
            camera.position.z = -7.5 + Math.cos(idleAngle) * 2.0;
            camera.setTarget(new Vector3(0, 1.0, 2));
            return;
        }

        if (!gameState.is(STATES.PLAYING)) return;

        if (currentSpeed < GAME_CONFIG.speed.max) {
            currentSpeed += GAME_CONFIG.speed.acceleration * deltaTime;
            trackManager.speed = currentSpeed;
        }

        trackManager.update(deltaTime);
        player.update(deltaTime);
        scoreManager.addDistance(currentSpeed * deltaTime * GAME_CONFIG.scoring.distanceMultiplier);

        obstacleManager.update(
            deltaTime,
            currentSpeed,
            player,
            triggerGameOver,
            (coinPos) => {
                soundManager.playCoin();
                effectManager.emitCoinBurst(coinPos);
                scoreManager.addCoin();
            }
        );
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener('resize', () => {
    engine.resize();
});