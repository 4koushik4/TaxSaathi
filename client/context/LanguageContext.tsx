import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Language,
  TranslationKeys,
  getTranslations,
  setCustomTranslations,
  SUPPORTED_LANGUAGES,
  AI_TRANSLATABLE_LANGUAGES,
} from '@/lib/i18n';
import en from '@/lib/i18n/translations/en';

interface LanguageContextType {
  language: string;
  languageName: string;
  t: TranslationKeys;
  setLanguage: (lang: string) => void;
  translateWithAI: (targetLang: string) => Promise<void>;
  isTranslating: boolean;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  aiLanguages: typeof AI_TRANSLATABLE_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'taxsathi_language';
const CUSTOM_TRANSLATIONS_KEY = 'taxsathi_custom_translations';
const CUSTOM_LANG_NAME_KEY = 'taxsathi_custom_lang_name';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const [translations, setTranslationsState] = useState<TranslationKeys>(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) || 'en';
      if (savedLang === 'custom') {
        const customData = localStorage.getItem(CUSTOM_TRANSLATIONS_KEY);
        if (customData) {
          const parsed = JSON.parse(customData);
          setCustomTranslations(parsed);
          return parsed;
        }
      }
      return getTranslations(savedLang);
    } catch {
      return getTranslations('en');
    }
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [customLangName, setCustomLangName] = useState(() => {
    try {
      return localStorage.getItem(CUSTOM_LANG_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    const t = getTranslations(lang);
    setTranslationsState(t);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  const getLanguageName = useCallback(() => {
    if (language === 'custom' && customLangName) return customLangName;
    const builtIn = SUPPORTED_LANGUAGES.find(l => l.code === language);
    if (builtIn) return builtIn.nativeName;
    const aiLang = AI_TRANSLATABLE_LANGUAGES.find(l => l.code === language);
    if (aiLang) return aiLang.nativeName;
    return 'English';
  }, [language, customLangName]);

  const translateWithAI = useCallback(async (targetLang: string) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translations: en,
          targetLanguage: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      if (data.translations) {
        // Save custom translations
        setCustomTranslations(data.translations);
        setTranslationsState(data.translations);
        setLanguageState('custom');

        const langName = AI_TRANSLATABLE_LANGUAGES.find(l => l.code === targetLang)?.nativeName || targetLang;
        setCustomLangName(langName);

        try {
          localStorage.setItem(STORAGE_KEY, 'custom');
          localStorage.setItem(CUSTOM_TRANSLATIONS_KEY, JSON.stringify(data.translations));
          localStorage.setItem(CUSTOM_LANG_NAME_KEY, langName);
        } catch {}
      }
    } catch (error) {
      console.error('AI translation failed:', error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageName: getLanguageName(),
        t: translations,
        setLanguage,
        translateWithAI,
        isTranslating,
        availableLanguages: SUPPORTED_LANGUAGES,
        aiLanguages: AI_TRANSLATABLE_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
