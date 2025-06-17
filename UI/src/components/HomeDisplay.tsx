import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Paper,
    useTheme,
    Button,
} from '@mui/material';
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';

import { FileWithId } from '../communication/sendFilesToBack.tsx';



interface FileDrawerProps {
    files: FileWithId[];
    onFilesAdded: (newFiles: FileWithId[]) => void;
    onRemoveFile: (index: number) => void;
}

const Home: React.FC<FileDrawerProps> = ({ onFilesAdded, files, onRemoveFile }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isFileView, setIsFileView] = useState(false);
    const theme = useTheme();
    const navigate = useNavigate();

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setIsFileView(true);
        }
    };

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsFileView(true);
        }
    };

    const handleStartClick = () => {
        navigate('/warehouses_router');
    };

    return (
        <Box
            sx={{
                height: '100vh',
                bgcolor: '#FBFEF9',
                color: '#955CFF',
                display: 'flex',
                flexDirection: 'row',
                position: 'relative'
            }}
        >
            <Fade in={true} timeout={1000}>
                <Container sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 0 
                }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, p: 2 }}>
                <img src='/images/Bahad_1_Symbol.png' alt='Bahad 1 Symbol' style={{ width: 60, height: 60 }} />
            </Box>
                    <Typography align='center' sx={{ mb: 0, fontFamily: 'aptos', fontSize: '3rem', padding: 0 }}>
                        המחסן הדיגיטלי
                    </Typography>

                    <Button 
                        size='medium' 
                        variant='contained' 
                        sx={{
                            bgcolor: '#955CFF',
                            width: '200px',
                            mt: 2
                        }}
                        onClick={handleStartClick}
                    >
                        להתחברות לחץ כאן
                    </Button>
                    <Typography sx={{ mt: '10vh', mb: '0', fontSize: '12px', textAlign: 'center' }}>
                        למידע נוסף לחץ{' '}
                        <Box
                            component="span"
                            sx={{ color: 'secondary.main', cursor: 'pointer' }}
                        >
                            כאן
                        </Box>
                    </Typography>
                </Container>
            </Fade>
        </Box>
    );
};

export default Home;
