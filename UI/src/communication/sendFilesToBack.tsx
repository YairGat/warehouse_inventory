export async function getFromBack(path: string): Promise<any> {
    const response = await fetch(`http://localhost:5001/${path}`, {
        credentials: 'include', // <-- This line is required!
    });
    const data = await response.json();
    return data;
}

export async function sendToBack(
    path: string,
    data: any = {},
    method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<any> {
    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };
        if (method !== 'DELETE') {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(`http://localhost:5001/${path}`, options);
        return await response.json();
    } catch (error) {
        return 0;
    }
}

// Add item to warehouse
export async function addItemToWarehouse(
    warehouseId: string,
    item: string,
    quantity: number
): Promise<any> {
    return await sendToBack(`warehouses/${warehouseId}/items`, {
        item,
        quantity
    });
}

// Update item in warehouse
export async function updateItemInWarehouse(
    warehouseId: string,
    item: string,
    quantity: number
): Promise<any> {
    return await sendToBack(
        `warehouses/${warehouseId}/items`,
        { item, quantity },
        'PUT'
    );
}

// Remove item from warehouse
export async function removeItemFromWarehouse(
    warehouseId: string,
    item: string
): Promise<any> {
    return await sendToBack(
        `warehouses/${warehouseId}/items/${encodeURIComponent(item)}`,
        {},
        'DELETE'
    );
}