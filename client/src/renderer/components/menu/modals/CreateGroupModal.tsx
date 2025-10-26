import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import {
  CrossIcon,
  DeleteIcon,
  DocumentIcon,
  ImgIcon,
  NoProductIcon,
} from "@/renderer/public/Svg";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";

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
  imgUrl?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGroup?: Group | null;
  token: string | null;
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
  const { t } = useTranslation();
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
  const [associatedProducts, setAssociatedProducts] = useState<
    AssociatedProduct[] | null
  >(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const confirm = useConfirm();

  const fetchAssociatedProducts = async () => {
    try {
      const response = await (
        window as any
      ).electronAPI.getAttachProductsByGroupId(token, editingGroup!.id);
      if (!response.status) {
        toast.error(
          t("menuComponents.modals.createGroupModal.errors.failedToFetch")
        );
        return;
      } else {
        setAssociatedProducts(response.data);
      }
    } catch (error) {
      toast.error(
        t("menuComponents.modals.createGroupModal.errors.failedToFetch")
      );
    }
  };
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
      if (isOpen) {
        fetchAssociatedProducts();
      }
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
      toast.error(
        t("menuComponents.modals.createGroupModal.errors.itemNameRequired")
      );
      return;
    }

    const complement: Complement = {
      id: Date.now().toString(),
      name: newComplement.name.trim(),
      price: newComplement.price,
      priority: newComplement.priority,
      imgUrl: "",
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
      toast.error(
        t("menuComponents.modals.createGroupModal.errors.nameRequired")
      );
      return;
    }
    if (complements.length === 0) {
      toast.error(
        t("menuComponents.modals.createGroupModal.errors.itemNameRequired")
      );
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
          editingGroup
            ? t("menuComponents.modals.createGroupModal.errors.failedToUpdate")
            : t("menuComponents.modals.createGroupModal.errors.failedToCreate")
        );
        return;
      }
      toast.success(
        editingGroup
          ? t("menuComponents.modals.createGroupModal.success.updated")
          : t("menuComponents.modals.createGroupModal.success.created")
      );
      onSuccess();
    } catch (error) {
      toast.error(
        t("menuComponents.modals.createGroupModal.errors.failedToCreate")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    const ok = await confirm({
      title: t("menuComponents.modals.createGroupModal.deleteTitle"),
      message: `${t("menuComponents.modals.createGroupModal.deleteMessage")} "${editingGroup?.name}" with ${complements.length} items? This group is attached to ${associatedProducts ? associatedProducts.length : 0} products. They will be detached!`,
      itemName: name,
      type: "danger",
      confirmText: t("menuComponents.modals.createGroupModal.deleteConfirm"),
      cancelText: t("menuComponents.modals.createGroupModal.cancel"),
      specialNote: t("menuComponents.modals.createGroupModal.specialNote"),
    });
    if (!ok) return;
    await (window as any).electronAPI
      .deleteGroup(token, id)
      .then((res: any) => {
        if (!res.status) {
          toast.error(
            t("menuComponents.modals.createGroupModal.errors.failedToDelete")
          );
          return;
        }
        toast.success(
          t("menuComponents.modals.createGroupModal.success.deleted")
        );
        onSuccess();
      });
  };
  const handleComplementImageChange = (
    complementId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateComplement(complementId, "imgUrl", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveComplementImage = (complementId: string) => {
    updateComplement(complementId, "imgUrl", "");
    if (fileInputRefs.current[complementId]) {
      fileInputRefs.current[complementId]!.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-black px-6 py-4 border-b border-gray-200">
          {editingGroup
            ? t("menuComponents.modals.createGroupModal.editTitle")
            : t("menuComponents.modals.createGroupModal.title")}
        </h2>

        <form onSubmit={handleSubmit} className="p-6">
          <CustomInput
            label={t("menuComponents.modals.createGroupModal.groupName")}
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t(
              "menuComponents.modals.createGroupModal.enterGroupName"
            )}
            required
          />
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("menuComponents.modals.createGroupModal.color")}
            </label>
            <div className="grid grid-cols-9 gap-2">
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
                  className={`p-2 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${getColorClasses(
                    option.value,
                    formData.color === option.value
                  )}`}
                >
                  <div className={`w-8 h-8 rounded-full ${option.color}`}></div>
                  {/* <span className="text-xs text-gray-700">{option.label}</span> */}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Complement Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-black mb-4">
              {t("menuComponents.modals.createGroupModal.addNewComplement")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <CustomInput
                label={t(
                  "menuComponents.modals.createGroupModal.complementName"
                )}
                name="complement-name"
                type="text"
                value={newComplement.name}
                onChange={(e) =>
                  setNewComplement({ ...newComplement, name: e.target.value })
                }
                placeholder={t(
                  "menuComponents.modals.createGroupModal.enterComplementName"
                )}
              />

              <CustomInput
                label={t("menuComponents.modals.createGroupModal.price")}
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={newComplement.price}
                onChange={(e) =>
                  setNewComplement({
                    ...newComplement,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                preLabel="€"
                otherClasses="relative"
                inputClasses="pl-8"
              />

              <CustomInput
                label={t("menuComponents.modals.createGroupModal.priority")}
                name="priority"
                type="number"
                min="0"
                value={newComplement.priority}
                onChange={(e) =>
                  setNewComplement({
                    ...newComplement,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="flex justify-end">
              <CustomButton
                type="button"
                onClick={addComplement}
                variant="orange"
                label={t("menuComponents.modals.createGroupModal.add")}
              />
            </div>
          </div>

          {/* Complements Table */}
          {complements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                {t("menuComponents.modals.createGroupModal.complements")}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(
                          "menuComponents.modals.createGroupModal.complementName"
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("menuComponents.modals.createGroupModal.price")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("menuComponents.modals.createGroupModal.priority")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("menuComponents.modals.createGroupModal.image")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("menuComponents.modals.createGroupModal.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complements.map((complement) => (
                      <tr key={complement.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomInput
                            label=""
                            name={`complement-name-${complement.id}`}
                            type="text"
                            value={complement.name}
                            onChange={(e) =>
                              updateComplement(
                                complement.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder={t(
                              "menuComponents.modals.createGroupModal.enterComplementName"
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomInput
                            label=""
                            name={`price-${complement.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={complement.price}
                            onChange={(e) =>
                              updateComplement(
                                complement.id,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            preLabel="€"
                            inputClasses="!w-28 pl-8"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomInput
                            label=""
                            name={`priority-${complement.id}`}
                            type="number"
                            min="0"
                            value={complement.priority}
                            onChange={(e) =>
                              updateComplement(
                                complement.id,
                                "priority",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            inputClasses="!w-20"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-1 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 flex items-center justify-center touch-manipulation w-32">
                            <input
                              ref={(el) => {
                                if (el) {
                                  fileInputRefs.current[complement.id] = el;
                                }
                              }}
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleComplementImageChange(complement.id, e)
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {complement.imgUrl ? (
                              <div className="flex flex-col items-center">
                                <div className="relative">
                                  <img
                                    crossOrigin="anonymous"
                                    src={complement.imgUrl}
                                    alt="Complement Preview"
                                    className="size-9 object-cover rounded shadow-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent triggering file input
                                      handleRemoveComplementImage(
                                        complement.id
                                      );
                                    }}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md hover:bg-gray-100 transition-colors"
                                  >
                                    <CrossIcon className="size-3 text-gray-600 hover:text-gray-800" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-gray-500 text-xs">
                                <ImgIcon className="size-9" />
                              </div>
                            )}
                          </div>
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
          {editingGroup && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setShowAssociatedProducts(true);
                }}
                className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
              >
                <DocumentIcon className="size-4" />
                {t(
                  "menuComponents.modals.createGroupModal.seeAssociatedProducts"
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div
            className={`flex ${editingGroup ? "justify-between" : "justify-end"} items-center`}
          >
            {editingGroup && (
              <CustomButton
                type="button"
                onClick={() =>
                  handleDeleteGroup(editingGroup.id, editingGroup.name)
                }
                variant="transparent"
                label={t("menuComponents.modals.createGroupModal.eliminate")}
                className="text-red-500 hover:text-red-700"
              />
            )}

            <div className="flex gap-3">
              <CustomButton
                type="button"
                onClick={onClose}
                variant="secondary"
                label={t("menuComponents.modals.createGroupModal.cancel")}
              />
              <CustomButton
                type="submit"
                disabled={isSubmitting}
                variant="yellow"
                label={
                  editingGroup
                    ? t("menuComponents.modals.createGroupModal.update")
                    : t("menuComponents.modals.createGroupModal.create")
                }
                isLoading={isSubmitting}
              />
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
                <h3 className="text-xl font-semibold text-black">
                  {t(
                    "menuComponents.modals.createGroupModal.associatedProducts"
                  )}
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
                {associatedProducts &&
                  associatedProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-black text-sm">
                          {product.productName}
                        </h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {product.subcategoryName}
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        €{product.productPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>

              {associatedProducts && associatedProducts.length === 0 && (
                <div className="text-center py-8">
                  <NoProductIcon className="size-12 text-gray-400 mb-4 mx-auto" />
                  <p className="text-gray-500">
                    {t("menuComponents.modals.createGroupModal.noProducts")}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <CustomButton
                type="button"
                label={t("menuComponents.modals.createGroupModal.close")}
                onClick={() => setShowAssociatedProducts(false)}
                variant="secondary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { CreateGroupModal };
