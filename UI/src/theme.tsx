
import * as React from 'react';
import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define the theme using createTheme
const theme = createTheme({
  palette: {
    background: {
      default: '#FBFEF9',
    },
    primary: {
      main: '#335C67',
    },
    secondary: {
      main: '#104F55', //E09F3E
      light: '#32746D',
      dark: '#01200F',
      contrastText: '#ffffff', 
    },
  },
  typography: {
    fontFamily: 'narkis, sans-serif',
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
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'narkis, barlev-regular, sans-serif',
        },
      },
    },
  },
});

const custom_theme = theme;

// Export the theme
export default custom_theme;
