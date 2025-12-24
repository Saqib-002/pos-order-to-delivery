import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { MarketPurchase, MarketPurchaseItem } from "@/types/marketPurchases";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/shadcn/date-picker";
import { useConfirm } from "../../../hooks/useConfirm";
import {
  CrossIcon,
  AddIcon,
  DeleteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
} from "../../../public/Svg";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MarketPurchase) => Promise<boolean>;
  initialData?: MarketPurchase | null;
  suppliers: any[];
  expenseTypes: any[];
}

interface PaymentMethod {
  type: "cash" | "card";
  amount: number;
}

export const MarketPurchaseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  suppliers,
  expenseTypes,
}: Props) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<MarketPurchase>>({
    paymentType: "cash",
    items: [],
  });
  const [items, setItems] = useState<MarketPurchaseItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "cash" | "card"
  >("cash");

  // Form state for adding new product
  const [newProduct, setNewProduct] = useState<MarketPurchaseItem>({
    productName: "",
    box: 0,
    unit: 0,
    totalUnit: 0,
    unitPrice: 0,
    tax: 0,
    total: 0,
  });
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setItems(initialData.items || []);
        if (initialData.paymentType) {
          if (initialData.paymentType.includes(":")) {
            try {
              const payments: PaymentMethod[] = initialData.paymentType
                .split(", ")
                .map((payment) => {
                  const [type, amount] = payment.split(":");
                  return {
                    type: type.trim() as "cash" | "card",
                    amount: parseFloat(amount) || 0,
                  };
                })
                .filter((payment) => payment.amount > 0);
              setPaymentMethods(payments);
            } catch (error) {
              setPaymentMethods([]);
            }
          } else {
            if (
              initialData.paymentType === "cash" ||
              initialData.paymentType === "card"
            ) {
              const amount =
                typeof initialData.totalAmount === "string"
                  ? parseFloat(initialData.totalAmount)
                  : initialData.totalAmount || 0;
              setPaymentMethods([
                {
                  type: initialData.paymentType as "cash" | "card",
                  amount: isNaN(amount) ? 0 : amount,
                },
              ]);
            }
          }
        }
        setCurrentStep(1);
      } else {
        setFormData({
          paymentType: "cash",
          items: [],
        });
        setItems([]);
        setPaymentMethods([]);
        setCurrentStep(1);
      }
      setNewProduct({
        productName: "",
        box: 0,
        unit: 0,
        totalUnit: 0,
        unitPrice: 0,
        tax: 0,
        total: 0,
      });
      setTaxPercentage(0);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const calculateItemTotal = (item: MarketPurchaseItem): number => {
    const box =
      typeof item.box === "string" ? parseInt(item.box) : item.box || 0;
    const unit =
      typeof item.unit === "string" ? parseInt(item.unit) : item.unit || 0;
    const unitPrice =
      typeof item.unitPrice === "string"
        ? parseFloat(item.unitPrice)
        : item.unitPrice || 0;
    const tax =
      typeof item.tax === "string" ? parseFloat(item.tax) : item.tax || 0;

    const totalUnits = box * unit;
    const subtotal = unitPrice * totalUnits;
    return subtotal + tax;
  };

  const calculateTotalAmount = (): number => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const updateNewProductCalculations = (
    product: MarketPurchaseItem,
    taxPercent?: number
  ) => {
    const totalUnit = product.box * product.unit;
    const subtotal = product.unitPrice * totalUnit;
    // Calculate tax amount from percentage
    const taxPercentValue =
      taxPercent !== undefined ? taxPercent : taxPercentage;
    const taxAmount = (subtotal * taxPercentValue) / 100;
    const total = subtotal + taxAmount;
    return {
      ...product,
      totalUnit,
      tax: taxAmount,
      total,
    };
  };

  const handleAddProduct = () => {
    if (!newProduct.productName.trim()) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.productNameRequired")
      );
      return;
    }
    if (newProduct.box <= 0) {
      toast.error(t("marketPurchaseManagement.modal.errors.boxRequired"));
      return;
    }
    if (newProduct.unit <= 0) {
      toast.error(t("marketPurchaseManagement.modal.errors.unitRequired"));
      return;
    }
    if (newProduct.unitPrice <= 0) {
      toast.error(t("marketPurchaseManagement.modal.errors.unitPriceRequired"));
      return;
    }

    if (editingIndex !== null) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[editingIndex] = { ...newProduct };
      setItems(updatedItems);
      setEditingIndex(null);
      toast.success(t("marketPurchaseManagement.modal.productUpdated"));
    } else {
      // Add new item
      setItems([...items, { ...newProduct }]);
      toast.success(t("marketPurchaseManagement.modal.productAdded"));
    }

    // Reset form
    setNewProduct({
      productName: "",
      box: 0,
      unit: 0,
      totalUnit: 0,
      unitPrice: 0,
      tax: 0,
      total: 0,
    });
    setTaxPercentage(0);
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    // Ensure all numeric values are numbers, not strings
    const editedProduct: MarketPurchaseItem = {
      ...item,
      box: typeof item.box === "string" ? parseInt(item.box) : item.box || 0,
      unit:
        typeof item.unit === "string" ? parseInt(item.unit) : item.unit || 0,
      totalUnit:
        typeof item.totalUnit === "string"
          ? parseInt(item.totalUnit)
          : item.totalUnit || 0,
      unitPrice:
        typeof item.unitPrice === "string"
          ? parseFloat(item.unitPrice)
          : item.unitPrice || 0,
      tax: typeof item.tax === "string" ? parseFloat(item.tax) : item.tax || 0,
      total:
        typeof item.total === "string"
          ? parseFloat(item.total)
          : item.total || 0,
    };
    setNewProduct(editedProduct);
    const subtotal = editedProduct.unitPrice * editedProduct.totalUnit;
    const taxPercent = subtotal > 0 ? (editedProduct.tax / subtotal) * 100 : 0;
    setTaxPercentage(taxPercent);
    setEditingIndex(index);
    setTimeout(() => {
      document
        .querySelector(".bg-gray-50.p-6.rounded-lg")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCancelEdit = () => {
    setNewProduct({
      productName: "",
      box: 0,
      unit: 0,
      totalUnit: 0,
      unitPrice: 0,
      tax: 0,
      total: 0,
    });
    setTaxPercentage(0);
    setEditingIndex(null);
  };

  const handleRemoveItem = async (index: number) => {
    const ok = await confirm({
      title: t("marketPurchaseManagement.modal.deleteProductTitle"),
      message: t("marketPurchaseManagement.modal.confirmDeleteProduct"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!ok) return;

    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleAddPayment = () => {
    if (currentPaymentAmount <= 0) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.pleaseEnterValidAmount")
      );
      return;
    }

    const totalAmount = calculateTotalAmount();
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );
    const remainingAmount = totalAmount - totalPaid;
    const actualAmount = Math.min(currentPaymentAmount, remainingAmount);

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === selectedPaymentType
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += actualAmount;
      setPaymentMethods(updatedMethods);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        {
          type: selectedPaymentType,
          amount: actualAmount,
        },
      ]);
    }

    setCurrentPaymentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const validateStep1 = (): boolean => {
    if (!formData.supplierId) {
      toast.error(t("marketPurchaseManagement.modal.errors.supplierRequired"));
      return false;
    }
    if (!formData.expenseTypeId) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.expenseTypeRequired")
      );
      return false;
    }
    if (!formData.ticketDate) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.ticketDateRequired")
      );
      return false;
    }
    if (!formData.ticketNumber || !formData.ticketNumber.trim()) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.ticketNumberRequired")
      );
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (items.length === 0) {
      toast.error(t("marketPurchaseManagement.modal.errors.itemsRequired"));
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const totalAmount = calculateTotalAmount();
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    if (paymentMethods.length === 0) {
      toast.error(t("marketPurchaseManagement.modal.errors.paymentRequired"));
      return false;
    }

    if (totalPaid < totalAmount) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.paymentIncomplete", {
          remaining: (totalAmount - totalPaid).toFixed(2),
        })
      );
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep3()) {
      return;
    }

    const totalAmount = calculateTotalAmount();
    const paymentTypeString = paymentMethods
      .map((method) => `${method.type}:${method.amount}`)
      .join(", ");

    const purchaseData: MarketPurchase = {
      ...formData,
      supplierId: formData.supplierId!,
      expenseTypeId: formData.expenseTypeId!,
      ticketDate: formData.ticketDate!,
      ticketNumber: formData.ticketNumber!,
      paymentType: paymentTypeString,
      totalAmount: Number(totalAmount),
      items: items.map((item) => ({
        ...item,
        totalUnit: item.box * item.unit,
        total: calculateItemTotal(item),
      })),
    } as MarketPurchase;

    const success = await onSubmit(purchaseData);
    if (success) {
      onClose();
      setItems([]);
      setFormData({ paymentType: "cash", items: [] });
      setPaymentMethods([]);
      setCurrentStep(1);
      setNewProduct({
        productName: "",
        box: 0,
        unit: 0,
        totalUnit: 0,
        unitPrice: 0,
        tax: 0,
        total: 0,
      });
      setTaxPercentage(0);
      setCurrentPaymentAmount(0);
    }
  };

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const expenseTypeOptions = expenseTypes.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const totalAmount = calculateTotalAmount();
  const totalPaid = paymentMethods.reduce((sum, method) => {
    const amount =
      typeof method.amount === "string"
        ? parseFloat(method.amount)
        : method.amount || 0;
    return sum + amount;
  }, 0);
  const remainingAmount =
    (typeof totalAmount === "string"
      ? parseFloat(totalAmount)
      : totalAmount || 0) - totalPaid;

  const renderStep1 = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {t("marketPurchaseManagement.modal.step1.title")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomSelect
          label={t("marketPurchaseManagement.modal.supplier")}
          options={supplierOptions}
          value={formData.supplierId || ""}
          onChange={(val) => setFormData({ ...formData, supplierId: val })}
        />
        <DatePicker
          label={t("marketPurchaseManagement.modal.ticketDate")}
          value={formData.ticketDate || ""}
          onChange={(date) =>
            setFormData({ ...formData, ticketDate: date || "" })
          }
          placeholder={t("marketPurchaseManagement.modal.ticketDate")}
        />
        <CustomSelect
          label={t("marketPurchaseManagement.modal.expenseType")}
          options={expenseTypeOptions}
          value={formData.expenseTypeId || ""}
          onChange={(val) => setFormData({ ...formData, expenseTypeId: val })}
        />
        <CustomInput
          label={t("marketPurchaseManagement.modal.ticketNumber")}
          name="ticketNumber"
          type="text"
          value={formData.ticketNumber || ""}
          onChange={(e) =>
            setFormData({ ...formData, ticketNumber: e.target.value })
          }
        />
      </div>
    </div>
  );

  const calculateSummary = () => {
    let totalBase = 0;
    let total = 0;
    const taxGroups: { [key: string]: number } = {};

    items.forEach((item) => {
      const unitPrice =
        typeof item.unitPrice === "string"
          ? parseFloat(item.unitPrice)
          : item.unitPrice || 0;
      const totalUnit =
        typeof item.totalUnit === "string"
          ? parseInt(item.totalUnit)
          : item.totalUnit || 0;
      const tax =
        typeof item.tax === "string" ? parseFloat(item.tax) : item.tax || 0;
      const itemTotal =
        typeof item.total === "string"
          ? parseFloat(item.total)
          : item.total || 0;

      const subtotal = unitPrice * totalUnit;
      totalBase += subtotal;
      total += itemTotal;

      if (tax > 0 && subtotal > 0) {
        const taxPercent = ((tax / subtotal) * 100).toFixed(1);
        if (!taxGroups[taxPercent]) {
          taxGroups[taxPercent] = 0;
        }
        taxGroups[taxPercent] += tax;
      }
    });

    return { totalBase, total, taxGroups };
  };

  const renderStep2 = () => {
    const { totalBase, total, taxGroups } = calculateSummary();

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {t("marketPurchaseManagement.modal.step2.title")}
        </h3>

        {/* Product Form - Top */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">
            {t("marketPurchaseManagement.modal.step2.addProduct")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CustomInput
              label={t("marketPurchaseManagement.modal.product")}
              name="productName"
              type="text"
              value={newProduct.productName}
              onChange={(e) =>
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    productName: e.target.value,
                  })
                )
              }
              placeholder={t("marketPurchaseManagement.modal.enterProductName")}
            />
            <CustomInput
              label={t("marketPurchaseManagement.modal.box")}
              name="box"
              type="number"
              value={newProduct.box.toString()}
              onChange={(e) =>
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    box: parseInt(e.target.value) || 0,
                  })
                )
              }
              min="0"
            />
            <CustomInput
              label={t("marketPurchaseManagement.modal.unit")}
              name="unit"
              type="number"
              value={newProduct.unit.toString()}
              onChange={(e) =>
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    unit: parseInt(e.target.value) || 0,
                  })
                )
              }
              min="0"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("marketPurchaseManagement.modal.totalUnit")}
              </label>
              <div className="px-3 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-900">
                {newProduct.totalUnit}
              </div>
            </div>
            <CustomInput
              label={t("marketPurchaseManagement.modal.unitPrice")}
              name="unitPrice"
              type="number"
              step="0.01"
              value={newProduct.unitPrice.toString()}
              onChange={(e) =>
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    unitPrice: parseFloat(e.target.value) || 0,
                  })
                )
              }
              min="0"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("marketPurchaseManagement.modal.tax")} (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxPercentage.toString()}
                onChange={(e) => {
                  const percent = parseFloat(e.target.value) || 0;
                  setTaxPercentage(percent);
                  setNewProduct(
                    updateNewProductCalculations(newProduct, percent)
                  );
                }}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("marketPurchaseManagement.modal.total")}
              </label>
              <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-900">
                €{newProduct.total.toFixed(2)}
              </div>
            </div>
            <div className="flex items-end gap-2">
              {editingIndex !== null && (
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  label={t("common.cancel")}
                  className="flex-1"
                />
              )}
              <CustomButton
                type="button"
                onClick={handleAddProduct}
                label={
                  editingIndex !== null
                    ? t("common.update")
                    : t("marketPurchaseManagement.modal.addProduct")
                }
                Icon={<AddIcon className="size-5" />}
                className={editingIndex !== null ? "flex-1" : "w-full"}
              />
            </div>
          </div>
        </div>

        {/* Products Table - Bottom */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-700">
              {t("marketPurchaseManagement.modal.step2.productsList")} (
              {items.length})
            </h4>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.product")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.box")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.unit")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.totalUnit")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.unitPrice")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.tax")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {t("marketPurchaseManagement.modal.total")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-20">
                    {t("marketPurchaseManagement.modal.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {t("marketPurchaseManagement.modal.noProducts")}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.box}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.totalUnit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        €
                        {(typeof item.unitPrice === "string"
                          ? parseFloat(item.unitPrice)
                          : item.unitPrice || 0
                        ).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(() => {
                          const unitPriceNum =
                            typeof item.unitPrice === "string"
                              ? parseFloat(item.unitPrice)
                              : item.unitPrice || 0;
                          const taxNum =
                            typeof item.tax === "string"
                              ? parseFloat(item.tax)
                              : item.tax || 0;
                          const subtotal = unitPriceNum * item.totalUnit;
                          const taxPercent =
                            subtotal > 0 ? (taxNum / subtotal) * 100 : 0;
                          return taxNum > 0
                            ? `€${taxNum.toFixed(2)} (${taxPercent.toFixed(1)}%)`
                            : "-";
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        €
                        {(typeof item.total === "string"
                          ? parseFloat(item.total)
                          : item.total || 0
                        ).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditItem(index)}
                            disabled={
                              editingIndex !== null && editingIndex !== index
                            }
                            className={`p-2 rounded-full ${
                              editingIndex !== null && editingIndex !== index
                                ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                : "hover:bg-blue-100 text-blue-600"
                            }`}
                            title={
                              editingIndex !== null && editingIndex !== index
                                ? t(
                                    "marketPurchaseManagement.modal.finishEditingFirst"
                                  )
                                : t("common.edit")
                            }
                          >
                            <EditIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={editingIndex !== null}
                            className={`p-2 rounded-full ${
                              editingIndex !== null
                                ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                : "hover:bg-red-100 text-red-600"
                            }`}
                            title={
                              editingIndex !== null
                                ? t(
                                    "marketPurchaseManagement.modal.finishEditingFirst"
                                  )
                                : t("common.delete")
                            }
                          >
                            <DeleteIcon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          {items.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-base font-semibold">
                  <span className="text-gray-700 uppercase">
                    {t("marketPurchaseManagement.modal.step2.totalBase")}
                  </span>
                  <span className="text-gray-900">
                    {(typeof totalBase === "string"
                      ? parseFloat(totalBase)
                      : totalBase || 0
                    )
                      .toFixed(2)
                      .replace(".", ",")}
                    €
                  </span>
                </div>
                {Object.entries(taxGroups)
                  .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                  .map(([percent, amount]) => (
                    <div
                      key={percent}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-600 uppercase">
                        {t("marketPurchaseManagement.modal.step2.tax")}{" "}
                        {percent}%
                      </span>
                      <span className="text-gray-900 font-medium">
                        {(typeof amount === "string"
                          ? parseFloat(amount)
                          : amount || 0
                        )
                          .toFixed(2)
                          .replace(".", ",")}
                        €
                      </span>
                    </div>
                  ))}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900 uppercase">
                      {t("marketPurchaseManagement.modal.step2.total")} =
                    </span>
                    <span className="text-gray-900">
                      {(typeof total === "string"
                        ? parseFloat(total)
                        : total || 0
                      )
                        .toFixed(2)
                        .replace(".", ",")}
                      €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {t("marketPurchaseManagement.modal.step3.title")}
      </h3>

      {/* Total Amount Display */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">
            {t("marketPurchaseManagement.modal.totalAmount")}:
          </span>
          <span className="text-2xl font-bold text-gray-900">
            €
            {(typeof totalAmount === "string"
              ? parseFloat(totalAmount)
              : totalAmount || 0
            ).toFixed(2)}
          </span>
        </div>
        {totalPaid > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {t("marketPurchaseManagement.modal.step3.totalPaid")}:
            </span>
            <span className="text-lg font-semibold text-green-600">
              €
              {(typeof totalPaid === "string"
                ? parseFloat(totalPaid)
                : totalPaid || 0
              ).toFixed(2)}
            </span>
          </div>
        )}
        {remainingAmount > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {t("marketPurchaseManagement.modal.step3.remaining")}:
            </span>
            <span className="text-lg font-semibold text-red-600">
              €
              {(typeof remainingAmount === "string"
                ? parseFloat(remainingAmount)
                : remainingAmount || 0
              ).toFixed(2)}
            </span>
          </div>
        )}
        {totalPaid >
          (typeof totalAmount === "string"
            ? parseFloat(totalAmount)
            : totalAmount || 0) && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {t("marketPurchaseManagement.modal.step3.change")}:
            </span>
            <span className="text-lg font-semibold text-blue-600">
              €
              {(
                totalPaid -
                (typeof totalAmount === "string"
                  ? parseFloat(totalAmount)
                  : totalAmount || 0)
              ).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("marketPurchaseManagement.modal.step3.selectPaymentMethod")}
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSelectedPaymentType("cash")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "cash"
                ? "border-green-400 bg-green-50 text-green-800"
                : "border-gray-200 hover:border-green-300"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">💵</span>
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.cash")}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaymentType("card")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "card"
                ? "border-blue-400 bg-blue-50 text-blue-800"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">💳</span>
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.card")}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <CustomInput
          label={t("marketPurchaseManagement.modal.step3.amount")}
          name="paymentAmount"
          type="number"
          step="0.01"
          value={currentPaymentAmount.toString()}
          onChange={(e) =>
            setCurrentPaymentAmount(parseFloat(e.target.value) || 0)
          }
          placeholder="0.00"
          min="0"
        />
        <CustomButton
          type="button"
          onClick={handleAddPayment}
          label={t("marketPurchaseManagement.modal.step3.addPayment")}
          className="w-full"
        />
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">
            {t("marketPurchaseManagement.modal.step3.addedPayments")}
          </h4>
          <div className="space-y-2">
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {method.type === "cash" ? "💵" : "💳"}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {method.type}
                    </div>
                    <div className="text-sm text-gray-600">
                      €{method.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePayment(index)}
                  className="p-2 hover:bg-red-100 rounded-full text-red-600"
                  title={t("common.delete")}
                >
                  <DeleteIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${
          currentStep === 1
            ? "max-w-2xl"
            : currentStep === 2
              ? "max-w-6xl"
              : "max-w-xl"
        }`}
      >
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">
              {initialData
                ? t("marketPurchaseManagement.modal.editTitle")
                : t("marketPurchaseManagement.modal.addTitle")}
            </h2>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === step
                      ? "bg-white w-8"
                      : currentStep > step
                        ? "bg-gray-400 w-6"
                        : "bg-gray-600 w-6"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <CrossIcon className="size-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 pt-4 px-8 pb-8 border-t border-gray-200 flex-shrink-0">
          <div>
            {currentStep > 1 && (
              <CustomButton
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                label={t("marketPurchaseManagement.modal.previous")}
                Icon={<ChevronLeftIcon className="size-5" />}
                disabled={editingIndex !== null}
              />
            )}
          </div>
          <div className="flex gap-4">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={t("common.cancel")}
              disabled={editingIndex !== null}
            />
            {currentStep < 3 ? (
              <CustomButton
                type="button"
                onClick={handleNext}
                label={
                  <span className="flex items-center gap-2">
                    {t("marketPurchaseManagement.modal.next")}
                    <ChevronRightIcon className="size-5" />
                  </span>
                }
                disabled={editingIndex !== null}
              />
            ) : (
              <CustomButton
                type="button"
                onClick={handleFinalSubmit}
                label={
                  initialData
                    ? t("common.update")
                    : t("marketPurchaseManagement.modal.complete")
                }
                disabled={editingIndex !== null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
