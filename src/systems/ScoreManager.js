import { GAME_CONFIG } from '../config/gameConfig.js';

export class ScoreManager {
    constructor(hudController) {
        this.hud = hudController;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.highScore = parseInt(localStorage.getItem(GAME_CONFIG.scoring.highScoreKey) || '0', 10);
        this.syncUI();
    }

    addDistance(deltaDistance) {
        this.distance += deltaDistance;
        this.recalculate();
    }

    addCoin() {
        this.coins += 1;
        this.recalculate();
    }

    recalculate() {
        this.score = Math.floor(this.distance) + this.coins * GAME_CONFIG.scoring.coinValue;
        this.syncUI();
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(GAME_CONFIG.scoring.highScoreKey, String(this.highScore));
        }
        this.syncUI();
    }

    reset() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.syncUI();
    }

    syncUI() {
        if (this.hud) {
            this.hud.updateScores(this.score, this.highScore);
        }
    }
}