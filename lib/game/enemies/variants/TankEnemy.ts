import { Enemy } from '../Enemy';

export class TankEnemy extends Enemy {
    constructor(canvasWidth: number, canvasHeight: number, playerLevel: number, diffMode: 'easy' | 'medium' | 'hard', diffLevel: number) {
        super('tank', canvasWidth, canvasHeight, playerLevel, diffMode, diffLevel);
    }
}
