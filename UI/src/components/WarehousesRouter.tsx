import React, { useState } from 'react';
import { Box } from '@mui/material';
import WarehouseAppBar from './WarehouseAppBar.tsx';
import WarehouseDrawer from './WarehouseDrawer.tsx';
import WarehouseButtons from './WarehouseButtons.tsx';
import WarehouseBottomDrawer from './WarehouseBottomDrawer.tsx';

const WarehousesRouter: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    const handleWarehouseClick = (warehouseName: string) => {
        setSelectedWarehouse(warehouseName);
        setBottomDrawerOpen(true);
    };

    const handleBottomDrawerClose = () => setBottomDrawerOpen(false);

    return (
        <Box height="100vh">
            <WarehouseAppBar onMenuClick={handleDrawerOpen} />
            <WarehouseDrawer open={drawerOpen} onClose={handleDrawerClose} />
            <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)" flexDirection="column">
                <WarehouseButtons onWarehouseClick={handleWarehouseClick} />
            </Box>
            <WarehouseBottomDrawer open={bottomDrawerOpen} onClose={handleBottomDrawerClose} warehouseName={selectedWarehouse} />
        </Box>
    );
};

export default WarehousesRouter; 