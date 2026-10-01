import { create } from 'zustand';

export type ProfileType =
  | 'visual_impairment'
  | 'low_vision'
  | 'blind'
  | 'motor'
  | 'dyslexia'
  | 'cognitive'
  | 'adhd'
  | 'epilepsy'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia';

type DaltonismMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromatic';
type CursorSize = 'default' | 'medium' | 'large';
type CursorColor = 'default' | 'black' | 'white' | 'yellow';
type GuideMode = 'none' | 'line' | 'mask' | 'spotlight';
type TextAlignMode = 'default' | 'left' | 'center' | 'right' | 'justify';
export type WidgetPosition = 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'center-right' | 'bottom-right';

export interface A11yPreferences {
  activeProfiles: ProfileType[];
  widgetPosition: WidgetPosition;
  highContrast: number;
  invertColors: boolean;
  daltonism: DaltonismMode;
  saturation: number;
  brightness: number;
  hideImages: boolean;
  textSize: number;
  pageScale: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  textAlign: TextAlignMode;
  dyslexiaFont: boolean;
  legibleFont: boolean;
  readingMode: boolean;
  highlightTitles: boolean;
  highlightLinks: boolean;
  highlightButtons: boolean;
  keyboardTips: boolean;
  hoverFocus: boolean;
  cursorSize: CursorSize;
  cursorColor: CursorColor;
  readingGuide: GuideMode;
  reduceMotion: boolean;
  pauseAnimations: boolean;
  ttsEnabled: boolean;
  ttsSpeed: number;
  muteMedia: boolean;
}

type MutablePreferenceKey = Exclude<keyof A11yPreferences, 'activeProfiles'>;

export interface A11yState extends A11yPreferences {
  toggleProfile: (profile: ProfileType) => void;
  updateValue: <Key extends MutablePreferenceKey>(key: Key, value: A11yPreferences[Key]) => void;
  resetAll: () => void;
  hydrateSettings: (settings: unknown) => void;
}

const initialPreferences: A11yPreferences = {
  activeProfiles: [],
  widgetPosition: 'center-left',
  highContrast: 0,
  invertColors: false,
  daltonism: 'none',
  saturation: 100,
  brightness: 100,
  hideImages: false,
  textSize: 100,
  pageScale: 100,
  lineHeight: 0,
  letterSpacing: 0,
  wordSpacing: 0,
  textAlign: 'default',
  dyslexiaFont: false,
  legibleFont: false,
  readingMode: false,
  highlightTitles: false,
  highlightLinks: false,
  highlightButtons: false,
  keyboardTips: false,
  hoverFocus: false,
  cursorSize: 'default',
  cursorColor: 'default',
  readingGuide: 'none',
  reduceMotion: false,
  pauseAnimations: false,
  ttsEnabled: false,
  ttsSpeed: 100,
  muteMedia: false,
};

const PROFILE_TYPES: ProfileType[] = [
  'visual_impairment', 'low_vision', 'blind', 'motor', 'dyslexia', 'cognitive',
  'adhd', 'epilepsy', 'protanopia', 'deuteranopia', 'tritanopia',
];
const WIDGET_POSITIONS: WidgetPosition[] = [
  'top-left', 'center-left', 'bottom-left', 'top-right', 'center-right', 'bottom-right',
];
const DALTONISM_MODES: DaltonismMode[] = ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'monochromatic'];
const TEXT_ALIGN_MODES: TextAlignMode[] = ['default', 'left', 'center', 'right', 'justify'];
const CURSOR_SIZES: CursorSize[] = ['default', 'medium', 'large'];
const CURSOR_COLORS: CursorColor[] = ['default', 'black', 'white', 'yellow'];
const GUIDE_MODES: GuideMode[] = ['none', 'line', 'mask', 'spotlight'];

const BOOLEAN_KEYS = [
  'invertColors', 'hideImages', 'dyslexiaFont', 'legibleFont', 'readingMode',
  'highlightTitles', 'highlightLinks', 'highlightButtons', 'keyboardTips',
  'hoverFocus', 'reduceMotion', 'pauseAnimations', 'ttsEnabled', 'muteMedia',
] as const satisfies readonly (keyof A11yPreferences)[];

const NUMBER_RANGES = {
  highContrast: [0, 100],
  saturation: [0, 200],
  brightness: [50, 150],
  textSize: [100, 200],
  pageScale: [100, 200],
  lineHeight: [0, 10],
  letterSpacing: [0, 10],
  wordSpacing: [0, 10],
  ttsSpeed: [50, 500],
} as const;

