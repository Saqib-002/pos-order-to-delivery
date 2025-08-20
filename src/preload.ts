import { contextBridge } from 'electron';
import { db } from './main/db';

contextBridge.exposeInMainWorld('electronAPI', {
  saveOrder: (order: any) => db.post(order),
  getOrders: () => db.allDocs({ include_docs: true }),
  updateOrder: (order: any) => db.put(order),
  getOrderById: (id: string) => db.get(id),
});