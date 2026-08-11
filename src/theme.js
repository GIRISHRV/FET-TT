import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode
          primary: {
            main: '#ef6905',
            container: '#ffccaa',
            onContainer: '#4a1f00',
          },
          secondary: {
            main: '#486c2f',
            container: '#cce5bb',
            onContainer: '#15240a',
          },
          background: {
            default: '#fcfaf7',
            paper: '#ffffff',
            surfaceContainerLow: '#f4f0e6',
            surfaceContainer: '#ebe5d5',
            surfaceContainerHigh: '#e0d8c2',
          },
          text: {
            primary: '#2b1b1b',
            secondary: '#6b5a5a',
          },
        }
      : {
          // Dark Mode
          primary: {
            main: '#ef6905',
            container: '#8b2626',
            onContainer: '#f1e5a1',
          },
          secondary: {
            main: '#f1e5a1',
            container: '#486c2f',
            onContainer: '#eef5e8',
          },
          background: {
            default: '#000000',
            paper: '#0f0a0a',
            surfaceContainerLow: '#1a1111',
            surfaceContainer: '#241818',
            surfaceContainerHigh: '#2e1f1f',
          },
          text: {
            primary: '#f1e5a1',
            secondary: '#d9cd91',
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
