import { db } from "./index.js";

export class FinancialDatabaseOperations {
  static async getFinancialAnalytics(filter: any): Promise<any> {
    const {
      dateRange,
      selectedDate,
      startDateRange,
      endDateRange,
    } = filter;

    let startDate = new Date();
    let endDate = new Date();

    if (startDateRange && endDateRange) {
      startDate = new Date(startDateRange);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateRange);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      switch (dateRange) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          if (selectedDate) {
            startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
        default:
           // Default to today if nothing matches
           startDate = new Date(now);
           startDate.setHours(0, 0, 0, 0);
           endDate = new Date(now);
           endDate.setHours(23, 59, 59, 999);
           break;
      }
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // 1. Calculate Income (Orders)
    // Status NOT: pending, sent to kitchen, cancelled
    const incomeResult = await db("order_items")
      .join("orders", "order_items.orderId", "orders.id")
      .whereBetween("orders.createdAt", [startISO, endISO])
      .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
      .sum("order_items.totalPrice as total")
      .first();
    
    const income = Number(incomeResult?.total || 0);

    // 2. Calculate Expenses

    // A. Vehicle Maintenance
    const vehicleResult = await db("vehicle_maintenance")
      .whereBetween("date", [startISO, endISO])
      .sum("total as total")
      .first();
    const vehicleExpenses = Number(vehicleResult?.total || 0);

    // B. Worker Salaries
    const workerResult = await db("worker_salaries")
      .whereBetween("date", [startISO, endISO])
      .sum("total as total")
      .first();
    const workerExpenses = Number(workerResult?.total || 0);

    // C. Market Purchases
    const marketResult = await db("market_purchases")
      .whereBetween("ticketDate", [startISO, endISO])
      .sum("totalAmount as total")
      .first();
    const marketExpenses = Number(marketResult?.total || 0);

    // D. General Expenses
    const generalResult = await db("expenses")
      .whereBetween("date", [startISO, endISO])
      .sum("total as total")
      .first();
    const generalExpenses = Number(generalResult?.total || 0);

    const totalExpenses = vehicleExpenses + workerExpenses + marketExpenses + generalExpenses;
    const netProfit = income - totalExpenses;

    // 3. Graph Data (Daily distribution for the selected range)
    // group by day (YYYY-MM-DD)
    
    // Helper to get daily sums
    const getDailySums = async (table: string, dateCol: string, sumCol: string, whereClause?: any) => {
        let q = db(table)
            .select(db.raw(`TO_CHAR("${dateCol}"::timestamp, 'YYYY-MM-DD') as date`))
            .sum(`${sumCol} as total`)
            .whereBetween(dateCol, [startISO, endISO]);
        
        if (whereClause) {
            q = q.where(whereClause);
        }
        
        return q.groupBy("date");
    };

    const dailyIncomeRaw = await db("order_items")
        .join("orders", "order_items.orderId", "orders.id")
        .select(db.raw(`TO_CHAR(orders."createdAt"::timestamp, 'YYYY-MM-DD') as date`))
        .sum("order_items.totalPrice as total")
        .whereBetween("orders.createdAt", [startISO, endISO])
        .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
        .groupBy("date");

    const dailyVehicleRaw = await getDailySums("vehicle_maintenance", "date", "total");
    const dailyWorkerRaw = await getDailySums("worker_salaries", "date", "total");
    const dailyMarketRaw = await getDailySums("market_purchases", "ticketDate", "totalAmount");
    const dailyGeneralRaw = await getDailySums("expenses", "date", "total");

    // Merge Data
    const graphDataMap = new Map<string, { income: number; expense: number }>();
    
    const addToMap = (data: any[], type: 'income' | 'expense') => {
        data.forEach((row: any) => {
            const date = row.date;
            const val = Number(row.total || 0);
            if (!graphDataMap.has(date)) {
                graphDataMap.set(date, { income: 0, expense: 0 });
            }
            const current = graphDataMap.get(date)!;
            if (type === 'income') current.income += val;
            else current.expense += val;
        });
    };

    addToMap(dailyIncomeRaw, 'income');
    addToMap(dailyVehicleRaw, 'expense');
    addToMap(dailyWorkerRaw, 'expense');
    addToMap(dailyMarketRaw, 'expense');
    addToMap(dailyGeneralRaw, 'expense');

    // Convert map to sorted array
    const graphData = Array.from(graphDataMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, vals]) => ({
            date,
            income: vals.income,
            expense: vals.expense
        }));

    return {
      summary: {
        income,
        totalExpenses,
        netProfit,
        breakdown: {
            vehicleExpenses,
            workerExpenses,
            marketExpenses,
            generalExpenses
        }
      },
      graphData
    };
  }
}