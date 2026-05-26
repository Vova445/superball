import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MATCHMAKING_REGIONS = ['Europe', 'North America', 'South America', 'Asia'] as const;
export const DISPLAY_MODES = ['Fullscreen', 'Borderless', 'Windowed'] as const;
export const QUALITY_PRESETS = ['Low', 'Medium', 'High', 'Ultra'] as const;

export type MatchmakingRegion = (typeof MATCHMAKING_REGIONS)[number];
export type DisplayMode = (typeof DISPLAY_MODES)[number];
export type QualityPreset = (typeof QUALITY_PRESETS)[number];
export type ControlAction = 'up' | 'down' | 'left' | 'right' | 'sprint' | 'pass' | 'shoot' | 'dash';

export type KeyBinding = {
  code: string;
  key: string;
  keyCode: number;
};

export type ControlBindings = Record<ControlAction, KeyBinding>;

export const DEFAULT_CONTROL_BINDINGS: ControlBindings = {
  up: { code: 'ArrowUp', key: 'ArrowUp', keyCode: 38 },
  down: { code: 'ArrowDown', key: 'ArrowDown', keyCode: 40 },
  left: { code: 'ArrowLeft', key: 'ArrowLeft', keyCode: 37 },
  right: { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39 },
  sprint: { code: 'ShiftLeft', key: 'Shift', keyCode: 16 },
  pass: { code: 'KeyA', key: 'a', keyCode: 65 },
  shoot: { code: 'Space', key: ' ', keyCode: 32 },
  dash: { code: 'KeyD', key: 'd', keyCode: 68 },
};

interface SettingsState {
  region: MatchmakingRegion;
  displayMode: DisplayMode;
  quality: QualityPreset;
  brightness: number;
  contrast: number;
  vsync: boolean;
  motionBlur: boolean;
  controls: ControlBindings;
  lastNonFullscreenDisplayMode: Exclude<DisplayMode, 'Fullscreen'>;
  setRegion: (region: string) => void;
  setDisplayMode: (displayMode: string) => void;
  setQuality: (quality: string) => void;
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  setVsync: (vsync: boolean) => void;
  setMotionBlur: (motionBlur: boolean) => void;
  setControlBinding: (action: ControlAction, binding: KeyBinding) => void;
  resetControlBindings: () => void;
  syncFullscreenExit: () => void;
}

export function normalizeRegion(region: string | null | undefined): MatchmakingRegion {
  const match = MATCHMAKING_REGIONS.find((item) => item === region);
  return match ?? 'Europe';
}

export function regionToRoomSlug(region: string): string {
  return normalizeRegion(region).toLowerCase().replace(/\s+/g, '-');
}

export function normalizeDisplayMode(displayMode: string | null | undefined): DisplayMode {
  const match = DISPLAY_MODES.find((item) => item === displayMode);
  return match ?? 'Borderless';
}

export function normalizeQuality(quality: string | null | undefined): QualityPreset {
  const match = QUALITY_PRESETS.find((item) => item === quality);
  return match ?? 'High';
}

export function qualityToRenderConfig(quality: string) {
  const preset = normalizeQuality(quality);

  if (preset === 'Low') {
    return {
      antialias: false,
      antialiasGL: false,
      pixelArt: true,
      roundPixels: true,
      desynchronized: true,
      powerPreference: 'low-power' as WebGLPowerPreference,
    };
  }

  if (preset === 'Medium') {
    return {
      antialias: false,
      antialiasGL: false,
      pixelArt: false,
      roundPixels: true,
      desynchronized: true,
      powerPreference: 'default' as WebGLPowerPreference,
    };
  }

  return {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    desynchronized: true,
    powerPreference: 'high-performance' as WebGLPowerPreference,
  };
}

export function normalizeVisualValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function visualValueToCssAmount(value: number): number {
  return 0.5 + normalizeVisualValue(value) / 100;
}

export function visualFilterToCss(brightness: number, contrast: number): string {
  return `brightness(${visualValueToCssAmount(brightness)}) contrast(${visualValueToCssAmount(contrast)})`;
}

