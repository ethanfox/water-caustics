/** Options for {@link mountWaterCaustics}. */
export type WaterCausticsOptions = {
  /** Brightness of the caustic ribbons. Default `0.85`. */
  intensity?: number;
  /** Animation speed multiplier. Default `1`. `0` freezes the pattern. */
  speed?: number;
  /** Spatial scale of the light network. Default `1`. */
  scale?: number;
  /** Highlight color as any CSS color. Default `#f4fff8`. */
  color?: string;
  /** Underwater wash color as any CSS color. Default `#2f7d88`. */
  tint?: string;
  /** Tint opacity from `0`–`1`. Default `0.06`. */
  tintStrength?: number;
  /** CSS `mix-blend-mode` on the overlay canvas. Default `screen`. */
  blendMode?: string;
  /** Cap for `devicePixelRatio`. Default `2`. */
  maxDpr?: number;
};

/** Live handle returned by {@link mountWaterCaustics}. */
export type WaterCausticsHandle = {
  canvas: HTMLCanvasElement;
  readonly paused: boolean;
  pause: () => void;
  resume: () => void;
  setOptions: (next: WaterCausticsOptions) => void;
  resize: () => void;
  destroy: () => void;
};

export type ResolvedOptions = {
  intensity: number;
  speed: number;
  scale: number;
  color: string;
  tint: string;
  tintStrength: number;
  blendMode: string;
  maxDpr: number;
};

export const DEFAULTS: ResolvedOptions = {
  intensity: 0.85,
  speed: 1,
  scale: 1,
  color: "#f4fff8",
  tint: "#2f7d88",
  tintStrength: 0.06,
  blendMode: "screen",
  maxDpr: 2,
};
