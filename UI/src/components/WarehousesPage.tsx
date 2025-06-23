import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import NavigationBar from './NavigationBar.tsx';
import ContactBar from './ContactBar.tsx';
import { useNavigate } from 'react-router-dom';
import { getFromBack, sendToBack } from '../communication/sendFilesToBack.tsx';
import DeleteIcon from '@mui/icons-material/Delete';

interface Warehouse {
    name: string;
    inventory: object;
    groups?: string[];
}

const WarehousesPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [warehouses, setWarehouses] = useState<{ [key: string]: Warehouse }>({});
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newWarehouseName, setNewWarehouseName] = useState('');
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [userGroup, setUserGroup] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadWarehouses();
        loadGroups();
        fetchUserGroup();
    }, []);

    const loadWarehouses = async () => {
        const data = await getFromBack('warehouses');
        setWarehouses(data);
    };

    const loadGroups = async () => {
        const data = await getFromBack('groups');
        setGroups(data);
    };

    // Fetch the current user's group from the backend (session)
    const fetchUserGroup = async () => {
        const data = await getFromBack('login'); // or a dedicated endpoint like 'whoami'
        if (data && data.group) {
            setUserGroup(data.group);
        } else {
            setUserGroup(null);
        }
    };

    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    const handleWarehouseClick = (warehouseId: string) => {
        navigate(`/warehouses/${encodeURIComponent(warehouseId)}`);
    };

    const handleAddWarehouse = async () => {
        if (!newWarehouseName.trim() || selectedGroups.length === 0) return;
        setLoading(true);
        await sendToBack('warehouses', { name: newWarehouseName, groups: selectedGroups }, 'POST');
        setAddDialogOpen(false);
        setNewWarehouseName('');
        setSelectedGroups([]);
        await loadWarehouses();
        setLoading(false);
    };

    const handleDeleteWarehouse = async (warehouseId: string) => {
        setLoading(true);
        await sendToBack(`warehouses/${warehouseId}`, {}, 'DELETE');
        await loadWarehouses();
        setLoading(false);
    };

    const handleGroupChange = (group: string) => {
        setSelectedGroups(prev =>
            prev.includes(group)
                ? prev.filter(g => g !== group)
                : [...prev, group]
        );
    };

    const isAdmin = userGroup === 'admin';

    return (
        <Box height="100vh">
            <NavigationBar onMenuClick={handleDrawerOpen} />
            <ContactBar open={drawerOpen} onClose={handleDrawerClose} />
            <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)" flexDirection="column">
                {isAdmin && (
                    <Box display="flex" justifyContent="flex-end" width="100%" maxWidth={320} mb={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setAddDialogOpen(true)}
                            sx={{ ml: 2 }}
                            disabled={loading}
                        >
                            הוסף מחסן
                        </Button>
                    </Box>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1rem 0', width: '100%', maxWidth: 320 }}>
                    {Object.entries(warehouses).map(([id, warehouse]) => (
                        <Box
                            key={id}
                            display="flex"
                            alignItems="center"
                            sx={{
                                background: '#955CFF',
                                borderRadius: '8px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                border: '1px solid #1976d2',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                transition: 'background 0.2s',
                                cursor: 'pointer',
                                px: 2,
                                py: 1,
                                '&:hover': { background: '#1976d2' },
                                minWidth: 0
                            }}
                        >
                            {isAdmin && (
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={() => handleDeleteWarehouse(id)}
                                    disabled={loading}
                                    sx={{ ml: 0, mr: 1 }}
                                    title="מחק מחסן"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                            <Box
                                flex={1}
                                onClick={() => handleWarehouseClick(id)}
                                sx={{ cursor: 'pointer', textAlign: 'center' }}
                            >
                                {warehouse.name}
                            </Box>
                        </Box>
                    ))}
                </div>
            </Box>
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
                <DialogTitle>הוסף מחסן חדש</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="שם מחסן"
                        fullWidth
                        value={newWarehouseName}
                        onChange={e => setNewWarehouseName(e.target.value)}
                        disabled={loading}
                    />
                    <FormGroup sx={{ mt: 2 }}>
                        {groups.map(group => (
                            <FormControlLabel
                                key={group}
                                control={
                                    <Checkbox
                                        checked={selectedGroups.includes(group)}
                                        onChange={() => handleGroupChange(group)}
                                        disabled={loading}
                                    />
                                }
                                label={group}
                            />
                        ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)} disabled={loading}>ביטול</Button>
                    <Button onClick={handleAddWarehouse} variant="contained" color="primary" disabled={loading || !newWarehouseName.trim() || selectedGroups.length === 0}>הוסף</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WarehousesPage;