import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../hooks/useConfirm";
import { useWorkerData } from "../hooks/useWorkerData";
import { Worker } from "@/types/workers";

import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import Pagination from "../components/shared/Pagination";
import { WorkerTable } from "../components/workers/WorkerTable";
import { WorkerModal } from "../components/workers/modals/WorkerModal";
import { SalaryModal } from "../components/workers/modals/SalaryModal";
import { AddIcon, SearchIcon } from "../public/Svg";

export const WorkerManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const {
    workersData,
    loading,
    filters,
    setFilters,
    createWorker,
    updateWorker,
    deleteWorker,
    updateSalary,
    addSalary,
    deleteSalary,
    fetchSalaryRecords,
  } = useWorkerData();

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
    });
  };

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit" | "salary";
    worker: Worker | null;
  }>({ isOpen: false, type: "add", worker: null });

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
    setModalState({ isOpen: true, type: "add", worker: null });
  const handleOpenEdit = (worker: Worker) =>
    setModalState({ isOpen: true, type: "edit", worker });
  const handleOpenSalary = (worker: Worker) =>
    setModalState({ isOpen: true, type: "salary", worker });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSaveWorker = async (data: Partial<Worker>) => {
    const result =
      modalState.type === "edit" && modalState.worker
        ? await updateWorker(modalState.worker.id, data)
        : await createWorker(data);
    return result;
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("workerManagement.modal.deleteConfirm.title"),
        message: t("workerManagement.modal.deleteConfirm.message"),
        confirmText: t("common.delete"),
        type: "danger",
      })
    ) {
      await deleteWorker(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {t("workerManagement.title")}
          </h2>
          <p className="text-gray-600 mt-1">{t("workerManagement.subtitle")}</p>
        </div>
        <CustomButton
          type="button"
          onClick={handleOpenAdd}
          label={t("workerManagement.addWorker")}
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
                placeholder={t("workerManagement.searchPlaceholder")}
                value={searchTerm}
                onChange={handleSearchChange}
                preLabel={<SearchIcon className="size-5 text-gray-400" />}
                inputClasses="pl-9"
                secLabelClasses="top-3 left-1.5!"
              />
            </div>
          </div>
          <div className="flex-shrink-0">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleClearFilters}
              label={t("workerManagement.filters.clearFilters")}
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
            {t("workerManagement.table.workers")} (
            {workersData.pagination.total})
          </h3>
          {loading && (
            <span className="text-sm text-gray-500 animate-pulse">
              {t("workerManagement.table.updating")}
            </span>
          )}
        </div>

        <div className="flex-grow">
          <WorkerTable
            workers={workersData.data}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onSalary={handleOpenSalary}
          />
        </div>

        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={workersData.pagination.page - 1}
            totalPages={workersData.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modals */}
      <WorkerModal
        isOpen={modalState.isOpen && modalState.type !== "salary"}
        onClose={handleClose}
        onSubmit={handleSaveWorker}
        initialData={modalState.type === "edit" ? modalState.worker : null}
      />

      <SalaryModal
        isOpen={modalState.isOpen && modalState.type === "salary"}
        onClose={handleClose}
        worker={modalState.worker}
        onAddRecord={addSalary}
        onUpdateRecord={updateSalary}
        onDeleteRecord={deleteSalary}
        fetchRecords={fetchSalaryRecords}
      />
    </div>
  );
};
