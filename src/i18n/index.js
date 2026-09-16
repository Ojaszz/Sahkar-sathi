import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
];

const translations = { en, hi, mr };

let currentLanguage = 'en';

export function setLanguage(lang) {
  if (translations[lang]) currentLanguage = lang;
}

export function getLanguage() {
  return currentLanguage;
}

// Resolve a dotted key path, with {placeholder} interpolation.
export function t(key, params = {}) {
  const dict = translations[currentLanguage] || translations.en;
  let value = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), dict);

  if (value === undefined || value === null) {
    // fall back to english
    value = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), translations.en);
  }
  if (value === undefined || value === null) return key;

  let str = String(value);
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });
  return str;
}

// t() that also supports the "categoryName" dynamic pattern
export default t;
