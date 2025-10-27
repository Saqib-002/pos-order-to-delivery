import { AnalyticsType } from "@/types/report";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  translateOrderStatus,
  getOrderStatusStyle,
  translatePaymentStatus,
  getPaymentStatusStyle,
} from "../utils/orderStatus";
import { DateRangeSelector } from "../components/report/DateRangeSelector";
import { HourlyDistribution } from "../components/report/HourlyDistribution";
import { StatusDistribution } from "../components/report/StatusDistribution";
import { TopItems } from "../components/report/TopItems";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import {
  AnalyticsIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  LightningBoltIcon,
} from "../public/Svg";
import { StatsCard } from "../components/shared/StatsCard.order";
import { OrderTable } from "../components/shared/OrderTable";
import { useConfigurations } from "../contexts/configurationContext";
import { useTranslation } from "react-i18next";

export const ReportView = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { configurations } = useConfigurations();

  const [dateRange, setDateRange] = useState<string>("today");
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const {
    auth: { token },
  } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await (window as any).electronAPI.getOrderAnalytics(token, {
        dateRange,
        selectedDate,
      });
      if (!res.status) {
        toast.error(t("reports.errors.fetchFailed"));
        return;
      }
      const totalOrders =
        res.data.totalCancelled +
        res.data.totalDelivered +
        res.data.totalOutForDelivery +
        res.data.totalReadyForDelivery +
        res.data.totalSentToKitchen+res.data.totalCompleted+res.data.totalPending;
      setAnalytics({
        ...res.data,
        totalOrders,
        inProgress:
          res.data.totalReadyForDelivery +
          res.data.totalOutForDelivery +
          res.data.totalSentToKitchen+res.data.pending,
        successRate:
          totalOrders > 0
            ? Math.round((res.data.totalDelivered / totalOrders) * 100)
            : 0,
      });
    };
    fetchAnalytics();
  }, [dateRange, selectedDate]);

  const renderOrderRow = (order: any) => (
    <tr
      key={order.orderId}
      className="hover:bg-gray-50 transition-colors duration-150"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-black">
          {configurations.orderPrefix || "K"}
          {order.orderId}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">{order.customer.name}</div>
        <div className="text-sm text-gray-500">{order.customer.phone}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-black">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600">{item.name}</span>
              <span className="text-black font-medium">x{item.quantity}</span>
            </div>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusStyle(order.status)}`}
        >
          {translateOrderStatus(order.status)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </td>
    </tr>
  );

  const ordersData = analytics?.orders.slice(0, 20) || [];

  return (
    <div className="p-4 flex flex-col">
      <Header
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        icon={<AnalyticsIcon className="size-8 text-purple-600" />}
        iconbgClasses="bg-purple-100"
      />
      <DateRangeSelector
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-4">
        <StatsCard
          title={t("reports.totalOrders")}
          value={analytics?.totalOrders || 0}
          icon={<ClipboardIcon className="size-8 text-blue-600" />}
          bgColor="bg-blue-100"
        />
        <StatsCard
          title={t("reports.delivered")}
          value={
            (analytics?.totalDelivered || 0) + (analytics?.totalCompleted || 0)
          }
          icon={<CheckIcon className="size-8 text-green-600" />}
          subtext={`${analytics?.successRate || 0}% ${t("reports.successRate")}`}
          bgColor="bg-green-100"
        />
        <StatsCard
          title={t("reports.avgDeliveryTime")}
          value={analytics?.avgDeliveryTime || 0}
          icon={<ClockIcon className="size-8 text-orange-600" />}
          bgColor="bg-orange-100"
          subtext={t("reports.minutes")}
          format={(value: number) => value?.toFixed(2)}
        />
        <StatsCard
          title={t("reports.inProgress")}
          value={analytics?.inProgress || 0}
          icon={<LightningBoltIcon className="size-8 text-purple-600" />}
          bgColor="bg-purple-100"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatusDistribution analytics={analytics} />
        <HourlyDistribution analytics={analytics} />
      </div>
      <div className="flex flex-col gap-4">
      {analytics?.topItems && analytics.topItems.length > 0 && (
        <TopItems
          topItems={analytics?.topItems}
          title={t("reports.topOrderedItems")}
        />
      )}
      {analytics?.topMenus && analytics.topMenus.length > 0 && (
        <TopItems
        topItems={analytics?.topMenus}
        title={t("reports.topOrderedMenus")}
        />
      )}
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden my-4">
        <OrderTable
          data={ordersData}
          title={t("reports.orderDetails")}
          columns={[
            t("reports.orderId"),
            t("reports.customer"),
            t("reports.items"),
            t("reports.status"),
            t("reports.time"),
          ]}
          renderRow={renderOrderRow}
          emptyStateIcon={
            <ClipboardIcon className="mx-auto h-12 w-12 text-gray-400" />
          }
          emptyStateTitle={t("reports.noOrdersFound")}
          subtitle={t("reports.noOrdersSubtitle")}
        />
        {analytics?.orders && analytics.orders.length > 20 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
            {t("reports.showingOrders", { total: analytics.orders.length })}
          </div>
        )}
      </div>
    </div>
  );
};
