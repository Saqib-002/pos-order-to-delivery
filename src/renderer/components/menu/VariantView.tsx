import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateVariantModal } from "./CreateVariantModal";
import { VariantItem } from "@/types/Variants";
import { toast } from "react-toastify";

interface Variant {
  id: string;
  groupName?: string;
  items:VariantItem[];
}

export const VariantView: React.FC<{token:string}> = ({token}) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  const getVariants=async()=>{
    const res=await (window as any).electronAPI.getVariants(token);
    if(!res.status){
      toast.error("Unable to get variants");
      return
    }
    setVariants(res.data);
  }
  // Mock data for variants
  useEffect(() => {
    getVariants()
  }, []);

  const handleCreateVariant = () => {
    setEditingVariant(null);
    setIsCreateVariantOpen(true);
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setIsCreateVariantOpen(true);
  };

  const handleDeleteVariant = async(variant: Variant) => {
    if (window.confirm(`Are you sure you want to delete "${variant.groupName!==""?variant.groupName:variant.items.map(i=>i.name).join("-")}" with "${variant.items.length} variants"?`)) {
      const res=await (window as any).electronAPI.deleteVariant(token,variant.id);
      if(!res.status){
        toast.error("Unable to delete variant");
        return
      }
      getVariants();
    }
  };

  const handleVariantSuccess = () => {
    setIsCreateVariantOpen(false);
    setEditingVariant(null);
    getVariants();
  };

  return (
    <div>
      {/* Action Buttons Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Main Action Button */}
          <button
            onClick={handleCreateVariant}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            CREATE VARIANT
          </button>
        </div>
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
            data={{id:variant.id,name:variant.groupName!==""?variant.groupName:variant.items.map(i=>i.name).join("-"),variantCount:variant.items.length}}
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
