import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Product } from "@/types/Menu";
import { CrossIcon } from "@/renderer/public/Svg";

interface ProductAllergenModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  token: string | null;
}

const ProductAllergenModal: React.FC<ProductAllergenModalProps> = ({
  isOpen,
  onClose,
  product,
  token,
}) => {
  const { t, i18n } = useTranslation();
  const [allergens, setAllergens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product?.id && token) {
      fetchAllergens();
    } else {
      setAllergens([]);
    }
  }, [isOpen, product, token]);

  const fetchAllergens = async () => {
    if (!product?.id || !token) return;
    try {
      setLoading(true);
      const res = await (window as any).electronAPI.getProductAllergensByProductId(
        token,
        product.id
      );
      if (res && res.status && Array.isArray(res.data)) {
        setAllergens(res.data);
      } else {
        setAllergens([]);
      }
    } catch (err) {
      console.error("Error loading product allergens:", err);
      setAllergens([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const containsAllergens = allergens.filter(
    (item: any) =>
      item.type === "contains" ||
      item.type === "contain" ||
      item.type === "contiene"
  );
  const tracesAllergens = allergens.filter(
    (item: any) =>
      item.type === "traces" ||
      item.type === "trace" ||
      item.type === "trazas"
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 min-w-0 pr-4">
            {product.imgUrl && (
              <img
                crossOrigin="anonymous"
                src={product.imgUrl}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-xs flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {t("orderTakingForm.allergens", "Información de Alérgenos")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer flex-shrink-0"
          >
            <CrossIcon className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-300 border-t-black" />
              <p className="text-sm text-gray-500 font-medium">
                {t("common.loading", "Cargando...")}
              </p>
            </div>
          ) : allergens.length === 0 ? (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-3xl mb-2">🌿</div>
              <p className="text-sm font-semibold text-gray-700">
                {t(
                  "orderTakingForm.noAllergens",
                  "No hay alérgenos declarados para este producto."
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Contiene (Contains) */}
              {containsAllergens.length > 0 && (
                <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <h4 className="font-bold text-red-800 text-sm uppercase tracking-wide">
                      {t("orderTakingForm.containsAllergens", "Contiene")}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {containsAllergens.map((item: any) => {
                      const name =
                        i18n.language === "en"
                          ? item.nameEn || item.nameEs
                          : item.nameEs || item.nameEn;
                      return (
                        <div
                          key={item.allergenId || item.id}
                          className="flex items-center space-x-2.5 bg-white border border-red-200 text-red-900 px-3 py-2 rounded-xl text-sm font-semibold shadow-xs"
                        >
                          {item.icon ? (
                            <img
                              crossOrigin="anonymous"
                              src={item.icon}
                              alt={name}
                              className="w-7 h-7 object-contain flex-shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {(name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trazas (Traces) */}
              {tracesAllergens.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-amber-800 text-sm uppercase tracking-wide">
                      {t(
                        "orderTakingForm.tracesAllergens",
                        "Trazas (Puede contener)"
                      )}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tracesAllergens.map((item: any) => {
                      const name =
                        i18n.language === "en"
                          ? item.nameEn || item.nameEs
                          : item.nameEs || item.nameEn;
                      return (
                        <div
                          key={item.allergenId || item.id}
                          className="flex items-center space-x-2.5 bg-white border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-sm font-semibold shadow-xs"
                        >
                          {item.icon ? (
                            <img
                              crossOrigin="anonymous"
                              src={item.icon}
                              alt={name}
                              className="w-7 h-7 object-contain flex-shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {(name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {t("common.close", "Cerrar")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductAllergenModal;
