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

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startISO = formatDate(startDate);
    const endISO = formatDate(endDate) + ' 23:59:59';

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

    // D. Cash Out (Outflows only)
    const cashOutResult = await db("cash_out_transactions")
      .whereBetween("date", [startISO, endISO])
      .where("transactionType", "out")
      .sum("total as total")
      .first();
    const cashOutTotal = Number(cashOutResult?.total || 0);

    // E. Cash In (Inflows only)
    const cashInResult = await db("cash_out_transactions")
      .whereBetween("date", [startISO, endISO])
      .where("transactionType", "in")
      .sum("total as total")
      .first();
    const cashInTotal = Number(cashInResult?.total || 0);

    const totalExpenses = vehicleExpenses + workerExpenses + marketExpenses;
    const netProfit = totalIncome - totalExpenses;
    const netBalance = netProfit - cashOutTotal + cashInTotal;

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
    const dailyCashOutRaw = await getDailySums(
      "cash_out_transactions",
      "date",
      "total",
      (builder: any) => {
        builder.where("transactionType", "out");
      }
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
        netBalance,
        breakdown: {
          vehicleExpenses,
          workerExpenses,
          marketExpenses,
          otherIncome,
          cashOutTotal,
          cashInTotal,
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

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startISO = formatDate(startDate);
    const endISO = formatDate(endDate) + ' 23:59:59';

    const calculatePendingAmount = (totalAmount: number, paymentType: string): number => {
      if (!paymentType || paymentType.trim() === "" || paymentType.toLowerCase() === "pending") {
        return totalAmount;
      }

      try {
        const payments = paymentType.split(", ");
        let totalPaid = 0;

        payments.forEach((payment: string) => {
          const [, amount] = payment.split(":");
          const numericAmount = parseFloat(amount);
          if (!isNaN(numericAmount)) {
            totalPaid += numericAmount;
          }
        });

        const remaining = totalAmount - totalPaid;
        return remaining > 0.01 ? remaining : 0;
      } catch (e) {
        return totalAmount;
      }
    };

    // 1. Other Income by Source (including POS Orders) with pending amounts
    let otherIncomeBySource: any[] = [];
    try {
      const otherIncomeSources = await db("other_incomes")
        .leftJoin("income_sources", "other_incomes.income_source_id", "income_sources.id")
        .whereBetween("other_incomes.date", [startISO, endISO])
        .select(
          db.raw("COALESCE(income_sources.name, 'Other') as name"),
          "other_incomes.income_source_id"
        )
        .groupBy("other_incomes.income_source_id", "income_sources.name");

      const otherIncomeSourcesWithPending = await Promise.all(
        otherIncomeSources.map(async (source: any) => {
          const incomes = await db("other_incomes")
            .whereBetween("date", [startISO, endISO])
            .where(function () {
              if (source.income_source_id) {
                this.where("income_source_id", source.income_source_id);
              } else {
                this.whereNull("income_source_id");
              }
            })
            .select("total", "paymentType");

          let totalAmount = 0;
          let pendingAmount = 0;

          incomes.forEach((income: any) => {
            const total = Number(income.total || 0);
            totalAmount += total;
            pendingAmount += calculatePendingAmount(total, income.paymentType || "");
          });

          return {
            name: source.name || "Other",
            total: totalAmount,
            pending: pendingAmount
          };
        })
      );

      const posOrders = await db("order_items")
        .join("orders", "order_items.orderId", "orders.id")
        .whereBetween("orders.createdAt", [startISO, endISO])
        .whereNotIn("orders.status", ["pending", "sent to kitchen", "cancelled"])
        .select(
          db.raw("SUM(order_items.\"totalPrice\") as order_total"),
          "orders.paymentType"
        )
        .groupBy("orders.id", "orders.paymentType");

      let posOrdersTotal = 0;
      let posOrdersPending = 0;

      posOrders.forEach((order: any) => {
        const total = Number(order.order_total || 0);
        posOrdersTotal += total;
        posOrdersPending += calculatePendingAmount(total, order.paymentType || "");
      });

      const combinedSources = [
        {
          name: "POS Orders",
          total: posOrdersTotal,
          pending: posOrdersPending
        },
        ...otherIncomeSourcesWithPending
      ];

      otherIncomeBySource = combinedSources.filter(item => item.total > 0);

    } catch (e) {
      console.error("Error in otherIncomeBySource:", e);
    }

    // 2. Market Purchases by Expense Type with pending
    let marketPurchasesByType: any[] = [];
    try {
      const purchaseTypes = await db("market_purchase_items")
        .join("market_purchases", "market_purchase_items.purchaseId", "market_purchases.id")
        .leftJoin("expense_types", "market_purchase_items.expenseTypeId", "expense_types.id")
        .whereBetween("market_purchases.ticketDate", [startISO, endISO])
        .select(
          db.raw("COALESCE(expense_types.name, 'Uncategorized') as name"),
          "market_purchase_items.expenseTypeId"
        )
        .groupBy("market_purchase_items.expenseTypeId", "expense_types.name");

      marketPurchasesByType = await Promise.all(
        purchaseTypes.map(async (type: any) => {
          const purchases = await db("market_purchases")
            .join("market_purchase_items", "market_purchases.id", "market_purchase_items.purchaseId")
            .whereBetween("market_purchases.ticketDate", [startISO, endISO])
            .where(function () {
              if (type.expenseTypeId) {
                this.where("market_purchase_items.expenseTypeId", type.expenseTypeId);
              } else {
                this.whereNull("market_purchase_items.expenseTypeId");
              }
            })
            .select(
              "market_purchases.id as purchaseId",
              "market_purchases.paymentType"
            )
            .sum("market_purchase_items.total as purchaseTotal")
            .groupBy("market_purchases.id", "market_purchases.paymentType");

          let totalAmount = 0;
          let pendingAmount = 0;

          purchases.forEach((purchase: any) => {
            const total = Number(purchase.purchaseTotal || 0);
            totalAmount += total;
            pendingAmount += calculatePendingAmount(total, purchase.paymentType || "");
          });

          return {
            name: type.name || "Uncategorized",
            total: totalAmount,
            pending: pendingAmount
          };
        })
      );

      marketPurchasesByType.sort((a, b) => b.total - a.total);
    } catch (e) { console.error("Error in marketPurchasesByType:", e); }

    // 3. Market Purchases by Supplier with pending
    let marketPurchasesBySupplier: any[] = [];
    try {
      const suppliers = await db("market_purchases")
        .join("suppliers", "market_purchases.supplierId", "suppliers.id")
        .whereBetween("market_purchases.ticketDate", [startISO, endISO])
        .select("suppliers.name as name", "market_purchases.supplierId")
        .groupBy("market_purchases.supplierId", "suppliers.name");

      marketPurchasesBySupplier = await Promise.all(
        suppliers.map(async (supplier: any) => {
          const purchases = await db("market_purchases")
            .whereBetween("ticketDate", [startISO, endISO])
            .where("supplierId", supplier.supplierId)
            .select("totalAmount", "paymentType");

          let totalAmount = 0;
          let pendingAmount = 0;

          purchases.forEach((purchase: any) => {
            const total = Number(purchase.totalAmount || 0);
            totalAmount += total;
            pendingAmount += calculatePendingAmount(total, purchase.paymentType || "");
          });

          return {
            name: supplier.name,
            total: totalAmount,
            pending: pendingAmount
          };
        })
      );

      marketPurchasesBySupplier.sort((a, b) => b.total - a.total);
    } catch (e) { console.error("Error in marketPurchasesBySupplier:", e); }

    // 4. Worker Salaries by Worker with pending
    let salariesByWorker: any[] = [];
    try {
      const workersWithSalaries = await db("worker_salaries")
        .join("workers", "worker_salaries.workerId", "workers.id")
        .whereBetween("worker_salaries.date", [startISO, endISO])
        .select("workers.id as workerId", "workers.name")
        .groupBy("workers.id", "workers.name");

      salariesByWorker = await Promise.all(
        workersWithSalaries.map(async (worker: any) => {
          const salaries = await db("worker_salaries")
            .whereBetween("date", [startISO, endISO])
            .where("workerId", worker.workerId)
            .select("id", "total");

          let totalAmount = 0;
          let totalPaid = 0;

          await Promise.all(
            salaries.map(async (salary: any) => {
              const total = Number(salary.total || 0);
              totalAmount += total;

              const paidResult = await db("worker_salary_payments")
                .where("salaryId", salary.id)
                .sum("amount as totalPaid")
                .first();

              totalPaid += Number(paidResult?.totalPaid || 0);
            })
          );

          return {
            name: worker.name,
            total: totalAmount,
            pending: Math.max(0, totalAmount - totalPaid)
          };
        })
      );

      salariesByWorker.sort((a, b) => b.total - a.total);
    } catch (e) { console.error("Error in salariesByWorker:", e); }

    // 5. Vehicle Maintenance by Vehicle with pending
    let maintenanceByVehicle: any[] = [];
    try {
      const vehicles = await db("vehicle_maintenance")
        .join("vehicles", "vehicle_maintenance.vehicleId", "vehicles.id")
        .whereBetween("vehicle_maintenance.date", [startISO, endISO])
        .select(
          db.raw('CONCAT(vehicles.model, \' (\', vehicles."licensePlate", \')\') as name'),
          "vehicle_maintenance.vehicleId"
        )
        .groupBy("vehicle_maintenance.vehicleId", db.raw('CONCAT(vehicles.model, \' (\', vehicles."licensePlate", \')\')'));

      maintenanceByVehicle = await Promise.all(
        vehicles.map(async (vehicle: any) => {
          const maintenanceRecords = await db("vehicle_maintenance")
            .whereBetween("date", [startISO, endISO])
            .where("vehicleId", vehicle.vehicleId)
            .select("total", "paymentType");

          let totalAmount = 0;
          let pendingAmount = 0;

          maintenanceRecords.forEach((record: any) => {
            const total = Number(record.total || 0);
            totalAmount += total;
            pendingAmount += calculatePendingAmount(total, record.paymentType || "");
          });

          return {
            name: vehicle.name,
            total: totalAmount,
            pending: pendingAmount
          };
        })
      );

      maintenanceByVehicle.sort((a, b) => b.total - a.total);
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
        cashOuts: (await db("cash_out_transactions")
          .whereBetween("date", [startISO, endISO])
          .select("name", "total", "date", "paymentType", "transactionType")
          .orderBy("date", "desc")
          .limit(10)).map((item: any) => ({
            ...item,
            total: Number(item.total || 0),
          })),
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

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startISO = formatDate(startDate);
    const endISO = formatDate(endDate) + ' 23:59:59';

    const paymentData: {
      income: Record<string, number>;
      expenses: Record<string, number>;
      cashIns: Record<string, number>;
      cashOuts: Record<string, number>;
    } = {
      income: {},
      expenses: {},
      cashIns: {},
      cashOuts: {},
    };

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

    // Cash Out Transactions
    const cashOutTransactions = await db("cash_out_transactions")
      .select("paymentType", "total", "transactionType")
      .whereBetween("date", [startISO, endISO]);

    cashOutTransactions.forEach((cashOut: any) => {
      const amount = Number(cashOut.total || 0);
      const method = (cashOut.paymentType || "cash").trim().toLowerCase();
      if (cashOut.transactionType === "in") {
        if (!paymentData.cashIns[method]) {
          paymentData.cashIns[method] = 0;
        }
        paymentData.cashIns[method] += amount;
      } else {
        if (!paymentData.cashOuts[method]) {
          paymentData.cashOuts[method] = 0;
        }
        paymentData.cashOuts[method] += amount;
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
    const cashInTotal = Object.values(paymentData.cashIns).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    const cashOutTotal = Object.values(paymentData.cashOuts).reduce(
      (sum: number, val: number) => sum + val,
      0
    );

    // Liquid Cash = Cash In - Cash Out (Expenses + CashOuts)
    const cashIncome = paymentData.income["cash"] || 0;
    const cashExpenses = paymentData.expenses["cash"] || 0;
    const cashInRegister = paymentData.cashIns["cash"] || 0;
    const cashBalance = cashIncome + cashInRegister - cashExpenses - cashOutTotal;

    return {
      paymentMethods: paymentData,
      summary: {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        totalCashIn: cashInTotal,
        totalCashOut: cashOutTotal,
        netCashFlow: incomeTotal + cashInTotal - expenseTotal - cashOutTotal,
        cashBalance: cashBalance,
      },
    };
  }
}