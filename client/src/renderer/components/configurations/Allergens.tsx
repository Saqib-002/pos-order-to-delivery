import { useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon, EyeIcon, ImgIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import CustomInput from "../shared/CustomInput";
import Pagination from "../shared/Pagination";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import { AllergenModal } from "./Modals/AllergenModal";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const fetchAllergens = async (
  token: string | null,
  setAllergens: any,
  t: any
) => {
  if (!token) return;
  try {
    const res = await (window as any).electronAPI.getAllAllergens(token);
    if (res.status) {
      setAllergens(res.data || []);
    } else {
      toast.error(t("allergens.fetchError", "Error al obtener la lista de alérgenos"));
    }
  } catch (error) {
    toast.error(t("allergens.fetchError", "Error al obtener la lista de alérgenos"));
  }
};

const Allergens = () => {
  const [allergens, setAllergens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllergenModal, setShowAllergenModal] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "view">("add");
  const [currentAllergen, setCurrentAllergen] = useState<any>(null);
  const {
    auth: { token },
  } = useAuth();
  const confirm = useConfirm();
  const { t } = useTranslation();

  useEffect(() => {
    fetchAllergens(token, setAllergens, t);
  }, [token, t]);

  const handleAddAllergen = () => {
    setMode("add");
    setCurrentAllergen(null);
    setShowAllergenModal(true);
  };

  const handleEdit = (allergen: any) => {
    setMode("edit");
    setCurrentAllergen(allergen);
    setShowAllergenModal(true);
  };

  const handleView = (allergen: any) => {
    setMode("view");
    setCurrentAllergen(allergen);
    setShowAllergenModal(true);
  };

  const handleDelete = async (id: string, allergenName: string) => {
    const ok = await confirm({
      title: t("allergens.deleteTitle", "Eliminar Alérgeno"),
      message: t("allergens.deleteMessage", "¿Estás seguro de que deseas eliminar este alérgeno?"),
      confirmText: t("allergens.deleteConfirm", "Eliminar"),
      cancelText: t("allergens.deleteCancel", "Cancelar"),
      itemName: allergenName,
    });
    if (!ok) return;
    try {
      const res = await (window as any).electronAPI.deleteAllergen(token, id);
      if (res.status) {
        toast.success(t("allergens.deletedSuccess", "Alérgeno eliminado exitosamente"));
        fetchAllergens(token, setAllergens, t);
      } else {
        toast.error(t("allergens.deletedFailed", "No se pudo eliminar el alérgeno"));
      }
    } catch (error) {
      toast.error(t("allergens.deletedError", "Ocurrió un error al eliminar el alérgeno"));
    }
  };

  const onCloseModal = () => {
    setShowAllergenModal(false);
    setCurrentAllergen(null);
    setMode("add");
  };

  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filteredAllergens = allergens.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const nameEs = (item.nameEs || "").toLowerCase();
    const nameEn = (item.nameEn || "").toLowerCase();
    return nameEs.includes(term) || nameEn.includes(term);
  });

  const totalPages = Math.ceil(filteredAllergens.length / ITEMS_PER_PAGE);
  const paginatedAllergens = filteredAllergens.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("allergens.title", "Gestión de Alérgenos")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("allergens.subtitle", "Registra y gestiona los alérgenos de los productos del restaurante")}
          </p>
        </div>
        <CustomButton
          type="button"
          onClick={handleAddAllergen}
          variant="primary"
          Icon={<AddIcon className="w-4 h-4" />}
          label={t("allergens.addAllergen", "Agregar Alérgeno")}
        />
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="w-72">
          <CustomInput
            name="search"
            type="text"
            placeholder={t("allergens.searchPlaceholder", "Buscar alérgenos...")}
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {t("allergens.totalCount", "Total: {{count}}", { count: filteredAllergens.length })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">{t("allergens.table.icon", "Icono")}</th>
                <th className="px-6 py-4">{t("allergens.table.nameEs", "Nombre (ES)")}</th>
                <th className="px-6 py-4">{t("allergens.table.nameEn", "Nombre (EN)")}</th>
                <th className="px-6 py-4">{t("allergens.table.createdAt", "Fecha Registro")}</th>
                <th className="px-6 py-4 text-right">{t("allergens.table.actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedAllergens.length > 0 ? (
                paginatedAllergens.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {item.icon ? (
                          <img
                            crossOrigin="anonymous"
                            src={item.icon}
                            alt={item.nameEs}
                            className="w-full h-full object-contain p-1 filter invert brightness-200"
                          />
                        ) : (
                          <ImgIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {item.nameEs}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.nameEn || <span className="text-gray-400 font-normal italic">-</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.createdAt
                        ? dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t("allergens.view", "Ver")}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={t("allergens.edit", "Editar")}
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.nameEs)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("allergens.delete", "Eliminar")}
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    {searchTerm
                      ? t("allergens.noResultsFound", "No se encontraron alérgenos que coincidan con la búsqueda.")
                      : t("allergens.noAllergens", "No hay alérgenos registrados todavía. Agrega uno usando el botón superior.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {showAllergenModal && (
        <AllergenModal
          onClose={onCloseModal}
          mode={mode}
          allergen={currentAllergen}
          token={token}
          onSuccess={() => fetchAllergens(token, setAllergens, t)}
        />
      )}
    </div>
  );
};

export default Allergens;
