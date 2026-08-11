import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.jsx'
import { AppProvider, useAppStore } from './store.jsx'
import { lightTheme, darkTheme } from './theme.js'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// A wrapper component to apply the theme based on global state
const ThemeWrapper = ({ children }) => {
  const { mode } = useAppStore();
  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <ThemeWrapper>
        <App />
      </ThemeWrapper>
    </AppProvider>
  </React.StrictMode>,
)
