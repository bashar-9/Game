import { Upgrade } from '../types';
import { IPlayer } from '../../types';
import { recalculatePlayerStats } from '../utils';

export const Haste: Upgrade = {
    id: 'haste',
    count: 0,
    name: 'ATTACK SPEED',
    desc: 'Increases firing rate.',
    stat: '+30% Attack Speed',
    icon: 'io_accelerator',
    maxLevel: 15,
    type: 'stat',
    apply: (p: IPlayer) => {
        p.modifiers.attackSpeed += 0.30;
        recalculatePlayerStats(p);
    },
    evoName: 'BURST MODE',
    evoDesc: 'EVOLUTION: Massive Attack Speed Boost.',
    evoApply: (p: IPlayer) => {
        p.modifiers.attackSpeed += 0.6;
        recalculatePlayerStats(p);
    },
    getCurrentStat: (c) => `+${Math.round((c + Math.floor(c / 5)) * 30)}% Speed`,
    isMaxed: (p: IPlayer) => Haste.count >= Haste.maxLevel
};
