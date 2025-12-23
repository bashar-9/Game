
export const createNeonSprite = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        drawFn(ctx, width, height);
    }
    return canvas;
};

export const CACHED_SPRITES: Record<string, HTMLCanvasElement> = {};
