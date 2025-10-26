import { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateVariantModal } from "./modals/CreateVariantModal";
import { VariantItem } from "@/types/Variants";
import { toast } from "react-toastify";
import {
  fetchAssociatedProductsByVariantId,
  getVariants,
} from "@/renderer/utils/menu";
import CustomButton from "../ui/CustomButton";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";
import { AddIcon } from "@/renderer/public/Svg";

export interface Variant {
  id: string;
  name?: string;
  color: string;
  items: VariantItem[];
}

export const VariantView = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [associatedProducts, setAssociatedProducts] = useState<any[]>([]);
  const confirm = useConfirm();
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const {
    auth: { token },
  } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    getVariants(token, setVariants);
  }, []);

  const handleCreateVariant = () => {
    setEditingVariant(null);
    setIsCreateVariantOpen(true);
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setIsCreateVariantOpen(true);
  };

  const handleDeleteVariant = async (variant: Variant) => {
    const res = await fetchAssociatedProductsByVariantId(
      token,
      variant.id,
      setAssociatedProducts
    );
    if (!res?.status) return;
    const ok = await confirm({
      title: t("menuComponents.common.delete"),
      message: `${t("menuComponents.common.delete")} "${variant.name !== "" ? variant.name : variant.items.map((i) => i.name).join("-")}" with "${variant.items.length} variants"? This variant is attached to ${res.data.length} products. They will be detached!`,
      type: "danger",
      confirmText: t("menuComponents.common.delete"),
      cancelText: t("menuComponents.common.cancel"),
      specialNote: t(
        "menuComponents.messages.specialNotes.variantDeleteWarning"
      ),
      itemName: variant.name,
    });
    if (!ok) return;
    const delRes = await (window as any).electronAPI.deleteVariant(
      token,
      variant.id
    );
    if (!delRes.status) {
      toast.error(t("menuComponents.messages.errors.failedToDelete"));
      return;
    }
    getVariants(token, setVariants);
  };

  const handleVariantSuccess = () => {
    setIsCreateVariantOpen(false);
    setEditingVariant(null);
    getVariants(token, setVariants);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Section */}
      <div className="flex flex-wrap gap-4 items-center">
        <CustomButton
          onClick={handleCreateVariant}
          label={t("menuComponents.variants.addVariant")}
          variant="orange"
          type="button"
          Icon={<AddIcon className="size-5" />}
        />
      </div>

      <div className="">
        <h2 className="text-xl font-semibold text-black">
          {t("menuComponents.variants.title")}
        </h2>
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {!variants.length && (
          <div className="text-center">
            <p>{t("menuComponents.variants.noVariants")}</p>
          </div>
        )}
        {variants.map((variant) => (
          <UnifiedCard
            key={variant.id}
            data={{
              ...variant,
              name:
                variant.name !== ""
                  ? variant.name
                  : variant.items.map((i) => i.name).join("-"),
              variantCount: variant.items.length,
            }}
            type="variant"
            onEdit={() => handleEditVariant(variant)}
            onDelete={() => handleDeleteVariant(variant)}
          />
        ))}
      </div>

      {/* Create/Edit Variant Modal */}
      <CreateVariantModal
        isOpen={isCreateVariantOpen}
        token={token}
        onClose={() => {
          setIsCreateVariantOpen(false);
          setEditingVariant(null);
        }}
        onSuccess={handleVariantSuccess}
        editingVariant={editingVariant}
      />
    </div>
  );
};
