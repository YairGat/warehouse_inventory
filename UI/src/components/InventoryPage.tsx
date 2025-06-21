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
                setWarehouse(data);
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

    // Handler for erasing an item
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
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
                <IconButton
                    color="primary"
                    onClick={handleOpenHistory}
                    sx={{ ml: 1 }}
                    title="היסטוריית מחסן"
                >
                    <HistoryIcon />
                </IconButton>
                <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
                    הוסף פריט
                </Button>
                <TextField
                    variant="outlined"
                    placeholder="חפש פריט"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180, background: '#fff' }}
                />
            </Stack>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                {filteredItems.length === 0 ? (
                    <p>אין פריטים תואמים.</p>
                ) : (
                    <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: '1px solid #aaa', textAlign: 'right' }}></th>
                                <th style={{ borderBottom: '1px solid #aaa', textAlign: 'right' }}>פריט</th>
                                <th style={{ borderBottom: '1px solid #aaa', textAlign: 'right' }}>כמות</th>
                                <th style={{ borderBottom: '1px solid #aaa', textAlign: 'right' }}>משתמש אחרון</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(([itemName, item]) => (
                                <tr key={itemName}>
                                    <td style={{ borderBottom: '1px solid #eee', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEraseItem(itemName)}
                                            sx={{ color: 'grey.600', mr: 1 }}
                                            title="מחק פריט"
                                            disabled={actionLoading === `erase-${itemName}`}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleAddOne(itemName, item.quantity)}
                                            color="primary"
                                            sx={{ mr: 1 }}
                                            title="הוסף אחד"
                                            disabled={actionLoading === `add-${itemName}`}
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleSubtractOne(itemName, item.quantity)}
                                            color="secondary"
                                            title="הסר אחד"
                                            disabled={actionLoading === `remove-${itemName}`}
                                        >
                                            <RemoveIcon fontSize="small" />
                                        </IconButton>
                                    </td>
                                    <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{itemName}</td>
                                    <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{item.quantity}</td>
                                    <td style={{ borderBottom: '1px solid #eee', textAlign: 'right' }}>{item.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                    <Button onClick={() => setAddDialogOpen(false)} disabled={actionLoading === 'add-dialog'}>ביטול</Button>
                    <Button onClick={handleAddItem} variant="contained" color="primary" disabled={actionLoading === 'add-dialog'}>הוסף</Button>
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