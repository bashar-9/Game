export type SoundName = 'shoot' | 'explosion' | 'collect' | 'damage' | 'game_over' | 'background';

class SoundManager {
    private context: AudioContext | null = null;
    private buffers: Map<SoundName, AudioBuffer> = new Map();
    private isMuted: boolean = false;
    private bgmSource: AudioBufferSourceNode | null = null;
    private gainNode: GainNode | null = null;

    private assets: Record<SoundName, string> = {
        shoot: '/sounds/shoot.ogg',
        explosion: '/sounds/explosion.ogg',
        collect: '/sounds/collect.ogg',
        damage: '/sounds/damage.ogg',
        game_over: '/sounds/game_over.ogg',
        background: '/sounds/background.ogg',
    };

    constructor() {
        if (typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.context = new AudioContextClass();
                this.gainNode = this.context.createGain();
                this.gainNode.connect(this.context.destination);
            }
        }
    }

    public async preload() {
        if (!this.context) return;

        const loadPromises = Object.entries(this.assets).map(async ([name, url]) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
                this.buffers.set(name as SoundName, audioBuffer);
            } catch (error) {
                console.warn(`Failed to load sound: ${name}`, error);
            }
        });

        await Promise.all(loadPromises);
    }

    public play(name: SoundName, volume: number = 0.5, loop: boolean = false) {
        if (!this.context || this.isMuted || !this.buffers.has(name)) return;

        // Auto-resume context if suspended (browser autoplay policy)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const source = this.context.createBufferSource();
        source.buffer = this.buffers.get(name)!;
        source.loop = loop;

        const gain = this.context.createGain();
        gain.gain.value = volume;

        source.connect(gain);
        gain.connect(this.gainNode!);

        source.start(0);

        if (loop) {
            return source; // Return source for seeking/stopping if needed, mainly for BGM
        }
    }

    public playBGM(volume: number = 0.05) {
        if (this.bgmSource) return; // Already playing
        const source = this.play('background', volume, true);
        if (source) {
            this.bgmSource = source;
        }
    }

    public stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource = null;
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.gainNode) {
            this.gainNode.gain.value = this.isMuted ? 0 : 1;
        }
        return this.isMuted;
    }
}

export const soundManager = new SoundManager();
