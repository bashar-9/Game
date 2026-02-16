import { DIFFICULTY_SETTINGS } from '../../config';
import { getDifficulty } from '../../utils';

export class DifficultyManager {
    difficulty: number = 1;
    diffMode: 'easy' | 'medium' | 'hard' = 'easy';

    constructor(diffMode: 'easy' | 'medium' | 'hard' = 'easy') {
        this.diffMode = diffMode;
    }

    update(gameTime: number) {
        this.difficulty = getDifficulty(gameTime);
    }

    getSettings() {
        return DIFFICULTY_SETTINGS[this.diffMode];
    }

    getHPScale(baseHp: number, playerLevel: number): number {
        const settings = this.getSettings();
        const levelMult = 1 + (playerLevel * 0.1);
        const diffScale = 1 + (Math.max(0, this.difficulty - 1) * 0.7);
        return baseHp * diffScale * settings.hpMult * levelMult;
    }

    getXPValue(baseXp: number): number {
        return Math.floor(baseXp * (1 + (this.difficulty * 0.35)));
    }

    getDamage(baseDamage: number): number {
        const settings = this.getSettings();
        return baseDamage * settings.dmgMult * (1 + (this.difficulty * 0.15));
    }
}
