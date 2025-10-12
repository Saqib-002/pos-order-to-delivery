import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon, DeleteIcon, DocumentIcon, NoProductIcon } from "@/renderer/assets/Svg";
import { fetchAssociatedProductsByVariantId } from "@/renderer/utils/menu";

interface Variant {
  id: string;
  name?: string;
  color: string;
  items: VariantItem[];
}

interface VariantItem {
  id: string;
  name: string;
  priority: number;
}

interface CreateVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  editingVariant?: Variant | null;
}
interface AssociatedProduct {
  productId: string;
  productName: string;
  productPrice: number;
  subcategoryName: string;
}

const CreateVariantModal: React.FC<CreateVariantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  editingVariant,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    color: "red",
  });
  const [newVariantName, setNewVariantName] = useState("");
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssociatedProducts, setShowAssociatedProducts] = useState(false);
    const [associatedProducts, setAssociatedProducts] = useState<AssociatedProduct[] | null>(null);


  // Get color classes for selection ring
  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return "border-gray-200 hover:border-gray-300";
    }

    const colorMap: Record<string, string> = {
      red: "border-red-500 ring-2 ring-red-500 ring-opacity-50",
      blue: "border-blue-500 ring-2 ring-blue-500 ring-opacity-50",
      green: "border-green-500 ring-2 ring-green-500 ring-opacity-50",
      purple: "border-purple-500 ring-2 ring-purple-500 ring-opacity-50",
      orange: "border-orange-500 ring-2 ring-orange-500 ring-opacity-50",
      pink: "border-pink-500 ring-2 ring-pink-500 ring-opacity-50",
      indigo: "border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50",
      yellow: "border-yellow-500 ring-2 ring-yellow-500 ring-opacity-50",
      gray: "border-gray-500 ring-2 ring-gray-500 ring-opacity-50",
    };

    return (
      colorMap[color] || "border-gray-500 ring-2 ring-gray-500 ring-opacity-50"
    );
  };

  useEffect(() => {
    if (editingVariant) {
      setFormData({
        name: editingVariant.name || "",
        color: editingVariant.color || "red",
      });
      setVariants(editingVariant.items || []);
    } else {
      setFormData({
        name: "",
        color: "red",
      });
      setVariants([]);
    }
    setNewVariantName("");
  }, [editingVariant, isOpen]);

  const addVariant = () => {
    if (!newVariantName.trim()) {
      toast.error("Please enter a variant name");
      return;
    }

    const variant: VariantItem = {
      id: Date.now().toString(),
      name: newVariantName.trim(),
      priority: 0,
    };

    setVariants([...variants, variant]);
    setNewVariantName("");
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((variant) => variant.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantItem, value: any) => {
    setVariants(
      variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (variants.length === 0) {
      toast.error("Please add at least one variant");
      return;
    }
    setIsSubmitting(true);
    try {
      let res;
      if (!editingVariant) {
        res = await (window as any).electronAPI.createVariant(
          token,
          formData,
          variants
        );
      } else {
        res = await (window as any).electronAPI.updateVariant(
          token,
          { ...formData, id: editingVariant!.id },
          variants
        );
      }
      if (!res.status) {
        toast.error(
          editingVariant ? "Failed to edit variant" : "Failed to save variant"
        );
        return;
      }
      toast.success(
        editingVariant
          ? "Variant updated successfully"
          : "Variant created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error("Failed to save variant");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 px-6 py-4 border-b border-gray-200">
          {editingVariant ? "EDIT VARIANT" : "CREATE VARIANT"}
        </h2>

        <form onSubmit={handleSubmit} className="p-6">
          <CustomInput label="VARIANT GROUP NAME (OPTIONAL)" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Variant group name" name="name" otherClasses="mb-4"/>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              COLOR
            </label>
            <div className="grid grid-cols-9 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, color: option.value })
                  }
                  className={`p-3 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${getColorClasses(
                    option.value,
                    formData.color === option.value
                  )}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full ${option.color}`}
                  ></div>
                  {/* <span className="text-xs text-gray-700">{option.label}</span> */}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <CustomInput label="VARIANT NAME" type="text" name="variantName" value={newVariantName} onChange={(e) => setNewVariantName(e.target.value)} placeholder="Variant name" onKeyPress={(e: any) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVariant();
              }
            }} otherClasses="w-full" />
            <CustomButton type="button" label="ADD" onClick={addVariant} className="self-end" variant="orange"/>
            
          </div>

          {/* Variants List */}
          {variants.length > 0 && (
            <div className="mb-6">
              <div className="space-y-3">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <CustomInput label="NAME" type="text" name="variantName" value={variant.name} onChange={(e) => updateVariant(variant.id, "name", e.target.value)} placeholder="Variant name" otherClasses="w-full"/>
                    <CustomInput label="PRIORITY" type="number" name="priority" value={variant.priority} onChange={(e) => updateVariant(variant.id, "priority", parseInt(e.target.value) || 0)} placeholder="Priority" otherClasses="w-24" min="0"/>
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="cursor-pointer text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        <DeleteIcon className="size-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {editingVariant && <div className="mb-6">
            <button
              type="button"
              onClick={async () => {
                await fetchAssociatedProductsByVariantId(token, editingVariant.id, setAssociatedProducts);
                setShowAssociatedProducts(true)
              }}
              className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
            >
              <DocumentIcon className="size-4" />
              See associated products
            </button>
          </div>}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <CustomButton type="button" label="Cancel" onClick={onClose} variant="secondary"/>
            <CustomButton type="submit" label="Keep" isLoading={isSubmitting} disabled={isSubmitting} variant="yellow"/>
          </div>
        </form>
      </div>
      {showAssociatedProducts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Associated Products
                </h3>
                <button
                  onClick={() => setShowAssociatedProducts(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <CrossIcon className="size-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {associatedProducts && associatedProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {product.productName}
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {product.subcategoryName}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      €{product.productPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {associatedProducts && associatedProducts.length === 0 && (
                <div className="text-center py-8">
                  <NoProductIcon className="size-12 text-gray-400 mb-4 mx-auto" />
                  <p className="text-gray-500">No associated products found</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <CustomButton type="button" label="Close" onClick={() => setShowAssociatedProducts(false)} variant="secondary"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { CreateVariantModal };
