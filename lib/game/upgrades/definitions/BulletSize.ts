import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const BulletSize: Upgrade = {
    id: 'size',
    count: 0,
    name: 'BULLET SIZE',
    desc: 'Increases projectile size.',
    stat: '+1 Bullet Size',
    icon: 'buffer_expansion',
    maxLevel: 5,
    type: 'stat',
    apply: (p: IPlayer) => p.bulletSize += 1,
    evoName: 'MEGA ROUNDS',
    evoDesc: 'EVOLUTION: +2 Bullet Size.',
    evoApply: (p: IPlayer) => p.bulletSize += 2,
    getCurrentStat: (c) => `+${c + Math.floor(c / 5)} Size`,
    isMaxed: (p: IPlayer) => BulletSize.count >= BulletSize.maxLevel
};
