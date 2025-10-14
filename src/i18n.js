import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@assets/locales/en.json';
import vi from '@assets/locales/vi.json';

// Configure i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: localStorage.getItem('language') || 'vi', // default language
    fallbackLng: 'en', // fallback language
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false, // disable suspense for SSR compatibility
    },
  });

export default i18n;
