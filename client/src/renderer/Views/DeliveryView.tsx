import { DeliveryPerson, FilterType, Order } from "@/types/order";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { DeliveryPersonInput } from "../components/delivery/DeliveryPersonInput.view";
import { OrderTable } from "../components/shared/OrderTable";
import { StatsCard } from "../components/shared/StatsCard.order";

// ICONS
import CircleCheckIcon from "../assets/icons/circle-check.svg?react";
import ThunderIcon from "../assets/icons/thunder.svg?react";
import MarkIcon from "../assets/icons/mark.svg?react";
import GroupIcon from "../assets/icons/group.svg?react";
import DeliveredIcon from "../assets/icons/delivered.svg?react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { FilterControls } from "../components/shared/FilterControl.order";
import { updateOrder } from "../utils/order";
import { formatAddress } from "../utils/utils";
import { useOrderManagement } from "../hooks/useOrderManagement";

export const DeliveryView = () => {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const { token } = auth;
  const { orders, filter, setFilter, refreshOrdersCallback } =
    useOrderManagement(auth);
  useEffect(() => {
    if (!filter.selectedDate) {
      setFilter((prev) => ({
        ...prev,
        selectedDate: new Date(),
      }));
    }
  }, [filter.selectedDate, setFilter]);
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(
    null
  );
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);

  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      try {
        const res = await (window as any).electronAPI.getDeliveryPersons(token);
        if (res.status) {
          setDeliveryPersons(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch delivery persons:", error);
      }
    };

    fetchDeliveryPersons();
    setFilter({
      selectedDate: null,
      searchTerm: "",
      selectedStatus: ["ready for delivery", "out for delivery"],
      selectedPaymentStatus: [],
    });
  }, []);

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status.toLowerCase() === "ready for delivery"),
    [orders]
  );
  const outForDeliveryOrders = useMemo(
    () => orders.filter((o) => o.status.toLowerCase() === "out for delivery"),
    [orders]
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
        setDeliveryPerson(null);
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
    [token, refreshOrdersCallback]
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
        icon: <ThunderIcon className="text-blue-600 size-6" />,
        bgColor: "bg-blue-100",
      },
      {
        title: t("deliveryView.stats.deliveredToday"),
        value: orders.filter((o) => {
          if (o.status.toLowerCase() !== "delivered") return false;
          const deliveredDate = new Date(o.id);
          const today = new Date();
          return deliveredDate.toDateString() === today.toDateString();
        }).length,
        icon: <MarkIcon className="text-gray-600 size-6" />,
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
    [readyOrders, outForDeliveryOrders, orders, t]
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
          <div className="text-sm font-medium text-black">K{order.orderId}</div>
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
          >
            <ThunderIcon className="size-4" />
            Assign
          </button>
        </td>
      </tr>
    );
  };
  const renderOutForDeliveryRow = (order: Order) => (
    <tr
      key={order.id}
      className="hover:bg-gray-50 transition-colors duration-150"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-black">#{order.orderId}</div>
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
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end min-w-[120px]">
        <button
          onClick={() => markAsDelivered(order.id)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
        >
          <MarkIcon className="size-4" />
          {t("deliveryView.delivered")}
        </button>
      </td>
    </tr>
  );

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
                <FilterControls filter={filter} setFilter={setFilter} />
              </div>
            </div>
            <OrderTable
              data={readyOrders}
              columns={[
                t("deliveryView.table.orderId"),
                t("deliveryView.table.customer"),
                t("deliveryView.table.contact"),
                t("deliveryView.table.address"),
                t("deliveryView.table.items"),
                t("deliveryView.table.readySince"),
                t("deliveryView.table.actions"),
              ]}
              renderRow={renderReadyOrderRow}
            />
          </div>
          {outForDeliveryOrders.length > 0 && (
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
                  t("deliveryView.table.actions"),
                ]}
                renderRow={renderOutForDeliveryRow}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
