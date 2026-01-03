import React, { useMemo } from "react";
import { FinancialAnalyticsType } from "@/types/report";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  registerables,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { StatsCard } from "../shared/StatsCard.order";
import {
  PieChart as ChartPieIcon,
  CircleDollarSign,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  ShoppingCart as ShoppingCartIcon,
  Truck as TruckIcon,
  CreditCard as CreditCardIcon,
  BarChart3 as BarChart3Icon,
  Wallet as WalletIcon,
  LayoutDashboard as LayoutDashboardIcon,
} from "lucide-react";

ChartJS.register(...registerables);

interface FinancialReportProps {
  data: FinancialAnalyticsType | null;
  dateRange: string;
  selectedDate: string;
  startDateRange: Date | null;
  endDateRange: Date | null;
}

const DistributionItem: React.FC<{
  label: string;
  value: number;
  percentage: number;
  color: string;
}> = ({ label, value, percentage, color }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 truncate max-w-[150px]" title={label}>{label}</span>
      <span className="font-semibold text-gray-900">{Number(value || 0).toFixed(2)}€</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

export const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  const { t } = useTranslation();

  const pieData = useMemo(() => {
    if (!data) return null;
    return {
      labels: [
        t("reports.financial.vehicles"),
        t("reports.financial.workers"),
        t("reports.financial.market"),
        t("reports.financial.general"),
      ],
      datasets: [
        {
          data: [
            data.summary.breakdown.vehicleExpenses,
            data.summary.breakdown.workerExpenses,
            data.summary.breakdown.marketExpenses,
            data.summary.breakdown.otherIncome || 0,
          ],
          backgroundColor: ["#60A5FA", "#F87171", "#34D399", "#A78BFA"],
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    };
  }, [data, t]);

  const expensePieData = useMemo(() => {
    if (!data) return null;
    return {
      labels: [
        t("reports.financial.vehicles"),
        t("reports.financial.workers"),
        t("reports.financial.market"),
      ],
      datasets: [
        {
          data: [
            data.summary.breakdown.vehicleExpenses,
            data.summary.breakdown.workerExpenses,
            data.summary.breakdown.marketExpenses,
          ],
          backgroundColor: ["#60A5FA", "#F87171", "#FACC15"],
          borderWidth: 0,
          hoverOffset: 15,
        },
      ],
    };
  }, [data, t]);

  const barData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.graphData.map((d) => d.date),
      datasets: [
        {
          label: t("reports.financial.income"),
          data: data.graphData.map((d) => d.income),
          backgroundColor: "#34D399",
          borderRadius: 4,
        },
        {
          label: t("reports.financial.expenses"),
          data: data.graphData.map((d) => d.expense),
          backgroundColor: "#F87171",
          borderRadius: 4,
        },
      ],
    };
  }, [data, t]);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8 pb-10 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t("reports.financial.totalIncome")}
          value={data.summary.income}
          icon={<CircleDollarSign className="h-6 w-6 text-emerald-600" />}
          bgColor="bg-emerald-50"
          format={(val: number) => `${val.toLocaleString()}€`}
        />
        <StatsCard
          title={t("reports.financial.totalExpenses")}
          value={data.summary.totalExpenses}
          icon={<TrendingDownIcon className="h-6 w-6 text-rose-600" />}
          bgColor="bg-rose-50"
          format={(val: number) => `${val.toLocaleString()}€`}
        />
        <StatsCard
          title={t("reports.financial.netProfit")}
          value={data.summary.netProfit}
          icon={<TrendingUpIcon className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-50"
          format={(val: number) => `${val.toLocaleString()}€`}
        />
         <StatsCard
          title={t("reports.financial.paymentOverview")}
          value={Object.values(data.breakdowns?.paymentMethods?.income || {}).reduce((a, b) => a + b, 0)}
          icon={<CreditCardIcon className="h-6 w-6 text-amber-600" />}
          bgColor="bg-amber-50"
          format={(val: number) => `${val.toLocaleString()}€`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense Distribution Graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3Icon className="w-5 h-5 text-gray-400" />
              {t("reports.financial.incomeVsExpense")}
            </h3>
          </div>
          <div className="h-[350px]">
            {barData && (
              <Bar
                data={barData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const, labels: { usePointStyle: true, boxWidth: 6 } },
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: { border: { dash: [4, 4] }, grid: { color: "#f3f4f6" } },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5 text-gray-400" />
            {t("reports.financial.expenseBreakdown")}
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="h-64 w-full relative">
              {expensePieData && (
                <Pie
                  data={expensePieData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                        labels: { usePointStyle: true, padding: 20 },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Distributions Title */}
      <div className="flex items-center gap-4 mt-4">
        <div className="h-px flex-1 bg-gray-100" />
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <LayoutDashboardIcon className="w-4 h-4" />
          {t("reports.financial.distributions")}
        </h2>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {/* Grid for categorized distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Income Sources */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <WalletIcon className="w-4 h-4 text-emerald-500" />
            {t("reports.financial.incomeBySource")}
          </h3>
          <div className="space-y-4">
            {(data.breakdowns?.otherIncomeBySource || []).length > 0 ? (
              data.breakdowns?.otherIncomeBySource.map((item, idx) => (
                <DistributionItem
                  key={idx}
                  label={item.name}
                  value={item.total}
                  percentage={calculatePercentage(item.total, data.summary.income)}
                  color={item.name === "POS Orders" ? "#059669" : "#10b981"}
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {/* Market Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCartIcon className="w-4 h-4 text-amber-500" />
            {t("reports.financial.expensesByCategory")}
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(data.breakdowns?.marketPurchasesByType || []).length > 0 ? (
              data.breakdowns?.marketPurchasesByType.map((item, idx) => (
                <DistributionItem
                  key={idx}
                  label={item.name}
                  value={item.total}
                  percentage={calculatePercentage(item.total, data.summary.breakdown.marketExpenses)}
                  color="#f59e0b"
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCartIcon className="w-4 h-4 text-blue-500" />
            {t("reports.financial.topSuppliers")}
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(data.breakdowns?.marketPurchasesBySupplier || []).length > 0 ? (
              data.breakdowns?.marketPurchasesBySupplier.map((item, idx) => (
                <DistributionItem
                  key={idx}
                  label={item.name}
                  value={item.total}
                  percentage={calculatePercentage(item.total, data.summary.breakdown.marketExpenses)}
                  color="#3b82f6"
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {/* Worker Salaries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-rose-500" />
            {t("reports.financial.topWorkers")}
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(data.breakdowns?.salariesByWorker || []).length > 0 ? (
              data.breakdowns?.salariesByWorker.map((item, idx) => (
                <DistributionItem
                  key={idx}
                  label={item.name}
                  value={item.total}
                  percentage={calculatePercentage(item.total, data.summary.breakdown.workerExpenses)}
                  color="#f43f5e"
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {/* Vehicle Maintenance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TruckIcon className="w-4 h-4 text-sky-500" />
            {t("reports.financial.maintenanceByVehicle")}
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(data.breakdowns?.maintenanceByVehicle || []).length > 0 ? (
              data.breakdowns?.maintenanceByVehicle.map((item, idx) => (
                <DistributionItem
                  key={idx}
                  label={item.name}
                  value={item.total}
                  percentage={calculatePercentage(item.total, data.summary.breakdown.vehicleExpenses)}
                  color="#0ea5e9"
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {/* Spending by Product */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCartIcon className="w-4 h-4 text-purple-500" />
            {t("reports.financial.purchasesByProduct")}
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(data.breakdowns?.purchasesByProduct || []).length > 0 ? (
              data.breakdowns?.purchasesByProduct.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate max-w-[150px]" title={item.name}>
                      {item.name} ({item.units} {t("reports.financial.units")})
                    </span>
                    <span className="font-semibold text-gray-900">{Number(item.total || 0).toFixed(2)}€</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${calculatePercentage(item.total, data.summary.breakdown.marketExpenses)}%`, 
                        backgroundColor: "#a855f7" 
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {/* Payment Methods Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4 text-indigo-500" />
            {t("reports.financial.paymentOverview")}
          </h3>
          <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {/* Income Payments */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("reports.financial.income")}</span>
              {Object.entries(data.breakdowns?.paymentMethods?.income || {}).map(([method, amount], idx) => (
                amount > 0 && (
                  <DistributionItem
                    key={idx}
                    label={method.charAt(0).toUpperCase() + method.slice(1)}
                    value={amount}
                    percentage={calculatePercentage(amount, data.summary.income)}
                    color="#6366f1"
                  />
                )
              ))}
            </div>
            {/* Expense Payments */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("reports.financial.expenses")}</span>
              {Object.entries(data.breakdowns?.paymentMethods?.expenses || {}).map(([method, amount], idx) => (
                amount > 0 && (
                  <DistributionItem
                    key={idx}
                    label={method.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    value={amount}
                    percentage={calculatePercentage(amount, data.summary.totalExpenses)}
                    color="#ef4444"
                  />
                )
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
