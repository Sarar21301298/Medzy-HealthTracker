/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Healthcare Green Palette
        'healthcare-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Primary green
          600: '#16a34a', // Darker green
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
        // Teal accent
        'healthcare-teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#06b6d4', // Primary teal
          600: '#0891b2', // Darker teal
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Emerald success
        'healthcare-emerald': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981', // Primary emerald
          600: '#059669', // Darker emerald
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft-xl': '0 6px 16px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-healthcare': 'linear-gradient(135deg, #16a34a 0%, #0891b2 100%)',
        'gradient-light': 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
      },
    },
  },
  plugins: [],
};
