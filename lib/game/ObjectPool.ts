export class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private resetFn: (obj: T) => void;

    constructor(factory: () => T, resetFn: (obj: T) => void) {
        this.factory = factory;
        this.resetFn = resetFn;
    }

    acquire(): T {
        if (this.pool.length > 0) {
            const obj = this.pool.pop()!;
            this.resetFn(obj);
            return obj;
        }
        return this.factory();
    }

    release(obj: T) {
        this.pool.push(obj);
    }

    clear() {
        this.pool = [];
    }

    get size(): number {
        return this.pool.length;
    }
}
