import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode (Pixel 10 inspired)
          primary: {
            main: '#6750A4', // Material 3 Primary
            container: '#EADDFF',
            onContainer: '#21005D',
          },
          secondary: {
            main: '#625B71',
            container: '#E8DEF8',
            onContainer: '#1D192B',
          },
          background: {
            default: '#FFFBFE',
            paper: '#FFFBFE',
            surfaceContainerLow: '#F7F2FA',
            surfaceContainer: '#F3EDF7',
            surfaceContainerHigh: '#ECE6F0',
          },
          text: {
            primary: '#1C1B1F',
            secondary: '#49454F',
          },
        }
      : {
          // Dark Mode
          primary: {
            main: '#D0BCFF',
            container: '#4F378B',
            onContainer: '#EADDFF',
          },
          secondary: {
            main: '#CCC2DC',
            container: '#4A4458',
            onContainer: '#E8DEF8',
          },
          background: {
            default: '#141218',
            paper: '#141218',
            surfaceContainerLow: '#1D1B20',
            surfaceContainer: '#211F26',
            surfaceContainerHigh: '#2B2930',
          },
          text: {
            primary: '#E6E0E9',
            secondary: '#CAC4D0',
          },
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 400 },
    h2: { fontSize: '2rem', fontWeight: 400 },
    h3: { fontSize: '1.75rem', fontWeight: 400 },
    h4: { fontSize: '1.5rem', fontWeight: 400 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 24,
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));
