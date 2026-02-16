import { Weapon } from './Weapon';
import { IPlayer, IEnemy } from '../types';
import { MainGun } from './MainGun';
import { IonOrbs } from './IonOrbs';
import { RepulsionField } from './RepulsionField';

export class WeaponManager {
    weapons: Weapon[] = [];
    mainGun: MainGun;
    ionOrbs: IonOrbs;
    repulsionField: RepulsionField;

    constructor(player: IPlayer) {
        this.mainGun = new MainGun(player);
        this.ionOrbs = new IonOrbs(player);
        this.repulsionField = new RepulsionField(player);

        // We can add them to a list for generic iteration, or call them explicitly to control order/logic
        this.weapons = [this.mainGun, this.ionOrbs, this.repulsionField];
    }

    update(delta: number, enemies: IEnemy[], frameCount: number, worldWidth: number, worldHeight: number, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void) {
        for (const weapon of this.weapons) {
            weapon.update(delta, enemies, frameCount, worldWidth, worldHeight, spawnBullet);
        }
    }
}
