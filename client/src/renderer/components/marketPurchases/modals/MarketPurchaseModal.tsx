import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { MarketPurchase, MarketPurchaseItem } from "@/types/marketPurchases";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/DatePicker";
import { useConfirm } from "../../../hooks/useConfirm";
import {
  CrossIcon,
  AddIcon,
  DeleteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
} from "../../../public/Svg";
import { PaymentStep, PaymentMethod } from "../../shared/PaymentStep";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MarketPurchase) => Promise<boolean>;
  initialData?: MarketPurchase | null;
  suppliers: any[];
  expenseTypes: any[];
  inventoryProducts: any[];
  token?: string | null;
}

export const MarketPurchaseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  suppliers,
  expenseTypes,
  inventoryProducts,
  token,
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
  const [filteredInventoryProducts, setFilteredInventoryProducts] = useState<
    any[]
  >([]);

  // Form state for adding new product
  const [newProduct, setNewProduct] = useState<MarketPurchaseItem>({
    productName: "",
    box: 0,
    unit: 0,
    totalUnit: 0,
    unitPrice: 0,
    tax: 0,
    total: 0,
    expenseTypeId: "",
    isTaxIncluded: false,
  });
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [boxRaw, setBoxRaw] = useState<string>("");
  const [unitRaw, setUnitRaw] = useState<string>("");
  const [unitPriceRaw, setUnitPriceRaw] = useState<string>("");
  const [taxPercentageRaw, setTaxPercentageRaw] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (newProduct.expenseTypeId) {
      fetchFilteredProducts(newProduct.expenseTypeId);
    } else {
      setFilteredInventoryProducts([]);
    }
  }, [newProduct.expenseTypeId]);

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
                    type: type.trim() as
                      | "cash"
                      | "card"
                      | "bizum"
                      | "bank-transfer"
                      | "account-direct-debit",
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
              initialData.paymentType === "card" ||
              initialData.paymentType === "bizum" ||
              initialData.paymentType === "bank-transfer" ||
              initialData.paymentType === "account-direct-debit"
            ) {
              const amount =
                typeof initialData.totalAmount === "string"
                  ? parseFloat(initialData.totalAmount)
                  : initialData.totalAmount || 0;
              setPaymentMethods([
                {
                  type: initialData.paymentType as
                    | "cash"
                    | "card"
                    | "bizum"
                    | "bank-transfer"
                    | "account-direct-debit",
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
        expenseTypeId: "",
        isTaxIncluded: false,
      });
      setTaxPercentage(0);
      setBoxRaw("");
      setUnitRaw("");
      setUnitPriceRaw("");
      setTaxPercentageRaw("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const calculateItemTotal = (item: MarketPurchaseItem): number => {
    const box =
      typeof item.box === "string" ? parseFloat(item.box) : item.box || 0;
    const unit =
      typeof item.unit === "string" ? parseFloat(item.unit) : item.unit || 0;
    const unitPrice =
      typeof item.unitPrice === "string"
        ? parseFloat(item.unitPrice)
        : item.unitPrice || 0;
    const tax =
      typeof item.tax === "string" ? parseFloat(item.tax) : item.tax || 0;

    const totalUnits = box * unit;
    const subtotal = unitPrice * totalUnits;
    return item.isTaxIncluded ? subtotal : subtotal + tax;
  };

  const calculateTotalAmount = (): number => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const updateNewProductCalculations = (
    product: MarketPurchaseItem,
    taxPercent?: number
  ) => {
    const totalUnit = product.box * product.unit;
    const currentTaxPercent =
      taxPercent !== undefined ? taxPercent : taxPercentage;
    const taxRate = currentTaxPercent / 100;
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    if (product.isTaxIncluded) {
      total = product.unitPrice * totalUnit;

      const baseTotal = total / (1 + taxRate);
      taxAmount = total - baseTotal;
      subtotal = baseTotal;
    } else {
      subtotal = product.unitPrice * totalUnit;
      taxAmount = subtotal * taxRate;
      total = subtotal + taxAmount;
    }
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
    if (!newProduct.expenseTypeId) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.expenseTypeRequired")
      );
      return;
    }
    let itemToSave = { ...newProduct };
    const expenseType = expenseTypes.find(
      (e) => e.id === newProduct.expenseTypeId
    );
    itemToSave.expenseTypeName = expenseType?.name;
    if (editingIndex !== null) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[editingIndex] = { ...itemToSave };
      setItems(updatedItems);
      setEditingIndex(null);
      toast.success(t("marketPurchaseManagement.modal.productUpdated"));
    } else {
      // Add new item
      setItems([...items, { ...itemToSave }]);
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
      expenseTypeId: "",
      isTaxIncluded: false,
    });
    setTaxPercentage(0);
    setBoxRaw("");
    setUnitRaw("");
    setUnitPriceRaw("");
    setTaxPercentageRaw("");
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    const boxNum =
      typeof item.box === "string" ? parseFloat(item.box) : item.box || 0;
    const unitNum =
      typeof item.unit === "string" ? parseFloat(item.unit) : item.unit || 0;
    const totalUnit = boxNum * unitNum;
    const unitPriceNum =
      typeof item.unitPrice === "string"
        ? parseFloat(item.unitPrice)
        : item.unitPrice || 0;
    const taxAmount =
      typeof item.tax === "string" ? parseFloat(item.tax) : item.tax || 0;
    const totalAmount =
      typeof item.total === "string" ? parseFloat(item.total) : item.total || 0;

    const subtotal = unitPriceNum * totalUnit;
    let taxPercent = 0;
    if (item.isTaxIncluded) {
      const netSubtotal = subtotal - taxAmount;
      if (netSubtotal > 0) {
        taxPercent = (taxAmount / netSubtotal) * 100;
      }
    } else {
      if (subtotal > 0) {
        taxPercent = (taxAmount / subtotal) * 100;
      }
    }

    const roundedTaxPercent = Number(taxPercent.toFixed(2));

    // Calculate tax percent based on stored values
    // Ensure all numeric values are numbers, not strings
    const editedProduct: MarketPurchaseItem = {
      ...item,
      box: boxNum,
      unit: unitNum,
      totalUnit,
      unitPrice: unitPriceNum,
      tax: taxAmount,
      total: totalAmount,
      expenseTypeId: item.expenseTypeId,
      isTaxIncluded: item.isTaxIncluded || false,
    };
    setNewProduct(editedProduct);
    setTaxPercentage(roundedTaxPercent);
    setBoxRaw(editedProduct.box.toString());
    setUnitRaw(editedProduct.unit.toString());
    setUnitPriceRaw(unitPriceNum.toString());
    setTaxPercentageRaw(roundedTaxPercent.toString());
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
      expenseTypeId: "",
      isTaxIncluded: false,
    });
    setTaxPercentage(0);
    setBoxRaw("");
    setUnitRaw("");
    setUnitPriceRaw("");
    setTaxPercentageRaw("");
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

  const validateStep1 = (): boolean => {
    if (!formData.supplierId) {
      toast.error(t("marketPurchaseManagement.modal.errors.supplierRequired"));
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
    const paymentTypeString =
      paymentMethods.length > 0
        ? paymentMethods
          .map((method) => `${method.type}:${method.amount}`)
          .join(", ")
        : "";

    const purchaseData: MarketPurchase = {
      ...formData,
      supplierId: formData.supplierId!,
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
      setBoxRaw("");
      setUnitRaw("");
      setUnitPriceRaw("");
      setTaxPercentageRaw("");
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

  // Function to fetch filtered products by expense type
  const fetchFilteredProducts = async (expenseTypeId: string) => {
    if (!expenseTypeId || !token) {
      setFilteredInventoryProducts([]);
      return;
    }

    try {
      const res = await (
        window as any
      ).electronAPI.getInventoryProductsByExpenseType(token, expenseTypeId);
      if (res.status) {
        setFilteredInventoryProducts(res.data || []);
      } else {
        setFilteredInventoryProducts([]);
      }
    } catch (error) {
      console.error("Error fetching filtered products:", error);
      setFilteredInventoryProducts([]);
    }
  };

  const inventoryProductOptions = filteredInventoryProducts.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const totalAmount = calculateTotalAmount();

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
          showSearch={true}
        />
        <DatePicker
          label={t("marketPurchaseManagement.modal.ticketDate")}
          value={formData.ticketDate || ""}
          onChange={(date) =>
            setFormData({ ...formData, ticketDate: date || "" })
          }
          placeholder={t("marketPurchaseManagement.modal.ticketDate")}
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
          ? parseFloat(item.totalUnit)
          : item.totalUnit || 0;
      const tax =
        typeof item.tax === "string" ? parseFloat(item.tax) : item.tax || 0;
      const itemTotal =
        typeof item.total === "string"
          ? parseFloat(item.total)
          : item.total || 0;

      const subtotal = unitPrice * totalUnit;
      const netSubtotal = item.isTaxIncluded ? subtotal - tax : subtotal;
      totalBase += netSubtotal;
      total += itemTotal;

      if (tax > 0 && netSubtotal > 0) {
        const taxPercent = ((tax / netSubtotal) * 100).toFixed(1);
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
            <CustomSelect
              label={t("marketPurchaseManagement.modal.expenseType")}
              options={expenseTypeOptions}
              value={newProduct.expenseTypeId || ""}
              onChange={(val) =>
                setNewProduct({
                  ...newProduct,
                  expenseTypeId: val,
                  productName: "",
                })
              }
              showSearch={true}
              placeholder={t(
                "marketPurchaseManagement.modal.selectExpenseType"
              )}
            />
            <CustomSelect
              label={t("marketPurchaseManagement.modal.product")}
              options={inventoryProductOptions}
              value={
                filteredInventoryProducts.find(
                  (p) => p.name === newProduct.productName
                )?.id || ""
              }
              onChange={(val) => {
                const selectedProduct = filteredInventoryProducts.find(
                  (p) => p.id === val
                );
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    productName: selectedProduct?.name || "",
                  })
                );
              }}
              showSearch={true}
              disabled={!newProduct.expenseTypeId}
              placeholder={
                !newProduct.expenseTypeId
                  ? t("marketPurchaseManagement.modal.selectExpenseTypeFirst")
                  : t("marketPurchaseManagement.modal.selectProduct")
              }
            />
            <CustomInput
              label={t("marketPurchaseManagement.modal.box")}
              name="box"
              type="number"
              value={boxRaw}
              onChange={(e) => {
                const val = e.target.value;
                setBoxRaw(val);
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    box: parseFloat(val) || 0,
                  })
                );
              }}
              min="0"
            />
            <CustomInput
              label={t("marketPurchaseManagement.modal.unit")}
              name="unit"
              type="number"
              value={unitRaw}
              onChange={(e) => {
                const val = e.target.value;
                setUnitRaw(val);
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    unit: parseFloat(val) || 0,
                  })
                );
              }}
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
            <div className="flex flex-col justify-center">
              <label className="flex items-center space-x-2 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={newProduct.isTaxIncluded}
                  onChange={(e) =>
                    setNewProduct(
                      updateNewProductCalculations({
                        ...newProduct,
                        isTaxIncluded: e.target.checked,
                      })
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tax Included
                </span>
              </label>
            </div>
            <CustomInput
              label={t("marketPurchaseManagement.modal.unitPrice")}
              name="unitPrice"
              type="number"
              step="0.01"
              value={unitPriceRaw}
              onChange={(e) => {
                const val = e.target.value;
                setUnitPriceRaw(val);
                setNewProduct(
                  updateNewProductCalculations({
                    ...newProduct,
                    unitPrice: parseFloat(val) || 0,
                  })
                );
              }}
              min="0"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("marketPurchaseManagement.modal.tax")} (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxPercentageRaw}
                onChange={(e) => {
                  const val = e.target.value;
                  setTaxPercentageRaw(val);
                  const percent = parseFloat(val) || 0;
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
                    {t("marketPurchaseManagement.modal.expenseType")}
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
                        {item.isTaxIncluded && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Tax Inc.
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.expenseTypeName ||
                          expenseTypes.find((e) => e.id === item.expenseTypeId)
                            ?.name ||
                          "-"}
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
                          const taxPercent = item.isTaxIncluded
                            ? (subtotal - taxNum) > 0
                              ? (taxNum / (subtotal - taxNum)) * 100
                              : 0
                            : subtotal > 0
                              ? (taxNum / subtotal) * 100
                              : 0;
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
                            className={`p-2 rounded-full ${editingIndex !== null && editingIndex !== index
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
                            className={`p-2 rounded-full ${editingIndex !== null
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

  const renderStep3 = () => {
    const total =
      typeof totalAmount === "string"
        ? parseFloat(totalAmount)
        : totalAmount || 0;
    return (
      <PaymentStep
        totalAmount={total}
        paymentMethods={paymentMethods}
        onPaymentMethodsChange={setPaymentMethods}
        initialPaymentType={initialData?.paymentType}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${currentStep === 1
          ? "max-w-2xl"
          : currentStep === 2
            ? "max-w-6xl"
            : "max-w-xl"
          }`}
      >
        <div className="bg-linear-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex justify-between items-center shrink-0">
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
                  className={`h-2 rounded-full transition-all ${currentStep === step
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
        <div className="flex justify-between gap-4 pt-4 px-8 pb-8 border-t border-gray-200 shrink-0">
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
