import { DeliveryPerson, Order } from "@/types/order";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { DeliveryPersonInput } from "../components/delivery/DeliveryPersonInput.view";
import { OrderTable } from "../components/shared/OrderTable";
import { StatsCard } from "../components/shared/StatsCard.order";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { FilterControls } from "../components/shared/FilterControl.order";
import { updateOrder, StringToComplements } from "../utils/order";
import { formatAddress, getOrderDisplayNumber, getCustomerDisplayName } from "../utils/utils";
import { useOrderManagementContext } from "../contexts/orderManagementContext";
import { useConfigurations } from "../contexts/configurationContext";
import { calculateOrderTotal } from "../utils/orderCalculations";
import {
  CheckIcon,
  CircleCheckIcon,
  DeliveredIcon,
  GroupIcon,
  LightningBoltIcon,
  CrossIcon,
  EditIcon,
} from "../public/Svg";
import { OPERATIONAL_PAGE_LIMIT, FUNCTIONS } from "@/constants";
import { CancelOrderModal } from "../components/order/modals/CancelOrderModal";
import Pagination from "../components/shared/Pagination";
import { CustomSelect } from "../components/ui/CustomSelect";
import DeliveryRouteModal from "../components/order/modals/DeliveryRouteModal";
import { DeliveryRadarModal } from "../components/order/modals/DeliveryRadarModal";
import { MapIcon } from "../public/Svg";
import { Compass } from "lucide-react";

