import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          description: {
            part1: 'Tokens',
            part2: 'Swap',
            part3: 'Fiat',
            part4: 'Addresses:',
            part5: 'Offers:',
            part6: 'Trustlines:',
            part7: 'Trades:',
            part8: 'Vol:',
            part9: 'Tokens Traded:',
            part10: 'Active Addresses:',
          }
        }
      },
      es: { // Add Spanish translations
        translation: {
          description: {
            part1: 'Tokens',
            part2: 'Intercambio',
            part3: 'Fíat',
            part4: 'Direcciones:',
            part5: 'Ofertas:',
            part6: 'Trustlines:',
            part7: 'Cambios:',
            part8: 'Vol:',
            part9: 'Tokens Cambiados:',
            part10: 'Direcciones Activa:',
          }
        }
      },
            
    }
  });

export default i18n;
