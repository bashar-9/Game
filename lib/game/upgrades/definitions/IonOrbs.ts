import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const IonOrbs: Upgrade = {
    id: 'ion_orbs',
    count: 0,
    name: 'ION ORBS',
    desc: 'Orbiting plasma. Scales with COUNT, SIZE, SPEED.',
    stat: '+1 Orb / Speed',
    icon: 'atom_orbit',
    maxLevel: 10,
    type: 'weapon',
    scalesWith: ['multishot', 'size', 'speed', 'damage'],
    apply: (p: IPlayer) => {
        if (!p.ionOrbsLevel) p.ionOrbsLevel = 0;
        p.ionOrbsLevel++;
    },
    evoName: 'ELECTRON CLOUD',
    evoDesc: 'EVOLUTION: Double Orbs & High Speed.',
    evoApply: (p: IPlayer) => {
        if (!p.ionOrbsLevel) p.ionOrbsLevel = 0;
        p.ionOrbsLevel += 5;
    },
    getCurrentStat: (c) => `Level ${c}`,
    isMaxed: (p: IPlayer) => IonOrbs.count >= IonOrbs.maxLevel
};
