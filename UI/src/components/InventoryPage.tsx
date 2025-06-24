import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Button, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import WarehouseAppBar from './NavigationBar.tsx';
import {
    getFromBack,
    addItemToWarehouse,
    updateItemInWarehouse,
    removeItemFromWarehouse
} from '../communication/sendFilesToBack.tsx';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

interface InventoryItem {
    quantity: number;
    user: string;
}

interface Warehouse {
    name: string;
    inventory: { [itemName: string]: InventoryItem };
}

const InventoryPage: React.FC = () => {
    const { warehouseName } = useParams<{ warehouseName: string }>();
    const navigate = useNavigate();
    const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
    const [search, setSearch] = useState('');
    const [filteredItems, setFilteredItems] = useState<[string, InventoryItem][]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // item name for which action is loading
    const [historyFilter, setHistoryFilter] = useState('');

    useEffect(() => {
        async function loadWarehouse() {
            if (warehouseName) {
                const data = await getFromBack(`warehouses/${warehouseName}`);
                if (data && data.error === "Warehouse not found") {
                    setWarehouse(null);
                } else {
                    setWarehouse(data);
                }
            }
        }
        loadWarehouse();
    }, [warehouseName]);

    useEffect(() => {
        if (warehouse) {
            const items = Object.entries(warehouse.inventory);
            if (search.trim() === '') {
                setFilteredItems(items);
            } else {
                setFilteredItems(
                    items.filter(([itemName]) =>
                        itemName.includes(search.trim())
                    )
                );
            }
        }
    }, [warehouse, search]);

    const handleAddItem = async () => {
        if (!warehouseName || !newItemName || !newItemQuantity) return;
        setActionLoading('add-dialog');
        await addItemToWarehouse(
            warehouseName,
            newItemName,
            Number(newItemQuantity)
        );
        setAddDialogOpen(false);
        setNewItemName('');
        setNewItemQuantity('');
        const data = await getFromBack(`warehouses/${warehouseName}`);
        setWarehouse(data);
        setActionLoading(null);
    };

    // History dialog handlers
    const handleOpenHistory = async () => {
        if (!warehouseName) return;
        const actions = await getFromBack(`get_actions/${warehouseName}`);
        setHistory(actions);
        setHistoryOpen(true);
    };

    const handleCloseHistory = () => {
        setHistoryOpen(false);
    };

    // Handler for erasing an item completely
    const handleEraseItem = async (itemName: string) => {
        if (!warehouseName) return;
        setActionLoading(`erase-${itemName}`);
        await removeItemFromWarehouse(warehouseName, itemName);
        const data = await getFromBack(`warehouses/${warehouseName}`);
        setWarehouse(data);
        setActionLoading(null);
    };

    // Handler for adding one to item quantity
    const handleAddOne = async (itemName: string, currentQuantity: number) => {
        if (!warehouseName) return;
        setActionLoading(`add-${itemName}`);
        await updateItemInWarehouse(warehouseName, itemName, currentQuantity + 1);
        const data = await getFromBack(`warehouses/${warehouseName}`);
        setWarehouse(data);
        setActionLoading(null);
    };

    // Handler for subtracting one from item quantity
    const handleSubtractOne = async (itemName: string, currentQuantity: number) => {
        if (!warehouseName || currentQuantity <= 0) return;
        setActionLoading(`remove-${itemName}`);
        await updateItemInWarehouse(warehouseName, itemName, currentQuantity - 1);
        const data = await getFromBack(`warehouses/${warehouseName}`);
        setWarehouse(data);
        setActionLoading(null);
    };

    const filteredHistory = historyFilter.trim()
        ? history.filter(
            action =>
                (action.item && action.item.includes(historyFilter)) ||
                (action.action && action.action.includes(historyFilter)) ||
                (action.user && action.user.includes(historyFilter))
        )
        : history;

    if (!warehouse) return <div dir="rtl">טוען מחסן...</div>;

    return (
        <Box>
            <WarehouseAppBar onBack={() => navigate(-1)} />
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap" sx={{ mt: 3, mb: 3 }}>
                <IconButton
                    color="primary"
                    onClick={handleOpenHistory}
                    sx={{ ml: 1, my: 1 }}
                    title="היסטוריית מחסן"
                >
                    <HistoryIcon />
                </IconButton>
                <Button variant="outlined" color="secondary" onClick={() => setAddDialogOpen(true)} sx={{ my: 1 }}>
                    הוסף פריט
                </Button>
                <TextField
                    variant="outlined"
                    placeholder="חפש פריט"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180, maxWidth: 300, background: '#fff', my: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                {filteredItems.length === 0 ? (
                    <p>אין פריטים תואמים.</p>
                ) : (
                    <Box sx={{ width: '100%', direction: 'rtl', maxWidth: { xs: '100vw', sm: 600, md: 900 }, mx: 'auto' }}>
                        <DataGrid
                            autoHeight
                            rows={filteredItems.map(([itemName, item]) => ({
                                id: itemName,
                                itemName,
                                quantity: item.quantity,
                                user: item.user
                            }))}
                            columns={[
                                {
                                    field: 'erase',
                                    headerName: '',
                                    width: 50,
                                    sortable: false,
                                    filterable: false,
                                    disableColumnMenu: true,
                                    renderCell: (params) => (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEraseItem(params.row.itemName)}
                                            color="error"
                                            title="מחק פריט"
                                            disabled={actionLoading === `erase-${params.row.itemName}`}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )
                                },
                                {
                                    field: 'itemName',
                                    headerName: 'פריט',
                                    flex: 1,
                                    minWidth: 70,
                                    headerAlign: 'center',
                                    align: 'center',
                                },
                                {
                                    field: 'quantity',
                                    headerName: 'כמות',
                                    flex: 0.5,
                                    minWidth: 100,
                                    headerAlign: 'center',
                                    align: 'center',
                                    renderCell: (params) => (
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleSubtractOne(params.row.itemName, params.row.quantity)}
                                                color="secondary"
                                                title="הסר אחד"
                                                disabled={actionLoading === `remove-${params.row.itemName}`}
                                            >
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <span style={{ minWidth: 24, textAlign: 'center', display: 'inline-block' }}>{params.row.quantity}</span>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAddOne(params.row.itemName, params.row.quantity)}
                                                color="secondary"
                                                title="הוסף אחד"
                                                disabled={actionLoading === `add-${params.row.itemName}`}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )
                                },
                                {
                                    field: 'user',
                                    headerName: 'משתמש אחרון',
                                    flex: 1,
                                    minWidth: 70,
                                    headerAlign: 'center',
                                    align: 'center',
                                },
                            ]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 50, page: 0 } }
                            }}
                            pageSizeOptions={[50, 100, 200]}
                            disableRowSelectionOnClick
                            sx={{
                                direction: 'rtl',
                                fontFamily: 'narkis',
                                borderRadius: 2,
                                mt: 2,
                                fontSize: { xs: '0.8rem', sm: '1rem' },
                                '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader': {
                                    py: { xs: 0.5, sm: 1 },
                                    px: { xs: 0.5, sm: 2 },
                                },
                            }}
                        />
                    </Box>
                )}
            </Box>
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} dir="rtl">
                <DialogTitle>הוסף פריט חדש</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="שם פריט"
                        fullWidth
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="כמות"
                        type="number"
                        fullWidth
                        value={newItemQuantity}
                        onChange={e => setNewItemQuantity(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)} color="secondary" disabled={actionLoading === 'add-dialog'}>ביטול</Button>
                    <Button onClick={handleAddItem} variant="contained" color="secondary" disabled={actionLoading === 'add-dialog'}>הוסף</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={historyOpen} onClose={handleCloseHistory} dir="rtl" maxWidth="md" fullWidth>
                <DialogTitle>היסטוריית פעולות למחסן</DialogTitle>
                <DialogContent>
                    <TextField
                        label="סנן היסטוריה"
                        variant="outlined"
                        fullWidth
                        value={historyFilter}
                        onChange={e => setHistoryFilter(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    {filteredHistory.length === 0 ? (
                        <p>אין פעולות להצגה.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'right' }}>תאריך</th>
                                    <th style={{ textAlign: 'right' }}>שעה</th>
                                    <th style={{ textAlign: 'right' }}>משתמש</th>
                                    <th style={{ textAlign: 'right' }}>פעולה</th>
                                    <th style={{ textAlign: 'right' }}>פריט</th>
                                    <th style={{ textAlign: 'right' }}>כמות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map((action, idx) => {
                                    const dateObj = new Date(action.timestamp);
                                    const dateStr = dateObj.toLocaleDateString('he-IL');
                                    const timeStr = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    return (
                                        <tr key={idx}>
                                            <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{dateStr}</td>
                                            <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{timeStr}</td>
                                            <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{action.user}</td>
                                            <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{action.action}</td>
                                            <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{action.item}</td>
                                            <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{action.quantity}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseHistory}>סגור</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InventoryPage;