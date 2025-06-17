import React from 'react';
import { Drawer, Divider, Box, Typography, Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

interface WarehouseBottomDrawerProps {
    open: boolean;
    onClose: () => void;
    warehouseName: string | null;
}

const WarehouseBottomDrawer: React.FC<WarehouseBottomDrawerProps> = ({ open, onClose, warehouseName }) => {
    const navigate = useNavigate();
    const handleAction = (action: string) => {
        if (warehouseName) {
            navigate(`/${action}/${encodeURIComponent(warehouseName)}`);
        }
    };
    return (
        <Drawer anchor="bottom" open={open} onClose={onClose}>
            <Box p={3} textAlign="center" minHeight={120} borderRadius="16px 16px 16px 16px">
                <Typography variant="h6" mb={2}>
                    {warehouseName ? `${warehouseName}` : 'No warehouse selected'}
                </Typography>
                <Divider sx={{ mb: 2, borderBottomWidth: 4, borderColor: 'primary.main' }} />
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Button variant="text" color="primary" startIcon={<AddCircleIcon />} fullWidth onClick={() => handleAction('add-item')}>Add Item</Button>
                    <Button variant="text" color="primary" startIcon={<RemoveCircleIcon />} fullWidth onClick={() => handleAction('remove-item')}>Remove Item</Button>
                    <Button variant="text" color="primary" startIcon={<VisibilityIcon />} fullWidth onClick={() => handleAction('see-content')}>See Content</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default WarehouseBottomDrawer; 