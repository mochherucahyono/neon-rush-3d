export const STATES = {
    MENU: 'MENU',
    ABOUT: 'ABOUT',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
};

export class GameState {
    constructor(initialState = STATES.MENU) {
        this.current = initialState;
        this.listeners = [];
    }

    set(nextState) {
        if (this.current === nextState) return;
        const prevState = this.current;
        this.current = nextState;
        for (const cb of this.listeners) {
            cb(nextState, prevState);
        }
    }

    is(state) {
        return this.current === state;
    }

    onChange(callback) {
        this.listeners.push(callback);
    }
}