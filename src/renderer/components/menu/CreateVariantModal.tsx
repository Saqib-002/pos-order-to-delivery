import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface Variant {
  id: string;
  groupName?: string;
  color: string;
  items:VariantItem[]
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
  token:string;
  editingVariant?: Variant | null;
}

const CreateVariantModal: React.FC<CreateVariantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  editingVariant,
}) => {
  const [formData, setFormData] = useState({
    groupName: "",
    color: "red",
  });
  const [newVariantName, setNewVariantName] = useState("");
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingVariant) {
      setFormData({
        groupName: editingVariant.groupName || "",
        color: editingVariant.color || "red"
      });
      setVariants(editingVariant.items || []);
    } else {
      setFormData({
        groupName: "",
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
      if(!editingVariant){
        res= await (window as any).electronAPI.createVariant(token,formData,variants);
      }else{
        res=await (window as any).electronAPI.updateVariant(token,{...formData,id:editingVariant!.id},variants);
      }
      if(!res.status){
        toast.error(editingVariant
          ? "Failed to edit variant"
          : "Failed to save variant");
        return
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
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingVariant ? "EDIT VARIANT" : "CREATE VARIANT"}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Variant Group Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VARIANT GROUP NAME (OPTIONAL)
            </label>
              <input
                type="text"
                value={formData.groupName}
                onChange={(e) =>
                  setFormData({ ...formData, groupName: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                placeholder="Variant group name"
              />
              
          </div>
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
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.color === option.value
                      ? "border-gray-900 ring-2 ring-gray-300"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-full h-8 rounded ${option.color} mb-2`}
                  ></div>
                  <span className="text-xs text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add New Variant Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VARIANT NAME
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Variant name"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addVariant();
                  }
                }}
              />
              
              <button
                type="button"
                onClick={addVariant}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors duration-200"
              >
                ADD
              </button>
            </div>
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
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NAME
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(variant.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PRIORITY
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.priority}
                        onChange={(e) =>
                          updateVariant(
                            variant.id,
                            "priority",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Keep
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CreateVariantModal };
