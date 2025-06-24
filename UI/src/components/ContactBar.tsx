import React from 'react';
import { Drawer, Box, Typography, Avatar, Button, Divider, IconButton, Tooltip } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useNavigate } from 'react-router-dom';

interface ContactBarProps {
    open: boolean;
    onClose: () => void;
}

const ContactBar: React.FC<ContactBarProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box width={250} height="100vh" position="relative" role="presentation" onClick={onClose} onKeyDown={onClose} p={2}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                    <Avatar sx={{ width: 96, height: 96, mb: 1 }}>U</Avatar>
                    <Typography variant="h6" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>שם משתמש</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Button variant="outlined" color="primary" sx={{ mb: 1, minWidth: 180 }} onClick={() => navigate('/about-us')}>מי אנחנו</Button>
                    <Button variant="outlined" color="primary" sx={{ minWidth: 180 }} onClick={() => navigate('/contact-us')}>צור קשר</Button>
                </Box>
                <Box position="absolute" bottom={16} right={0} left={0} display="flex" flexDirection="row" gap={2} alignItems="center" justifyContent="center">
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Tooltip title="Bug Report">
                            <IconButton color="primary" href = 'https://github.com/YairGat/warehouse_inventory/issues/new'>
                                <BugReportIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="caption" color="primary">דיווח באגים</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Tooltip title="Feature Requests">
                            <IconButton color="primary" href = 'https://github.com/YairGat/warehouse_inventory/issues/new'>
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

export default ContactBar; 