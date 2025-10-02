import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import DocumentIcon from "../../../assets/icons/document.svg?react";
import CrossIcon from "../../../assets/icons/cross.svg?react";
import NoProductIcon from "../../../assets/icons/no-procut.svg?react";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";

interface Group {
  id: string;
  name: string;
  color: string;
  items: Complement[];
}

interface Complement {
  id: string;
  name: string;
  price: number;
  priority: number;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGroup?: Group | null;
  token: string;
}

interface AssociatedProduct {
  productId: string;
  productName: string;
  productPrice: number;
  subcategoryName: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingGroup,
  token,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    color: "red",
  });
  const [newComplement, setNewComplement] = useState({
    name: "",
    price: 0,
    priority: 0,
  });
  const [complements, setComplements] = useState<Complement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssociatedProducts, setShowAssociatedProducts] = useState(false);
  const [associatedProducts, setAssociatedProducts] = useState<AssociatedProduct[] | null>(null);

  const fetchAssociatedProducts = async () => {
    try {
      const response = await (window as any).electronAPI.getAttachProductsByGroupId(
        token,
        editingGroup!.id
      );
      console.log(response);
      if (!response.status) {
        toast.error("Failed to fetch associated products");
        return;
      } else {
        setAssociatedProducts(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch associated products");
    }
  }
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
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        color: editingGroup.color,
      });
      setComplements(editingGroup.items);
    } else {
      setFormData({
        name: "",
        color: "red",
      });
      setComplements([]);
    }
    setNewComplement({
      name: "",
      price: 0,
      priority: 0,
    });

  }, [editingGroup, isOpen]);

  const addComplement = () => {
    if (!newComplement.name.trim()) {
      toast.error("Please enter a complement name");
      return;
    }

    const complement: Complement = {
      id: Date.now().toString(),
      name: newComplement.name.trim(),
      price: newComplement.price,
      priority: newComplement.priority,
    };

    setComplements([...complements, complement]);
    setNewComplement({
      name: "",
      price: 0,
      priority: 0,
    });
  };

  const removeComplement = (id: string) => {
    setComplements(complements.filter((complement) => complement.id !== id));
  };

  const updateComplement = (
    id: string,
    field: keyof Complement,
    value: any
  ) => {
    setComplements(
      complements.map((complement) =>
        complement.id === id ? { ...complement, [field]: value } : complement
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (complements.length === 0) {
      toast.error("Please add at least one complement");
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      if (editingGroup) {
        res = await (window as any).electronAPI.updateGroup(
          token,
          { id: editingGroup.id, ...formData },
          complements
        );
      } else {
        res = await (window as any).electronAPI.createGroup(
          token,
          formData,
          complements
        );
      }
      if (!res.status) {
        toast.error(
          editingGroup ? "Failed to edit group" : "Failed to save group"
        );
        return;
      }
      toast.success(
        editingGroup
          ? "Group updated successfully"
          : "Group created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error("Failed to save group");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteGroup = (id: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete this "${editingGroup?.name}" with ${complements.length} items?`
      )
    ) {
      (window as any).electronAPI.deleteGroup(token, id).then((res: any) => {
        if (!res.status) {
          toast.error("Failed to delete group");
          return;
        }
        toast.success("Group deleted successfully");
        onSuccess();
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 px-6 py-4 border-b border-gray-200">
          {editingGroup ? "EDIT PLUGIN GROUP" : "CREATE PLUGIN GROUP"}
        </h2>

        <form onSubmit={handleSubmit} className="p-6">
          <CustomInput label="GROUP NAME *" name="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter group name" required />
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              COLOR
            </label>
            <div className="grid grid-cols-12 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      color: option.value,
                    })
                  }
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${getColorClasses(
                    option.value,
                    formData.color === option.value
                  )}`}
                >
                  <div
                    className={`w-full h-8 rounded ${option.color} mb-2`}
                  ></div>
                  <span className="text-xs text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add New Complement Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Complement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <CustomInput label="COMPLEMENT NAME *" name="complement-name" type="text" value={newComplement.name} onChange={(e) => setNewComplement({ ...newComplement, name: e.target.value })} placeholder="Enter complement name" />
              <CustomInput label="PRICE *" name="price" type="number" step="0.01" min="0" value={newComplement.price} onChange={(e) => setNewComplement({ ...newComplement, price: parseFloat(e.target.value) || 0 })} placeholder="0" preLabel="€" otherClasses="relative" inputClasses="pl-8" />
              <CustomInput label="PRIORITY" name="priority" type="number" min="0" value={newComplement.priority} onChange={(e) => setNewComplement({ ...newComplement, priority: parseInt(e.target.value) || 0 })} placeholder="0" />
            </div>

            <div className="flex justify-end">
              <CustomButton type="button" onClick={addComplement} variant="orange" label="ADD" />
            </div>
          </div>

          {/* Complements Table */}
          {complements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Complements
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Complement Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complements.map((complement) => (
                      <tr key={complement.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomInput label="" name={`complement-name-${complement.id}`} type="text" value={complement.name} onChange={(e) => updateComplement(complement.id, "name", e.target.value)} placeholder="Enter complement name" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomInput label="" name={`price-${complement.id}`} type="number" step="0.01" min="0" value={complement.price} onChange={(e) => updateComplement(complement.id, "price", parseFloat(e.target.value) || 0)} placeholder="0" preLabel="€" inputClasses="!w-28 pl-8" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomInput label="" name={`priority-${complement.id}`} type="number" min="0" value={complement.priority} onChange={(e) => updateComplement(complement.id, "priority", parseInt(e.target.value) || 0)} placeholder="0" inputClasses="!w-20" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => removeComplement(complement.id)}
                            className="cursor-pointer text-red-600 hover:text-red-800 transition-colors duration-200"
                          >
                            <DeleteIcon className="size-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Associated Products Link */}
          {editingGroup && <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                fetchAssociatedProducts();
                setShowAssociatedProducts(true)
              }}
              className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
            >
              <DocumentIcon className="size-4" />
              See associated products
            </button>
          </div>}

          {/* Action Buttons */}
          <div
            className={`flex ${editingGroup ? "justify-between" : "justify-end"} items-center`}
          >
            {editingGroup && (
              <CustomButton type="button" onClick={() => handleDeleteGroup(editingGroup.id)} variant="transparent" label="ELIMINATE" className="text-red-500 hover:text-red-700" />
            )}

            <div className="flex gap-3">
              <CustomButton type="button" onClick={onClose} variant="secondary" label="CANCEL" />
              <CustomButton type="submit" disabled={isSubmitting} variant="yellow" label="KEEP" isLoading={isSubmitting} />
            </div>
          </div>
        </form>
      </div>

      {/* Associated Products Modal */}
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

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAssociatedProducts(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { CreateGroupModal };
