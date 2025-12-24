import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../hooks/useConfirm";
import { useExpenseData } from "../hooks/useExpenseData";
import { Expense } from "@/types/expenses";

import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { DatePicker } from "../components/ui/shadcn/date-picker";
import Pagination from "../components/shared/Pagination";
import { ExpensesTable } from "../components/expenses/ExpensesTable";
import { ExpenseModal } from "../components/expenses/modals/ExpenseModal";
import { AddIcon, SearchIcon } from "../public/Svg";

export const ExpensesManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const {
    expensesData,
    loading,
    filters,
    setFilters,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenseData();

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
      startDate: undefined,
      endDate: undefined,
    });
  };

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit";
    expense: Expense | null;
  }>({ isOpen: false, type: "add", expense: null });

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
    setModalState({ isOpen: true, type: "add", expense: null });
  const handleOpenEdit = (expense: Expense) =>
    setModalState({ isOpen: true, type: "edit", expense });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSaveExpense = async (data: Expense) => {
    const result =
      modalState.type === "edit" && modalState.expense
        ? await updateExpense(modalState.expense.id!, data)
        : await createExpense(data);
    if (result) {
      handleClose();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("expenseManagement.modal.deleteConfirm.title"),
        message: t("expenseManagement.modal.deleteConfirm.message"),
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        type: "danger",
      })
    ) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {t("expenseManagement.title")}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("expenseManagement.subtitle")}
          </p>
        </div>
        <CustomButton
          type="button"
          onClick={handleOpenAdd}
          label={t("expenseManagement.addExpense")}
          Icon={<AddIcon className="size-5" />}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            <div className="sm:col-span-1 lg:col-span-1">
              <CustomInput
                name="search"
                type="text"
                placeholder={t("expenseManagement.searchPlaceholder")}
                value={searchTerm}
                onChange={handleSearchChange}
                preLabel={<SearchIcon className="size-5 text-gray-400" />}
                inputClasses="pl-9"
                secLabelClasses="top-3 left-1.5!"
              />
            </div>
            <DatePicker
            //   label={t("expenseManagement.filters.startDate")}
              value={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              placeholder={t("expenseManagement.filters.startDate")}
            />
            <DatePicker
            //   label={t("expenseManagement.filters.endDate")}
              value={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              placeholder={t("expenseManagement.filters.endDate")}
            />
          </div>
          <div className="flex-shrink-0">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleClearFilters}
              label={t("expenseManagement.filters.clearFilters")}
              className="hover:scale-105 whitespace-nowrap"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">
            {t("expenseManagement.table.expenses")} (
            {expensesData.pagination.total})
          </h3>
          {loading && (
            <span className="text-sm text-gray-500 animate-pulse">
              {t("expenseManagement.table.updating")}
            </span>
          )}
        </div>

        <div className="flex-grow">
          <ExpensesTable
            expenses={expensesData.data}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </div>

        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={expensesData.pagination.page - 1}
            totalPages={expensesData.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal */}
      <ExpenseModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onSubmit={handleSaveExpense}
        initialData={modalState.type === "edit" ? modalState.expense : null}
      />
    </div>
  );
};
