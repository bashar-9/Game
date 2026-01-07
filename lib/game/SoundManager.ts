export type SoundName =
    | 'shoot'
    | 'explosion'
    | 'collect'
    | 'damage'
    | 'game_over'
    | 'background'
    | 'level_up'
    | 'upgrade_select'
    | 'upgrade_reroll'
    | 'evolution'
    | 'menu_open'
    | 'menu_bgm'
    | 'powerup'; // Fallback for now

export type AudioCategory = 'master' | 'music' | 'sfx' | 'ui';

interface AudioChannel {
    volume: number;
    muted: boolean;
}

interface ActiveSound {
    source: AudioBufferSourceNode;
    startTime: number;
}

class SoundManager {
    private context: AudioContext | null = null;
    private buffers: Map<SoundName, AudioBuffer> = new Map();
    private activeSounds: Map<SoundName, ActiveSound[]> = new Map();
    private channels: Record<AudioCategory, AudioChannel> = {
        master: { volume: 1.0, muted: false },
        music: { volume: 0.6, muted: false },
        sfx: { volume: 0.8, muted: false },
        ui: { volume: 1.0, muted: false }
    };

    private gainNodes: Record<AudioCategory, GainNode | null> = {
        master: null,
        music: null,
        sfx: null,
        ui: null
    };

    private bgmSource: AudioBufferSourceNode | null = null;
    private menuBgmSource: AudioBufferSourceNode | null = null;

    private assets: Record<SoundName, string> = {
        shoot: '/sounds/shoot.mp3',
        explosion: '/sounds/explosion.mp3',
        collect: '/sounds/collect.mp3',
        damage: '/sounds/damage.mp3',
        game_over: '/sounds/game_over.mp3',
        background: '/sounds/background.mp3',
        level_up: '/sounds/level_up.mp3',
        upgrade_select: '/sounds/upgrade_select.mp3',
        upgrade_reroll: '/sounds/upgrade_reroll.mp3',
        evolution: '/sounds/evolution.mp3',
        menu_open: '/sounds/menu_open.mp3',
        menu_bgm: '/sounds/menu_bgm.mp3',
        powerup: '/sounds/collect.mp3', // Fallback
    };

    // Concurrency limits per sound
    private concurrencyLimits: Partial<Record<SoundName, number>> = {
        shoot: 5,
        explosion: 8,
        collect: 10,
        damage: 3
    };

    constructor() {
        if (typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.context = new AudioContextClass();
                this.setupGainNodes();
            }
        }
    }

    private setupGainNodes() {
        if (!this.context) return;

        // Master Gain
        this.gainNodes.master = this.context.createGain();
        this.gainNodes.master.connect(this.context.destination);

        // Category Gains
        (['music', 'sfx', 'ui'] as const).forEach(cat => {
            const node = this.context!.createGain();
            node.connect(this.gainNodes.master!);
            this.gainNodes[cat] = node;
        });

        this.updateVolumes();
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
                console.warn(`[SoundManager] Failed to load sound: ${name}`, error);
            }
        });

        await Promise.all(loadPromises);
    }

    public play(name: SoundName, category: AudioCategory = 'sfx', volumeScale: number = 1.0, loop: boolean = false, pitchVariance: number = 0): AudioBufferSourceNode | undefined {
        if (!this.context) {
            console.warn('[SoundManager] Context not initialized');
            return;
        }
        if (!this.buffers.has(name)) {
            console.warn(`[SoundManager] Sound not found: ${name}`);
            return;
        }

        // Check master mute or category mute
        if (this.channels.master.muted || this.channels[category].muted) return;


        // Auto-resume context if suspended
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        // Concurrency Check
        const limit = this.concurrencyLimits[name];
        if (limit) {
            const active = this.activeSounds.get(name) || [];
            // cleanup finished sounds
            const now = this.context.currentTime;
            // simple cleanup by checking if sound likely finished?
            // Actually, we can just remove old ones if we exceed limit
            if (active.length >= limit) {
                // Stop the oldest one
                const oldest = active.shift();
                if (oldest) {
                    try { oldest.source.stop(); } catch (e) { }
                }
            }
            this.activeSounds.set(name, active);
        }

        const source = this.context.createBufferSource();
        source.buffer = this.buffers.get(name)!;
        source.loop = loop;

        // Pitch variance
        if (pitchVariance > 0) {
            const variance = (Math.random() * pitchVariance * 2) - pitchVariance; // +/- variance
            source.playbackRate.value = 1.0 + variance;
        }

        const gain = this.context.createGain();
        gain.gain.value = volumeScale;

        // Connect to category gain node
        const categoryNode = this.gainNodes[category];
        if (categoryNode) {
            source.connect(gain);
            gain.connect(categoryNode);
        } else {
            // Fallback to master if category fails
            source.connect(gain);
            gain.connect(this.gainNodes.master!);
        }

        source.start(0);

        // Track active sound
        if (limit) {
            const active = this.activeSounds.get(name) || [];
            active.push({ source, startTime: this.context.currentTime });
            // Clean up reference when done
            source.onended = () => {
                const current = this.activeSounds.get(name) || [];
                const idx = current.findIndex(s => s.source === source);
                if (idx !== -1) {
                    current.splice(idx, 1);
                    this.activeSounds.set(name, current);
                }
            };
            this.activeSounds.set(name, active);
        }

        if (loop) return source;
    }

    public playBGM(volume: number = 0.5) {
        if (this.bgmSource) return;
        this.channels.music.volume = volume; // Set initial volume pref
        this.updateVolumes();
        this.bgmSource = this.play('background', 'music', 1.0, true) || null;
    }

    public stopBGM() {
        if (this.bgmSource) {
            try { this.bgmSource.stop(); } catch (e) { }
            this.bgmSource = null;
        }
    }

    public playMenuBGM(volume: number = 0.5) {
        if (this.menuBgmSource) return;
        // Don't play if regular BGM is playing (failsafe)
        if (this.bgmSource) return;

        this.channels.music.volume = volume;
        this.updateVolumes();
        this.menuBgmSource = this.play('menu_bgm', 'music', 1.0, true) || null;
    }

    public stopMenuBGM() {
        if (this.menuBgmSource) {
            try { this.menuBgmSource.stop(); } catch (e) { }
            this.menuBgmSource = null;
        }
    }

    public setVolume(category: AudioCategory, volume: number) {
        this.channels[category].volume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    public toggleMute(category: AudioCategory = 'master') {
        this.channels[category].muted = !this.channels[category].muted;
        this.updateVolumes();
        return this.channels[category].muted;
    }

    public getChannelState(category: AudioCategory) {
        return this.channels[category];
    }

    private updateVolumes() {
        if (!this.context) return;

        // Master
        if (this.gainNodes.master) {
            this.gainNodes.master.gain.value = this.channels.master.muted ? 0 : this.channels.master.volume;
        }

        // Categories
        (['music', 'sfx', 'ui'] as const).forEach(cat => {
            if (this.gainNodes[cat]) {
                this.gainNodes[cat]!.gain.value = this.channels[cat].muted ? 0 : this.channels[cat].volume;
            }
        });
    }
}

export const soundManager = new SoundManager();
