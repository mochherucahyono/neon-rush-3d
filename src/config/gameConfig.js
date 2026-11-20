export const GAME_CONFIG = {
    track: {
        laneWidth: 2.2,
        segmentLength: 10,
        poolSize: 12,
        fogStart: 45,
        fogEnd: 95
    },
    player: {
        baseY: 0.6,
        slideY: 0.3,
        jumpForce: 15.5,
        gravity: -44,
        fastDropVelocity: -32,
        slideDuration: 0.55,
        laneLerpSpeed: 18,
        hitboxScale: {
            x: 0.78,
            y: 0.85,
            z: 0.78
        }
    },
    speed: {
        base: 18,
        max: 38,
        acceleration: 0.32
    },
    scoring: {
        distanceMultiplier: 0.5,
        coinValue: 10,
        highScoreKey: 'neon_rush_highscore'
    },
    spawn: {
        zPosition: 85,
        baseInterval: 22,
        maxInterval: 34,
        coinRowChance: 0.72,
        obstacleChance: 0.82,
        bonusCoinChance: 0.55
    },
    camera: {
        shakeDuration: 0.28,
        shakeMagnitude: 0.28
    }
};