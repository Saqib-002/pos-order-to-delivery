import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Vehicle,
  VehicleMaintenance,
  MaintenanceFilters,
  PaginatedResult,
} from "@/types/vehicles";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import Pagination from "../../shared/Pagination";
import {
  CrossIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
} from "../../../public/Svg";
import { useConfirm } from "../../../hooks/useConfirm";
import { PaymentStep, PaymentMethod } from "../../shared/PaymentStep";
import { DatePicker } from "../../ui/DatePicker";
import { DateRangePicker } from "../../ui/DateRangePicker";
import { toast } from "react-toastify";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon,
} from "../../../public/Svg";
import { useConfigurations } from "../../../contexts/configurationContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  calculatePaymentStatus,
  getPaymentStatusStyle,
} from "../../../utils/paymentStatus";
import { generateMaintenanceReportHTML } from "../../../utils/pdfService";
import dayjs from "dayjs";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onAddRecord: (
    vehicleId: string,
    data: Partial<VehicleMaintenance>,
  ) => Promise<boolean>;
  onAddMultipleRecords: (
    records: Partial<VehicleMaintenance>[],
  ) => Promise<boolean>;
  onUpdateRecord: (
    maintenanceId: string,
    data: Partial<VehicleMaintenance>,
  ) => Promise<boolean>;
  onUpdateMultiplePayments: (
    maintenanceIds: string[],
    paymentType: string,
  ) => Promise<boolean>;
  onDeleteRecord: (maintenanceId: string) => Promise<boolean>;
  fetchRecords: (
    vehicleId: string,
    filters: MaintenanceFilters,
  ) => Promise<PaginatedResult<VehicleMaintenance>>;
}

interface MaintenanceForm {
  sparePart: string;
  unit: string;
  price: string;
  date: string;
  currentMileage: string;
}

