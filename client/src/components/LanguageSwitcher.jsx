import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
        language === 'en'
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-orange-500 text-white hover:bg-orange-600'
      }`}
      title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
    >
      <Globe size={18} />
      <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
    </button>
  );
};

export default LanguageSwitcher;
