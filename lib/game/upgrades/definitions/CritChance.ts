import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const CritChance: Upgrade = {
    id: 'critChance',
    count: 0,
    name: 'CRIT CHANCE',
    desc: 'Increases critical hit probability.',
    stat: '+25% Crit Chance',
    icon: 'heuristic_logic',
    maxLevel: 3,
    type: 'stat',
    apply: (p: IPlayer) => p.critChance = Math.min(1.0, p.critChance + 0.25),
    evoName: 'CERTAIN DOOM',
    evoDesc: 'MAX LEVEL: +25% Crit Chance.',
    evoApply: (p: IPlayer) => p.critChance = Math.min(1.0, p.critChance + 0.25),
    getCurrentStat: (c) => `+${Math.round(c * 25)}% Chance`,
    isMaxed: (p: IPlayer) => CritChance.count >= CritChance.maxLevel
};