export const DeliveryView = () => {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const { token, user } = auth;
  const { filter, setFilter, refreshOrdersCallback } =
    useOrderManagementContext();
  const { configurations } = useConfigurations();
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(
    null
  );
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [selectedOrderForChange, setSelectedOrderForChange] =
    useState<Order | null>(null);
  const [changeDeliveryPerson, setChangeDeliveryPerson] =
    useState<DeliveryPerson | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedOrderForRoute, setSelectedOrderForRoute] =
    useState<Order | null>(null);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [deliveringDriverId, setDeliveringDriverId] = useState<string | null>(
    null
  );

  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const [res, platformsRes] = await Promise.all([
          (window as any).electronAPI.getDeliveryPersons(token),
          (window as any).electronAPI.getAllPlatforms(token),
        ]);
        if (res?.status && isMounted) {
          setDeliveryPersons(res.data);
        }
        if (platformsRes?.status && isMounted) {
          setPlatforms(platformsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch delivery persons/platforms:", error);
      }

      setFilter({
        selectedDate: new Date(),
        searchTerm: "",
        selectedStatus: ["ready for delivery", "out for delivery"],
        selectedPaymentStatus: [],
        page: 0,
        limit: OPERATIONAL_PAGE_LIMIT,
        startDateRange: null,
        endDateRange: null,
        selectedDeliveryPerson: "",
        selectedCustomer: "",
        selectedOrderType: "",
      });

      await refreshOrdersCallback();
      if (isMounted) {
        setIsLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Independent state for Ready for Delivery table
  const [readyOrdersState, setReadyOrdersState] = useState<{
    orders: Order[];
    totalCount: number;
  }>({
    orders: [],
    totalCount: 0,
  });
  const [readyPage, setReadyPage] = useState<number>(0);

  // Independent state for Out for Delivery table
  const [outOrdersState, setOutOrdersState] = useState<{
    orders: Order[];
    totalCount: number;
  }>({
    orders: [],
    totalCount: 0,
  });
  const [outPage, setOutPage] = useState<number>(0);

  // Accurate count of orders delivered today
  const [deliveredTodayCount, setDeliveredTodayCount] = useState<number>(0);

  // Dedicated state for radar orders: caps at 100 and respects the active filter
  const [radarData, setRadarData] = useState<{
    readyOrders: Order[];
    kitchenOrders: Order[];
  }>({
    readyOrders: [],
    kitchenOrders: [],
  });

  // Fetch up to 50 ready orders with independent pagination
  const fetchReadyOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await (window as any).electronAPI.getOrdersByFilter(token, {
        selectedDate: filter.selectedDate,
        startDateRange: filter.startDateRange,
        endDateRange: filter.endDateRange,
        searchTerm: filter.searchTerm,
        selectedStatus: ["ready for delivery"],
        selectedPaymentStatus: [],
        selectedDeliveryPerson: "",
        selectedCustomer: "",
        selectedOrderType: "",
        page: readyPage,
        limit: OPERATIONAL_PAGE_LIMIT,
      });

      if (res?.status && res?.data) {
        const formattedOrders: Order[] = (res.data.orders || []).map(
          (order: Order) => ({
            ...order,
            items:
              order.items?.map((item) => ({
                ...item,
                complements: StringToComplements(item.complements),
              })) || [],
          })
        );
        setReadyOrdersState({
          orders: formattedOrders,
          totalCount: res.data.totalCount || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch ready orders:", err);
    }
  }, [
    token,
    filter.selectedDate,
    filter.startDateRange,
    filter.endDateRange,
    filter.searchTerm,
    readyPage,
  ]);

  // Fetch up to 50 out for delivery orders with independent pagination
  const fetchOutOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await (window as any).electronAPI.getOrdersByFilter(token, {
        selectedDate: filter.selectedDate,
        startDateRange: filter.startDateRange,
        endDateRange: filter.endDateRange,
        searchTerm: filter.searchTerm,
        selectedStatus: ["out for delivery"],
        selectedPaymentStatus: [],
        selectedDeliveryPerson: "",
        selectedCustomer: "",
        selectedOrderType: "",
        page: outPage,
        limit: OPERATIONAL_PAGE_LIMIT,
      });

      if (res?.status && res?.data) {
        const formattedOrders: Order[] = (res.data.orders || []).map(
          (order: Order) => ({
            ...order,
            items:
              order.items?.map((item) => ({
                ...item,
                complements: StringToComplements(item.complements),
              })) || [],
          })
        );
        setOutOrdersState({
          orders: formattedOrders,
          totalCount: res.data.totalCount || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch out-for-delivery orders:", err);
    }
  }, [
    token,
    filter.selectedDate,
    filter.startDateRange,
    filter.endDateRange,
    filter.searchTerm,
    outPage,
  ]);

  // Fetch count of delivered orders (respecting active date and search filter)
  const fetchDeliveredTodayCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await (window as any).electronAPI.getOrdersByFilter(token, {
        selectedDate: filter.selectedDate,
        startDateRange: filter.startDateRange,
        endDateRange: filter.endDateRange,
        searchTerm: filter.searchTerm,
        selectedStatus: ["delivered"],
        selectedPaymentStatus: [],
        selectedDeliveryPerson: "",
        selectedCustomer: "",
        selectedOrderType: "",
        page: 0,
        limit: 1,
      });

      if (res?.status && res?.data) {
        setDeliveredTodayCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch delivered today count:", err);
    }
  }, [
    token,
    filter.selectedDate,
    filter.startDateRange,
    filter.endDateRange,
    filter.searchTerm,
  ]);

  // Last radar payload, so polling only updates state when orders actually change
  // (new arrays every 5s would make the open radar re-geocode and redraw)
  const lastRadarDataJsonRef = useRef<string>("");

  // Dedicated queries for radar orders (up to 100 each).
  // Kitchen orders are filtered by delivery type server-side, so dine-in /
  // takeaway kitchen orders can't use up the limit and push delivery orders out.
  const fetchRadarOrders = useCallback(async () => {
    if (!token) return;
    const fetchRadarPage = async (
      selectedStatus: string[],
      selectedOrderType: string
    ): Promise<Order[] | null> => {
      const res = await (window as any).electronAPI.getOrdersByFilter(token, {
        selectedDate: filter.selectedDate,
        startDateRange: filter.startDateRange,
        endDateRange: filter.endDateRange,
        searchTerm: filter.searchTerm,
        selectedStatus,
        selectedPaymentStatus: [],
        selectedDeliveryPerson: "",
        selectedCustomer: "",
        selectedOrderType,
        page: 0,
        limit: 100,
      });
      if (!res?.status || !Array.isArray(res?.data?.orders)) return null;
      return res.data.orders.map((order: Order) => ({
        ...order,
        items:
          order.items?.map((item) => ({
            ...item,
            complements: StringToComplements(item.complements),
          })) || [],
      }));
    };

    try {
      const [readyRes, kitchenDeliveryRes, kitchenPlatformRes] =
        await Promise.all([
          fetchRadarPage(["ready for delivery"], ""),
          // "delivery" covers delivery, web:delivery, app:delivery
          fetchRadarPage(["sent to kitchen"], "delivery"),
          // "platform" covers every platform:* type, narrowed below
          fetchRadarPage(["sent to kitchen"], "platform"),
        ]);
      if (!readyRes || !kitchenDeliveryRes || !kitchenPlatformRes) return;

      const ready = readyRes.filter(
        (o) => o.status?.toLowerCase() === "ready for delivery"
      );
      const kitchen = [
        ...kitchenDeliveryRes,
        ...kitchenPlatformRes.filter((o) => o.orderType === "platform:delivery"),
      ].filter((o) => o.status?.toLowerCase() === "sent to kitchen");

      const nextData = { readyOrders: ready, kitchenOrders: kitchen };
      const nextJson = JSON.stringify(nextData);
      if (nextJson === lastRadarDataJsonRef.current) return;
      lastRadarDataJsonRef.current = nextJson;
      setRadarData(nextData);
    } catch (err) {
      console.error("Failed to fetch radar orders:", err);
    }
  }, [
    token,
    filter.selectedDate,
    filter.startDateRange,
    filter.endDateRange,
    filter.searchTerm,
  ]);

  // Refresh all independent delivery queries simultaneously
  const refreshAllDeliveryData = useCallback(async () => {
    await Promise.all([
      fetchReadyOrders(),
      fetchOutOrders(),
      fetchRadarOrders(),
      fetchDeliveredTodayCount(),
    ]);
  }, [
    fetchReadyOrders,
    fetchOutOrders,
    fetchRadarOrders,
    fetchDeliveredTodayCount,
  ]);

  // Reset pagination when date filter or search filter changes
  useEffect(() => {
    setReadyPage(0);
    setOutPage(0);
  }, [
    filter.selectedDate,
    filter.startDateRange,
    filter.endDateRange,
    filter.searchTerm,
  ]);

  // Real-time polling every 5s for delivery queries
  useEffect(() => {
    refreshAllDeliveryData();
    const interval = setInterval(() => {
      refreshAllDeliveryData();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshAllDeliveryData]);

  // Listen for incoming web orders and immediately refresh queues
  useEffect(() => {
    if (!token) return;
    if (!(window as any).electronAPI?.onNewWebOrder) return;
    const cleanup = (window as any).electronAPI.onNewWebOrder(() => {
      refreshAllDeliveryData();
    });
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [token, refreshAllDeliveryData]);

  const readyOrders = readyOrdersState.orders;
  const outForDeliveryOrders = outOrdersState.orders;
  const kitchenDeliveryOrders = radarData.kitchenOrders;

  const readyTotalPages =
    readyOrdersState.totalCount > 0
      ? Math.ceil(readyOrdersState.totalCount / OPERATIONAL_PAGE_LIMIT)
      : 0;

  const outTotalPages =
    outOrdersState.totalCount > 0
      ? Math.ceil(outOrdersState.totalCount / OPERATIONAL_PAGE_LIMIT)
      : 0;

  // Step back when the current page no longer exists (e.g. orders dispatched
  // from the last page), otherwise the table is empty and pagination is hidden
  useEffect(() => {
    if (readyPage > 0 && readyPage >= readyTotalPages) {
      setReadyPage(Math.max(0, readyTotalPages - 1));
    }
  }, [readyPage, readyTotalPages]);

  useEffect(() => {
    if (outPage > 0 && outPage >= outTotalPages) {
      setOutPage(Math.max(0, outTotalPages - 1));
    }
  }, [outPage, outTotalPages]);

  const assignDelivery = useCallback(
    async (order: Order) => {
      if (!deliveryPerson?.name.trim()) {
        toast.error(t("deliveryView.messages.pleaseEnterDeliveryPersonName"));
        return;
      }
      try {
        const res = await updateOrder(token, order.id, {
          deliveryPersonId: deliveryPerson.id,
          deliveryPersonPhone: deliveryPerson.phone,
          deliveryPersonName: deliveryPerson.name,
          deliveryPersonEmail: deliveryPerson.email,
          deliveryPersonVehicleType: deliveryPerson.vehicleType,
          deliveryPersonLicenseNo: deliveryPerson.licenseNo,
          status: "out for delivery",
          assignedAt: new Date(Date.now()).toISOString(),
        });
        if (!res) {
          toast.error(t("deliveryView.messages.failedToAssignDeliveryPerson"));
          return;
        }
        refreshAllDeliveryData();
        refreshOrdersCallback();
        const orderDisplayId = order.ticketNumber
          ? order.ticketNumber
          : `${configurations.orderPrefix || "K"}${order.orderId}`;
        toast.success(
          t("deliveryView.messages.deliveryPersonAssigned", {
            name: deliveryPerson.name,
            orderId: orderDisplayId,
          }) || `Delivery person ${deliveryPerson.name} assigned successfully`
        );
      } catch (error) {
        console.error("Failed to assign delivery:", error);
        toast.error(t("deliveryView.messages.failedToAssignDelivery"));
      }
    },
    [
      deliveryPerson,
      token,
      refreshAllDeliveryData,
      refreshOrdersCallback,
      configurations.orderPrefix,
      t,
    ]
  );

  const markAsDelivered = useCallback(
    async (id: string) => {
      try {
        const res = await updateOrder(token, id, {
          status: "delivered",
          deliveredAt: new Date(Date.now()).toISOString(),
        });
        if (!res) {
          toast.error(t("deliveryView.messages.failedToMarkAsDelivered"));
          return;
        }
        refreshAllDeliveryData();
        refreshOrdersCallback();
        toast.success(t("deliveryView.messages.orderMarkedAsDelivered"));
      } catch (error) {
        console.error("Failed to mark as delivered:", error);
        toast.error(t("deliveryView.messages.failedToMarkAsDeliveredRetry"));
      }
    },
    [token, refreshAllDeliveryData, refreshOrdersCallback, t]
  );

  const handleCompleteDriverOrders = async (
    driverId: string,
    driverName: string
  ) => {
    if (deliveringDriverId) return;
    setDeliveringDriverId(driverId);
    try {
      const ordersToDeliver = outForDeliveryOrders.filter((o) => {
        if (driverId === "__unassigned__") {
          return !o.deliveryPerson?.name;
        }
        return (o.deliveryPerson?.id || o.deliveryPerson?.name) === driverId;
      });

      if (ordersToDeliver.length === 0) return;

      const nowIso = new Date().toISOString();
      const results = await Promise.all(
        ordersToDeliver.map((o) =>
          updateOrder(token, o.id, {
            status: "delivered",
            deliveredAt: nowIso,
          })
        )
      );

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        toast.success(
          t("deliveryView.messages.driverOrdersDeliveredSuccess", {
            name: driverName,
            count: successCount,
          }) || `${successCount} pedidos de ${driverName} completados`
        );
        await refreshAllDeliveryData();
        refreshOrdersCallback();
      } else {
        toast.error(
          t("deliveryView.messages.failedToMarkAsDelivered") ||
            "Failed to mark orders as delivered"
        );
      }
    } catch (error) {
      console.error("Failed to complete driver orders:", error);
      toast.error(
        t("deliveryView.messages.failedToMarkAsDeliveredRetry") ||
          "Failed to mark orders as delivered"
      );
    } finally {
      setDeliveringDriverId(null);
    }
  };

  const activeOutDrivers = useMemo(() => {
    const driverMap = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    outForDeliveryOrders.forEach((o) => {
      if (o.deliveryPerson?.name) {
        const key = o.deliveryPerson.id || o.deliveryPerson.name;
        const existing = driverMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          driverMap.set(key, {
            id: key,
            name: o.deliveryPerson.name,
            count: 1,
          });
        }
      }
    });
    return Array.from(driverMap.values());
  }, [outForDeliveryOrders]);

  const driverOrderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    activeOutDrivers.forEach((d) => {
      map[d.id] = d.count;
      map[d.name] = d.count;
    });
    return map;
  }, [activeOutDrivers]);

  const handleCancelOrderClick = (order: Order) => {
    setSelectedOrderForCancel(order);
    setIsCancelOrderModalOpen(true);
  };

  const handleCancelOrderConfirm = async (cancelNote: string) => {
    if (!selectedOrderForCancel) return;

    try {
      const res = await (window as any).electronAPI.deleteOrder(
        token,
        selectedOrderForCancel.id,
        cancelNote
      );
      if (!res.status) {
        toast.error(
          res.error ||
          t("deliveryView.messages.failedToCancelOrder") ||
          "Failed to cancel order"
        );
        return;
      }
      toast.success(
        t("deliveryView.messages.orderCancelled") ||
        "Order cancelled successfully"
      );
      setIsCancelOrderModalOpen(false);
      setSelectedOrderForCancel(null);
      refreshAllDeliveryData();
      refreshOrdersCallback();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(
        t("deliveryView.messages.failedToCancelOrder") ||
        "Failed to cancel order"
      );
    }
  };

  // Check if user has cancel order permission
  const hasCancelOrderPermission = () => {
    if (!user) return false;
    // Admins always have permission
    if (user.role === "admin") return true;
    // Check function permissions
    return user.functionPermissions?.includes(FUNCTIONS.CANCEL_ORDER) || false;
  };

  // Check if user has change delivery person permission
  const hasChangeDeliveryPersonPermission = () => {
    if (!user) return false;
    // Admins always have permission
    if (user.role === "admin") return true;
    // Check function permissions
    return (
      user.functionPermissions?.includes(FUNCTIONS.CHANGE_DELIVERY_PERSON) ||
      false
    );
  };

  const changeDeliveryPersonForOrder = useCallback(
    async (order: Order, newDeliveryPerson: DeliveryPerson) => {
      if (!newDeliveryPerson?.name.trim()) {
        toast.error(t("deliveryView.messages.pleaseEnterDeliveryPersonName"));
        return;
      }
      try {
        const res = await updateOrder(token, order.id, {
          deliveryPersonId: newDeliveryPerson.id,
          deliveryPersonPhone: newDeliveryPerson.phone,
          deliveryPersonName: newDeliveryPerson.name,
          deliveryPersonEmail: newDeliveryPerson.email,
          deliveryPersonVehicleType: newDeliveryPerson.vehicleType,
          deliveryPersonLicenseNo: newDeliveryPerson.licenseNo,
          status: "out for delivery",
        });
        if (!res) {
          toast.error(
            t("deliveryView.messages.failedToChangeDeliveryPerson") ||
            "Failed to change delivery person"
          );
          return;
        }
        toast.success(
          t("deliveryView.messages.deliveryPersonChanged") ||
          "Delivery person changed successfully"
        );
        refreshAllDeliveryData();
        refreshOrdersCallback();
        setSelectedOrderForChange(null);
        setChangeDeliveryPerson(null);
      } catch (error) {
        console.error("Failed to change delivery person:", error);
        toast.error(
          t("deliveryView.messages.failedToChangeDeliveryPerson") ||
          "Failed to change delivery person"
        );
      }
    },
    [token, refreshAllDeliveryData, refreshOrdersCallback, t]
  );

  const stats = useMemo(
    () => [
      {
        title: t("deliveryView.stats.readyForDelivery"),
        value: readyOrdersState.totalCount,
        icon: <CircleCheckIcon className="size-6 text-green-600" />,
        bgColor: "bg-green-100",
      },
      {
        title: t("deliveryView.stats.outForDelivery"),
        value: outOrdersState.totalCount,
        icon: <LightningBoltIcon className="text-blue-600 size-6" />,
        bgColor: "bg-blue-100",
      },
      {
        title:
          filter.startDateRange && filter.endDateRange
            ? t("deliveryView.delivered") || "Delivered"
            : t("deliveryView.stats.deliveredToday"),
        value: deliveredTodayCount,
        icon: <CheckIcon className="text-gray-600 size-6" />,
        bgColor: "bg-gray-100",
      },
      {
        title: t("deliveryView.stats.activeDrivers"),
        value: new Set(
          outForDeliveryOrders.map((o) => o.deliveryPerson?.id).filter(Boolean)
        ).size,
        icon: <GroupIcon className="text-purple-600 size-6" />,
        bgColor: "bg-purple-100",
      },
    ],
    [
      readyOrdersState.totalCount,
      outOrdersState.totalCount,
      deliveredTodayCount,
      outForDeliveryOrders,
      filter.startDateRange,
      filter.endDateRange,
      t,
    ]
  );
  const renderReadyOrderRow = (order: Order, index: number = 0) => {
    const readyTime = new Date(order.readyAt || order.createdAt || "");
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - readyTime.getTime()) / (1000 * 60)
    );
    const readySince = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    const serial = readyPage * OPERATIONAL_PAGE_LIMIT + index + 1;

    return (
      <tr
        key={order.id}
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
          #{serial}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-black">
            {getCustomerDisplayName(order, platforms)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-black">
            {order.customer.phone || "-"}
          </div>
        </td>
        <td className="px-6 py-4 min-w-[250px]">
          <div className="text-sm text-black max-w-xs">
            {order.customer.address
              ? formatAddress(order.customer.address)
              : "-"}
          </div>
        </td>
        <td className="px-6 py-4 min-w-[250px]">
          <div className="text-sm text-black">
            <div className="space-y-1">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{item.productName}</span>
                    <span className="text-black font-medium">
                      x{item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          €{calculateOrderTotal(order.items || []).orderTotal.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-black font-medium">{readySince}</div>
          <div className="text-xs text-gray-500">
            {readyTime.toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-2xl font-bold text-black">
            {getOrderDisplayNumber(order, configurations.orderPrefix || "K")}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
          <button
            onClick={() => assignDelivery(order)}
            disabled={!deliveryPerson?.name.trim()}
            className="bg-black hover:bg-zinc-800 disabled:bg-gray-400 text-white px-4 h-9 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm"
          >
            <LightningBoltIcon className="size-4" />
            {t("deliveryView.assignDelivery") || "Assign"}
          </button>
          {/* Cancel Order Button */}
          {hasCancelOrderPermission() && (
            <button
              onClick={() => handleCancelOrderClick(order)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title={t("deliveryView.cancelOrder") || "Cancel Order"}
            >
              <CrossIcon className="size-4" />
            </button>
          )}
          {(order.orderType === "delivery" ||
            order.orderType === "platform:delivery" ||
            order.orderType === "web:delivery" ||
            order.orderType === "app:delivery") && (
              <button
                onClick={() => {
                  setSelectedOrderForRoute(order);
                  setIsRouteModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                title={
                  t("orderProcessingModal.customerSearch.viewRoute") ||
                  "View Route"
                }
              >
                <MapIcon className="size-4" />
              </button>
            )}
        </td>
      </tr>
    );
  };
  const renderOutForDeliveryRow = (order: Order, index: number = 0) => {
    const assignedTime = new Date(
      order.assignedAt || (order as any).updatedAt || order.createdAt || ""
    );
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - assignedTime.getTime()) / (1000 * 60)
    );
    const assignedSince = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    const orderTotal =
      calculateOrderTotal(order.items || []).orderTotal ||
      (order as any).price ||
      0;
    const serial = outPage * OPERATIONAL_PAGE_LIMIT + index + 1;

    return (
      <tr
        key={order.id}
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
          #{serial}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-black">
            {getCustomerDisplayName(order, platforms)}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-black max-w-xs">
            {order.customer.address ? formatAddress(order.customer.address) : "-"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {order.deliveryPerson ? (
            <div className="text-sm">
              <div className="font-medium text-black">
                {order.deliveryPerson.name || "-"}
              </div>
              <div className="text-gray-500 text-xs">
                {order.deliveryPerson.phone || "-"} •{" "}
                {order.deliveryPerson.vehicleType || "-"}
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-black">
            <div className="space-y-1">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{item.productName}{" "}</span>
                    <span className="text-black font-medium">
                      x {item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
          €{orderTotal.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-black font-medium">{assignedSince}</div>
          <div className="text-xs text-gray-500">
            {assignedTime.toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-2xl font-bold text-black">
            {getOrderDisplayNumber(order, configurations.orderPrefix || "K")}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2 items-center">
        {/* Hide Delivered and Cancel buttons when in edit mode */}
        {selectedOrderForChange?.id !== order.id && (
          <>
            <button
              onClick={() => markAsDelivered(order.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 h-9 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <CheckIcon className="size-4" />
              {t("deliveryView.delivered")}
            </button>
            {/* Cancel Order Button */}
            {hasCancelOrderPermission() && (
              <button
                onClick={() => handleCancelOrderClick(order)}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                title={t("deliveryView.cancelOrder") || "Cancel Order"}
              >
                <CrossIcon className="size-4" />
              </button>
            )}
            {(order.orderType === "delivery" ||
              order.orderType === "platform:delivery" ||
              order.orderType === "web:delivery" ||
              order.orderType === "app:delivery") && (
                <button
                  onClick={() => {
                    setSelectedOrderForRoute(order);
                    setIsRouteModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  title={
                    t("orderProcessingModal.customerSearch.viewRoute") ||
                    "View Route"
                  }
                >
                  <MapIcon className="size-4" />
                </button>
              )}
          </>
        )}
        {/* Change Delivery Person Button */}
        {hasChangeDeliveryPersonPermission() && (
          <div className="flex items-center gap-2">
            {selectedOrderForChange?.id === order.id ? (
              <div className="flex items-center gap-2">
                <CustomSelect
                  options={deliveryPersons
                    .filter((person) => person.isActive !== false)
                    .map((person) => ({
                      value: person.id || person.name || "",
                      label: `${person.name} (${person.vehicleType || "N/A"})`,
                    }))}
                  value={
                    changeDeliveryPerson?.id || changeDeliveryPerson?.name || ""
                  }
                  onChange={(value) => {
                    const selectedPerson = deliveryPersons
                      .filter((person) => person.isActive !== false)
                      .find(
                        (p) => (p.id && p.id === value) || p.name === value
                      );
                    if (selectedPerson) {
                      setChangeDeliveryPerson(selectedPerson);
                    }
                  }}
                  placeholder={
                    t("deliveryView.selectNewDeliveryPerson") ||
                    "Select new delivery person"
                  }
                  className="w-64"
                  portalClassName="delivery-person-change-dropdown-portal"
                />
                <button
                  onClick={() => {
                    if (changeDeliveryPerson) {
                      changeDeliveryPersonForOrder(order, changeDeliveryPerson);
                    }
                  }}
                  disabled={!changeDeliveryPerson}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  title={t("deliveryView.confirmChange") || "Confirm Change"}
                >
                  <CheckIcon className="size-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedOrderForChange(null);
                    setChangeDeliveryPerson(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  title={t("common.cancel") || "Cancel"}
                >
                  <CrossIcon className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedOrderForChange(order);
                  setChangeDeliveryPerson(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 h-9 min-w-[38px] rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                title={
                  t("deliveryView.changeDeliveryPerson") ||
                  "Change Delivery Person"
                }
              >
                <EditIcon className="size-4" />
              </button>
            )}
          </div>
        )}
        </td>
    </tr>
  );
};

  return (
    <div className="p-4 flex flex-col">
      <Header
        title={t("deliveryView.title")}
        subtitle={t("deliveryView.subtitle")}
        icon={<img src="./images/delivery-bike.png" width={48} height={48} />}
        iconbgClasses="bg-blue-100"
      />
      <div className="flex-1">
        <div className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                bgColor={stat.bgColor}
              />
            ))}
          </div>

          {/* Delivery Radar Banner */}
          <div className="bg-zinc-900 text-white rounded-xl shadow-md p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white shadow-inner">
                <Compass className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {t("deliveryView.radar.title") || "Radar de Despacho & Rutas Agrupadas"}
                  </h3>
                  <span className="text-[11px] bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-0.5 rounded-full font-semibold">
                    {t("deliveryView.radar.badgeAngle") || "Ángulo & Proximidad"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t("deliveryView.radar.description") ||
                    "Visualiza el mapa en vivo de pedidos listos y en cocina. Agrupa entregas en el mismo rumbo angular para un solo repartidor."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-emerald-400">
                  {radarData.readyOrders.length} {t("deliveryView.stats.readyForDelivery") || "Listos"}
                </div>
                <div className="text-[11px] text-amber-300">
                  {radarData.kitchenOrders.length} {t("deliveryView.radar.inKitchen") || "En Cocina"}
                </div>
              </div>
              <button
                onClick={() => setIsRadarModalOpen(true)}
                className="bg-white hover:bg-zinc-200 text-black font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Compass className="size-4 text-black" />
                <span>{t("deliveryView.radar.openRadar") || "Abrir Radar de Reparto"}</span>
              </button>
            </div>
          </div>

          <DeliveryPersonInput
            deliveryPerson={deliveryPerson}
            setDeliveryPerson={setDeliveryPerson}
            deliveryPersons={deliveryPersons}
            showSuggestions={showDeliverySuggestions}
            setShowSuggestions={setShowDeliverySuggestions}
            onAssign={() => readyOrders[0] && assignDelivery(readyOrders[0])}
            disabled={!deliveryPerson?.name.trim() || readyOrders.length === 0}
            activeDeliveryCounts={driverOrderCounts}
          />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    {readyOrders.length > 0
                      ? t("deliveryView.readyForDeliveryOrders")
                      : t("deliveryView.noOrdersReady")}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {readyOrders.length > 0
                      ? t("deliveryView.descriptions.ordersReadyToAssign")
                      : t(
                        "deliveryView.descriptions.allOrdersInKitchenOrAssigned"
                      )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <FilterControls filter={filter} setFilter={setFilter} />
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="size-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                <span className="text-xs text-zinc-500 font-medium">
                  {t("common.loading") || "Cargando pedidos..."}
                </span>
              </div>
            ) : (
              <>
                <OrderTable
                  data={readyOrders}
                  columns={[
                    t("deliveryView.table.serial"),
                    t("deliveryView.table.customer"),
                    t("deliveryView.table.contact"),
                    t("deliveryView.table.address"),
                    t("deliveryView.table.items"),
                    t("deliveryView.table.amount"),
                    t("deliveryView.table.readySince"),
                    t("deliveryView.table.orderId"),
                    t("deliveryView.table.actions"),
                  ]}
                  renderRow={renderReadyOrderRow}
                />
                {readyTotalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex justify-end">
                    <Pagination
                      currentPage={readyPage}
                      totalPages={readyTotalPages}
                      onPageChange={setReadyPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {!isLoading && outForDeliveryOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black">
                      {t("deliveryView.table.outForDelivery")}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t(
                        "deliveryView.descriptions.ordersCurrentlyBeingDelivered"
                      )}
                    </p>
                  </div>
                  {/* Complete by Driver Controls */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs text-zinc-500 font-medium">
                      {t("deliveryView.completeByDriver") || "Completar por repartidor:"}
                    </span>
                    {activeOutDrivers.map((driver) => {
                      const isProcessing = deliveringDriverId === driver.id;
                      return (
                        <button
                          key={driver.id}
                          type="button"
                          onClick={() =>
                            handleCompleteDriverOrders(driver.id, driver.name)
                          }
                          disabled={Boolean(deliveringDriverId)}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3.5 h-9 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                          title={
                            t("deliveryView.completeDriverOrders", {
                              name: driver.name,
                              count: driver.count,
                            }) || `Completar pedidos de ${driver.name}`
                          }
                        >
                          {isProcessing ? (
                            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckIcon className="size-3.5" />
                          )}
                          <span>
                            {driver.name} ({driver.count})
                          </span>
                        </button>
                      );
                    })}
                    {(() => {
                      const unassignedCount = outForDeliveryOrders.filter(
                        (o) => !o.deliveryPerson?.name
                      ).length;
                      if (unassignedCount === 0) return null;
                      const isProcessing = deliveringDriverId === "__unassigned__";
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            handleCompleteDriverOrders(
                              "__unassigned__",
                              t("deliveryView.unassigned") || "Sin asignar"
                            )
                          }
                          disabled={Boolean(deliveringDriverId)}
                          className="bg-zinc-700 hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3.5 h-9 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                          title={t("deliveryView.unassigned") || "Sin asignar"}
                        >
                          {isProcessing ? (
                            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckIcon className="size-3.5" />
                          )}
                          <span>
                            {t("deliveryView.unassigned") || "Sin asignar"} (
                            {unassignedCount})
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <OrderTable
                data={outForDeliveryOrders}
                columns={[
                  t("deliveryView.table.serial"),
                  t("deliveryView.table.customer"),
                  t("deliveryView.table.address"),
                  t("deliveryView.table.driver"),
                  t("deliveryView.table.items"),
                  t("deliveryView.table.amount"),
                  t("deliveryView.table.assignedSince") || "Assigned Since",
                  t("deliveryView.table.orderId"),
                  t("deliveryView.table.actions"),
                ]}
                renderRow={renderOutForDeliveryRow}
              />
              {outTotalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex justify-end">
                  <Pagination
                    currentPage={outPage}
                    totalPages={outTotalPages}
                    onPageChange={setOutPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onClose={() => {
          setIsCancelOrderModalOpen(false);
          setSelectedOrderForCancel(null);
        }}
        onConfirm={handleCancelOrderConfirm}
        order={selectedOrderForCancel}
        orderPrefix={configurations.orderPrefix || "K"}
      />
      {/* Delivery Route Modal */}
      <DeliveryRouteModal
        isOpen={isRouteModalOpen}
        onClose={() => {
          setIsRouteModalOpen(false);
          setSelectedOrderForRoute(null);
        }}
        origin={
          [configurations.address, configurations.city, configurations.province]
            .filter(Boolean)
            .join(", ") || configurations.address
        }
        destination={selectedOrderForRoute?.customer?.address || ""}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
        orderId={selectedOrderForRoute?.id}
      />
      {/* Delivery Radar Modal (Proximity & Bearing Matching) */}
      <DeliveryRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        readyOrders={radarData.readyOrders}
        kitchenOrders={radarData.kitchenOrders}
        restaurantAddress={
          [configurations.address, configurations.city, configurations.province]
            .filter(Boolean)
            .join(", ") || configurations.address || ""
        }
        restaurantLogo={configurations.logo}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
        deliveryPersons={deliveryPersons}
        token={token}
        onOrdersAssigned={() => {
          refreshAllDeliveryData();
          refreshOrdersCallback();
        }}
        orderPrefix={configurations.orderPrefix || "K"}
        restaurantCoords={
          configurations.latitude && configurations.longitude
            ? { lat: configurations.latitude, lng: configurations.longitude }
            : undefined
        }
      />
    </div>
  );
};
