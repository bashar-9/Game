// Camera system for scrollable world rendering

export class Camera {
    x: number = 0;
    y: number = 0;
    width: number;
    height: number;

    // Smoothing factor (0 = instant, higher = smoother/slower)
    private smoothing: number = 0.1;

    constructor(viewportWidth: number, viewportHeight: number) {
        this.width = viewportWidth;
        this.height = viewportHeight;
    }

    /**
     * Update camera position to follow target, clamped to world bounds.
     * @param targetX - Target X (typically player.x)
     * @param targetY - Target Y (typically player.y)
     * @param worldWidth - Total world width
     * @param worldHeight - Total world height
     */
    follow(targetX: number, targetY: number, worldWidth: number, worldHeight: number) {
        // Desired camera position (centered on target)
        const desiredX = targetX - this.width / 2;
        const desiredY = targetY - this.height / 2;

        // Smooth interpolation
        this.x += (desiredX - this.x) * this.smoothing;
        this.y += (desiredY - this.y) * this.smoothing;

        // Clamp to world bounds
        this.x = Math.max(0, Math.min(worldWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(worldHeight - this.height, this.y));
    }

    /**
     * Update viewport size (on window resize).
     */
    resize(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
    }

    /**
     * Check if a world-space rectangle is visible in the viewport.
     * Used for culling off-screen entities.
     */
    isVisible(x: number, y: number, w: number, h: number): boolean {
        return !(
            x + w < this.x ||
            x > this.x + this.width ||
            y + h < this.y ||
            y > this.y + this.height
        );
    }

    /**
     * Check if a world-space circle is visible in the viewport.
     */
    isCircleVisible(cx: number, cy: number, radius: number): boolean {
        return this.isVisible(cx - radius, cy - radius, radius * 2, radius * 2);
    }
}
