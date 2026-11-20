export class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('neon_rush_muted') === 'true';
    }

    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    setMuted(muted) {
        this.muted = muted;
        localStorage.setItem('neon_rush_muted', String(muted));
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    playTone(freqStart, freqEnd, duration, type = 'sine', gainPeak = 0.12) {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, now);
        if (freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), now + duration);
        }

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    playLaneSwitch() {
        this.playTone(260, 380, 0.08, 'triangle', 0.08);
    }

    playJump() {
        this.playTone(220, 560, 0.16, 'sine', 0.12);
    }

    playSlide() {
        this.playTone(340, 140, 0.14, 'sawtooth', 0.07);
    }

    playCoin() {
        this.playTone(880, 1320, 0.12, 'sine', 0.11);
    }

    playCrash() {
        this.playTone(170, 42, 0.35, 'sawtooth', 0.18);
    }
}