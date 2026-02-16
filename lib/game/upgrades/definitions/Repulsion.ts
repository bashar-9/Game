import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const Repulsion: Upgrade = {
    id: 'repulsion',
    count: 0,
    name: 'REPULSION FIELD',
    desc: 'Pushes enemies. DMG scales with MAX HP. Rate scales with REGEN.',
    stat: '+Range/Force/Dmg',
    icon: 'radius_rejection',
    maxLevel: 10,
    type: 'weapon',
    scalesWith: ['damage', 'maxhp', 'regen', 'size', 'critChance', 'critDamage'],
    apply: (p: IPlayer) => p.repulsionLevel++,
    evoName: 'NOVA WAVE',
    evoDesc: 'EVOLUTION: Massive Radius & Double damage.',
    evoApply: (p: IPlayer) => { p.repulsionLevel += 5; },
    getCurrentStat: (c) => `Level ${c + (Math.floor(c / 5) * 4)}`,
    isMaxed: (p: IPlayer) => Repulsion.count >= Repulsion.maxLevel
};
