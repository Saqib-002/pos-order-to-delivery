import { DeliveryPerson, Order } from "@/types/order";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { DeliveryPersonInput } from "../components/delivery/DeliveryPersonInput.view";
import { OrderTable } from "../components/shared/OrderTable";
import { StatsCard } from "../components/shared/StatsCard.order";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { FilterControls } from "../components/shared/FilterControl.order";
import { updateOrder } from "../utils/order";
import { formatAddress, getOrderDisplayNumber } from "../utils/utils";
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
import { DEFAULT_PAGE_LIMIT, FUNCTIONS } from "@/constants";
import { CancelOrderModal } from "../components/order/modals/CancelOrderModal";
import { CustomSelect } from "../components/ui/CustomSelect";
import DeliveryRouteModal from "../components/order/modals/DeliveryRouteModal";
import { DeliveryRadarModal } from "../components/order/modals/DeliveryRadarModal";
import { MapIcon } from "../public/Svg";
import { Compass } from "lucide-react";

export const DeliveryView = () => {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const { token, user } = auth;
  const { orders, filter, setFilter, refreshOrdersCallback } =
    useOrderManagementContext();
  const { configurations } = useConfigurations();
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(
    null
  );
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
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
        const res = await (window as any).electronAPI.getDeliveryPersons(token);
        if (res?.status && isMounted) {
          setDeliveryPersons(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch delivery persons:", error);
      }

      setFilter({
        selectedDate: new Date(),
        searchTerm: "",
        selectedStatus: ["sent to kitchen", "ready for delivery", "out for delivery", "delivered"],
        selectedPaymentStatus: [],
        page: 0,
        limit: DEFAULT_PAGE_LIMIT,
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

  // Ensure orders from other screens (e.g. ManageOrders with status "all") are not shown while switching
  const isDeliveryFilterActive = useMemo(() => {
    return (
      Array.isArray(filter.selectedStatus) &&
      filter.selectedStatus.includes("ready for delivery") &&
      filter.selectedStatus.includes("out for delivery") &&
      !filter.selectedStatus.includes("all")
    );
  }, [filter.selectedStatus]);

  const readyOrders = useMemo(
    () =>
      !isDeliveryFilterActive || isLoading
        ? []
        : orders.filter((o) => o.status.toLowerCase() === "ready for delivery"),
    [orders, isDeliveryFilterActive, isLoading]
  );
  const outForDeliveryOrders = useMemo(
    () =>
      !isDeliveryFilterActive || isLoading
        ? []
        : orders.filter((o) => o.status.toLowerCase() === "out for delivery"),
    [orders, isDeliveryFilterActive, isLoading]
  );
  const kitchenDeliveryOrders = useMemo(
    () =>
      !isDeliveryFilterActive || isLoading
        ? []
        : orders.filter(
            (o) =>
              o.status.toLowerCase() === "sent to kitchen" &&
              (o.orderType === "delivery" ||
                o.orderType === "platform:delivery" ||
                o.orderType === "web:delivery" ||
                o.orderType === "app:delivery")
          ),
    [orders, isDeliveryFilterActive, isLoading]
  );

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
    [deliveryPerson, token, refreshOrdersCallback]
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
        refreshOrdersCallback();
        toast.success(t("deliveryView.messages.orderMarkedAsDelivered"));
      } catch (error) {
        console.error("Failed to mark as delivered:", error);
        toast.error(t("deliveryView.messages.failedToMarkAsDeliveredRetry"));
      }
    },
    [token, refreshOrdersCallback, t]
  );

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
    [token, refreshOrdersCallback, t]
  );

  const stats = useMemo(
    () => [
      {
        title: t("deliveryView.stats.readyForDelivery"),
        value: readyOrders.length,
        icon: <CircleCheckIcon className="size-6 text-green-600" />,
        bgColor: "bg-green-100",
      },
      {
        title: t("deliveryView.stats.outForDelivery"),
        value: outForDeliveryOrders.length,
        icon: <LightningBoltIcon className="text-blue-600 size-6" />,
        bgColor: "bg-blue-100",
      },
      {
        title: t("deliveryView.stats.deliveredToday"),
        value:
          !isDeliveryFilterActive || isLoading
            ? 0
            : orders.filter((o) => {
                if (o.status?.toLowerCase() !== "delivered") return false;
                const deliveredDate = new Date(
                  o.deliveredAt || (o as any).updatedAt || o.createdAt || ""
                );
                const today = new Date();
                return (
                  !isNaN(deliveredDate.getTime()) &&
                  deliveredDate.toDateString() === today.toDateString()
                );
              }).length,
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
    [readyOrders, outForDeliveryOrders, orders, isDeliveryFilterActive, isLoading, t]
  );
  const renderReadyOrderRow = (order: Order) => {
    const readyTime = new Date(order.readyAt || order.createdAt || "");
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - readyTime.getTime()) / (1000 * 60)
    );
    const readySince = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;

    return (
      <tr
        key={order.id}
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-2xl font-bold text-black">
            {getOrderDisplayNumber(order, configurations.orderPrefix || "K")}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-black">
            {order.customer.name || "-"}
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
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2 min-w-[140px]">
          <button
            onClick={() => assignDelivery(order)}
            disabled={!deliveryPerson?.name.trim()}
            className="bg-black hover:bg-black disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
          >
            <LightningBoltIcon className="size-4" />
            {t("deliveryView.assignDelivery") || "Assign"}
          </button>
          {/* Cancel Order Button */}
          {hasCancelOrderPermission() && (
            <button
              onClick={() => handleCancelOrderClick(order)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title={t("deliveryView.cancelOrder") || "Cancel Order"}
            >
              <CrossIcon className="w-4 h-4" />
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
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title={
                  t("orderProcessingModal.customerSearch.viewRoute") ||
                  "View Route"
                }
              >
                <MapIcon className="w-4 h-4" />
              </button>
            )}
        </td>
      </tr>
    );
  };
  const renderOutForDeliveryRow = (order: Order) => {
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

    return (
      <tr
        key={order.id}
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-2xl font-bold text-black">
            {getOrderDisplayNumber(order, configurations.orderPrefix || "K")}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-black">
            {order.customer.name || "-"}
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
          €{orderTotal.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-black font-medium">{assignedSince}</div>
          <div className="text-xs text-gray-500">
            {assignedTime.toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2 min-w-[280px]">
        {/* Hide Delivered and Cancel buttons when in edit mode */}
        {selectedOrderForChange?.id !== order.id && (
          <>
            <button
              onClick={() => markAsDelivered(order.id)}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
            >
              <CheckIcon className="size-4" />
              {t("deliveryView.delivered")}
            </button>
            {/* Cancel Order Button */}
            {hasCancelOrderPermission() && (
              <button
                onClick={() => handleCancelOrderClick(order)}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1 text-sm cursor-pointer"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 text-sm cursor-pointer"
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
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1 text-sm cursor-pointer hover:scale-105"
                  title={t("deliveryView.confirmChange") || "Confirm Change"}
                >
                  <CheckIcon className="size-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedOrderForChange(null);
                    setChangeDeliveryPerson(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1 text-sm cursor-pointer hover:scale-105"
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
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1 text-sm cursor-pointer hover:scale-105"
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
        icon={<DeliveredIcon className="size-8 text-blue-600" />}
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
                  {readyOrders.length} {t("deliveryView.stats.readyForDelivery") || "Listos"}
                </div>
                <div className="text-[11px] text-amber-300">
                  {kitchenDeliveryOrders.length} {t("deliveryView.radar.inKitchen") || "En Cocina"}
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
            {isLoading || !isDeliveryFilterActive ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="size-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                <span className="text-xs text-zinc-500 font-medium">
                  {t("common.loading") || "Cargando pedidos..."}
                </span>
              </div>
            ) : (
              <OrderTable
                data={readyOrders}
                columns={[
                  t("deliveryView.table.orderId"),
                  t("deliveryView.table.customer"),
                  t("deliveryView.table.contact"),
                  t("deliveryView.table.address"),
                  t("deliveryView.table.items"),
                  t("deliveryView.table.amount"),
                  t("deliveryView.table.readySince"),
                  t("deliveryView.table.actions"),
                ]}
                renderRow={renderReadyOrderRow}
              />
            )}
          </div>
          {!isLoading && isDeliveryFilterActive && outForDeliveryOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                </div>
              </div>
              <OrderTable
                data={outForDeliveryOrders}
                columns={[
                  t("deliveryView.table.orderId"),
                  t("deliveryView.table.customer"),
                  t("deliveryView.table.address"),
                  t("deliveryView.table.driver"),
                  t("deliveryView.table.items"),
                  t("deliveryView.table.amount"),
                  t("deliveryView.table.assignedSince") || "Assigned Since",
                  t("deliveryView.table.actions"),
                ]}
                renderRow={renderOutForDeliveryRow}
              />
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
        origin={configurations.address}
        destination={formatAddress(selectedOrderForRoute?.customer?.address || "")}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
        orderId={selectedOrderForRoute?.id}
      />
      {/* Delivery Radar Modal (Proximity & Bearing Matching) */}
      <DeliveryRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        readyOrders={readyOrders}
        kitchenOrders={kitchenDeliveryOrders}
        restaurantAddress={configurations.address || ""}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
        deliveryPersons={deliveryPersons}
        token={token}
        onOrdersAssigned={refreshOrdersCallback}
        orderPrefix={configurations.orderPrefix || "K"}
      />
    </div>
  );
};
