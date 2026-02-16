import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const Multishot: Upgrade = {
    id: 'multishot',
    count: 0,
    name: 'MULTISHOT',
    desc: 'Adds an additional projectile.',
    stat: '+1 Projectile',
    icon: 'fork_process',
    maxLevel: 15,
    type: 'stat',
    apply: (p: IPlayer) => p.projectileCount++,
    evoName: 'MULTISHOT II',
    evoDesc: 'EVOLUTION: +2 Projectiles instantly.',
    evoApply: (p: IPlayer) => p.projectileCount += 2,
    getCurrentStat: (c) => `+${c + Math.floor(c / 5)} Proj`,
    isMaxed: (p: IPlayer) => Multishot.count >= Multishot.maxLevel
};
