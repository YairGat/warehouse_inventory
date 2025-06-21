import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import NavigationBar from './NavigationBar.tsx';
import ContactBar from './ContactBar.tsx';
import { useNavigate } from 'react-router-dom';
import { getFromBack } from '../communication/sendFilesToBack.tsx';

interface Warehouse {
    name: string;
    inventory: object;
}

const WarehousesPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [warehouses, setWarehouses] = useState<{ [key: string]: Warehouse }>({});
    const navigate = useNavigate();

    useEffect(() => {
        async function loadWarehouses() {
            const data = await getFromBack('warehouses');
            setWarehouses(data);
        }
        loadWarehouses();
    }, []);

    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    const handleWarehouseClick = (warehouseId: string) => {
        navigate(`/inventory/${encodeURIComponent(warehouseId)}`);
    };

    return (
        <Box height="100vh">
            <NavigationBar onMenuClick={handleDrawerOpen} />
            <ContactBar open={drawerOpen} onClose={handleDrawerClose} />
            <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)" flexDirection="column">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1rem 0' }}>
                    {Object.entries(warehouses).map(([id, warehouse]) => (
                        <button
                            key={id}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid #1976d2',
                                background: '#955CFF',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => (e.currentTarget.style.background = '#1976d2')}
                            onMouseOut={e => (e.currentTarget.style.background = '#955CFF')}
                            onClick={() => handleWarehouseClick(id)}
                        >
                            {warehouse.name}
                        </button>
                    ))}
                </div>
            </Box>
        </Box>
    );
};

export default WarehousesPage;