import { useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon, EyeIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import { SupplierModal } from "./Modals/SupplierModal";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const fetchSuppliers = async (
  token: string | null,
  setSuppliers: any,
  t: any
) => {
  if (!token) return;
  try {
    const res = await (window as any).electronAPI.getAllSuppliers(token);
    if (res.status) {
      setSuppliers(res.data || []);
    } else {
      toast.error(t("suppliers.fetchError"));
    }
  } catch (error) {
    toast.error(t("suppliers.fetchError"));
  }
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "view">("add");
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);
  const {
    auth: { token },
  } = useAuth();
  const confirm = useConfirm();
  const { t } = useTranslation();

  useEffect(() => {
    fetchSuppliers(token, setSuppliers, t);
  }, [token, t]);

  const handleAddSupplier = () => {
    setMode("add");
    setCurrentSupplier(null);
    setShowSupplierModal(true);
  };

  const handleEdit = (supplier: any) => {
    setMode("edit");
    setCurrentSupplier(supplier);
    setShowSupplierModal(true);
  };

  const handleView = (supplier: any) => {
    setMode("view");
    setCurrentSupplier(supplier);
    setShowSupplierModal(true);
  };

  const handleDelete = async (id: string, supplierName: string) => {
    const ok = await confirm({
      title: t("suppliers.deleteTitle"),
      message: t("suppliers.deleteMessage"),
      confirmText: t("suppliers.deleteConfirm"),
      cancelText: t("suppliers.deleteCancel"),
      itemName: supplierName,
    });
    if (!ok) return;
    try {
      const res = await (window as any).electronAPI.deleteSupplier(token, id);
      if (res.status) {
        toast.success(t("suppliers.deletedSuccess"));
        fetchSuppliers(token, setSuppliers, t);
      } else {
        toast.error(t("suppliers.deletedFailed"));
      }
    } catch (error) {
      toast.error(t("suppliers.deletedError"));
    }
  };

  const onCloseModal = () => {
    setShowSupplierModal(false);
    setCurrentSupplier(null);
    setMode("add");
  };

  return (
    <div className="relative">
      {showSupplierModal && (
        <SupplierModal
          onClose={onCloseModal}
          mode={mode}
          supplier={currentSupplier}
          token={token}
          onSuccess={() => fetchSuppliers(token, setSuppliers, t)}
        />
      )}
      <div className="pb-6 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100">
                <img
                  src="./images/supplier.png"
                  alt="Supplier"
                  className="size-10"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {t("suppliers.title")}
                </h2>
                <p className="text-gray-600 mt-1">{t("suppliers.subtitle")}</p>
              </div>
            </div>
            <CustomButton
              type="button"
              label={t("suppliers.addSupplier")}
              onClick={handleAddSupplier}
              Icon={<AddIcon className="size-7" />}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            {t("suppliers.suppliersList")}
          </h3>
          {suppliers.length === 0 ? (
            <p className="text-gray-500">{t("suppliers.noSuppliers")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("suppliers.table.supplierName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("suppliers.table.createdAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("suppliers.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier: any) => (
                    <tr key={supplier.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {supplier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {dayjs(new Date(supplier.createdAt).toLocaleDateString()).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                        <CustomButton
                          type="button"
                          onClick={() => handleView(supplier)}
                          Icon={<EyeIcon className="size-5" />}
                          variant="transparent"
                          className="p-0!"
                        />
                        <CustomButton
                          type="button"
                          onClick={() => handleEdit(supplier)}
                          Icon={<EditIcon className="size-5" />}
                          variant="transparent"
                          className="p-0! text-blue-500! hover:text-blue-700!"
                        />
                        <CustomButton
                          type="button"
                          onClick={() =>
                            handleDelete(supplier.id, supplier.name)
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

export default Suppliers;
