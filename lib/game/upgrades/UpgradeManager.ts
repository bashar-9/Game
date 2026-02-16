import { Upgrade } from './types';
import { Multishot } from './definitions/Multishot';
import { Haste } from './definitions/Haste';
import { Damage } from './definitions/Damage';
import { Speed } from './definitions/Speed';
import { Pierce } from './definitions/Pierce';
import { MaxHP } from './definitions/MaxHP';
import { Regen } from './definitions/Regen';
import { BulletSize } from './definitions/BulletSize';
import { Repulsion } from './definitions/Repulsion';
import { IonOrbs } from './definitions/IonOrbs';
import { CritChance } from './definitions/CritChance';
import { CritDamage } from './definitions/CritDamage';

export class UpgradeManager {
    static upgrades: Upgrade[] = [
        Multishot,
        Haste,
        Damage,
        Speed,
        Pierce,
        MaxHP,
        Regen,
        BulletSize,
        Repulsion,
        IonOrbs,
        CritChance,
        CritDamage
    ];

    static getLabel() {
        return 'UpgradeManager';
    }

    static getAll(): Upgrade[] {
        return this.upgrades;
    }

    static getById(id: string): Upgrade | undefined {
        return this.upgrades.find(u => u.id === id);
    }

    static reset() {
        this.upgrades.forEach(u => u.count = 0);
    }
}
