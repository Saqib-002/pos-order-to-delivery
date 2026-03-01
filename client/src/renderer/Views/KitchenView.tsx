import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  cloneElement,
} from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FilterControls } from "../components/shared/FilterControl.order";
import { Order } from "@/types/order";
import { StatsCard } from "../components/shared/StatsCard.order";
import { useAuth } from "../contexts/AuthContext";
import { updateOrder, StringToComplements } from "../utils/order";
import Header from "../components/shared/Header.order";
import { OrderTable } from "../components/shared/OrderTable";
import OrderDetailsModal from "../components/order/modals/OrderDetailsModal";
import { useOrderManagementContext } from "../contexts/orderManagementContext";
import { useConfigurations } from "../contexts/configurationContext";
import { translateOrderType, getOrderTypeStyle } from "../utils/orderStatus";
import {
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  EyeIcon,
  LightningBoltIcon,
  SentToKitchenIcon,
  DeliveredIcon,
  CarIcon,
  PersonIcon,
  AnalyticsIcon,
  MapIcon,
} from "../public/Svg";
import { DEFAULT_PAGE_LIMIT } from "@/constants";
import { formatAddress } from "../utils/utils";
import DeliveryRouteModal from "../components/order/modals/DeliveryRouteModal";

export const KitchenView = () => {
  const { t } = useTranslation();
  const {
    auth: { token },
  } = useAuth();
  const { orders, filter, setFilter, refreshOrdersCallback } =
    useOrderManagementContext();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const { configurations } = useConfigurations();
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedOrderForRoute, setSelectedOrderForRoute] =
    useState<Order | null>(null);
  useEffect(() => {
    setFilter({
      selectedDate: new Date(),
      searchTerm: "",
      selectedStatus: ["sent to kitchen"],
      selectedPaymentStatus: [],
      page: 0,
      limit: DEFAULT_PAGE_LIMIT,
      startDateRange: null,
      endDateRange: null,
      selectedDeliveryPerson: "",
      selectedCustomer: "",
      selectedOrderType: "",
    });
  }, [token, setFilter]);

  const markAsReady = useCallback(
    async (order: Order) => {
      try {
        let updates: {
          status: string;
          readyAt?: string;
          assignedAt?: string;
          deliveredAt?: string;
        };
        if (
          order.orderType === "delivery" ||
          order.orderType === "platform" ||
          order.orderType === "platform:delivery"
        ) {
          updates = {
            status: "ready for delivery",
            readyAt: new Date(Date.now()).toISOString(),
          };
        } else {
          // For pickup, dine-in, and platform:pickup orders, mark as completed
          updates = {
            status: "completed",
            readyAt: new Date(Date.now()).toISOString(),
            assignedAt: new Date(Date.now()).toISOString(),
            deliveredAt: new Date(Date.now()).toISOString(),
          };
        }
        const res = await updateOrder(token, order.id, updates);
        if (!res) {
          toast.error(t("kitchenView.messages.failedToUpdateOrder"));
          return;
        }
        refreshOrdersCallback();
        toast.success(
          updates.status === "completed"
            ? t("kitchenView.messages.orderMarkedAsCompleted")
            : t("kitchenView.messages.orderMarkedAsReady"),
        );
      } catch (error) {
        console.error("Failed to update order:", error);
      }
    },
    [token, refreshOrdersCallback],
  );

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  const parseComplements = (complements: any) => {
    if (Array.isArray(complements)) return complements;
    if (typeof complements === "string") {
      return StringToComplements(complements);
    }

    return [];
  };

  const stats = useMemo(() => {
    const highPriorityCount = orders.filter((order) => {
      const orderTime = new Date(order.createdAt || order.id);
      const now = new Date();
      const diffHours =
        (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
      return diffHours > 1;
    }).length;

    const primaryStats = [
      {
        title: t("kitchenView.stats.ordersInKitchen"),
        value: orders.length,
        icon: <ClipboardIcon className="size-6 text-blue-600" />,
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
      },
      {
        title: t("kitchenView.stats.highPriority"),
        value: highPriorityCount,
        icon: <ClockIcon className="w-6 h-6 text-red-600" />,
        bgColor: "bg-red-100",
        textColor: "text-red-600",
      },
      {
        title: t("kitchenView.stats.avgPrepTime"),
        value: t("kitchenView.stats.avgPrepTimeValue"),
        icon: <LightningBoltIcon className="w-6 h-6 text-green-600" />,
        bgColor: "bg-green-100",
        textColor: "text-green-600",
      },
    ];

    const typeStats = [
      {
        title: t("kitchenView.stats.delivery"),
        value: orders.filter((o) => o.orderType === "delivery").length,
        icon: <DeliveredIcon className="size-6 text-orange-600" />,
        bgColor: "bg-orange-100",
        textColor: "text-orange-600",
      },
      {
        title: t("kitchenView.stats.pickup"),
        value: orders.filter((o) => o.orderType === "pickup").length,
        icon: <CarIcon className="size-6 text-blue-600" />,
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
      },
      {
        title: t("kitchenView.stats.dineIn"),
        value: orders.filter((o) => o.orderType === "dine-in").length,
        icon: <PersonIcon className="size-6 text-purple-600" />,
        bgColor: "bg-purple-100",
        textColor: "text-purple-600",
      },
      {
        title: t("kitchenView.stats.platform"),
        value: orders.filter((o) => o.orderType?.startsWith("platform")).length,
        icon: <AnalyticsIcon className="size-6 text-pink-600" />,
        bgColor: "bg-pink-100",
        textColor: "text-pink-600",
      },
    ];

    return { primaryStats, typeStats };
  }, [orders, t]);
  const getPriorityLabel = (diffMinutes: number) => {
    const mediumPriority = configurations.mediumKitchenPriorityTime || 60;
    const highPriority = configurations.highKitchenPriorityTime || 120;
    if (diffMinutes > highPriority)
      return {
        label: t("kitchenView.priority.high"),
        color: "bg-red-100 text-red-800",
      };
    if (diffMinutes > mediumPriority)
      return {
        label: t("kitchenView.priority.medium"),
        color: "bg-orange-100 text-orange-800",
      };
    return {
      label: t("kitchenView.priority.low"),
      color: "bg-blue-100 text-blue-800",
    };
  };
  const getPriorityColor = (order: Order) => {
    const orderTime = new Date(order.createdAt || order.id);
    const now = new Date();
    const diffHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);

    if (diffHours > 2) return "border-red-500 bg-red-50";
    if (diffHours > 1) return "border-orange-500 bg-orange-50";
    return "border-blue-500 bg-blue-50";
  };
  const OrderRowRenderer = (order: Order) => {
    const orderTime = new Date(order.createdAt || "");
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60),
    );
    const timeInKitchen = `${Math.floor(diffMinutes / 60)}${t("kitchenView.timeFormat.hours")} ${diffMinutes % 60}${t("kitchenView.timeFormat.minutes")}`;
    const { label, color } = getPriorityLabel(diffMinutes);
    return (
      <tr
        className={`hover:bg-gray-50 transition-colors duration-150 ${getPriorityColor(order)}`}
        key={order.id}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
          >
            {label}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-black">
          {order.ticketNumber ? (
            <>{order.ticketNumber}</>
          ) : (
            <>
              {configurations.orderPrefix || "K"}
              {order.orderId}
            </>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          {order.customer.name}
          <div className="max-w-24 whitespace-normal text-xs text-gray-500">
            {formatAddress(order.customer.address)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getOrderTypeStyle(order.orderType || "")}`}
          >
            {translateOrderType(order.orderType || "")}
          </span>
        </td>
        <td className="px-6 py-4 min-w-[350px] text-sm text-black">
          <div className="space-y-2">
            {order.items &&
              order.items.map((item, index) => {
                const parsedComplements = parseComplements(item.complements);
                return (
                  <div
                    key={index}
                    className="border-b border-gray-100 pb-0 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-black">
                          {item.quantity}x {item.productName}
                          {item.variantName && item.variantId && (
                            <span className="text-gray-600">
                              {" "}
                              ({item.variantName})
                            </span>
                          )}
                        </div>
                        {parsedComplements.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">
                              {t("kitchenView.addOns")}
                            </span>{" "}
                            {parsedComplements
                              .map((c) => c.itemName)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-black font-medium">{timeInKitchen}</div>
          <div className="text-xs text-gray-500">
            {orderTime.toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center gap-2 justify-end min-w-[120px]">
            <button
              onClick={() => handleViewDetails(order)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
              title={t("kitchenView.actions.viewOrderDetails")}
            >
              <EyeIcon className="size-4" />
            </button>
            <button
              onClick={() => markAsReady(order)}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
              title={t("kitchenView.actions.markAsReady")}
            >
              <CheckIcon className="size-4" />
            </button>
            {order.orderType === "delivery" && (
              <button
                onClick={() => {
                  setSelectedOrderForRoute(order);
                  setIsRouteModalOpen(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                title={
                  t("orderProcessingModal.customerSearch.viewRoute") ||
                  "View Route"
                }
              >
                <MapIcon className="size-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };
  return (
    <div className="p-4 flex flex-col">
      <Header
        title={t("kitchenView.title")}
        subtitle={t("kitchenView.subtitle")}
        icon={<SentToKitchenIcon className="text-orange-600 size-8" />}
        iconbgClasses="bg-orange-100"
      />
      <div className="flex-1">
        <div className="pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            {/* Primary Stats */}
            {stats.primaryStats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}

            {/* Breakdown Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <AnalyticsIcon className="size-4 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {t("kitchenView.stats.activeOrdersByType")}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {stats.typeStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex flex-col group transition-all duration-200 p-2 rounded-lg hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={`p-1 ${stat.bgColor} rounded-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        {cloneElement(
                          stat.icon as React.ReactElement<{
                            className?: string;
                          }>,
                          {
                            className: "size-7 " + stat.textColor,
                          },
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">
                        {stat.title}
                      </span>
                    </div>
                    <span className="text-2xl text-center font-bold text-black leading-tight ml-0.5">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    {orders.length > 0
                      ? t("kitchenView.table.kitchenOrders")
                      : t("kitchenView.table.noOrdersMatch")}
                  </h3>
                </div>
                <FilterControls filter={filter} setFilter={setFilter} />
              </div>
            </div>
            <OrderTable
              data={orders}
              columns={[
                t("kitchenView.table.priority"),
                t("kitchenView.table.orderId"),
                t("kitchenView.table.customer"),
                t("kitchenView.table.orderType"),
                t("kitchenView.table.items"),
                t("kitchenView.table.timeInKitchen"),
                t("kitchenView.table.actions"),
              ]}
              renderRow={OrderRowRenderer}
            />
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Delivery Route Modal */}
      <DeliveryRouteModal
        isOpen={isRouteModalOpen}
        onClose={() => {
          setIsRouteModalOpen(false);
          setSelectedOrderForRoute(null);
        }}
        origin={configurations.address}
        destination={formatAddress(
          selectedOrderForRoute?.customer?.address || "",
        )}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
      />
    </div>
  );
};