export function vsyncToFpsConfig(vsync: boolean) {
  return vsync
    ? {
        forceSetTimeOut: false,
        limit: 0,
        target: 60,
      }
    : {
        forceSetTimeOut: true,
        limit: 144,
        target: 144,
      };
}

export function normalizeKeyBinding(binding: KeyBinding | undefined, fallback: KeyBinding): KeyBinding {
  if (!binding || typeof binding.keyCode !== 'number' || !binding.code || !binding.key) {
    return fallback;
  }

  return binding;
}

export function normalizeControlBindings(bindings: Partial<ControlBindings> | undefined): ControlBindings {
  return {
    up: normalizeKeyBinding(bindings?.up, DEFAULT_CONTROL_BINDINGS.up),
    down: normalizeKeyBinding(bindings?.down, DEFAULT_CONTROL_BINDINGS.down),
    left: normalizeKeyBinding(bindings?.left, DEFAULT_CONTROL_BINDINGS.left),
    right: normalizeKeyBinding(bindings?.right, DEFAULT_CONTROL_BINDINGS.right),
    sprint: normalizeKeyBinding(bindings?.sprint, DEFAULT_CONTROL_BINDINGS.sprint),
    pass: normalizeKeyBinding(bindings?.pass, DEFAULT_CONTROL_BINDINGS.pass),
    shoot: normalizeKeyBinding(bindings?.shoot, DEFAULT_CONTROL_BINDINGS.shoot),
    dash: normalizeKeyBinding(bindings?.dash, DEFAULT_CONTROL_BINDINGS.dash),
  };
}

export function formatKeyBinding(binding: KeyBinding): string {
  if (binding.code === 'Space') return 'Space';
  if (binding.key === ' ') return 'Space';
  if (binding.key.startsWith('Arrow')) return binding.key.replace('Arrow', '');
  if (binding.key.length === 1) return binding.key.toUpperCase();
  return binding.key;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      region: 'Europe',
      displayMode: 'Borderless',
      quality: 'High',
      brightness: 50,
      contrast: 50,
      vsync: true,
      motionBlur: false,
      controls: DEFAULT_CONTROL_BINDINGS,
      lastNonFullscreenDisplayMode: 'Borderless',
      setRegion: (region) => set({ region: normalizeRegion(region) }),
      setDisplayMode: (displayMode) =>
        set((state) => {
          const nextDisplayMode = normalizeDisplayMode(displayMode);

          return {
            displayMode: nextDisplayMode,
            lastNonFullscreenDisplayMode:
              nextDisplayMode === 'Fullscreen'
                ? state.lastNonFullscreenDisplayMode
                : nextDisplayMode,
            };
        }),
      setQuality: (quality) => set({ quality: normalizeQuality(quality) }),
      setBrightness: (brightness) => set({ brightness: normalizeVisualValue(brightness) }),
      setContrast: (contrast) => set({ contrast: normalizeVisualValue(contrast) }),
      setVsync: (vsync) => set({ vsync }),
      setMotionBlur: (motionBlur) => set({ motionBlur }),
      setControlBinding: (action, binding) =>
        set((state) => ({
          controls: normalizeControlBindings({
            ...state.controls,
            [action]: binding,
          }),
        })),
      resetControlBindings: () => set({ controls: DEFAULT_CONTROL_BINDINGS }),
      syncFullscreenExit: () =>
        set((state) =>
          state.displayMode === 'Fullscreen'
            ? { displayMode: state.lastNonFullscreenDisplayMode }
            : state
        ),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        region: state.region,
        displayMode: state.displayMode,
        quality: state.quality,
        brightness: state.brightness,
        contrast: state.contrast,
        vsync: state.vsync,
        motionBlur: state.motionBlur,
        controls: state.controls,
        lastNonFullscreenDisplayMode: state.lastNonFullscreenDisplayMode,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<SettingsState>),
        controls: normalizeControlBindings((persistedState as Partial<SettingsState> | undefined)?.controls),
      }),
    }
  )
);
