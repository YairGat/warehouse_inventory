import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme.tsx';
import { CssBaseline } from '@mui/material';
import HomePage from './components/HomePage.tsx';
import { Routes, Route } from 'react-router-dom';
import WarehousesPage from './components/WarehousesPage.tsx';
import InventoryPage from './components/InventoryPage.tsx';
import AboutUsPage from './components/AboutUsPage.tsx';
import ContactUsPage from './components/ContactUsPage.tsx';

export interface FileWithId extends File {
    name: string;
    size: number;
}

// TypeScript Functional Component
const NewApp: React.FC = () => {

    return (
        <div className="NewApp">
            <style>
                {`
          @font-face {
            font-family: 'barlev-regular';
            src: url('/fonts/BARLEV-AAA-REGULAR.OTF') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
            `}
            </style>
            <style>
                {`
          @font-face {
            font-family: 'barlev-bold';
            src: url('/fonts/BARLEV-AAA-BOLD.OTF') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
            `}
            </style>
            <style>
                {`
          @font-face {
            font-family: 'narkis';
            src: url('/fonts/NarkissBlock-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
            `}
            </style>
            <style>
                {`
          @font-face {
            font-family: 'aptos';
            src: url('/fonts/Aptos.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        `}
            </style>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Routes>
                    <Route path="/" element={<WarehousesPage />} />
                    <Route path="/warehouses/:warehouseName" element={<InventoryPage />} />
                    <Route path="/about-us" element={<AboutUsPage />} />
                    <Route path="/contact-us" element={<ContactUsPage />} />
                </Routes>
            </ThemeProvider>
        </div>
    );
};

export default NewApp;

