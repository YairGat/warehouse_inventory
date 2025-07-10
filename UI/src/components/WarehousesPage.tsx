import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormGroup, FormControlLabel, Checkbox, Grid } from '@mui/material';
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
    const [manageMode, setManageMode] = useState(false);
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
                
                <Grid
                    container
                    spacing={2}
                    justifyContent="center"
                    alignItems="stretch"
                    sx={{ my: 2, width: '100%', maxWidth: 900 }}
                >
                    {Object.entries(warehouses).map(([id, warehouse]) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={id} display="flex" alignItems="stretch">
                            <Box position="relative" width="100%">
                                {isAdmin && manageMode && (
                                    <IconButton
                                        size="small"
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDeleteWarehouse(id);
                                        }}
                                        disabled={loading}
                                        title="מחק מחסן"
                                        sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: "secondary.contrastText" }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                                <Button
                                    color='secondary'
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={() => handleWarehouseClick(id)}
                                    sx={{ minHeight: '50px', justifyContent: 'center', pl: isAdmin && manageMode ? 5 : 2 }}
                                >
                                    {warehouse.name}
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
                {isAdmin && manageMode && (
                    <Box display="flex" justifyContent="center" width="100%" gap={2} mt={3}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setAddDialogOpen(true)}
                            disabled={loading}
                        >
                            הוסף מחסן
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => setManageMode(false)}
                            disabled={loading}
                        >
                            סיים ניהול
                        </Button>
                    </Box>
                )}
                {isAdmin && !manageMode && (
                    <Box display="flex" justifyContent="center" width="100%" mt={3}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setManageMode(true)}
                            disabled={loading}
                            sx={{ minWidth: 200, fontSize: '1.1rem', boxShadow: 3 }}
                        >
                            נהל מחסנים
                        </Button>
                    </Box>
                )}
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
                    <Button onClick={() => setAddDialogOpen(false)} color="secondary" disabled={loading}>ביטול</Button>
                    <Button onClick={handleAddWarehouse} variant="contained" color="secondary" disabled={loading || !newWarehouseName.trim() || selectedGroups.length === 0}>הוסף</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WarehousesPage;