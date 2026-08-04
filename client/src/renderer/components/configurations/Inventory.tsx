import { useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon, EyeIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import CustomInput from "../shared/CustomInput";
import Pagination from "../shared/Pagination";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import { InventoryProductModal } from "./Modals/InventoryProductModal";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const fetchInventoryProducts = async (
  token: string | null,
  setInventoryProducts: any,
  t: any
) => {
  if (!token) return;
  try {
    const res = await (window as any).electronAPI.getAllInventoryProducts(
      token
    );
    if (res.status) {
      setInventoryProducts(res.data || []);
    } else {
      toast.error(t("inventory.fetchError"));
    }
  } catch (error) {
    toast.error(t("inventory.fetchError"));
  }
};

const Inventory = () => {
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInventoryProductModal, setShowInventoryProductModal] =
    useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "view">("add");
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const {
    auth: { token },
  } = useAuth();
  const confirm = useConfirm();
  const { t } = useTranslation();

  useEffect(() => {
    fetchInventoryProducts(token, setInventoryProducts, t);
  }, [token, t]);

  const handleAddProduct = () => {
    setMode("add");
    setCurrentProduct(null);
    setShowInventoryProductModal(true);
  };

  const handleEdit = (product: any) => {
    setMode("edit");
    setCurrentProduct(product);
    setShowInventoryProductModal(true);
  };

  const handleView = (product: any) => {
    setMode("view");
    setCurrentProduct(product);
    setShowInventoryProductModal(true);
  };

  const handleDelete = async (id: string, productName: string) => {
    const ok = await confirm({
      title: t("inventory.deleteTitle"),
      message: t("inventory.deleteMessage"),
      confirmText: t("inventory.deleteConfirm"),
      cancelText: t("inventory.deleteCancel"),
      itemName: productName,
    });
    if (!ok) return;
    try {
      const res = await (window as any).electronAPI.deleteInventoryProduct(
        token,
        id
      );
      if (res.status) {
        toast.success(t("inventory.deletedSuccess"));
        fetchInventoryProducts(token, setInventoryProducts, t);
      } else {
        toast.error(t("inventory.deletedFailed"));
      }
    } catch (error) {
      toast.error(t("inventory.deletedError"));
    }
  };

  const onCloseModal = () => {
    setShowInventoryProductModal(false);
    setCurrentProduct(null);
    setMode("add");
  };

  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filteredProducts = inventoryProducts.filter((product: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = product.name.toLowerCase().includes(searchLower);
    const matchesExpenseType = product.expenseType?.name
      ?.toLowerCase()
      .includes(searchLower);
    return matchesName || matchesExpenseType;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="relative">
      {showInventoryProductModal && (
        <InventoryProductModal
          onClose={onCloseModal}
          mode={mode}
          product={currentProduct}
          token={token}
          onSuccess={() =>
            fetchInventoryProducts(token, setInventoryProducts, t)
          }
        />
      )}
      <div className="pb-6 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <img
                  src="./images/inventory.png"
                  alt="Inventory"
                  className="size-10"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {t("inventory.title")}
                </h2>
                <p className="text-gray-600 mt-1">{t("inventory.subtitle")}</p>
              </div>
            </div>
            <CustomButton
              type="button"
              label={t("inventory.addProduct")}
              onClick={handleAddProduct}
              Icon={<AddIcon className="size-7" />}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-black">
              {t("inventory.productsList")}
            </h3>
            <div className="w-full md:w-64">
              <CustomInput
                name="search"
                type="text"
                placeholder={t("inventory.searchPlaceholder")}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                inputClasses="py-1.5!"
              />
            </div>
          </div>
          {inventoryProducts.length === 0 ? (
            <p className="text-gray-500">{t("inventory.noProducts")}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-gray-500">{t("inventory.noResultsFound")}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("inventory.table.productName")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("inventory.table.expenseType")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("inventory.table.createdAt")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("inventory.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProducts.map((product: any) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {product.expenseType ? product.expenseType.name : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {dayjs(
                            new Date(product.createdAt).toLocaleDateString()
                          ).format("DD/MM/YYYY")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                          <CustomButton
                            type="button"
                            onClick={() => handleView(product)}
                            Icon={<EyeIcon className="size-5" />}
                            variant="transparent"
                            className="p-0!"
                          />
                          <CustomButton
                            type="button"
                            onClick={() => handleEdit(product)}
                            Icon={<EditIcon className="size-5" />}
                            variant="transparent"
                            className="p-0! text-blue-500! hover:text-blue-700!"
                          />
                          <CustomButton
                            type="button"
                            onClick={() => handleDelete(product.id, product.name)}
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
