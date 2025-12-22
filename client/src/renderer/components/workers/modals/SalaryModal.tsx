import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Worker, WorkerSalary } from "@/types/workers";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/shadcn/date-picker";
import { DeleteIcon, EditIcon, CrossIcon } from "@/renderer/public/Svg";
import Pagination from "../../shared/Pagination";
import { useConfirm } from "@/renderer/hooks/useConfirm";

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
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
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
  };
  const [formData, setFormData] = useState<Partial<WorkerSalary>>(initialForm);

  const loadRecords = async () => {
    if (!worker) return;
    const res = await fetchRecords(worker.id, { page, pageSize: 5 });
    setRecords(res.data);
    setTotal(res.pagination.total);
  };

  useEffect(() => {
    if (isOpen && worker) loadRecords();
    if (!isOpen) {
      setEditingId(null);
      setFormData(initialForm);
      setActiveTab("list");
    }
  }, [isOpen, worker, page, activeTab]);

  // Handle Edit Click
  const handleEditClick = (record: WorkerSalary) => {
    setEditingId(record.id);
    setFormData({
      base: record.base,
      socialSecurityCompany: record.socialSecurityCompany,
      socialSecurityWorker: record.socialSecurityWorker,
      irpf: record.irpf,
      extraPayment: record.extraPayment,
      bonus: record.bonus,
      extraServices: record.extraServices,
      total: record.total,
      date: new Date(record.date).toISOString().split("T")[0],
    });
    setActiveTab("form");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleTabChange = (tab: "list" | "form") => {
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

    let success = false;
    if (editingId) {
      success = await onUpdateRecord(editingId, formData);
    } else {
      success = await onAddRecord({ ...formData, workerId: worker.id });
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
        title: "Delete Record",
        message: "Are you sure?",
        confirmText: "Delete",
        type: "danger",
      })
    ) {
      await onDeleteRecord(id);
      loadRecords();
    }
  };

  if (!isOpen || !worker) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Salary Records</h3>
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

        <div className="p-6 border-b border-gray-100 flex gap-4 bg-white shrink-0">
          <button
            onClick={() => handleTabChange("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "list" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            History
          </button>
          <button
            onClick={() => handleTabChange("form")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "form" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {editingId ? "Edit Entry" : "Add New Entry"}
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {activeTab === "list" ? (
            <div className="flex flex-col h-full">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Base</th>
                    <th className="p-2">SS(Comp)</th>
                    <th className="p-2">SS(Work)</th>
                    <th className="p-2">Bonus/Extra</th>
                    <th className="p-2 font-bold">Total</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No salary history found
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        <td className="p-2">
                          {new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="p-2">{r.base}€</td>
                        <td className="p-2">{r.socialSecurityCompany}€</td>
                        <td className="p-2">{r.socialSecurityWorker}€</td>
                        <td className="p-2">
                          {(
                            Number(r.bonus) +
                            Number(r.extraServices) +
                            Number(r.extraPayment)
                          ).toFixed(2)}
                          €
                        </td>
                        <td className="p-2 font-bold">{r.total}€</td>
                        <td className="p-2 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(r)}
                            className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                          >
                            <EditIcon className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <DeleteIcon className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="mt-4">
                <Pagination
                  currentPage={page - 1}
                  totalPages={Math.ceil(total / 5)}
                  onPageChange={(p) => setPage(p + 1)}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                placeholder="Select salary date"
              />
              <div className="col-span-1"></div> {/* Spacer */}
              <CustomInput
                name="baseSalary"
                type="number"
                step="0.01"
                label="Base Salary"
                value={formData.base}
                onChange={(e) =>
                  setFormData({ ...formData, base: parseFloat(e.target.value) })
                }
              />
              <CustomInput
                name="socialSecurity(Company)"
                type="number"
                step="0.01"
                label="Social Security (Company)"
                value={formData.socialSecurityCompany}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialSecurityCompany: parseFloat(e.target.value),
                  })
                }
              />
              <CustomInput
                name="socialSecurity(Worker)"
                type="number"
                step="0.01"
                label="Social Security (Worker)"
                value={formData.socialSecurityWorker}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialSecurityWorker: parseFloat(e.target.value),
                  })
                }
              />
              <CustomInput
                name="irpf"
                type="number"
                step="0.01"
                label="IRPF"
                value={formData.irpf}
                onChange={(e) =>
                  setFormData({ ...formData, irpf: parseFloat(e.target.value) })
                }
              />
              <CustomInput
                name="extraPayment"
                type="number"
                step="0.01"
                label="Extra Payment"
                value={formData.extraPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extraPayment: parseFloat(e.target.value),
                  })
                }
              />
              <CustomInput
                name="bonus"
                type="number"
                step="0.01"
                label="Bonus"
                value={formData.bonus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bonus: parseFloat(e.target.value),
                  })
                }
              />
              <CustomInput
                name="extraServices"
                type="number"
                step="0.01"
                label="Extra Services (Transport/Rent)"
                value={formData.extraServices}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extraServices: parseFloat(e.target.value),
                  })
                }
              />
              <CustomInput
                name="total"
                type="number"
                step="0.01"
                label="TOTAL (Final)"
                value={formData.total}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total: parseFloat(e.target.value),
                  })
                }
                required
              />
              <div className="col-span-2 mt-4 flex justify-end gap-2">
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={() => handleTabChange("list")}
                  label="Cancel"
                />
                <CustomButton
                  type="submit"
                  label={
                    editingId ? "Update Salary Record" : "Save Salary Record"
                  }
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
