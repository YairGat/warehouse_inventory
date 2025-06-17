import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import WarehouseAppBar from './WarehouseAppBar.tsx';

const SeeContentPage: React.FC = () => {
    const { warehouseName } = useParams<{ warehouseName: string }>();
    const navigate = useNavigate();
    return (
        <Box>
            <WarehouseAppBar onBack={() => navigate(-1)} />
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="90vh">
                <Typography variant="h4" mb={2}>See Content</Typography>
                <Typography variant="h6">Warehouse: {warehouseName}</Typography>
            </Box>
        </Box>
    );
};

export default SeeContentPage; 