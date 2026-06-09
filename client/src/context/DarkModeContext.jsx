import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  // Check localStorage for saved preference or default to light
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    const initialValue = saved ? JSON.parse(saved) : false;
    console.log('DarkMode Initial Value:', initialValue);
    return initialValue;
  });

  // Update localStorage and document class when dark mode changes
  useEffect(() => {
    console.log('DarkMode Changed:', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to document');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from document');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    console.log('Toggle clicked, current state:', isDarkMode);
    setIsDarkMode(prev => {
      const newValue = !prev;
      console.log('New state will be:', newValue);
      return newValue;
    });
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode: setIsDarkMode
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

export default DarkModeContext;
