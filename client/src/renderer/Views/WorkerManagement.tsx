import { useState, useEffect } from "react"; // Added useEffect
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
    fetchSalaryRecords
  } = useWorkerData();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit" | "salary";
    worker: Worker | null;
  }>({ isOpen: false, type: "add", worker: null });

  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, setFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (zeroIndexedPage: number) => {
    setFilters(prev => ({ ...prev, page: zeroIndexedPage + 1 }));
  };

  const handleOpenAdd = () => setModalState({ isOpen: true, type: "add", worker: null });
  const handleOpenEdit = (worker: Worker) => setModalState({ isOpen: true, type: "edit", worker });
  const handleOpenSalary = (worker: Worker) => setModalState({ isOpen: true, type: "salary", worker });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSaveWorker = async (data: Partial<Worker>) => {
    const result = modalState.type === "edit" && modalState.worker
      ? await updateWorker(modalState.worker.id, data)
      : await createWorker(data);
    return result;
  };

  const handleDelete = async (id: string) => {
    if (await confirm({ title: "Delete Worker", message: "Are you sure? This will delete all salary records too.", confirmText: "Delete", type: "danger" })) {
        await deleteWorker(id);
    }
  };

  const paymentOptions = [
      { value: 'all', label: 'All Payment Types' },
      { value: 'cash', label: 'Cash' },
      { value: 'transfer', label: 'Transfer' },
      { value: 'mixed', label: 'Mixed' }
  ];
  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Worker Management</h2>
          <p className="text-gray-600 mt-1">Manage employees and payroll</p>
        </div>
        <CustomButton type="button" onClick={handleOpenAdd} label="Register Worker" Icon={<AddIcon className="size-5" />} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                  <CustomInput
                      name="search"
                      type="text"
                      placeholder="Search Name or ID Number..."
                      // Use local state here
                      value={searchTerm} 
                      onChange={handleSearchChange}
                      preLabel={<SearchIcon className="size-5 text-gray-400" />}
                      inputClasses="pl-9"
                  />
              </div>
              <CustomSelect
                  options={paymentOptions}
                  value={filters.paymentMethod || 'all'}
                  onChange={(val) => handleFilterChange('paymentMethod', val)}
                  placeholder="Payment Method"
              />
          </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px] relative">
        {/* 3. Non-blocking Loading Indicator */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">Workers ({workersData.pagination.total})</h3>
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