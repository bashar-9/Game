import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const Pierce: Upgrade = {
    id: 'pierce',
    count: 0,
    name: 'PIERCE',
    desc: 'Projectiles pass through enemies.',
    stat: '+1 Pierce',
    icon: 'pointer_piercers',
    maxLevel: 8,
    type: 'stat',
    apply: (p: IPlayer) => p.pierce++,
    evoName: 'SPECTRAL PIERCE',
    evoDesc: 'EVOLUTION: +3 Pierce & Velocity.',
    evoApply: (p: IPlayer) => {
        p.pierce += 3;
        p.bulletSpeed += 5;
    },
    getCurrentStat: (c) => `+${c + (Math.floor(c / 5) * 2)} Pierce`,
    isMaxed: (p: IPlayer) => Pierce.count >= Pierce.maxLevel
};
