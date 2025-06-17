import React from 'react';
import { Drawer, Box, Typography, Avatar, Button, Divider, IconButton, Tooltip } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useNavigate } from 'react-router-dom';

interface WarehouseDrawerProps {
    open: boolean;
    onClose: () => void;
}

const WarehouseDrawer: React.FC<WarehouseDrawerProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box width={250} height="100vh" position="relative" role="presentation" onClick={onClose} onKeyDown={onClose} p={2}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                    <Avatar sx={{ width: 64, height: 64, mb: 1 }}>U</Avatar>
                    <Typography variant="subtitle1">שם משתמש</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Button variant="outlined" color="primary" fullWidth sx={{ mb: 1 }} onClick={() => navigate('/about-us')}>About Us</Button>
                <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/contact-us')}>צור קשר</Button>
                <Box position="absolute" bottom={16} right={16} display="flex" flexDirection="row" gap={2} alignItems="center">
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Tooltip title="Bug Report">
                            <IconButton color="primary">
                                <BugReportIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="caption" color="primary">דיווח באגים</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Tooltip title="Feature Requests">
                            <IconButton color="primary">
                                <LightbulbIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="caption" color="primary">בקשת פיצ'רים</Typography>
                    </Box>
                </Box>
            </Box>
        </Drawer>
    );
};

export default WarehouseDrawer; 