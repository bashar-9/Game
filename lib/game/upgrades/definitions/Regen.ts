import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const Regen: Upgrade = {
    id: 'regen',
    count: 0,
    name: 'REGEN',
    desc: 'Repairs health over time.',
    stat: '+5 HP / Sec',
    icon: 'sector_rebuild',
    maxLevel: 10,
    type: 'stat',
    apply: (p: IPlayer) => p.regen += 5,
    evoName: 'RAPID REPAIR',
    evoDesc: 'EVOLUTION: +5 Regeneration/sec.',
    evoApply: (p: IPlayer) => p.regen += 5,
    getCurrentStat: (c) => `+${c * 5} HP/s`,
    isMaxed: (p: IPlayer) => Regen.count >= Regen.maxLevel
};
