import React, { useState } from 'react';
import { Box, Collapse, Button, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface WarehouseButtonsProps {
    onWarehouseClick: (warehouseName: string) => void;
}

const WarehouseButtons: React.FC<WarehouseButtonsProps> = ({ onWarehouseClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    const warehouses = [
        'רספייה פלוגת סהר',
        'קרביץ פלוגת יפתח',
        'מחסן גדוד אלון',
        'מחסן גדוד ארז',
        'מחסן פלוגת יפתח'
    ];

    return (
        <Box display="flex" flexDirection="column" gap={2} width="100%" maxWidth={300}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                <Typography align='center' sx={{ fontFamily: 'aptos', fontSize: '2rem', padding: 0, color: '#191923' }}>
                    בחר מחסן
                </Typography>
                <IconButton onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            <Collapse in={isOpen}>
                <Box display="flex" flexDirection="column" gap={1}>
                    {warehouses.map((warehouse) => (
                        <Button
                            key={warehouse}
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={() => onWarehouseClick(warehouse)}
                        >
                            {warehouse}
                        </Button>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

export default WarehouseButtons; 