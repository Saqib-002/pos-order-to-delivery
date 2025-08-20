import { ipcMain } from 'electron';

import { getOrderById, getOrders, saveOrder, updateOrder } from './handlers/orders.js';

export function registerIpcHandlers() {
  ipcMain.handle('save-order', saveOrder);

  ipcMain.handle('get-orders', getOrders);

  ipcMain.handle('update-order', updateOrder);

  ipcMain.handle('get-order-by-id', getOrderById);
}