import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../hooks/useConfirm";
import { useOtherIncomesData } from "../hooks/useIncomeData";
import { Income } from "@/types/incomes";

import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import Pagination from "../components/shared/Pagination";
import { AddIcon, SearchIcon } from "../public/Svg";
import { IncomeTable } from "../components/incomes/IncomesTable";
import { OtherIncomeModal } from "../components/incomes/modals/OtherIncomeModal";

export const IncomesManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const {
    otherIncomesData,
    loading,
    filters,
    setFilters,
    createOtherIncome,
    updateOtherIncome,
    deleteOtherIncome,
  } = useOtherIncomesData();

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
      startDate: startDate ? startDate.toISOString().split("T")[0] : undefined,
      endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
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

        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">
            {t("incomesManagement.table.otherIncomes")} (
            {otherIncomesData.pagination.total})
          </h3>
          {loading && (
            <span className="text-sm text-gray-500 animate-pulse">
              {t("incomesManagement.table.updating")}
            </span>
          )}
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
      />
    </div>
  );
};