const PROFILE_SETTINGS: Record<ProfileType, Partial<A11yPreferences>> = {
  visual_impairment: { highContrast: 40, textSize: 115, cursorSize: 'large' },
  low_vision: { highContrast: 20, textSize: 120, pageScale: 110, cursorSize: 'large' },
  blind: { ttsEnabled: true, highlightLinks: true, keyboardTips: true, hideImages: true },
  motor: { keyboardTips: true, cursorSize: 'large', pauseAnimations: true, reduceMotion: true },
  dyslexia: { dyslexiaFont: true, letterSpacing: 2, lineHeight: 5, readingGuide: 'line', textAlign: 'left' },
  cognitive: { readingMode: true, legibleFont: true, pauseAnimations: true, reduceMotion: true, textAlign: 'left' },
  adhd: { readingGuide: 'mask', reduceMotion: true, pauseAnimations: true, hideImages: true },
  epilepsy: { pauseAnimations: true, reduceMotion: true, brightness: 90, saturation: 90, muteMedia: true },
  protanopia: { daltonism: 'protanopia' },
  deuteranopia: { daltonism: 'deuteranopia' },
  tritanopia: { daltonism: 'tritanopia' },
};

export function sanitizeA11yPreferences(settings: unknown): Partial<A11yPreferences> {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
  const source = settings as Record<string, unknown>;
  const sanitized: Partial<A11yPreferences> = {};

  if (Array.isArray(source.activeProfiles)) {
    sanitized.activeProfiles = source.activeProfiles
      .filter((profile): profile is ProfileType => typeof profile === 'string' && PROFILE_TYPES.includes(profile as ProfileType))
      .slice(0, PROFILE_TYPES.length);
  }
  if (typeof source.widgetPosition === 'string' && WIDGET_POSITIONS.includes(source.widgetPosition as WidgetPosition)) {
    sanitized.widgetPosition = source.widgetPosition as WidgetPosition;
  }
  if (typeof source.daltonism === 'string' && DALTONISM_MODES.includes(source.daltonism as DaltonismMode)) {
    sanitized.daltonism = source.daltonism as DaltonismMode;
  }
  if (typeof source.textAlign === 'string' && TEXT_ALIGN_MODES.includes(source.textAlign as TextAlignMode)) {
    sanitized.textAlign = source.textAlign as TextAlignMode;
  }
  if (typeof source.cursorSize === 'string' && CURSOR_SIZES.includes(source.cursorSize as CursorSize)) {
    sanitized.cursorSize = source.cursorSize as CursorSize;
  }
  if (typeof source.cursorColor === 'string' && CURSOR_COLORS.includes(source.cursorColor as CursorColor)) {
    sanitized.cursorColor = source.cursorColor as CursorColor;
  }
  if (typeof source.readingGuide === 'string' && GUIDE_MODES.includes(source.readingGuide as GuideMode)) {
    sanitized.readingGuide = source.readingGuide as GuideMode;
  }

  for (const key of BOOLEAN_KEYS) {
    if (typeof source[key] === 'boolean') {
      (sanitized as Record<string, unknown>)[key] = source[key];
    }
  }
  for (const [key, range] of Object.entries(NUMBER_RANGES)) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      (sanitized as Record<string, unknown>)[key] = Math.min(range[1], Math.max(range[0], value));
    }
  }

  return sanitized;
}

export function serializeA11yPreferences(state: A11yState): A11yPreferences {
  const serialized = sanitizeA11yPreferences(state);
  return { ...initialPreferences, ...serialized };
}

export const useAccessibilityStore = create<A11yState>()((set) => ({
  ...initialPreferences,

  updateValue: (key, value) => set((state) => ({ ...state, [key]: value, activeProfiles: [] })),

  toggleProfile: (profile) => set((state) => {
    const isDaltonism = ['protanopia', 'deuteranopia', 'tritanopia'].includes(profile);
    const isActive = state.activeProfiles.includes(profile);
    let newProfiles = state.activeProfiles.filter((current) => current !== profile);

    if (!isActive) {
      if (isDaltonism) {
        newProfiles = newProfiles.filter((current) => !['protanopia', 'deuteranopia', 'tritanopia'].includes(current));
      }
      newProfiles.push(profile);
    }

    const newSettings: Partial<A11yPreferences> = {
      ...initialPreferences,
      widgetPosition: state.widgetPosition,
      activeProfiles: newProfiles,
    };
    newProfiles.forEach((current) => Object.assign(newSettings, PROFILE_SETTINGS[current]));
    return newSettings;
  }),

  resetAll: () => set({ ...initialPreferences, activeProfiles: [] }),

  hydrateSettings: (settings) => set((state) => ({
    ...state,
    ...sanitizeA11yPreferences(settings),
  })),
}));
