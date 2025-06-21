import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button,
    TextField,
    Paper,
} from '@mui/material';
import Fade from '@mui/material/Fade';
import { sendToBack } from '../communication/sendFilesToBack.tsx';

const HomePage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const response = await sendToBack('login', { username, password });
        setLoading(false);
        if (response && response.success) {
            navigate('/warehouses');
        } else {
            alert('Login failed');
        }
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
                    <Paper elevation={3} sx={{ mt: 4, p: 4, minWidth: 320 }}>
                        <form onSubmit={handleLogin}>
                            <TextField
                                label="שם משתמש"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                            <TextField
                                label="סיסמה"
                                type="password"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 2 }}
                                disabled={loading}
                            >
                                התחבר
                            </Button>
                        </form>
                    </Paper>
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

export default HomePage;