const INITIAL_FILTERS: MaintenanceFilters = {
  page: 1,
  pageSize: 20,
  search: "",
  startDate: undefined,
  endDate: undefined,
  minPrice: undefined,
  maxPrice: undefined,
};

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "-";
  return dayjs(dateString).format("YYYY-MM-DD");
};

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onAddRecord,
  onAddMultipleRecords,
  onUpdateRecord,
  onUpdateMultiplePayments,
  onDeleteRecord,
  fetchRecords,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { configurations } = useConfigurations();
  const {
    auth: { token },
  } = useAuth();
  const [data, setData] = useState<PaginatedResult<VehicleMaintenance>>({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 5, totalPages: 0 },
  });
  const [filters, setFilters] = useState<MaintenanceFilters>(INITIAL_FILTERS);
  const [form, setForm] = useState<MaintenanceForm>({
    unit: "1",
    sparePart: "",
    price: "",
    date: dayjs().format("YYYY-MM-DD"),
    currentMileage: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<
    Partial<VehicleMaintenance>[]
  >([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && vehicle) {
      setFilters(INITIAL_FILTERS);
      resetForm();
      loadRecords(INITIAL_FILTERS);
      setMaintenanceItems([]);
      setSelectedRecordIds([]);
    }
  }, [isOpen, vehicle]);

  const resetForm = () => {
    setForm({
      unit: "1",
      sparePart: "",
      price: "",
      date: dayjs().format("YYYY-MM-DD"),
      currentMileage: "",
    });
    setEditingId(null);
    setCurrentStep(1);
    setPaymentMethods([]);
    setMaintenanceItems([]);
    setSelectedRecordIds([]);
  };

  const loadRecords = async (currentFilters: MaintenanceFilters) => {
    if (vehicle) {
      const result = await fetchRecords(vehicle.id, currentFilters);
      setData(result);
    }
  };

  const handleFilterChange = (key: keyof MaintenanceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    setSelectedRecordIds([]); // Reset selection on filter change
    loadRecords(newFilters);
  };

  const handlePageChange = (zeroIndexedPage: number) => {
    const newFilters = { ...filters, page: zeroIndexedPage + 1 };
    setFilters(newFilters);
    setSelectedRecordIds([]); // Reset selection on page change
    loadRecords(newFilters);
  };

  const validateStep1 = (): boolean => {
    if (!form.sparePart || !form.sparePart.trim()) {
      toast.error(
        t("vehicleManagement.maintenanceModal.errors.sparePartRequired"),
      );
      return false;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error(t("vehicleManagement.maintenanceModal.errors.priceRequired"));
      return false;
    }
    if (!form.date) {
      toast.error(t("vehicleManagement.maintenanceModal.errors.dateRequired"));
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (editingId) {
        if (validateStep1()) {
          setCurrentStep(2);
        }
      } else if (maintenanceItems.length > 0 || selectedRecordIds.length > 0) {
        setCurrentStep(2);
      } else {
        if (validateStep1()) {
          addItemToList();
          setCurrentStep(2);
        }
      }
    }
  };

  const addItemToList = () => {
    if (validateStep1()) {
      const priceVal = parseFloat(form.price);
      const unitVal = parseInt(form.unit);
      const total = priceVal * (isNaN(unitVal) ? 1 : unitVal);

      const newItem: Partial<VehicleMaintenance> = {
        sparePart: form.sparePart,
        price: priceVal,
        unit: isNaN(unitVal) ? 1 : unitVal,
        total: total,
        date: form.date,
        currentMileage: form.currentMileage
          ? parseInt(form.currentMileage)
          : undefined,
        vehicleId: vehicle?.id,
      };

      setMaintenanceItems([...maintenanceItems, newItem]);
      setForm({ ...form, sparePart: "", price: "", unit: "1" });
    }
  };

  const removeItemFromList = (index: number) => {
    setMaintenanceItems(maintenanceItems.filter((_, i) => i !== index));
  };

  const toggleRecordSelection = (id: string, isUnpaid: boolean) => {
    if (!isUnpaid) return;
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!vehicle || !validateStep2()) return;

    const paymentTypeString =
      paymentMethods.length > 0
        ? paymentMethods
            .map((method) => `${method.type}:${method.amount}`)
            .join(", ")
        : "";

    let success = false;

    if (editingId) {
      const priceVal = parseFloat(form.price);
      const unitVal = parseInt(form.unit);
      const total = priceVal * (isNaN(unitVal) ? 1 : unitVal);

      const payload = {
        sparePart: form.sparePart,
        price: priceVal,
        unit: isNaN(unitVal) ? 1 : unitVal,
        total: total,
        date: form.date,
        currentMileage: form.currentMileage
          ? parseInt(form.currentMileage)
          : undefined,
        paymentType: paymentTypeString,
      };
      success = await onUpdateRecord(editingId, payload);
    } else if (selectedRecordIds.length > 0) {
      success = await onUpdateMultiplePayments(
        selectedRecordIds,
        paymentTypeString,
      );
    } else {
      let remainingPayments = paymentMethods.map((m) => ({
        type: m.type,
        amount: m.amount,
      }));

      const recordsToSave = maintenanceItems.map((item) => {
        const itemTotal = item.total || 0;
        let itemRemainingToPay = itemTotal;
        const itemPaymentParts: string[] = [];

        for (const method of remainingPayments) {
          if (itemRemainingToPay <= 0) break;
          if (method.amount <= 0) continue;

          const amountToTake = Math.min(itemRemainingToPay, method.amount);
          if (amountToTake > 0) {
            itemPaymentParts.push(`${method.type}:${amountToTake.toFixed(2)}`);
            method.amount -= amountToTake;
            itemRemainingToPay -= amountToTake;
          }
        }

        return {
          ...item,
          paymentType: itemPaymentParts.join(", "),
        };
      });
      success = await onAddMultipleRecords(recordsToSave as any);
    }

    if (success) {
      resetForm();
      loadRecords(filters);
    }
  };

  const handleEdit = (record: VehicleMaintenance) => {
    setForm({
      sparePart: record.sparePart,
      unit: record.unit.toString(),
      price: record.price.toString(),
      date: dayjs(record.date).format("YYYY-MM-DD"),
      currentMileage: record.currentMileage?.toString() || "",
    });
    setEditingId(record.id);
    setCurrentStep(1);

    if (record.paymentType) {
      if (record.paymentType.includes(":")) {
        try {
          const payments: PaymentMethod[] = record.paymentType
            .split(/[,;]\s*/)
            .filter((p) => p.trim() !== "")
            .map((payment) => {
              const [type, amount] = payment.split(":");
              return {
                type: type.trim() as any,
                amount: parseFloat(amount) || 0,
              };
            })
            .filter((payment) => payment.amount > 0);
          setPaymentMethods(payments);
        } catch (error) {
          setPaymentMethods([]);
        }
      } else {
        setPaymentMethods([
          {
            type: record.paymentType as any,
            amount: record.total || 0,
          },
        ]);
      }
    } else {
      setPaymentMethods([]);
    }
  };

  const handlePrint = async () => {
    if (!token || !vehicle) return;

    try {
      const html = generateMaintenanceReportHTML(
        vehicle,
        data.data,
        { startDate: filters.startDate, endDate: filters.endDate },
        configurations,
        t,
      );
      const defaultFileName = `maintenance-report-${vehicle.licensePlate}-${dayjs().format("YYYY-MM-DD")}.pdf`;

      const result = await (window as any).electronAPI.saveMaintenanceReportPDF(
        token,
        html,
        defaultFileName,
      );

      if (result.status) {
        toast.success(t("vehicleManagement.maintenanceModal.pdfSaved"));
      } else {
        if (result.error !== "Save cancelled") {
          toast.error(t("vehicleManagement.maintenanceModal.pdfError"));
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t("vehicleManagement.maintenanceModal.pdfError"));
    }
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("vehicleManagement.maintenanceModal.deleteTitle"),
        message: t("vehicleManagement.maintenanceModal.deleteMessage"),
        confirmText: t("common.delete"),
        type: "danger",
      })
    ) {
      const success = await onDeleteRecord(id);
      if (success) loadRecords(filters);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full h-[90vh] flex flex-col ${currentStep === 2 ? "max-w-xl" : "max-w-5xl"}`}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">
                {t("vehicleManagement.maintenanceModal.title")}
              </h3>
              <p className="text-sm text-gray-300 opacity-90">
                {vehicle.model} - {vehicle.licensePlate}
              </p>
              <div className="flex gap-2 mt-2">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all ${
                      currentStep === step
                        ? "bg-white w-8"
                        : currentStep > step
                          ? "bg-gray-400 w-6"
                          : "bg-gray-600 w-6"
                    }`}
                  />
                ))}
              </div>
            </div>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-gray-500 p-2! rounded-full! hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col">
          {/* Step 1: Form & List / History */}
          {currentStep === 1 && (
            <>
              {/* Form Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 shrink-0">
                <h4 className="font-semibold mb-3 text-sm text-black uppercase tracking-wider">
                  {editingId
                    ? t("vehicleManagement.maintenanceModal.editRecord")
                    : t("vehicleManagement.maintenanceModal.addNewRecord")}
                </h4>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3">
                    <CustomInput
                      name="sparePart"
                      type="text"
                      label={t("vehicleManagement.maintenanceModal.sparePart")}
                      placeholder={t(
                        "vehicleManagement.maintenanceModal.sparePartPlaceholder",
                      )}
                      value={form.sparePart}
                      onChange={(e) =>
                        setForm({ ...form, sparePart: e.target.value })
                      }
                      inputClasses="bg-white py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <DatePicker
                      label={t("vehicleManagement.maintenanceModal.date")}
                      value={form.date}
                      onChange={(date) =>
                        setForm({ ...form, date: date || "" })
                      }
                      placeholder={t(
                        "vehicleManagement.maintenanceModal.selectDate",
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <CustomInput
                      name="unit"
                      type="number"
                      label={t("vehicleManagement.maintenanceModal.unit")}
                      value={form.unit}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                      inputClasses="bg-white py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <CustomInput
                      name="price"
                      type="number"
                      label={t("vehicleManagement.maintenanceModal.price")}
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      inputClasses="bg-white py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <CustomInput
                      name="currentMileage"
                      type="number"
                      label={t(
                        "vehicleManagement.maintenanceModal.currentMileage",
                      )}
                      value={form.currentMileage}
                      onChange={(e) =>
                        setForm({ ...form, currentMileage: e.target.value })
                      }
                      inputClasses="bg-white py-2"
                      placeholder={t(
                        "vehicleManagement.maintenanceModal.currentMileagePlaceholder",
                      )}
                    />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    {!editingId ? (
                      <>
                        <CustomButton
                          type="button"
                          onClick={addItemToList}
                          label={t("common.add")}
                          className="flex-1 justify-center bg-gray-200 hover:bg-gray-300 text-black py-2"
                        />
                        <CustomButton
                          type="button"
                          onClick={handleNext}
                          label={<ChevronRightIcon className="size-5" />}
                          className="w-12 justify-center bg-black hover:bg-gray-800 text-white py-2"
                          title={t("marketPurchaseManagement.modal.next")}
                        />
                      </>
                    ) : (
                      <>
                        <CustomButton
                          type="button"
                          onClick={handleNext}
                          label={t("marketPurchaseManagement.modal.next")}
                          className="flex-1 justify-center bg-black hover:bg-gray-800 text-white py-2"
                        />
                        <CustomButton
                          type="button"
                          onClick={resetForm}
                          label="X"
                          className="bg-gray-200 text-black py-2 px-3"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pending Items List */}
              {!editingId && maintenanceItems.length > 0 && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col max-h-[30%] shrink-0">
                  <div className="bg-blue-50/50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-semibold text-sm text-blue-800 uppercase tracking-wider">
                      {t("vehicleManagement.maintenanceModal.pendingItems")} (
                      {maintenanceItems.length})
                    </h4>
                    <span className="text-blue-700 font-bold bg-blue-100/50 px-3 py-1 rounded-full text-sm">
                      Total:{" "}
                      {maintenanceItems
                        .reduce((acc, item) => acc + (item.total || 0), 0)
                        .toFixed(2)}
                      €
                    </span>
                  </div>
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">
                            {t(
                              "vehicleManagement.maintenanceModal.table.servicePart",
                            )}
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">
                            {t("vehicleManagement.maintenanceModal.table.unit")}
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">
                            {t(
                              "vehicleManagement.maintenanceModal.table.price",
                            )}
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">
                            {t(
                              "vehicleManagement.maintenanceModal.table.total",
                            )}
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">
                            {t(
                              "vehicleManagement.maintenanceModal.currentMileage",
                            )}
                          </th>
                          <th className="px-4 py-2 text-center font-medium text-gray-500 w-16">
                            {t("marketPurchaseManagement.modal.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {maintenanceItems.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-2 font-medium text-gray-900">
                              {item.sparePart}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-600">
                              {item.unit}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-600">
                              {Number(item.price).toFixed(2)}€
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">
                              {item.total?.toFixed(2)}€
                            </td>
                            <td className="px-4 py-2 text-right text-gray-600">
                              {item.currentMileage || "-"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => removeItemFromList(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <DeleteIcon className="size-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Filters & History Table */}
              {!editingId && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex gap-3 mb-4 items-end shrink-0">
                    <div className="flex-1">
                      <CustomInput
                        name="search"
                        type="text"
                        placeholder={t(
                          "vehicleManagement.maintenanceModal.searchPlaceholder",
                        )}
                        value={filters.search}
                        onChange={(e) =>
                          handleFilterChange("search", e.target.value)
                        }
                        preLabel={
                          <SearchIcon className="size-4.5 text-gray-400 mt-1.5" />
                        }
                        inputClasses="pl-9 py-3 text-sm"
                      />
                    </div>
                    <div className="w-48">
                      <DateRangePicker
                        startDate={
                          filters.startDate
                            ? dayjs(filters.startDate).toDate()
                            : null
                        }
                        endDate={
                          filters.endDate
                            ? dayjs(filters.endDate).toDate()
                            : null
                        }
                        onChange={(start, end) => {
                          handleFilterChange(
                            "startDate",
                            start
                              ? dayjs(start).format("YYYY-MM-DD")
                              : undefined,
                          );
                          handleFilterChange(
                            "endDate",
                            end ? dayjs(end).format("YYYY-MM-DD") : undefined,
                          );
                        }}
                        className="w-full"
                      />
                    </div>
                    <CustomButton
                      type="button"
                      onClick={handlePrint}
                      label={t("vehicleManagement.maintenanceModal.print")}
                      Icon={<PrinterIcon className="size-5" />}
                      className="bg-black text-white px-4 h-[42px]"
                    />
                    {selectedRecordIds.length > 0 && (
                      <CustomButton
                        type="button"
                        onClick={handleNext}
                        label={
                          t("common.paySelected") +
                          ` (${selectedRecordIds.length})`
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-4 h-[42px]"
                      />
                    )}
                  </div>

                  <div className="flex-1 rounded-lg border border-gray-100 overflow-hidden flex flex-col bg-white">
                    <div className="overflow-y-auto flex-1">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="p-3 text-left w-10"></th>
                            <th className="p-3 text-left font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.table.date",
                              )}
                            </th>
                            <th className="p-3 text-left font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.table.servicePart",
                              )}
                            </th>
                            <th className="p-3 text-right font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.table.unit",
                              )}
                            </th>
                            <th className="p-3 text-right font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.table.price",
                              )}
                            </th>
                            <th className="p-3 text-right font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.table.total",
                              )}
                            </th>
                            <th className="p-3 text-right font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.currentMileage",
                              )}
                            </th>
                            <th className="p-3 text-right font-medium text-gray-500">
                              {t(
                                "vehicleManagement.maintenanceModal.table.actions",
                              )}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.data.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="p-8 text-center text-gray-400"
                              >
                                {t(
                                  "vehicleManagement.maintenanceModal.table.noRecordsFound",
                                )}
                              </td>
                            </tr>
                          ) : (
                            data.data.map((r) => {
                              const total =
                                typeof r.total === "number"
                                  ? r.total
                                  : parseFloat(String(r.total || 0)) || 0;
                              const paymentStatus = calculatePaymentStatus(
                                r.paymentType || "",
                                total,
                              );
                              const isUnpaid =
                                paymentStatus.status === "UNPAID";
                              return (
                                <tr
                                  key={r.id}
                                  className={`hover:bg-gray-50 ${selectedRecordIds.includes(r.id) ? "bg-blue-50" : ""}`}
                                >
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedRecordIds.includes(r.id)}
                                      onChange={() =>
                                        toggleRecordSelection(r.id, isUnpaid)
                                      }
                                      disabled={!isUnpaid}
                                      className={`size-4 rounded border-gray-300 text-black focus:ring-black ${!isUnpaid ? "opacity-20" : "cursor-pointer"}`}
                                    />
                                  </td>
                                  <td className="p-3 text-gray-600">
                                    {formatDate(r.date)}
                                  </td>
                                  <td className="p-3 font-medium text-black">
                                    <div className="flex flex-col">
                                      <span>{r.sparePart}</span>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit border ${getPaymentStatusStyle(paymentStatus.status)}`}
                                      >
                                        {t(
                                          `common.paymentStatus.${paymentStatus.status.toLowerCase()}`,
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">{r.unit}</td>
                                  <td className="p-3 text-right">
                                    {Number(r.price).toFixed(2)}€
                                  </td>
                                  <td className="p-3 text-right font-semibold">
                                    {total.toFixed(2)}€
                                  </td>
                                  <td className="p-3 text-right">
                                    {r.currentMileage || "-"}
                                  </td>
                                  <td className="p-3 text-right flex justify-end gap-1">
                                    <CustomButton
                                      type="button"
                                      variant="transparent"
                                      onClick={() => handleEdit(r)}
                                      Icon={<EditIcon className="size-4" />}
                                      className="text-black p-1.5!"
                                    />
                                    <CustomButton
                                      type="button"
                                      variant="transparent"
                                      onClick={() => handleDelete(r.id)}
                                      Icon={<DeleteIcon className="size-4" />}
                                      className="text-red-500 p-1.5!"
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                      <Pagination
                        currentPage={data.pagination.page - 1}
                        totalPages={data.pagination.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6">
              <PaymentStep
                totalAmount={
                  editingId
                    ? parseFloat(form.price) * parseInt(form.unit || "1") || 0
                    : selectedRecordIds.length > 0
                      ? data.data
                          .filter((r) => selectedRecordIds.includes(r.id))
                          .reduce(
                            (acc, r) =>
                              acc +
                              (typeof r.total === "number"
                                ? r.total
                                : parseFloat(String(r.total)) || 0),
                            0,
                          )
                      : maintenanceItems.reduce(
                          (acc, item) => acc + (item.total || 0),
                          0,
                        )
                }
                paymentMethods={paymentMethods}
                onPaymentMethodsChange={setPaymentMethods}
                initialPaymentType={undefined}
              />
              <div className="flex justify-between gap-4 pt-4 border-t border-gray-200">
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={handlePrevious}
                  label={t("marketPurchaseManagement.modal.previous")}
                  Icon={<ChevronLeftIcon className="size-5" />}
                />
                <CustomButton
                  type="button"
                  onClick={handleSubmit}
                  label={
                    editingId
                      ? t("common.update")
                      : t("vehicleManagement.maintenanceModal.add")
                  }
                  className="bg-black text-white px-8"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
