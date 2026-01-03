import { db } from "./index.js";

export class FinancialDatabaseOperations {
  static async getFinancialAnalytics(filter: any): Promise<any> {
    const { dateRange, selectedDate, startDateRange, endDateRange } = filter;

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
    const ordersIncomeResult = await db("order_items")
      .join("orders", "order_items.orderId", "orders.id")
      .whereBetween("orders.createdAt", [startISO, endISO])
      .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
      .sum("order_items.totalPrice as total")
      .first();

    const ordersIncome = Number(ordersIncomeResult?.total || 0);

    // 2. Calculate Other Income (formerly general expenses)
    const otherIncomeResult = await db("other_incomes")
      .whereBetween("date", [startISO, endISO])
      .sum("total as total")
      .first();
    const otherIncome = Number(otherIncomeResult?.total || 0);

    const totalIncome = ordersIncome + otherIncome;

    // 3. Calculate Expenses

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

    const totalExpenses = vehicleExpenses + workerExpenses + marketExpenses;
    const netProfit = totalIncome - totalExpenses;

    // 4. Graph Data (Daily distribution for the selected range)
    // group by day (YYYY-MM-DD)

    // Helper to get daily sums
    const getDailySums = async (
      table: string,
      dateCol: string,
      sumCol: string,
      whereClause?: any
    ) => {
      let q = db(table)
        .select(
          db.raw(`TO_CHAR("${dateCol}"::timestamp, 'YYYY-MM-DD') as date`)
        )
        .sum(`${sumCol} as total`)
        .whereBetween(dateCol, [startISO, endISO]);

      if (whereClause) {
        q = q.where(whereClause);
      }

      return q.groupBy(db.raw(`TO_CHAR("${dateCol}"::timestamp, 'YYYY-MM-DD')`));
    };

    const dailyOrdersIncomeRaw = await db("order_items")
      .join("orders", "order_items.orderId", "orders.id")
      .select(
        db.raw(`TO_CHAR(orders."createdAt"::timestamp, 'YYYY-MM-DD') as date`)
      )
      .sum("order_items.totalPrice as total")
      .whereBetween("orders.createdAt", [startISO, endISO])
      .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
      .groupBy(db.raw(`TO_CHAR(orders."createdAt"::timestamp, 'YYYY-MM-DD')`));

    const dailyOtherIncomeRaw = await getDailySums(
      "other_incomes",
      "date",
      "total"
    );

    const dailyVehicleRaw = await getDailySums(
      "vehicle_maintenance",
      "date",
      "total"
    );
    const dailyWorkerRaw = await getDailySums(
      "worker_salaries",
      "date",
      "total"
    );
    const dailyMarketRaw = await getDailySums(
      "market_purchases",
      "ticketDate",
      "totalAmount"
    );

    // Merge Data
    const graphDataMap = new Map<string, { income: number; expense: number }>();

    const addToMap = (data: any[], type: "income" | "expense") => {
      data.forEach((row: any) => {
        const date = row.date;
        const val = Number(row.total || 0);
        if (!graphDataMap.has(date)) {
          graphDataMap.set(date, { income: 0, expense: 0 });
        }
        const current = graphDataMap.get(date)!;
        if (type === "income") current.income += val;
        else current.expense += val;
      });
    };

    addToMap(dailyOrdersIncomeRaw, "income");
    addToMap(dailyOtherIncomeRaw, "income");
    addToMap(dailyVehicleRaw, "expense");
    addToMap(dailyWorkerRaw, "expense");
    addToMap(dailyMarketRaw, "expense");

    // Convert map to sorted array
    const graphData = Array.from(graphDataMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, vals]) => ({
        date,
        income: vals.income,
        expense: vals.expense,
      }));

    return {
      summary: {
        income: totalIncome,
        totalExpenses,
        netProfit,
        breakdown: {
          vehicleExpenses,
          workerExpenses,
          marketExpenses,
          otherIncome,
        },
      },
      graphData,
    };
  }

  static async getComprehensiveFinancialAnalytics(filter: any): Promise<any> {
    const mainAnalytics = await this.getFinancialAnalytics(filter);
    const { dateRange, selectedDate, startDateRange, endDateRange } = filter;

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
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // 1. Other Income by Source (including POS Orders)
    let otherIncomeBySource: any[] = [];
    try {
      // First get other income sources
      const otherIncomeSources = await db("other_incomes")
        .leftJoin("income_sources", "other_incomes.income_source_id", "income_sources.id")
        .whereBetween("other_incomes.date", [startISO, endISO])
        .select(
          db.raw("COALESCE(income_sources.name, 'Other') as name"),
          "other_incomes.income_source_id"
        )
        .sum("other_incomes.total as total")
        .groupBy("other_incomes.income_source_id", "income_sources.name")
        .orderBy("total", "desc");

      // Calculate POS orders income
      const posOrdersResult = await db("order_items")
        .join("orders", "order_items.orderId", "orders.id")
        .whereBetween("orders.createdAt", [startISO, endISO])
        .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
        .sum("order_items.totalPrice as total")
        .first();

      const posOrdersTotal = Number(posOrdersResult?.total || 0);

      // Combine and deduplicate by name
      const combinedSources = [
        { name: "POS Orders", total: posOrdersTotal },
        ...otherIncomeSources.map((item: any) => ({
          name: item.name || "Other",
          total: Number(item.total || 0)
        }))
      ];

      otherIncomeBySource = combinedSources.filter(item => item.total > 0);

    } catch (e) { 
      console.error("Error in otherIncomeBySource:", e); 
    }

    // 2. Market Purchases by Expense Type
    let marketPurchasesByType: any[] = [];
    try {
      marketPurchasesByType = await db("market_purchase_items")
        .join("market_purchases", "market_purchase_items.purchaseId", "market_purchases.id")
        .leftJoin("expense_types", "market_purchase_items.expenseTypeId", "expense_types.id")
        .whereBetween("market_purchases.ticketDate", [startISO, endISO])
        .select(db.raw("COALESCE(expense_types.name, 'Uncategorized') as name"))
        .sum("market_purchase_items.total as total")
        .groupBy(db.raw("COALESCE(expense_types.name, 'Uncategorized')"))
        .orderBy("total", "desc");
    } catch (e) { console.error("Error in marketPurchasesByType:", e); }

    // 3. Market Purchases by Supplier
    let marketPurchasesBySupplier: any[] = [];
    try {
      marketPurchasesBySupplier = await db("market_purchases")
        .join("suppliers", "market_purchases.supplierId", "suppliers.id")
        .whereBetween("market_purchases.ticketDate", [startISO, endISO])
        .select("suppliers.name as name")
        .sum("market_purchases.totalAmount as total")
        .groupBy("suppliers.name")
        .orderBy("total", "desc")
        .limit(10);
    } catch (e) { console.error("Error in marketPurchasesBySupplier:", e); }

    // 4. Worker Salaries by Worker
    let salariesByWorker: any[] = [];
    try {
      salariesByWorker = await db("worker_salaries")
        .join("workers", "worker_salaries.workerId", "workers.id")
        .whereBetween("worker_salaries.date", [startISO, endISO])
        .select("workers.name as name")
        .sum("worker_salaries.total as total")
        .groupBy("workers.name")
        .orderBy("total", "desc");
    } catch (e) { console.error("Error in salariesByWorker:", e); }

    // 5. Vehicle Maintenance by Vehicle
    let maintenanceByVehicle: any[] = [];
    try {
      maintenanceByVehicle = await db("vehicle_maintenance")
        .join("vehicles", "vehicle_maintenance.vehicleId", "vehicles.id")
        .whereBetween("vehicle_maintenance.date", [startISO, endISO])
        .select(db.raw('CONCAT(vehicles.model, \' (\', vehicles."licensePlate", \')\') as name'))
        .sum("vehicle_maintenance.total as total")
        .groupBy(db.raw('CONCAT(vehicles.model, \' (\', vehicles."licensePlate", \')\')'))
        .orderBy("total", "desc");
    } catch (e) { console.error("Error in maintenanceByVehicle:", e); }

    // 6. Market Purchases by Inventory Product
    let purchasesByProduct: any[] = [];
    try {
      purchasesByProduct = await db("market_purchase_items")
        .join("market_purchases", "market_purchase_items.purchaseId", "market_purchases.id")
        .whereBetween("market_purchases.ticketDate", [startISO, endISO])
        .select("market_purchase_items.productName as name")
        .sum("market_purchase_items.total as total")
        .sum("market_purchase_items.totalUnit as units")
        .groupBy("market_purchase_items.productName")
        .orderBy("total", "desc");
    } catch (e) { console.error("Error in purchasesByProduct:", e); }

    // 7. Detailed Payment Methods
    let paymentMethods = { income: {}, expenses: {} };
    try {
      const pmReport = await this.getPaymentMethodsReport(filter);
      paymentMethods = pmReport.paymentMethods;
    } catch (e) { console.error("Error in paymentMethods:", e); }

    return {
      ...mainAnalytics,
      breakdowns: {
        otherIncomeBySource: (otherIncomeBySource || []).map((item: any) => ({
          ...item,
          total: Number(item.total || 0),
        })),
        marketPurchasesByType: (marketPurchasesByType || []).map((item: any) => ({
          ...item,
          total: Number(item.total || 0),
        })),
        marketPurchasesBySupplier: (marketPurchasesBySupplier || []).map((item: any) => ({
          ...item,
          total: Number(item.total || 0),
        })),
        salariesByWorker: (salariesByWorker || []).map((item: any) => ({
          ...item,
          total: Number(item.total || 0),
        })),
        maintenanceByVehicle: (maintenanceByVehicle || []).map((item: any) => ({
          ...item,
          total: Number(item.total || 0),
        })),
        purchasesByProduct: (purchasesByProduct || []).map((item: any) => ({
          ...item,
          total: Number(item.total || 0),
          units: Number(item.units || 0),
        })),
        paymentMethods,
      },
    };
  }

  // Comprehensive Payment Methods Report
  static async getPaymentMethodsReport(filter: any): Promise<any> {
    const { dateRange, selectedDate, startDateRange, endDateRange } = filter;

    let startDate = new Date();
    let endDate = new Date();

    // Date range logic (same as above)
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
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const paymentData: {
      income: Record<string, number>;
      expenses: Record<string, number>;
    } = {
      income: {},
      expenses: {},
    };

    // Helper to add payment amount
    const addToPayment = (target: Record<string, number>, method: string, amount: number) => {
      const cleanMethod = method.trim().toLowerCase();
      if (!target[cleanMethod]) {
        target[cleanMethod] = 0;
      }
      target[cleanMethod] += amount;
    };

    // 1. Process Order Income Payments
    const orderPayments = await db("order_items")
      .join("orders", "order_items.orderId", "orders.id")
      .select("orders.paymentType")
      .sum("order_items.totalPrice as total")
      .whereBetween("orders.createdAt", [startISO, endISO])
      .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
      .groupBy("orders.id", "orders.paymentType");

    orderPayments.forEach((order: any) => {
      const totalAmount = Number(order.total) || 0;
      if (order.paymentType && order.paymentType.includes(":")) {
        // Split payment (e.g., "cash:50, card:30")
        const payments = order.paymentType.split(", ");
        payments.forEach((payment: string) => {
          const [method, amount] = payment.split(":");
          const numAmount = parseFloat(amount) || 0;
          addToPayment(paymentData.income, method, numAmount);
        });
      } else if (order.paymentType && order.paymentType !== "pending") {
        addToPayment(paymentData.income, order.paymentType, totalAmount);
      }
    });

    // 2. Process Other Income Payments
    const otherIncomePayments = await db("other_incomes")
      .select("paymentType", "total")
      .whereBetween("date", [startISO, endISO]);

    otherIncomePayments.forEach((income: any) => {
      const totalAmount = Number(income.total) || 0;
      if (income.paymentType && income.paymentType.includes(":")) {
        const payments = income.paymentType.split(", ");
        payments.forEach((payment: string) => {
          const [method, amount] = payment.split(":");
          const numAmount = parseFloat(amount) || 0;
          addToPayment(paymentData.income, method, numAmount);
        });
      } else if (income.paymentType) {
        addToPayment(paymentData.income, income.paymentType, totalAmount);
      }
    });

    // 3. Process Expense Payments
    // Market Purchases
    const marketPurchases = await db("market_purchases")
      .select("paymentType", "totalAmount")
      .whereBetween("ticketDate", [startISO, endISO]);

    marketPurchases.forEach((purchase: any) => {
      const amount = Number(purchase.totalAmount || 0);
      if (purchase.paymentType) {
        if (purchase.paymentType.includes(":")) {
          const payments = purchase.paymentType.split(", ");
          payments.forEach((payment: string) => {
            const [method, amt] = payment.split(":");
            const numAmount = parseFloat(amt) || 0;
            addToPayment(paymentData.expenses, method, numAmount);
          });
        } else {
          addToPayment(paymentData.expenses, purchase.paymentType, amount);
        }
      }
    });

    // Worker Salary Payments
    const workerPayments = await db("worker_salary_payments")
      .join("worker_salaries", "worker_salary_payments.salaryId", "worker_salaries.id")
      .select("worker_salary_payments.paymentMethod", "worker_salary_payments.amount")
      .whereBetween("worker_salaries.date", [startISO, endISO]);

    workerPayments.forEach((payment: any) => {
      const amount = Number(payment.amount || 0);
      if (payment.paymentMethod) {
        addToPayment(paymentData.expenses, payment.paymentMethod, amount);
      }
    });

    // Vehicle Maintenance
    const vehicleMaintenance = await db("vehicle_maintenance")
      .select("paymentType", "total")
      .whereBetween("date", [startISO, endISO]);

    vehicleMaintenance.forEach((maintenance: any) => {
      const amount = Number(maintenance.total || 0);
      if (maintenance.paymentType) {
        if (maintenance.paymentType.includes(":")) {
          const payments = maintenance.paymentType.split(", ");
          payments.forEach((payment: string) => {
            const [method, amt] = payment.split(":");
            const numAmount = parseFloat(amt) || 0;
            addToPayment(paymentData.expenses, method, numAmount);
          });
        } else {
          addToPayment(paymentData.expenses, maintenance.paymentType, amount);
        }
      }
    });

    // Calculate totals
    const incomeTotal = Object.values(paymentData.income).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    const expenseTotal = Object.values(paymentData.expenses).reduce(
      (sum: number, val: number) => sum + val,
      0
    );

    return {
      paymentMethods: paymentData,
      summary: {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        netCashFlow: incomeTotal - expenseTotal,
      },
    };
  }
}
