import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "../components/shared/Header.order";
import { Wallet as WalletIcon, Plus as PlusIcon, Trash2 as Trash2Icon, Edit as EditIcon, Search as SearchIcon } from "lucide-react";
import { useCashOutData } from "../hooks/useIncomeData";
import { CashOutModal } from "../components/cashout/CashOutModal";
import { Income } from "@/types/incomes";
import { useConfirm } from "../hooks/useConfirm";
import CustomInput from "../components/shared/CustomInput";
import CustomButton from "../components/ui/CustomButton";
import Pagination from "../components/shared/Pagination";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";

export const CashOutManagement = () => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const {
    cashOutData,
    loading,
    filters,
    setFilters,
    createCashOut,
    updateCashOut,
    deleteCashOut,
    refresh
  } = useCashOutData();

  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Income | null>(null);
  const [currentCashBalance, setCurrentCashBalance] = useState<number>(0);

  const fetchBalance = async () => {
    try {
      const res = await (window as any).electronAPI.getCashBalance(token);
      if (res.status) {
        setCurrentCashBalance(res.data || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [cashOutData]);

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Income) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: t("common.confirmDelete"),
      message: t("common.confirmDelete"),
    });
    if (isConfirmed) {
      await deleteCashOut(id);
    }
  };

  const handleModalSubmit = async (data: Income) => {
    if (selectedItem) {
      return await updateCashOut(selectedItem.id!, data);
    } else {
      return await createCashOut(data);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-slate-50">
      <Header
        title={t("cashOutManagement.title")}
        subtitle={t("cashOutManagement.subtitle")}
        icon={<img src="./images/cashout.png" className="size-12" />}
        iconbgClasses="bg-emerald-100"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-4">
        {/* Balance Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center">
          <span className="text-sm font-medium text-emerald-600 uppercase tracking-wider">{t("cashOutManagement.currentBalance")}</span>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {currentCashBalance.toFixed(2)}€
          </div>
        </div>

        {/* Actions Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <CustomInput
              label=""
              name="search"
              type="text"
              placeholder={t("cashOutManagement.searchPlaceholder")}
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            // icon={<SearchIcon className="size-5 text-slate-400" />}
            />
          </div>
          <CustomButton
            type="button"
            onClick={handleAdd}
            label={t("cashOutManagement.addTransaction")}
            Icon={<PlusIcon className="size-5" />}
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t("cashOutManagement.table.reason")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t("cashOutManagement.table.type")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t("cashOutManagement.table.amount")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t("cashOutManagement.table.date")}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashOutData.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <WalletIcon className="size-12 opacity-20" />
                      <span className="font-medium">{t("cashOutManagement.noTransactionsTitle")}</span>
                      <span className="text-sm">{t("cashOutManagement.noTransactionsSubtitle")}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cashOutData.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.description && <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.transactionType === "in"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                        }`}>
                        {item.transactionType === "in" ? t("cashOutManagement.modal.in") : t("cashOutManagement.modal.out")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${item.transactionType === "in"
                        ? "text-emerald-600"
                        : "text-rose-600"
                        }`}>
                        {item.transactionType === "in" ? "+" : "-"}{item.total.toFixed(2)}€
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {dayjs(item.date).format("YYYY-MM-DD")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors">
                          <EditIcon className="size-5" />
                        </button>
                        <button onClick={() => handleDelete(item.id!)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors">
                          <Trash2Icon className="size-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {cashOutData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={cashOutData.pagination.totalPages}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}
      </div>

      <CashOutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedItem}
      />
    </div>
  );
};
