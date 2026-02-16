import { CONFIG, POWERUP_DURATIONS } from '../config';
import { IPlayer } from './types';
import { soundManager } from './SoundManager';


type PickupType = 'xp' | 'powerup';
// Helper type from Player (need to import or redeclare if circular dep issue, but TS should handle import type)
// We will use string for loose coupling or cast
type PowerupType = 'double_stats' | 'invulnerability' | 'magnet';

export class Pickup {
    x: number;
    y: number;
    value: number;
    magnetized: boolean;
    dead: boolean;

    tier: number; // 1, 2, or 3
    type: PickupType;
    powerupType?: PowerupType;

    constructor(x: number, y: number, value: number, tier: number = 1, type: PickupType = 'xp', powerupType?: PowerupType) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.tier = tier;
        this.type = type;
        this.powerupType = powerupType;
        this.magnetized = false;
        this.dead = false;
    }

    update(player: IPlayer, delta: number = 1) { // Type 'any' for now to avoid circular dependency
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < player.pickupRange) this.magnetized = true;

        if (this.magnetized) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const speed = 14 * delta;
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
            if (dist < player.radius + 10) {
                if (this.type === 'powerup' && this.powerupType) {
                    // Get upgraded duration from store
                    // We dynamically import or use the store directly since it's a static method on the store hooks
                    // Ideally we import it at the top, let's fix imports first
                    const { usePowerUpProgressionStore } = require('../../store/PowerUpProgressionStore');
                    let duration = usePowerUpProgressionStore.getState().getPowerUpDuration(this.powerupType);

                    // We need to cast player to Player class to use applyPowerup
                    // ideally IPlayer interface should have it, but for now:
                    if ((player as any).applyPowerup) {
                        (player as any).applyPowerup(this.powerupType, duration);
                    }
                    soundManager.play('powerup', 'sfx', 0.5); // Unified powerup sound
                } else {
                    player.gainXp(this.value);
                    // Low volume for XP, slight pitch variance to make it sparkly
                    soundManager.play('collect', 'sfx', 0.15, false, 0.1);
                }
                this.dead = true;
            }
        }
    }



}
