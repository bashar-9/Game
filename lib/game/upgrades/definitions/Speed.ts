import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const Speed: Upgrade = {
    id: 'speed',
    count: 0,
    name: 'MOVE SPEED',
    desc: 'Increases movement speed.',
    stat: '+15% Move Speed',
    icon: 'bus_velocity',
    maxLevel: 10,
    type: 'stat',
    apply: (p: IPlayer) => p.speed *= 1.15,
    evoName: 'HYPERTHREADING',
    evoDesc: 'EVOLUTION: Massive Speed + Max HP.',
    evoApply: (p: IPlayer) => {
        p.speed *= 1.4;
        p.maxHp += 50;
        p.hp += 50;
    },
    getCurrentStat: (c) => {
        const evos = Math.floor(c / 5);
        const normal = c - evos;
        const mult = Math.pow(1.15, normal) * Math.pow(1.4, evos);
        return `+${Math.round((mult - 1) * 100)}% Speed`;
    },
    isMaxed: (p: IPlayer) => Speed.count >= Speed.maxLevel
};
