import { db } from '../database/index.js';
import Logger from 'electron-log';

export async function renumberDay(day: string): Promise<void> {
  try {
    const orders = await db('orders')
      .whereRaw('DATE(created_at) = ?', [day])
      .andWhere('is_deleted', false)
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc');
    
    if (orders.length === 0) return;
    
    const updates: Array<{ id: string; order_id: number }> = [];
    
    orders.forEach((order, index) => {
      const expectedOrderId = index + 1;
      if (order.order_id !== expectedOrderId) {
        updates.push({ id: order.id, order_id: expectedOrderId });
      }
    });
    
    if (updates.length > 0) {
      await db.transaction(async (trx) => {
        for (const update of updates) {
          await trx('orders')
            .where('id', update.id)
            .update({ 
              order_id: update.order_id,
              updated_at: new Date().toISOString(),
              synced_at: null // Mark for sync
            });
        }
      });
      
      Logger.info(`Renumbered ${updates.length} orders for day ${day}`);
    }
  } catch (error) {
    Logger.error('Error renumbering orders:', error);
  }
}