import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Worker, WorkerSalary } from "@/types/workers";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/DatePicker";
import { DateRangePicker } from "../../ui/DateRangePicker";
import {
  DeleteIcon,
  EditIcon,
  CrossIcon,
  PrinterIcon,
} from "@/renderer/public/Svg";
import { generateSalaryReportHTML } from "@/renderer/utils/pdfService";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useAuth } from "@/renderer/contexts/AuthContext";
import Pagination from "../../shared/Pagination";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import {
  calculatePaymentStatus,
  getPaymentStatusStyle,
} from "@/renderer/utils/paymentStatus";
import dayjs from "dayjs";
import { TransactionModal, PaymentMethod } from "./TransactionModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onAddRecord: (data: any) => Promise<any>;
  onUpdateRecord: (id: string, data: any) => Promise<boolean>;
  onDeleteRecord: (id: string) => Promise<boolean>;
  fetchRecords: (workerId: string, filters: any) => Promise<any>;
  addPaymentTransactions: (
    salaryId: string,
    payments: any[]
  ) => Promise<boolean>;
  getPaymentTransactions: (salaryId: string) => Promise<any[]>;
  deletePaymentTransaction: (id: string) => Promise<boolean>;
  getTotalPaidForSalary: (salaryId: string) => Promise<number>;
}

