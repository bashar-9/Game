import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const CritDamage: Upgrade = {
    id: 'critDamage',
    count: 0,
    name: 'CRIT DAMAGE',
    desc: 'Increases critical hit damage.',
    stat: '+15% Crit Dmg',
    icon: 'bitwise_burst',
    maxLevel: 10,
    type: 'stat',
    apply: (p: IPlayer) => p.critMultiplier += 0.15,
    evoName: 'FATAL ERROR',
    evoDesc: 'EVOLUTION: +30% Crit Dmg.',
    evoApply: (p: IPlayer) => p.critMultiplier += 0.30,
    getCurrentStat: (c) => `+${(c + Math.floor(c / 5)) * 15}% Dmg`,
    isMaxed: (p: IPlayer) => CritDamage.count >= CritDamage.maxLevel
};
