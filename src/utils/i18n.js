import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from '../../public/locales/en/translation.json';
import translationES from '../../public/locales/es/translation.json';
// the translations

const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

// Only initialize if not already initialized
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      debug: false, // Disable debug to reduce console noise
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false // not needed for react as it escapes by default
      }
    });
}

export default i18n;