export const SalaryModal = ({
  isOpen,
  onClose,
  worker,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  fetchRecords,
  addPaymentTransactions,
  getPaymentTransactions,
  deletePaymentTransaction,
  getTotalPaidForSalary,
}: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"list" | "form" | "payment">(
    "list"
  );
  const [records, setRecords] = useState<WorkerSalary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalTotalPaid, setOriginalTotalPaid] = useState<number>(0);
  const [originalPaymentTransactions, setOriginalPaymentTransactions] =
    useState<any[]>([]);
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const confirm = useConfirm();
  const { configurations } = useConfigurations();
  const {
    auth: { token },
  } = useAuth();

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
    date: dayjs().format("YYYY-MM-DD"),
  };
  const [formData, setFormData] = useState<Partial<WorkerSalary>>(initialForm);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

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
      total: Math.max(0, calculatedTotal),
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
    const res = await fetchRecords(worker.id, {
      page,
      pageSize: 10,
      ...filters,
    });
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
      setOriginalTotalPaid(0);
      setOriginalPaymentTransactions([]);
      setFilters({});
    }
  }, [isOpen, worker, page]);

  const handleEditClick = async (record: WorkerSalary) => {
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
      date: dayjs(record.date).format("YYYY-MM-DD"),
    });

    try {
      const payments = await getPaymentTransactions(record.id);
      setOriginalPaymentTransactions(payments || []);

      if (payments && payments.length > 0) {
        const paymentMethods: PaymentMethod[] = payments.map((p: any) => ({
          type: p.paymentMethod as "cash" | "card" | "bizum" | "bank-transfer",
          amount: Number(p.amount) || 0,
          date: p.paymentDate || p.createdAt,
          isExisting: true,
          transactionId: p.id,
        }));

        setPaymentMethods(paymentMethods);

        const totalPaid = payments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );
        setOriginalTotalPaid(totalPaid);
      } else {
        setPaymentMethods([]);
        setOriginalTotalPaid(0);
      }
    } catch (error) {
      console.error("Error loading payment transactions:", error);
      setPaymentMethods([]);
      setOriginalTotalPaid(0);
      setOriginalPaymentTransactions([]);
    }

    setActiveTab("form");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setPaymentMethods([]);
    setOriginalTotalPaid(0);
    setOriginalPaymentTransactions([]);
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

    const totalAmount =
      typeof formData.total === "number"
        ? formData.total
        : parseFloat(String(formData.total || 0)) || 0;
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    const salaryData = {
      ...formData,
      socialSecurityCompany:
        typeof formData.socialSecurityCompany === "number"
          ? formData.socialSecurityCompany
          : parseFloat(String(formData.socialSecurityCompany || 0)) || 0,
      socialSecurityWorker:
        typeof formData.socialSecurityWorker === "number"
          ? formData.socialSecurityWorker
          : parseFloat(String(formData.socialSecurityWorker || 0)) || 0,
    };

    let success: any = false;
    let salaryId = editingId;

    if (editingId) {
      success = await onUpdateRecord(editingId, salaryData);
    } else {
      success = await onAddRecord({ ...salaryData, workerId: worker.id });
      if (success && success.data) {
        salaryId = success.data.id;
      }
    }

    const isSuccess = typeof success === "boolean" ? success : success.success;
    if (isSuccess && salaryId) {
      if (editingId) {
        const currentExistingPayments = paymentMethods.filter(
          (method) => method.isExisting
        );
        const newPayments = paymentMethods.filter(
          (method) => !method.isExisting
        );

        const originalTransactionIds = originalPaymentTransactions.map(
          (p) => p.id
        );
        const currentTransactionIds = currentExistingPayments.map(
          (p) => p.transactionId
        );
        const deletedTransactionIds = originalTransactionIds.filter(
          (id) => !currentTransactionIds.includes(id)
        );

        console.log(`Editing salary ${salaryId}:`);
        console.log(`New payments: ${newPayments.length}`, newPayments);
        console.log(
          `Deleted transactions: ${deletedTransactionIds.length}`,
          deletedTransactionIds
        );

        // Delete removed transactions
        if (deletedTransactionIds.length > 0) {
          try {
            for (const transactionId of deletedTransactionIds) {
              await deletePaymentTransaction(transactionId);
              console.log(`Deleted transaction ${transactionId}`);
            }
          } catch (error) {
            console.error("Error deleting transactions:", error);
          }
        }

        // Add new payments
        if (newPayments.length > 0) {
          const paymentsToAdd = newPayments.map((method) => ({
            paymentMethod: method.type,
            amount: method.amount,
            paymentDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            notes: `Payment added during edit on ${dayjs().format("DD/MM/YYYY HH:mm")}`,
          }));

          try {
            const result = await addPaymentTransactions(
              salaryId,
              paymentsToAdd
            );
            console.log("Added new payments:", result);
          } catch (error) {
            console.error("Error adding new payments:", error);
          }
        }
      } else {
        if (paymentMethods.length > 0) {
          const payments = paymentMethods.map((method) => ({
            paymentMethod: method.type,
            amount: method.amount,
            paymentDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          }));

          console.log(
            `Creating new salary ${salaryId} with payments:`,
            payments
          );
          const result = await addPaymentTransactions(salaryId, payments);
          console.log("New salary payment result:", result);
        }
      }
    }

    if (isSuccess) {
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

  const handlePrint = async () => {
    if (!token || !worker) return;

    try {
      const salaryPayments: { [salaryId: string]: any[] } = {};
      await Promise.all(
        records.map(async (record) => {
          try {
            const payments = await getPaymentTransactions(record.id);
            salaryPayments[record.id] = payments || [];
          } catch (error) {
            console.error(
              `Error fetching payments for salary ${record.id}:`,
              error
            );
            salaryPayments[record.id] = [];
          }
        })
      );

      const html = await generateSalaryReportHTML(
        worker,
        records,
        salaryPayments,
        filters,
        configurations,
        t
      );
      const defaultFileName = `salary-report-${worker.name}-${dayjs().format("YYYY-MM-DD")}.pdf`;

      const result = await (window as any).electronAPI.saveSalaryReportPDF(
        token,
        html,
        defaultFileName
      );

      if (result.status) {
        toast.success(t("workerManagement.salaryModal.pdfSaved"));
      } else {
        if (result.error !== "Save cancelled") {
          toast.error(t("workerManagement.salaryModal.pdfError"));
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t("workerManagement.salaryModal.pdfError"));
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
        <div className="bg-linear-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl shrink-0">
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
              className="text-white hover:text-gray-500 p-2! rounded-full! hover:bg-white hover:bg-opacity-20"
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
              <div className="flex gap-3 mb-4 shrink-0">
                <div className="w-48">
                  <DateRangePicker
                    startDate={
                      filters.startDate ? new Date(filters.startDate) : null
                    }
                    endDate={filters.endDate ? new Date(filters.endDate) : null}
                    selectedDate={
                      filters.startDate ? new Date(filters.startDate) : null
                    }
                    onChange={(startDate, endDate) => {
                      setFilters({
                        startDate: startDate
                          ? dayjs(startDate).format("YYYY-MM-DD")
                          : undefined,
                        endDate: endDate
                          ? dayjs(endDate).format("YYYY-MM-DD")
                          : undefined,
                      });
                      setPage(1);
                    }}
                    className="w-full"
                  />
                </div>
                <CustomButton
                  type="button"
                  onClick={() => {
                    setFilters({});
                    setPage(1);
                  }}
                  label={t("workerManagement.filters.clearFilters")}
                  className="bg-gray-200 hover:bg-gray-300 text-black whitespace-nowrap"
                />
                <CustomButton
                  type="button"
                  onClick={handlePrint}
                  label={t("workerManagement.salaryModal.print")}
                  Icon={<PrinterIcon className="size-5" />}
                  className="bg-black hover:bg-gray-800 text-white whitespace-nowrap"
                />
              </div>
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
                            {dayjs(
                              new Date(r.date).toLocaleDateString()
                            ).format("DD/MM/YYYY")}
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
                              const totalPaid =
                                typeof r.totalPaid === "number"
                                  ? r.totalPaid
                                  : parseFloat(String(r.totalPaid || 0)) || 0;

                              console.log(
                                `Salary ${r.id}: total=${total}, totalPaid=${totalPaid}, raw totalPaid=${r.totalPaid}`
                              );

                              let status: "PAID" | "UNPAID" | "PARTIAL";
                              if (totalPaid <= 0) {
                                status = "UNPAID";
                              } else if (totalPaid >= total) {
                                status = "PAID";
                              } else {
                                status = "PARTIAL";
                              }

                              return (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusStyle(status)}`}
                                >
                                  {t(
                                    `common.paymentStatus.${status.toLowerCase()}`
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
            <TransactionModal
              totalAmount={totalAmount}
              paymentMethods={paymentMethods}
              onPaymentMethodsChange={setPaymentMethods}
              initialPaymentType={undefined}
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
        <div className="flex justify-between gap-4 pt-4 px-8 pb-8 border-t border-gray-200 shrink-0">
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
