import { Upgrade } from '../types';
import { IPlayer } from '../../types';
import { recalculatePlayerStats } from '../utils';

export const Damage: Upgrade = {
    id: 'damage',
    count: 0,
    name: 'DAMAGE',
    desc: 'Increases projectile damage.',
    stat: '+25% Damage',
    icon: 'voltage_spike',
    maxLevel: 15,
    type: 'stat',
    apply: (p: IPlayer) => {
        p.modifiers.damage += 0.25;
        recalculatePlayerStats(p);
    },
    evoName: 'POWER SURGE',
    evoDesc: 'EVOLUTION: +50% Damage.',
    evoApply: (p: IPlayer) => {
        p.modifiers.damage += 0.5;
        recalculatePlayerStats(p);
    },
    getCurrentStat: (c) => `+${(c + Math.floor(c / 5)) * 25}% Dmg`,
    isMaxed: (p: IPlayer) => Damage.count >= Damage.maxLevel
};
