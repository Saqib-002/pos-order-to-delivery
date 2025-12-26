import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Worker, WorkerSalary } from "@/types/workers";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/DatePicker";
import { DeleteIcon, EditIcon, CrossIcon } from "@/renderer/public/Svg";
import Pagination from "../../shared/Pagination";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import {
  calculatePaymentStatus,
  getPaymentStatusStyle,
} from "@/renderer/utils/paymentStatus";
import { PaymentStep, PaymentMethod } from "../../shared/PaymentStep";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onAddRecord: (data: any) => Promise<boolean>;
  onUpdateRecord: (id: string, data: any) => Promise<boolean>;
  onDeleteRecord: (id: string) => Promise<boolean>;
  fetchRecords: (workerId: string, filters: any) => Promise<any>;
}

export const SalaryModal = ({
  isOpen,
  onClose,
  worker,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  fetchRecords,
}: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"list" | "form" | "payment">(
    "list"
  );
  const [records, setRecords] = useState<WorkerSalary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const confirm = useConfirm();

  // Form State
  const initialForm = {
    base: 0,
    socialSecurityCompany: 0,
    socialSecurityWorker: 0,
    irpf: 0,
    extraPayment: 0,
    bonus: 0,
    extraServices: 0,
    total: 0,
    date: new Date().toISOString().split("T")[0],
    paymentType: "cash",
  };
  const [formData, setFormData] = useState<Partial<WorkerSalary>>(initialForm);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Auto-calculate total whenever relevant fields change
  useEffect(() => {
    const base =
      typeof formData.base === "number"
        ? formData.base
        : parseFloat(String(formData.base || 0)) || 0;
    const socialSecurityCompany =
      typeof formData.socialSecurityCompany === "number"
        ? formData.socialSecurityCompany
        : parseFloat(String(formData.socialSecurityCompany || 0)) || 0;
    const socialSecurityWorker =
      typeof formData.socialSecurityWorker === "number"
        ? formData.socialSecurityWorker
        : parseFloat(String(formData.socialSecurityWorker || 0)) || 0;
    const irpf =
      typeof formData.irpf === "number"
        ? formData.irpf
        : parseFloat(String(formData.irpf || 0)) || 0;
    const extraPayment =
      typeof formData.extraPayment === "number"
        ? formData.extraPayment
        : parseFloat(String(formData.extraPayment || 0)) || 0;
    const bonus =
      typeof formData.bonus === "number"
        ? formData.bonus
        : parseFloat(String(formData.bonus || 0)) || 0;
    const extraServices =
      typeof formData.extraServices === "number"
        ? formData.extraServices
        : parseFloat(String(formData.extraServices || 0)) || 0;

    // Total = base + bonus + extraPayment + extraServices - socialSecurityCompany - socialSecurityWorker - irpf
    const calculatedTotal =
      base +
      bonus +
      extraPayment +
      extraServices -
      socialSecurityCompany -
      socialSecurityWorker -
      irpf;

    setFormData((prev) => ({
      ...prev,
      total: Math.max(0, calculatedTotal), // Ensure total is not negative
    }));
  }, [
    formData.base,
    formData.socialSecurityCompany,
    formData.socialSecurityWorker,
    formData.irpf,
    formData.extraPayment,
    formData.bonus,
    formData.extraServices,
  ]);

  const loadRecords = async () => {
    if (!worker) return;
    const res = await fetchRecords(worker.id, { page, pageSize: 10 });
    setRecords(res.data);
    setTotal(res.pagination.total);
  };

  useEffect(() => {
    if (isOpen && worker) loadRecords();
    if (!isOpen) {
      setEditingId(null);
      setFormData(initialForm);
      setActiveTab("list");
      setPaymentMethods([]);
    }
  }, [isOpen, worker, page]);

  // Handle Edit Click
  const handleEditClick = (record: WorkerSalary) => {
    setEditingId(record.id);
    setFormData({
      base: record.base,
      socialSecurityCompany:
        typeof record.socialSecurityCompany === "number"
          ? record.socialSecurityCompany
          : parseFloat(String(record.socialSecurityCompany || 0)) || 0,
      socialSecurityWorker:
        typeof record.socialSecurityWorker === "number"
          ? record.socialSecurityWorker
          : parseFloat(String(record.socialSecurityWorker || 0)) || 0,
      irpf: record.irpf,
      extraPayment: record.extraPayment,
      bonus: record.bonus,
      extraServices: record.extraServices,
      total: record.total,
      date: new Date(record.date).toISOString().split("T")[0],
      paymentType: record.paymentType || "cash",
    });

    // Parse existing payment type
    if (record.paymentType) {
      if (record.paymentType.includes(":")) {
        try {
          const payments: PaymentMethod[] = record.paymentType
            .split(", ")
            .map((payment) => {
              const [type, amount] = payment.split(":");
              return {
                type: type.trim() as
                  | "cash"
                  | "card"
                  | "bizum"
                  | "bank-transfer",
                amount: parseFloat(amount) || 0,
              };
            })
            .filter((payment) => payment.amount > 0);
          setPaymentMethods(payments);
        } catch (error) {
          setPaymentMethods([]);
        }
      } else {
        if (
          record.paymentType === "cash" ||
          record.paymentType === "card" ||
          record.paymentType === "bizum" ||
          record.paymentType === "bank-transfer"
        ) {
          const amount =
            typeof record.total === "string"
              ? parseFloat(record.total)
              : record.total || 0;
          setPaymentMethods([
            {
              type: record.paymentType as
                | "cash"
                | "card"
                | "bizum"
                | "bank-transfer",
              amount: isNaN(amount) ? 0 : amount,
            },
          ]);
        }
      }
    } else {
      setPaymentMethods([]);
    }

    setActiveTab("form");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setPaymentMethods([]);
  };

  const handleTabChange = (tab: "list" | "form" | "payment") => {
    if (tab === "form" && activeTab === "list" && !editingId) {
      resetForm();
    }
    if (tab === "list") {
      resetForm();
    }
    setActiveTab(tab);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    // Validate payment
    const totalAmount =
      typeof formData.total === "number"
        ? formData.total
        : parseFloat(String(formData.total || 0)) || 0;
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    const paymentTypeString =
      paymentMethods.length > 0
        ? paymentMethods
            .map((method) => `${method.type}:${method.amount}`)
            .join(", ")
        : "";

    const salaryData = {
      ...formData,
      paymentType: paymentTypeString,
      socialSecurityCompany:
        typeof formData.socialSecurityCompany === "number"
          ? formData.socialSecurityCompany
          : parseFloat(String(formData.socialSecurityCompany || 0)) || 0,
      socialSecurityWorker:
        typeof formData.socialSecurityWorker === "number"
          ? formData.socialSecurityWorker
          : parseFloat(String(formData.socialSecurityWorker || 0)) || 0,
    };

    let success = false;
    if (editingId) {
      success = await onUpdateRecord(editingId, salaryData);
    } else {
      success = await onAddRecord({ ...salaryData, workerId: worker.id });
    }

    if (success) {
      resetForm();
      setActiveTab("list");
      loadRecords();
    }
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("common.delete"),
        message: t("common.confirmDelete"),
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        type: "danger",
      })
    ) {
      await onDeleteRecord(id);
      loadRecords();
    }
  };

  if (!isOpen || !worker) return null;

  const totalAmount =
    typeof formData.total === "number"
      ? formData.total
      : parseFloat(String(formData.total || 0)) || 0;
  const totalPaid = paymentMethods.reduce((sum, method) => {
    const amount =
      typeof method.amount === "string"
        ? parseFloat(method.amount)
        : method.amount || 0;
    return sum + amount;
  }, 0);
  const remainingAmount = totalAmount - totalPaid;

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "€0.00";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "€0.00";
    return `€${numAmount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${
          activeTab === "payment"
            ? "max-w-xl"
            : activeTab === "form" && editingId
              ? "max-w-5xl"
              : "max-w-7xl"
        }`}
      >
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">
                {t("workerManagement.salaryModal.title")}
              </h3>
              <p className="text-sm text-gray-300 opacity-90">
                {worker.name} - {worker.idNumber}
              </p>
            </div>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>

        {/* Hide tabs when editing */}
        {!editingId && (
          <div className="p-6 border-b border-gray-100 flex gap-4 bg-white shrink-0">
            <button
              onClick={() => handleTabChange("list")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "list"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("workerManagement.salaryModal.history")}
            </button>
            <button
              onClick={() => handleTabChange("form")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "form"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("workerManagement.salaryModal.addEntry")}
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === "list" ? (
            <div className="flex flex-col h-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.date")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.base")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.ssCompany")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.ssWorker")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.irpf")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.extraPayment")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.bonus")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.extraServices")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.total")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {t("workerManagement.salaryModal.paymentStatus")}
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
                        {t("common.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {t("workerManagement.salaryModal.noRecords")}
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {new Date(r.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.base)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.socialSecurityCompany)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.socialSecurityWorker)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.irpf)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.extraPayment)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.bonus)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(r.extraServices)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                            {formatCurrency(r.total)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {(() => {
                              const total =
                                typeof r.total === "number"
                                  ? r.total
                                  : parseFloat(String(r.total || 0)) || 0;
                              const paymentStatus = calculatePaymentStatus(
                                r.paymentType || "",
                                total
                              );
                              return (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusStyle(paymentStatus.status)}`}
                                >
                                  {t(
                                    `common.paymentStatus.${paymentStatus.status.toLowerCase()}`
                                  )}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(r)}
                              className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                              title={t("common.edit")}
                            >
                              <EditIcon className="size-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-2 hover:bg-red-100 rounded-full text-red-600"
                              title={t("common.delete")}
                            >
                              <DeleteIcon className="size-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={page - 1}
                  totalPages={Math.ceil(total / 10)}
                  onPageChange={(p) => setPage(p + 1)}
                />
              </div>
            </div>
          ) : activeTab === "payment" ? (
            <PaymentStep
              totalAmount={totalAmount}
              paymentMethods={paymentMethods}
              onPaymentMethodsChange={setPaymentMethods}
              initialPaymentType={
                editingId
                  ? records.find((r) => r.id === editingId)?.paymentType
                  : undefined
              }
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTabChange("payment");
              }}
              className="grid grid-cols-3 gap-4"
            >
              <DatePicker
                label={t("workerManagement.salaryModal.date")}
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                placeholder={t("workerManagement.salaryModal.selectDate")}
              />
              <CustomInput
                name="baseSalary"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.baseSalary")}
                value={formData.base?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    base: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <CustomInput
                name="socialSecurityCompany"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.socialSecurityCompany")}
                value={formData.socialSecurityCompany?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialSecurityCompany: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <CustomInput
                name="socialSecurityWorker"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.socialSecurityWorker")}
                value={formData.socialSecurityWorker?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialSecurityWorker: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <CustomInput
                name="irpf"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.irpf")}
                value={formData.irpf?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    irpf: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <CustomInput
                name="extraPayment"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.extraPayment")}
                value={formData.extraPayment?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extraPayment: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <CustomInput
                name="bonus"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.bonus")}
                value={formData.bonus?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bonus: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <CustomInput
                name="extraServices"
                type="number"
                step="0.01"
                label={t("workerManagement.salaryModal.extraServices")}
                value={formData.extraServices?.toString() || "0"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extraServices: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("workerManagement.salaryModal.total")} (
                  {t("workerManagement.salaryModal.autoCalculated")})
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm font-semibold text-gray-900">
                  €{totalAmount.toFixed(2)}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="flex justify-between gap-4 pt-4 px-8 pb-8 border-t border-gray-200 flex-shrink-0">
          {activeTab === "form" ? (
            <>
              <div>
                {editingId && (
                  <CustomButton
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      resetForm();
                      setActiveTab("list");
                    }}
                    label={t("common.cancel")}
                  />
                )}
              </div>
              <div className="flex gap-4">
                {!editingId && (
                  <CustomButton
                    type="button"
                    variant="secondary"
                    onClick={() => handleTabChange("list")}
                    label={t("common.cancel")}
                  />
                )}
                <CustomButton
                  type="button"
                  onClick={() => handleTabChange("payment")}
                  label={t("workerManagement.salaryModal.nextToPayment")}
                />
              </div>
            </>
          ) : activeTab === "payment" ? (
            <div className="flex justify-end gap-4 w-full">
              <CustomButton
                type="button"
                variant="secondary"
                onClick={() => handleTabChange("form")}
                label={t("marketPurchaseManagement.modal.previous")}
              />
              <CustomButton
                type="button"
                onClick={handleSubmit}
                label={editingId ? t("common.update") : t("common.save")}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
