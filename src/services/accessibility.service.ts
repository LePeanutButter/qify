export interface AccessibilityPreferences {
  theme: 'light' | 'dark';
  contrast: 'normal' | 'high';
  textSize: 'normal' | 'large';
  motion: 'normal' | 'reduced';
}

const STORAGE_KEY = 'qify-accessibility';
const defaults: AccessibilityPreferences = {
  theme: 'dark',
  contrast: 'normal',
  textSize: 'normal',
  motion: 'normal'
};

export function getAccessibilityPreferences(): AccessibilityPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<AccessibilityPreferences>;
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

export function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  const root = document.documentElement;
  root.dataset['theme'] = preferences.theme;
  root.dataset['contrast'] = preferences.contrast;
  root.dataset['textSize'] = preferences.textSize;
  root.dataset['motion'] = preferences.motion;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function updateAccessibilityPreference(
  key: keyof AccessibilityPreferences,
  value: AccessibilityPreferences[typeof key]
): AccessibilityPreferences {
  const preferences = { ...getAccessibilityPreferences(), [key]: value };
  applyAccessibilityPreferences(preferences);
  return preferences;
}
