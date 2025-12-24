import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../hooks/useConfirm";
import { useMarketPurchaseData } from "../hooks/useMarketPurchaseData";
import { MarketPurchase } from "@/types/marketPurchases";

import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import Pagination from "../components/shared/Pagination";
import { MarketPurchaseTable } from "../components/marketPurchases/MarketPurchaseTable";
import { MarketPurchaseModal } from "../components/marketPurchases/modals/MarketPurchaseModal";
import { AddIcon, SearchIcon } from "../public/Svg";
import { DatePicker } from "../components/ui/shadcn/date-picker";

export const MarketPurchaseManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const {
    purchasesData,
    suppliers,
    expenseTypes,
    loading,
    filters,
    setFilters,
    createPurchase,
    updatePurchase,
    deletePurchase,
  } = useMarketPurchaseData();

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
      supplierId: undefined,
      expenseTypeId: undefined,
      startDate: undefined,
      endDate: undefined,
      ticketNumber: undefined,
    });
  };

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit";
    purchase: MarketPurchase | null;
  }>({ isOpen: false, type: "add", purchase: null });

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
    setModalState({ isOpen: true, type: "add", purchase: null });
  const handleOpenEdit = (purchase: MarketPurchase) =>
    setModalState({ isOpen: true, type: "edit", purchase });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSavePurchase = async (data: MarketPurchase) => {
    const result =
      modalState.type === "edit" && modalState.purchase
        ? await updatePurchase(modalState.purchase.id!, data)
        : await createPurchase(data);
    if (result) {
      handleClose();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("marketPurchaseManagement.modal.deleteConfirm.title"),
        message: t("marketPurchaseManagement.modal.deleteConfirm.message"),
        confirmText: t("common.delete"),
        type: "danger",
      })
    ) {
      await deletePurchase(id);
    }
  };

  const supplierOptions = [
    { value: "", label: t("marketPurchaseManagement.filters.allSuppliers") },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  const expenseTypeOptions = [
    { value: "", label: t("marketPurchaseManagement.filters.allExpenseTypes") },
    ...expenseTypes.map((e) => ({ value: e.id, label: e.name })),
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {t("marketPurchaseManagement.title")}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("marketPurchaseManagement.subtitle")}
          </p>
        </div>
        <CustomButton
          type="button"
          onClick={handleOpenAdd}
          label={t("marketPurchaseManagement.addPurchase")}
          Icon={<AddIcon className="size-5" />}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
            <div className="sm:col-span-1 lg:col-span-1">
              <CustomInput
                name="search"
                type="text"
                placeholder={t("marketPurchaseManagement.searchPlaceholder")}
                value={searchTerm}
                onChange={handleSearchChange}
                preLabel={<SearchIcon className="size-5 text-gray-400" />}
                inputClasses="pl-9"
                secLabelClasses="top-3 left-1.5!"
              />
            </div>
            <CustomSelect
              options={supplierOptions}
              value={filters.supplierId || ""}
              onChange={(val) =>
                handleFilterChange("supplierId", val || undefined)
              }
              placeholder={t("marketPurchaseManagement.filters.supplier")}
            />
            <CustomSelect
              options={expenseTypeOptions}
              value={filters.expenseTypeId || ""}
              onChange={(val) =>
                handleFilterChange("expenseTypeId", val || undefined)
              }
              placeholder={t("marketPurchaseManagement.filters.expenseType")}
            />
            <DatePicker
            //   label={t("marketPurchaseManagement.filters.startDate")}
              value={filters.startDate || ""}
              onChange={(date) =>
                handleFilterChange("startDate", date || undefined)
              }
              placeholder={t("marketPurchaseManagement.filters.startDate")}
            />
            <DatePicker
            //   label={t("marketPurchaseManagement.filters.endDate")}
              value={filters.endDate || ""}
              onChange={(date) =>
                handleFilterChange("endDate", date || undefined)
              }
              placeholder={t("marketPurchaseManagement.filters.endDate")}
            />
          </div>
          <div className="flex-shrink-0">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleClearFilters}
              label={t("marketPurchaseManagement.filters.clearFilters")}
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
            {t("marketPurchaseManagement.table.purchases")} (
            {purchasesData.pagination.total})
          </h3>
          {loading && (
            <span className="text-sm text-gray-500 animate-pulse">
              {t("marketPurchaseManagement.table.updating")}
            </span>
          )}
        </div>

        <div className="flex-grow">
          <MarketPurchaseTable
            purchases={purchasesData.data}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </div>

        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={purchasesData.pagination.page - 1}
            totalPages={purchasesData.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal */}
      <MarketPurchaseModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onSubmit={handleSavePurchase}
        initialData={modalState.type === "edit" ? modalState.purchase : null}
        suppliers={suppliers}
        expenseTypes={expenseTypes}
      />
    </div>
  );
};
