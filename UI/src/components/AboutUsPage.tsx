import React from 'react';
import { Box, Typography } from '@mui/material';
import WarehouseAppBar from './WarehouseAppBar.tsx';
import { useNavigate } from 'react-router-dom';

const AboutUsPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Box>
            <WarehouseAppBar onBack={() => navigate(-1)} />
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="90vh">
                <Typography variant="h4" mb={2}>About Us</Typography>
                <Typography variant="body1" maxWidth={500} textAlign="center">
                    This is a placeholder for the About Us page. Add your company or app information here.
                </Typography>
            </Box>
        </Box>
    );
};

export default AboutUsPage; 