import { Upgrade } from '../types';
import { IPlayer } from '../../types';

export const MaxHP: Upgrade = {
    id: 'maxhp',
    count: 0,
    name: 'MAX HP',
    desc: 'Increases maximum health.',
    stat: '+150 Max HP',
    icon: 'encap_shielding',
    maxLevel: 15,
    type: 'stat',
    apply: (p: IPlayer) => {
        p.maxHp += 150;
        p.hp += 150;
    },
    evoName: 'IRON CORE',
    evoDesc: 'EVOLUTION: +75 Max HP & 50% Heal.',
    evoApply: (p: IPlayer) => {
        p.maxHp += 75;
        p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.5));
    },
    getCurrentStat: (c) => `+${(c * 150) - (Math.floor(c / 5) * 75)} HP`,
    isMaxed: (p: IPlayer) => MaxHP.count >= MaxHP.maxLevel
};
