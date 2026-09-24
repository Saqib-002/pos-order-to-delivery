import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../hooks/useConfirm";
import { useOtherIncomesData } from "../hooks/useIncomeData";
import { useAuth } from "../contexts/AuthContext";
import { Income } from "@/types/incomes";

import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import Pagination from "../components/shared/Pagination";
import { AddIcon, SearchIcon } from "../public/Svg";
import { IncomeTable } from "../components/incomes/IncomesTable";
import { OtherIncomeModal } from "../components/incomes/modals/OtherIncomeModal";
import dayjs from "dayjs";

export const IncomesManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const {
    auth: { token },
  } = useAuth();
  const {
    otherIncomesData,
    loading,
    filters,
    setFilters,
    createOtherIncome,
    updateOtherIncome,
    deleteOtherIncome,
  } = useOtherIncomesData();

  const getPaymentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "cash":
        return "./images/cash.png";
      case "card":
        return "./images/card.png";
      case "bizum":
        return "./images/bizum.png";
      case "bank-transfer":
      case "banktransfer":
        return "./images/bank-transfer.png";
      case "account-direct-debit":
      case "accountdirectdebit":
        return "./images/direct-debit.png";
      default:
        return "./images/cash.png";
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "cash":
        return t("marketPurchaseManagement.modal.cash", "Cash");
      case "card":
        return t("marketPurchaseManagement.modal.card", "Card");
      case "bizum":
        return t("marketPurchaseManagement.modal.bizum", "Bizum");
      case "bank-transfer":
      case "banktransfer":
        return t("marketPurchaseManagement.modal.bankTransfer", "Bank Transfer");
      case "account-direct-debit":
      case "accountdirectdebit":
        return t("marketPurchaseManagement.modal.account-direct-debit", "Direct Debit");
      case "pending":
        return t("common.paymentStatus.pending", "Pending");
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getPaymentCardStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "cash":
        return {
          card: "bg-green-50 border-green-300 text-green-900",
          iconBg: "bg-white border-green-200",
          title: "text-green-700",
          amount: "text-green-950",
          pending: "text-amber-700",
        };
      case "card":
        return {
          card: "bg-blue-50 border-blue-300 text-blue-900",
          iconBg: "bg-white border-blue-200",
          title: "text-blue-700",
          amount: "text-blue-950",
          pending: "text-amber-700",
        };
      case "bizum":
        return {
          card: "bg-purple-50 border-purple-300 text-purple-900",
          iconBg: "bg-white border-purple-200",
          title: "text-purple-700",
          amount: "text-purple-950",
          pending: "text-amber-700",
        };
      case "bank-transfer":
      case "banktransfer":
        return {
          card: "bg-orange-50 border-orange-300 text-orange-900",
          iconBg: "bg-white border-orange-200",
          title: "text-orange-700",
          amount: "text-orange-950",
          pending: "text-amber-700",
        };
      case "account-direct-debit":
      case "accountdirectdebit":
        return {
          card: "bg-indigo-50 border-indigo-300 text-indigo-900",
          iconBg: "bg-white border-indigo-200",
          title: "text-indigo-700",
          amount: "text-indigo-950",
          pending: "text-amber-700",
        };
      default:
        return {
          card: "bg-gray-50 border-gray-300 text-gray-900",
          iconBg: "bg-white border-gray-200",
          title: "text-gray-600",
          amount: "text-gray-950",
          pending: "text-amber-700",
        };
    }
  };

  const totalCardStyle = {
    card: "bg-slate-100 border-slate-300 text-slate-900",
    iconBg: "bg-white border-slate-300",
    title: "text-slate-600",
    amount: "text-slate-950",
    pending: "text-amber-700",
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleDateRangeChange = (
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      startDate: startDate ? dayjs(startDate).format("YYYY-MM-DD") : undefined,
      endDate: endDate ? dayjs(endDate).format("YYYY-MM-DD") : undefined,
      page: 1,
    }));
  };

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit";
    otherIncome: Income | null;
  }>({ isOpen: false, type: "add", otherIncome: null });

  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, setFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (zeroIndexedPage: number) => {
    setFilters((prev) => ({ ...prev, page: zeroIndexedPage + 1 }));
  };

  const handleOpenAdd = () =>
    setModalState({ isOpen: true, type: "add", otherIncome: null });
  const handleOpenEdit = (otherIncome: Income) =>
    setModalState({ isOpen: true, type: "edit", otherIncome });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSaveOtherIncome = async (data: Income) => {
    const result =
      modalState.type === "edit" && modalState.otherIncome
        ? await updateOtherIncome(modalState.otherIncome.id!, data)
        : await createOtherIncome(data);
    if (result) {
      handleClose();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("incomesManagement.modal.deleteConfirm.title"),
        message: t("incomesManagement.modal.deleteConfirm.message"),
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        type: "danger",
      })
    ) {
      await deleteOtherIncome(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {t("incomesManagement.title")}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("incomesManagement.subtitle")}
          </p>
        </div>
        <CustomButton
          type="button"
          onClick={handleOpenAdd}
          label={t("incomesManagement.addOtherIncome")}
          Icon={<AddIcon className="size-5" />}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            <div className="sm:col-span-1 lg:col-span-1">
              <CustomInput
                name="search"
                type="text"
                placeholder={t("incomesManagement.searchPlaceholder")}
                value={searchTerm}
                onChange={handleSearchChange}
                preLabel={<SearchIcon className="size-5 text-gray-400" />}
                inputClasses="pl-9"
                secLabelClasses="top-3 left-1.5!"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-2 max-w-xs">
              <DateRangePicker
                startDate={
                  filters.startDate ? new Date(filters.startDate) : null
                }
                endDate={filters.endDate ? new Date(filters.endDate) : null}
                selectedDate={
                  filters.startDate ? new Date(filters.startDate) : null
                }
                onChange={handleDateRangeChange}
                className="w-full"
              />
            </div>
          </div>
          <div className="shrink-0">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleClearFilters}
              label={t("incomesManagement.filters.clearFilters")}
              className="hover:scale-105 whitespace-nowrap"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-125 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}

        <div className="px-6 py-5 border-b border-gray-200 flex flex-col gap-4">
          {/* Top Row: Title & count + loading indicator */}
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-bold text-black">
              {t("incomesManagement.table.otherIncomes")} (
              {otherIncomesData.pagination.total})
            </h3>
            {loading && (
              <span className="text-sm text-gray-500 animate-pulse">
                {t("incomesManagement.table.updating")}
              </span>
            )}
          </div>

          {/* Bottom Row: Full-width Summary Boxes */}
          <div className="flex flex-wrap gap-3.5 w-full">
            {/* Total Box */}
            <div
              className={`${totalCardStyle.card} border-2 rounded-xl p-3.5 flex items-center gap-3.5 flex-1 min-w-[170px] shadow-2xs transition-all`}
            >
              <div
                className={`size-12 rounded-xl ${totalCardStyle.iconBg} border flex items-center justify-center shrink-0 shadow-2xs`}
              >
                <img
                  src="./images/expense.png"
                  className="size-8 object-contain"
                  alt="Total"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-semibold ${totalCardStyle.title} uppercase tracking-wider`}
                >
                  {t("incomesManagement.summary.total", "Total")}
                </span>
                <span
                  className={`text-base font-bold ${totalCardStyle.amount} leading-tight`}
                >
                  €{(otherIncomesData.summary?.totalAmount || 0).toFixed(2)}
                </span>
                {((otherIncomesData.summary?.totalPendingAmount ??
                  Object.values(
                    otherIncomesData.summary?.paymentMethodTotals || {}
                  ).reduce((acc, curr) => acc + (curr.pending || 0), 0)) >
                  0) && (
                  <span
                    className={`text-xs font-semibold ${totalCardStyle.pending} leading-tight mt-0.5`}
                  >
                    {t("common.paymentStatus.pending", "Pending")}: €{(
                      otherIncomesData.summary?.totalPendingAmount ??
                      Object.values(
                        otherIncomesData.summary?.paymentMethodTotals || {}
                      ).reduce((acc, curr) => acc + (curr.pending || 0), 0)
                    ).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method Boxes */}
            {Object.entries(otherIncomesData.summary?.paymentMethodTotals || {})
              .filter(
                ([_, stats]) =>
                  (stats.paid || 0) > 0 || (stats.pending || 0) > 0
              )
              .map(([method, stats]) => {
                const paid = stats.paid || 0;
                const pending = stats.pending || 0;
                const style = getPaymentCardStyle(method);

                return (
                  <div
                    key={method}
                    className={`${style.card} border-2 rounded-xl p-3.5 flex items-center gap-3.5 flex-1 min-w-[170px] shadow-2xs transition-all`}
                  >
                    <div
                      className={`size-12 rounded-xl ${style.iconBg} border flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      <img
                        src={getPaymentIcon(method)}
                        className="size-8 object-contain"
                        alt={method}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-xs font-semibold ${style.title} truncate`}
                      >
                        {getPaymentMethodLabel(method)}
                      </span>
                      <span
                        className={`text-base font-bold ${style.amount} leading-tight`}
                      >
                        €{paid.toFixed(2)}
                      </span>
                      {pending > 0 && (
                        <span
                          className={`text-xs font-semibold ${style.pending} leading-tight mt-0.5`}
                        >
                          {t("common.paymentStatus.pending", "Pending")}: €
                          {pending.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="grow">
          <IncomeTable
            incomes={otherIncomesData.data}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </div>

        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={otherIncomesData.pagination.page - 1}
            totalPages={otherIncomesData.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal */}
      <OtherIncomeModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onSubmit={handleSaveOtherIncome}
        initialData={modalState.type === "edit" ? modalState.otherIncome : null}
        token={token}
      />
    </div>
  );
};
