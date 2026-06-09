import React, { createContext, useState, useContext, useEffect } from 'react';
import { en } from '../translations/en';
import { bn } from '../translations/bn';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return saved || 'en';
  });

  const translations = {
    en,
    bn
  };

  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
    // Set document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  };

  const setLanguageTo = (lang) => {
    if (lang === 'en' || lang === 'bn') {
      setLanguage(lang);
    }
  };

  return (
    <TranslationContext.Provider value={{ language, t, toggleLanguage, setLanguageTo }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};
