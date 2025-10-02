import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateVariantModal } from "./modals/CreateVariantModal";
import { VariantItem } from "@/types/Variants";
import { toast } from "react-toastify";
import AddIcon from "../../assets/icons/add.svg?react";
import { getVariants } from "@/renderer/utils/menu";
import CustomButton from "../ui/CustomButton";

export interface Variant {
  id: string;
  name?: string;
  color: string;
  items: VariantItem[];
}

export const VariantView: React.FC<{ token: string }> = ({ token }) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

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
    if (
      window.confirm(
        `Are you sure you want to delete "${variant.name !== "" ? variant.name : variant.items.map((i) => i.name).join("-")}" with "${variant.items.length} variants"?`
      )
    ) {
      const res = await (window as any).electronAPI.deleteVariant(
        token,
        variant.id
      );
      if (!res.status) {
        toast.error("Unable to delete variant");
        return;
      }
      getVariants(token, setVariants);
    }
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
          label="Create Variant"
          variant="orange"
          type="button"
          Icon={<AddIcon className="size-5"/>}
        />
      </div>

      <div className="">
        <h2 className="text-xl font-semibold text-gray-900">Variants</h2>
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {!variants.length && (
          <div className="text-center">
            <p>No variants found. Please create one.</p>
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
