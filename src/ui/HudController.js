import { STATES } from '../core/GameState.js';

export class HudController {
    constructor({ onPlay, onOpenAbout, onCloseAbout, onPause, onResume, onRestart, onToggleMute }) {
        this.scoreEl = document.getElementById('scoreValue');
        this.highScoreEl = document.getElementById('highScoreValue');
        this.finalScoreEl = document.getElementById('finalScore');

        this.hudEl = document.getElementById('hud');
        this.mainMenuEl = document.getElementById('mainMenuScreen');
        this.aboutEl = document.getElementById('aboutScreen');
        this.pauseEl = document.getElementById('pauseScreen');
        this.gameOverEl = document.getElementById('gameOverScreen');

        this.playBtn = document.getElementById('playBtn');
        this.aboutBtn = document.getElementById('aboutBtn');
        this.closeAboutBtn = document.getElementById('closeAboutBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.menuRestartBtn = document.getElementById('menuRestartBtn');
        this.muteBtn = document.getElementById('muteBtn');

        this.playBtn?.addEventListener('click', onPlay);
        this.aboutBtn?.addEventListener('click', onOpenAbout);
        this.closeAboutBtn?.addEventListener('click', onCloseAbout);
        this.resumeBtn?.addEventListener('click', onResume);
        this.pauseBtn?.addEventListener('click', onPause);
        this.restartBtn?.addEventListener('click', onRestart);
        this.menuRestartBtn?.addEventListener('click', onRestart);
        this.muteBtn?.addEventListener('click', onToggleMute);
    }

    updateScores(score, highScore) {
        if (this.scoreEl) this.scoreEl.textContent = score;
        if (this.highScoreEl) this.highScoreEl.textContent = highScore;
    }

    setMuteLabel(isMuted) {
        if (this.muteBtn) {
            this.muteBtn.textContent = isMuted ? 'SUARA: OFF' : 'SUARA: ON';
        }
    }

    onStateChange(state, finalScore = 0) {
        this.mainMenuEl?.classList.toggle('hidden', state !== STATES.MENU);
        this.aboutEl?.classList.toggle('hidden', state !== STATES.ABOUT);
        this.pauseEl?.classList.toggle('hidden', state !== STATES.PAUSED);
        this.gameOverEl?.classList.toggle('hidden', state !== STATES.GAMEOVER);

        const hideHud = state === STATES.MENU || state === STATES.ABOUT;
        this.hudEl?.classList.toggle('hidden', hideHud);

        if (state === STATES.GAMEOVER && this.finalScoreEl) {
            this.finalScoreEl.textContent = finalScore;
        }
    }
}