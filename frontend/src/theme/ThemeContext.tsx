import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleDarkMode: () => {},
});

export const useThemeToggle = () => useContext(ThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newVal = !prev;
      localStorage.setItem('theme-mode', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const theme = useMemo(() => {
    const primaryColor = darkMode ? '#3b82f6' : '#1d4ed8'; // Cobalt Azure Blue
    const secondaryColor = '#0d9488'; // Classy Teal/Forest Emerald
    
    return createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: primaryColor,
          light: '#60a5fa',
          dark: '#1e3a8a',
        },
        secondary: {
          main: secondaryColor,
          light: '#2dd4bf',
          dark: '#115e59',
        },
        background: {
          default: darkMode ? '#070a13' : '#f1f5f9', // Sleek space black/grey-slate
          paper: darkMode ? '#0f172a' : '#ffffff', // Dark slate-900 / white
        },
        text: {
          primary: darkMode ? '#f8fafc' : '#0f172a', // Off-white / Slate-900
          secondary: darkMode ? '#94a3b8' : '#475569', // Slate-400 / Slate-600
        },
        divider: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
      },
      typography: {
        fontFamily: "'Outfit', 'Inter', 'Roboto', sans-serif",
        h1: { fontSize: '2.5rem', fontWeight: 700 },
        h2: { fontSize: '2rem', fontWeight: 700 },
        h3: { fontSize: '1.75rem', fontWeight: 600 },
        h4: { fontSize: '1.5rem', fontWeight: 600 },
        h5: { fontSize: '1.25rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 600 },
        subtitle1: { fontSize: '1rem', fontWeight: 500 },
        body1: { fontSize: '0.925rem', lineHeight: 1.6 },
        body2: { fontSize: '0.85rem', lineHeight: 1.5 },
      },
      shape: {
        borderRadius: 16,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': {
                width: '6px',
                height: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: darkMode ? '#0b0f19' : '#f8fafc',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: darkMode ? '#374151' : '#cbd5e1',
                borderRadius: '8px',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
              padding: '8px 20px',
              borderRadius: 8,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            },
            containedPrimary: {
              boxShadow: darkMode ? '0 4px 14px 0 rgba(99, 102, 241, 0.4)' : '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              borderRadius: 16,
              boxShadow: darkMode 
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' 
                : '0 8px 32px 0 rgba(15, 23, 42, 0.04)',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(15, 23, 42, 0.05)',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              backdropFilter: 'blur(10px)',
              backgroundColor: darkMode ? 'rgba(11, 15, 25, 0.8)' : 'rgba(248, 250, 252, 0.8)',
              borderBottom: darkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
            },
          },
        },
      },
    });
  }, [darkMode]);

  const value = useMemo(() => ({ darkMode, toggleDarkMode }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
