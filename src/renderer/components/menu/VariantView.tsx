import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateVariantModal } from "./CreateVariantModal";

interface Variant {
  id: string;
  name: string;
  groupName?: string;
  variantCount: number;
  color: string;
}

export const VariantView: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  // Mock data for variants
  useEffect(() => {
    const mockVariants: Variant[] = [
      {
        id: "1",
        name: "Size Variants",
        groupName: "Pizza Sizes",
        variantCount: 3,
        color: "blue",
      },
      {
        id: "2",
        name: "Flavor Variants",
        groupName: "Ice Cream",
        variantCount: 5,
        color: "green",
      },
      {
        id: "3",
        name: "Temperature",
        groupName: "Beverages",
        variantCount: 2,
        color: "orange",
      },
      {
        id: "4",
        name: "Spice Level",
        groupName: "Curry Dishes",
        variantCount: 4,
        color: "red",
      },
      {
        id: "5",
        name: "Crust Type",
        groupName: "Pizza",
        variantCount: 3,
        color: "purple",
      },
      {
        id: "6",
        name: "Dressing",
        groupName: "Salads",
        variantCount: 6,
        color: "teal",
      },
    ];
    setVariants(mockVariants);
  }, []);

  const handleCreateVariant = () => {
    setEditingVariant(null);
    setIsCreateVariantOpen(true);
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setIsCreateVariantOpen(true);
  };

  const handleDeleteVariant = (variant: Variant) => {
    if (window.confirm(`Are you sure you want to delete "${variant.name}"?`)) {
      setVariants(variants.filter((v) => v.id !== variant.id));
      // TODO: Call API to delete variant
    }
  };

  const handleVariantSuccess = () => {
    setIsCreateVariantOpen(false);
    setEditingVariant(null);
    // TODO: Refresh variants from API
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
        {variants.map((variant) => (
          <UnifiedCard
            key={variant.id}
            data={variant}
            type="variant"
            onEdit={() => handleEditVariant(variant)}
            onDelete={() => handleDeleteVariant(variant)}
          />
        ))}
      </div>

      {/* Create/Edit Variant Modal */}
      <CreateVariantModal
        isOpen={isCreateVariantOpen}
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
