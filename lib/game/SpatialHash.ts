
export class SpatialHash<T extends { x: number, y: number, radius: number, id?: string }> {
    cellSize: number;
    // Map key "x,y" to Set of objects
    grid: Map<string, Set<T>>;

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    // Get the cell key for a given coordinate
    getKey(x: number, y: number): string {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    // Add an object to the grid
    add(obj: T) {
        // We add the object to ALL cells it overlaps with
        // Calculate min/max cells based on bounding box
        const startX = Math.floor((obj.x - obj.radius) / this.cellSize);
        const endX = Math.floor((obj.x + obj.radius) / this.cellSize);
        const startY = Math.floor((obj.y - obj.radius) / this.cellSize);
        const endY = Math.floor((obj.y + obj.radius) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                this.grid.get(key)!.add(obj);
            }
        }
    }

    // Clear the grid for next frame
    clear() {
        this.grid.clear();
    }

    // Query for objects near a point/object
    // Returns a Set to ensure unique fallback if checking multiple cells
    query(x: number, y: number, radius: number): Set<T> {
        const results = new Set<T>();

        const startX = Math.floor((x - radius) / this.cellSize);
        const endX = Math.floor((x + radius) / this.cellSize);
        const startY = Math.floor((y - radius) / this.cellSize);
        const endY = Math.floor((y + radius) / this.cellSize);

        for (let ix = startX; ix <= endX; ix++) {
            for (let iy = startY; iy <= endY; iy++) {
                const key = `${ix},${iy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const obj of cell) {
                        results.add(obj);
                    }
                }
            }
        }

        return results;
    }
}
