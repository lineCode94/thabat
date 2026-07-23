import { createContext, useContext } from 'react';

export const initialThemeState = {
  theme: 'system',
  setTheme: () => null,
};

export const ThemeProviderContext = createContext(initialThemeState);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
