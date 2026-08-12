import { db } from "../database/index.js";

// Push a driver profile to the VPS database (for login authentication)
export async function syncDriverToVPS(driver: any) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const response = await fetch(`${vpsUrl}/api/pos/sync-driver`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: driver.id,
                name: driver.name,
                email: driver.email,
                username: driver.username,
                phone: driver.phone || "",
                vehicleType: driver.vehicleType || "bike",
                licenseNo: driver.licenseNo || "",
                password: driver.password,
                isActive: driver.isActive
            })
        });
        if (!response.ok) {
            console.error(`SyncManager: Failed to sync driver ${driver.id}: ${response.statusText}`);
        }
    } catch (err) {
        console.error(`SyncManager: Error syncing driver ${driver.id}:`, err);
    }
}

// Push updated order status & delivery assignment to VPS v1 API
export async function syncOrderToVPS(orderId: string) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const order = await db("orders").where({ id: orderId }).first();
        if (!order) return;

        const items = await db("order_items").where({ orderId });

        const response = await fetch(`${vpsUrl}/api/pos/sync-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                order: {
                    id: order.id,
                    orderId: order.orderId,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    customerCIF: order.customerCIF,
                    customerEmail: order.customerEmail,
                    customerAddress: order.customerAddress,
                    customerComments: order.customerComments,
                    notes: order.notes,
                    orderType: order.orderType,
                    isPaid: order.isPaid,
                    paymentType: order.paymentType,
                    status: order.status,
                    deliveryPersonId: order.deliveryPersonId,
                    deliveryPersonName: order.deliveryPersonName,
                    deliveryPersonPhone: order.deliveryPersonPhone,
                    deliveryPersonEmail: order.deliveryPersonEmail,
                    deliveryPersonVehicleType: order.deliveryPersonVehicleType,
                    deliveryPersonLicenseNo: order.deliveryPersonLicenseNo,
                    readyAt: order.readyAt,
                    assignedAt: order.assignedAt,
                    deliveredAt: order.deliveredAt,
                    cancelAt: order.cancelAt,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                    ticketNumber: order.ticketNumber,
                    pickupTime: order.pickupTime,
                    platformId: order.platformId,
                    receivingTime: order.receivingTime
                },
                items: items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    productDescription: item.productDescription || "",
                    productPrice: item.productPrice,
                    productDiscount: item.productDiscount || 0,
                    productPriority: item.productPriority || 0,
                    productTax: item.productTax || 0,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    complements: item.complements || "",
                    variantId: item.variantId || "",
                    variantName: item.variantName || "",
                    variantPrice: item.variantPrice || 0,
                    menuId: item.menuId || "",
                    menuSecondaryId: item.menuSecondaryId || null,
                    menuName: item.menuName || "",
                    menuDescription: item.menuDescription || "",
                    menuDiscount: item.menuDiscount || 0,
                    menuTax: item.menuTax || 0,
                    menuPrice: item.menuPrice || 0,
                    supplement: item.supplement || 0,
                    productNote: item.productNote || ""
                }))
            })
        });
        if (!response.ok) {
            console.error(`SyncManager: Failed to sync order ${orderId}: ${response.statusText}`);
        } else {
            console.log(`SyncManager: Successfully synced order ${orderId} with ${items.length} items to VPS`);
        }
    } catch (err) {
        console.error(`SyncManager: Error syncing order ${orderId}:`, err);
    }
}

// Push configurations to the VPS
export async function syncConfigToVPS(configId: string) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const config = await db("configurations").where({ id: configId }).first();
        if (!config) return;

        const response = await fetch(`${vpsUrl}/api/pos/sync-config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config)
        });
        if (!response.ok) {
            console.error(`SyncManager: Failed to sync configurations: ${response.statusText}`);
        } else {
            console.log(`SyncManager: Successfully synced configurations ${configId} to VPS`);
        }
    } catch (err) {
        console.error("SyncManager: Error syncing configurations:", err);
    }
}

// Clear orders from VPS whiteboard once processed locally
async function clearWhiteboardOrders(ids: string[]) {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const response = await fetch(`${vpsUrl}/api/pos/clear-orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids })
        });
        if (!response.ok) {
            console.error(`SyncManager: Failed to clear whiteboard orders on VPS: ${response.statusText}`);
        }
    } catch (err) {
        console.error("SyncManager: Error clearing orders on VPS:", err);
    }
}

// Run a 10-second polling loop to download status updates (Delivered/Cancelled) from VPS whiteboard
export function startBackgroundSync() {
    console.log("SyncManager: Starting background sync loop (10s interval)...");
    setInterval(async () => {
        const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
        try {
            const response = await fetch(`${vpsUrl}/api/pos/poll-updates`);
            if (!response.ok) return;

            const updates: any = await response.json();
            if (!Array.isArray(updates) || updates.length === 0) return;

            const processedIds: string[] = [];

            for (const update of updates) {
                try {
                    if (update.status.toLowerCase() === "delivered") {
                        await db("orders").where({ id: update.id }).update({
                            status: "Delivered",
                            deliveredAt: update.deliveredAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                        console.log(`SyncManager: Locally marked order ${update.id} as Delivered`);
                    } else if (update.status.toLowerCase() === "cancelled") {
                        await db("orders").where({ id: update.id }).update({
                            status: "Cancelled",
                            notes: update.notes,
                            updatedAt: new Date().toISOString()
                        });
                        console.log(`SyncManager: Locally marked order ${update.id} as Cancelled`);
                    }
                    processedIds.push(update.id);
                } catch (dbErr) {
                    console.error(`SyncManager: Failed to update local order ${update.id}:`, dbErr);
                }
            }

            if (processedIds.length > 0) {
                await clearWhiteboardOrders(processedIds);
            }
        } catch (err) {
            console.error("SyncManager: Background sync execution error:", err);
        }
    }, 10000);
}
