import React from 'react';
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

interface WarehouseAppBarProps {
    onMenuClick?: () => void;
    onBack?: () => void;
}

const WarehouseAppBar: React.FC<WarehouseAppBarProps> = ({ onMenuClick, onBack }) => {
    const navigate = useNavigate();
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/');
        }
    };
    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton color="inherit" onClick={handleBack} edge="start" aria-label="back">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2, fontFamily: 'aptos' }}>
                    המחסן הדיגיטלי
                </Typography>
                {onMenuClick && (
                    <IconButton color="inherit" edge="end" aria-label="open drawer" onClick={onMenuClick}>
                        <MenuIcon />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default WarehouseAppBar; 