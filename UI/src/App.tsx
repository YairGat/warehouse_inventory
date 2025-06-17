import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme.tsx';
import { CssBaseline } from '@mui/material';
import Home from './components/HomeDisplay.tsx';
import { Routes, Route } from 'react-router-dom';
import WarehousesRouter from './components/WarehousesRouter.tsx';
import AddItemPage from './components/AddItemPage.tsx';
import RemoveItemPage from './components/RemoveItemPage.tsx';
import SeeContentPage from './components/SeeContentPage.tsx';
import AboutUsPage from './components/AboutUsPage.tsx';
import ContactUsPage from './components/ContactUsPage.tsx';

export interface FileWithId extends File {
    name: string;
    size: number;
}

// TypeScript Functional Component
const NewApp: React.FC = () => {

    const [files, setFiles] = useState<FileWithId[]>([]);

    const handleFilesAdded = (newFiles: FileWithId[]) => {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
        console.log({ files })
    };
    return (
        <div className="NewApp">
            <style>
                {`
          @font-face {
            font-family: 'eras-itc-bold';
            src: url('/fonts/eras-itc-bold.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
            `}
            </style>
            <style>
                {`
          @font-face {
            font-family: 'eras-itc-medium';
            src: url('/fonts/eras-itc-medium.ttf') format('truetype');
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
                    <Route path="/" element={<Home onFilesAdded={handleFilesAdded} files={files} onRemoveFile={removeFile} />} />
                    <Route path="/warehouses_router" element={<WarehousesRouter />} />
                    <Route path="/add-item/:warehouseName" element={<AddItemPage />} />
                    <Route path="/remove-item/:warehouseName" element={<RemoveItemPage />} />
                    <Route path="/see-content/:warehouseName" element={<SeeContentPage />} />
                    <Route path="/about-us" element={<AboutUsPage />} />
                    <Route path="/contact-us" element={<ContactUsPage />} />
                </Routes>
            </ThemeProvider>
        </div>
    );
};

export default NewApp;
