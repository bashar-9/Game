import { Enemy } from '../Enemy';

export class SwarmEnemy extends Enemy {
    constructor(canvasWidth: number, canvasHeight: number, playerLevel: number, diffMode: 'easy' | 'medium' | 'hard', diffLevel: number) {
        super('swarm', canvasWidth, canvasHeight, playerLevel, diffMode, diffLevel);
    }
}
