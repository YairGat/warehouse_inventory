import React from 'react';
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

interface NavigationBarProps {
    onMenuClick?: () => void;
    onBack?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ onMenuClick, onBack }) => {
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
            <Toolbar sx={{ minHeight: 80, px: 3 }}>
                <IconButton color="inherit" onClick={handleBack} edge="start" aria-label="back">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" component="div" sx={{ flexGrow: 1, ml: 2, fontFamily: 'barlev-bold', fontSize: '2rem' }}>
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

export default NavigationBar; 