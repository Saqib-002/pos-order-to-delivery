import { useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon, EyeIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import { ExpenseTypeModal } from "./Modals/ExpenseTypeModal";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const fetchExpenseTypes = async (
  token: string | null,
  setExpenseTypes: any,
  t: any
) => {
  if (!token) return;
  try {
    const res = await (window as any).electronAPI.getAllExpenseTypes(token);
    if (res.status) {
      setExpenseTypes(res.data || []);
    } else {
      toast.error(t("expenseTypes.fetchError"));
    }
  } catch (error) {
    toast.error(t("expenseTypes.fetchError"));
  }
};

const ExpenseTypes = () => {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [showExpenseTypeModal, setShowExpenseTypeModal] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "view">("add");
  const [currentExpenseType, setCurrentExpenseType] = useState<any>(null);
  const {
    auth: { token },
  } = useAuth();
  const confirm = useConfirm();
  const { t } = useTranslation();

  useEffect(() => {
    fetchExpenseTypes(token, setExpenseTypes, t);
  }, [token, t]);

  const handleAddExpenseType = () => {
    setMode("add");
    setCurrentExpenseType(null);
    setShowExpenseTypeModal(true);
  };

  const handleEdit = (expenseType: any) => {
    setMode("edit");
    setCurrentExpenseType(expenseType);
    setShowExpenseTypeModal(true);
  };

  const handleView = (expenseType: any) => {
    setMode("view");
    setCurrentExpenseType(expenseType);
    setShowExpenseTypeModal(true);
  };

  const handleDelete = async (id: string, expenseTypeName: string) => {
    const ok = await confirm({
      title: t("expenseTypes.deleteTitle"),
      message: t("expenseTypes.deleteMessage"),
      confirmText: t("expenseTypes.deleteConfirm"),
      cancelText: t("expenseTypes.deleteCancel"),
      itemName: expenseTypeName,
    });
    if (!ok) return;
    try {
      const res = await (window as any).electronAPI.deleteExpenseType(
        token,
        id
      );
      if (res.status) {
        toast.success(t("expenseTypes.deletedSuccess"));
        fetchExpenseTypes(token, setExpenseTypes, t);
      } else {
        toast.error(t("expenseTypes.deletedFailed"));
      }
    } catch (error) {
      toast.error(t("expenseTypes.deletedError"));
    }
  };

  const onCloseModal = () => {
    setShowExpenseTypeModal(false);
    setCurrentExpenseType(null);
    setMode("add");
  };

  return (
    <div className="relative">
      {showExpenseTypeModal && (
        <ExpenseTypeModal
          onClose={onCloseModal}
          mode={mode}
          expenseType={currentExpenseType}
          token={token}
          onSuccess={() => fetchExpenseTypes(token, setExpenseTypes, t)}
        />
      )}
      <div className="pb-6 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <img
                  src="./images/expense.png"
                  alt="Expense Type"
                  className="size-10"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {t("expenseTypes.title")}
                </h2>
                <p className="text-gray-600 mt-1">
                  {t("expenseTypes.subtitle")}
                </p>
              </div>
            </div>
            <CustomButton
              type="button"
              label={t("expenseTypes.addExpenseType")}
              onClick={handleAddExpenseType}
              Icon={<AddIcon className="size-7" />}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            {t("expenseTypes.expenseTypesList")}
          </h3>
          {expenseTypes.length === 0 ? (
            <p className="text-gray-500">{t("expenseTypes.noExpenseTypes")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("expenseTypes.table.expenseTypeName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("expenseTypes.table.createdAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("expenseTypes.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseTypes.map((expenseType: any) => (
                    <tr key={expenseType.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {expenseType.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {dayjs(new Date(expenseType.createdAt).toLocaleDateString()).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                        <CustomButton
                          type="button"
                          onClick={() => handleView(expenseType)}
                          Icon={<EyeIcon className="size-5" />}
                          variant="transparent"
                          className="p-0!"
                        />
                        <CustomButton
                          type="button"
                          onClick={() => handleEdit(expenseType)}
                          Icon={<EditIcon className="size-5" />}
                          variant="transparent"
                          className="p-0! text-blue-500! hover:text-blue-700!"
                        />
                        <CustomButton
                          type="button"
                          onClick={() =>
                            handleDelete(expenseType.id, expenseType.name)
                          }
                          Icon={<DeleteIcon className="size-5" />}
                          variant="transparent"
                          className="p-0! text-red-500! hover:text-red-700!"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTypes;
