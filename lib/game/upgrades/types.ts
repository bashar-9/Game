import { IPlayer } from '../types';

export type UpgradeType = 'weapon' | 'stat';

export interface Upgrade {
    id: string;
    count: number;
    name: string;
    desc: string;
    stat: string;
    maxLevel: number;
    icon: string;
    type: UpgradeType;
    scalesWith?: string[]; // For weapons: what stats affect them
    // We can't type 'p' as Player easily here without circular dep, using any or a simple interface
    apply: (p: IPlayer) => void;
    evoName?: string;
    evoDesc?: string;
    evoApply?: (p: IPlayer) => void;
    getCurrentStat?: (count: number) => string;
    isMaxed?: (p: IPlayer) => boolean;
}
