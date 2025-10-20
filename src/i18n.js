import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@assets/locales/en.json';
import vi from '@assets/locales/vi.json';

// Get browser language preference
const getBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0]; // Get 'en' from 'en-US'
  return ['en', 'vi'].includes(browserLang) ? browserLang : 'en';
};

// Get initial language
const getInitialLanguage = () => {
  const savedLang = localStorage.getItem('language');
  if (savedLang && ['en', 'vi'].includes(savedLang)) {
    return savedLang;
  }
  return getBrowserLanguage();
};

// Configure i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: getInitialLanguage(), // default language from localStorage or browser
    fallbackLng: 'en', // fallback language
    debug: false, // set to true for development
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false, // disable suspense for SSR compatibility
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.setAttribute('lang', lng);
});

// Set initial language attribute on html element
document.documentElement.setAttribute('lang', i18n.language);

export default i18n;
