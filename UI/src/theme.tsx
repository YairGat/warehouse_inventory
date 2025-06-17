import * as React from 'react';
import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define the theme using createTheme
const theme = createTheme({
  palette: {
    background: {
      default: '#ffffff',
    },
    primary: {
      main: '#955CFF',
      dark: '#293A80',
      contrastText: '#fafafa'
    },
    secondary: {
      main: '#E6B342',
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: '#22303C',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#5EB1BF',
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#293A80',
        },
        '*::MuiButton-root:hover': {
          backgroundColor: '#fff',
        }
      },
    },
  },
});



const custom_theme = theme;

// Export the theme
export default custom_theme;
