import { useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon, EyeIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import { IncomeSourceModal } from "./Modals/IncomeSourceModal";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const fetchIncomeSources = async (
  token: string | null,
  setIncomeSources: any,
  t: any
) => {
  if (!token) return;
  try {
    const res = await (window as any).electronAPI.getAllIncomeSources(token);
    if (res.status) {
      setIncomeSources(res.data || []);
    } else {
      toast.error(t("incomeSources.fetchError"));
    }
  } catch (error) {
    toast.error(t("incomeSources.fetchError"));
  }
};

const IncomeSources = () => {
  const [incomeSources, setIncomeSources] = useState([]);
  const [showIncomeSourceModal, setShowIncomeSourceModal] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "view">("add");
  const [currentIncomeSource, setCurrentIncomeSource] = useState<any>(null);
  const {
    auth: { token },
  } = useAuth();
  const confirm = useConfirm();
  const { t } = useTranslation();

  useEffect(() => {
    fetchIncomeSources(token, setIncomeSources, t);
  }, [token, t]);

  const handleAddIncomeSource = () => {
    setMode("add");
    setCurrentIncomeSource(null);
    setShowIncomeSourceModal(true);
  };

  const handleEdit = (incomeSource: any) => {
    setMode("edit");
    setCurrentIncomeSource(incomeSource);
    setShowIncomeSourceModal(true);
  };

  const handleView = (incomeSource: any) => {
    setMode("view");
    setCurrentIncomeSource(incomeSource);
    setShowIncomeSourceModal(true);
  };

  const handleDelete = async (id: string, incomeSourceName: string) => {
    const ok = await confirm({
      title: t("incomeSources.deleteTitle"),
      message: t("incomeSources.deleteMessage"),
      confirmText: t("incomeSources.deleteConfirm"),
      cancelText: t("incomeSources.deleteCancel"),
      itemName: incomeSourceName,
    });
    if (!ok) return;
    try {
      const res = await (window as any).electronAPI.deleteIncomeSource(
        token,
        id
      );
      if (res.status) {
        toast.success(t("incomeSources.deletedSuccess"));
        fetchIncomeSources(token, setIncomeSources, t);
      } else {
        toast.error(t("incomeSources.deletedFailed"));
      }
    } catch (error) {
      toast.error(t("incomeSources.deletedError"));
    }
  };

  const onCloseModal = () => {
    setShowIncomeSourceModal(false);
    setCurrentIncomeSource(null);
    setMode("add");
  };

  return (
    <div className="relative">
      {showIncomeSourceModal && (
        <IncomeSourceModal
          onClose={onCloseModal}
          mode={mode}
          incomeSource={currentIncomeSource}
          token={token}
          onSuccess={() => fetchIncomeSources(token, setIncomeSources, t)}
        />
      )}
      <div className="pb-6 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <img
                  src="./images/expense.png"
                  alt="Income Source"
                  className="size-10"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {t("incomeSources.title")}
                </h2>
                <p className="text-gray-600 mt-1">
                  {t("incomeSources.subtitle")}
                </p>
              </div>
            </div>
            <CustomButton
              type="button"
              label={t("incomeSources.addIncomeSource")}
              onClick={handleAddIncomeSource}
              Icon={<AddIcon className="size-7" />}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            {t("incomeSources.incomeSourcesList")}
          </h3>
          {incomeSources.length === 0 ? (
            <p className="text-gray-500">
              {t("incomeSources.noIncomeSources")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("incomeSources.table.incomeSourceName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("incomeSources.table.description")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("incomeSources.table.createdAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("incomeSources.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomeSources.map((incomeSource: any) => (
                    <tr key={incomeSource.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {incomeSource.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {incomeSource.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {dayjs(
                          new Date(incomeSource.created_at).toLocaleDateString()
                        ).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                        <CustomButton
                          type="button"
                          onClick={() => handleView(incomeSource)}
                          Icon={<EyeIcon className="size-5" />}
                          variant="transparent"
                          className="p-0!"
                        />
                        <CustomButton
                          type="button"
                          onClick={() => handleEdit(incomeSource)}
                          Icon={<EditIcon className="size-5" />}
                          variant="transparent"
                          className="p-0! text-blue-500! hover:text-blue-700!"
                        />
                        <CustomButton
                          type="button"
                          onClick={() =>
                            handleDelete(incomeSource.id, incomeSource.name)
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

export default IncomeSources;
