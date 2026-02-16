import { Enemy } from '../Enemy';

export class BasicEnemy extends Enemy {
    constructor(canvasWidth: number, canvasHeight: number, playerLevel: number, diffMode: 'easy' | 'medium' | 'hard', diffLevel: number) {
        super('basic', canvasWidth, canvasHeight, playerLevel, diffMode, diffLevel);
    }
}
