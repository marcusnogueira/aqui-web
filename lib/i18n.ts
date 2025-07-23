import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// No inline resources - will be loaded from files

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en', // Set default language for SSR
    debug: process.env.NODE_ENV === 'development',
    
    // Namespace configuration
    ns: ['common', 'about', 'faq', 'explore', 'dashboard', 'vendor', 'search'],
    defaultNS: 'common',
    
    interpolation: { 
      escapeValue: false 
    },
    
    react: {
      useSuspense: false, // Disable suspense to prevent hydration issues
    },
    
    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: typeof window !== 'undefined' ? ['localStorage', 'navigator', 'htmlTag'] : [],
      caches: typeof window !== 'undefined' ? ['localStorage'] : [],
    },
  })

export default i18n
