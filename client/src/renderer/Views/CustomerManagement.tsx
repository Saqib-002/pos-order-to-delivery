import { useState, useEffect } from "react";
import { Customer } from "@/types/order";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  AddIcon,
  CrossIcon,
  DeleteIcon,
  EditIcon,
  SearchIcon,
  GroupIcon,
} from "../public/Svg";
import CustomButton from "../components/ui/CustomButton";
import { StatsCard } from "../components/shared/StatsCard.order";
import CustomInput from "../components/shared/CustomInput";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../hooks/useConfirm";
import { formatAddress } from "../utils/utils";
import * as XLSX from "xlsx";
import CustomerModal from "../components/order/modals/CustomerModal";

export const CustomerManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    auth: { token },
  } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await (window as any).electronAPI.getAllCustomers(token);
      if (!res.status) {
        toast.error(res.error || t("customerManagement.messages.fetchFailed"));
        return;
      }
      setCustomers(res.data);
    } catch (error) {
      toast.error(t("customerManagement.messages.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const ok = await confirm({
      title: t("customerManagement.deleteConfirmTitle"),
      message: t("customerManagement.deleteConfirmMessage"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await (window as any).electronAPI.deleteCustomer(
        token,
        customerId
      );
      if (!res.status) {
        toast.error(res.error || t("customerManagement.messages.deleteFailed"));
        return;
      }
      setCustomers(customers.filter((c) => c.id !== customerId));
      toast.success(t("customerManagement.messages.deleted"));
    } catch (error) {
      toast.error(t("customerManagement.messages.deleteFailed"));
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setModalMode("edit");
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleBulkImport = async (file: File) => {
    setBulkImportLoading(true);
    setImportResults(null);

    try {
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      if (jsonData.length === 0) {
        toast.error(t("customerManagement.bulkImport.noData"));
        setBulkImportLoading(false);
        return;
      }

      const errors: string[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2;

        try {
          const address = String(row["Address"] || row["address"] || "").trim();
          const postalCode = String(
            row["Postal Code"] ||
              row["PostalCode"] ||
              row["postal code"] ||
              row["postalCode"] ||
              ""
          ).trim();
          const city = String(row["City"] || row["city"] || "").trim();
          const province = String(
            row["Province"] ||
              row["State"] ||
              row["province"] ||
              row["state"] ||
              ""
          ).trim();

          const customerData = {
            name: String(row["Name"] || row["name"] || "").trim(),
            phone: String(row["Phone"] || row["phone"] || "").trim(),
            address: address,
            postalCode: postalCode,
            city: city,
            province: province,
            email:
              String(row["Email"] || row["email"] || "").trim() || undefined,
            cif: String(row["CIF"] || row["cif"] || "").trim() || undefined,
            comments:
              String(row["Comments"] || row["comments"] || "").trim() ||
              undefined,
          };

          if (!customerData.name) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.nameRequired")}`
            );
            failedCount++;
            continue;
          }

          if (!customerData.phone) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.phoneRequired")}`
            );
            failedCount++;
            continue;
          }

          const phoneRegex = /^[0-9]+$/;
          if (!phoneRegex.test(customerData.phone)) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.phoneInvalid")}`
            );
            failedCount++;
            continue;
          }

          if (!customerData.address) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.addressRequired")}`
            );
            failedCount++;
            continue;
          }

          if (!customerData.postalCode) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.postalCodeRequired")}`
            );
            failedCount++;
            continue;
          }

          if (!customerData.city) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.cityRequired")}`
            );
            failedCount++;
            continue;
          }

          if (!customerData.province) {
            errors.push(
              `Row ${rowNumber}: ${t("customerManagement.validation.provinceRequired")}`
            );
            failedCount++;
            continue;
          }

          // Combine address fields into pipe-separated format
          const addressString = `address=${customerData.address}|postal=${customerData.postalCode}|city=${customerData.city}|province=${customerData.province}`;

          const customerPayload = {
            name: customerData.name,
            phone: customerData.phone,
            address: addressString,
            email: customerData.email || "",
            cif: customerData.cif || "",
            comments: customerData.comments || "",
          };

          // Check if customer exists by phone number
          const existingCustomerRes = await (
            window as any
          ).electronAPI.getCustomerByPhone(token, customerData.phone);

          let res;
          if (existingCustomerRes.status && existingCustomerRes.data) {
            // Update existing customer
            res = await (window as any).electronAPI.updateCustomerById(
              token,
              existingCustomerRes.data.id,
              customerPayload
            );
          } else {
            // Create new customer
            res = await (window as any).electronAPI.createCustomer(
              token,
              customerPayload
            );
          }

          if (!res.status) {
            // Parse error message to be user-friendly
            let errorMessage = res.error;
            if (
              res.error.includes("UNIQUE constraint") ||
              res.error.includes("duplicate key")
            ) {
              errorMessage = t("customerManagement.messages.phoneTaken");
            } else if (res.error.includes("violates unique constraint")) {
              errorMessage = t("customerManagement.messages.phoneTaken");
            } else if (
              res.error.includes("insert into") ||
              res.error.includes("values")
            ) {
              // Hide SQL errors, show generic error
              errorMessage = t("customerManagement.bulkImport.databaseError");
            }
            errors.push(
              `Row ${rowNumber}: ${errorMessage} (${customerData.phone})`
            );
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          // Parse error message to be user-friendly
          let errorMessage = (error as Error).message;
          if (
            errorMessage.includes("UNIQUE constraint") ||
            errorMessage.includes("duplicate key")
          ) {
            errorMessage = t("customerManagement.messages.phoneTaken");
          } else if (
            errorMessage.includes("insert into") ||
            errorMessage.includes("values")
          ) {
            errorMessage = t("customerManagement.bulkImport.databaseError");
          }
          errors.push(`Row ${rowNumber}: ${errorMessage}`);
          failedCount++;
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 50),
      });

      if (successCount > 0) {
        await fetchCustomers();
      }

      if (successCount > 0 && failedCount === 0) {
        toast.success(
          t("customerManagement.bulkImport.success", {
            count: successCount,
          })
        );
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(
          t("customerManagement.bulkImport.partialSuccess", {
            success: successCount,
            failed: failedCount,
          })
        );
      } else if (failedCount > 0) {
        toast.error(
          t("customerManagement.bulkImport.failed", {
            count: failedCount,
          })
        );
      }
    } catch (error) {
      toast.error(t("customerManagement.bulkImport.parseError"));
      console.error("Bulk import error:", error);
    } finally {
      setBulkImportLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith(".xlsx")
      ) {
        handleBulkImport(file);
      } else {
        toast.error(t("customerManagement.bulkImport.invalidFile"));
      }
    }
    // Reset input
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Name: "John Doe",
        Phone: "123456789",
        Address: "123 Main Street",
        "Postal Code": "28001",
        City: "Madrid",
        Province: "Madrid",
        Email: "john@example.com",
        CIF: "",
        Comments: "Regular customer",
      },
      {
        Name: "Jane Smith",
        Phone: "987654321",
        Address: "456 Oak Avenue",
        "Postal Code": "08001",
        City: "Barcelona",
        Province: "Barcelona",
        Email: "jane@example.com",
        CIF: "B12345678",
        Comments: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    const fileName = `customer_import_template_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black">
              {t("customerManagement.title")}
            </h2>
            <p className="text-gray-600 mt-1">
              {t("customerManagement.subtitle")}
            </p>
          </div>
          <div className="flex gap-3">
            <CustomButton
              onClick={() => setIsBulkImportModalOpen(true)}
              type="button"
              label={t("customerManagement.bulkImport.buttonLabel")}
              variant="secondary"
              className="whitespace-nowrap"
            />
            <CustomButton
              onClick={openAddModal}
              type="button"
              label={t("customerManagement.addCustomer")}
              Icon={<AddIcon className="size-5" />}
              className="whitespace-nowrap"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title={t("customerManagement.totalCustomers")}
            value={customers.length}
            icon={<GroupIcon className="size-6 text-black" />}
            bgColor="bg-gray-100"
          />
          <StatsCard
            title={t("customerManagement.withEmail")}
            value={customers.filter((c) => c.email && c.email.trim()).length}
            icon={<GroupIcon className="size-6 text-blue-600" />}
            bgColor="bg-blue-100"
          />
          <StatsCard
            title={t("customerManagement.withAddress")}
            value={
              customers.filter((c) => c.address && c.address.trim()).length
            }
            icon={<GroupIcon className="size-6 text-green-600" />}
            bgColor="bg-green-100"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <CustomInput
            placeholder={t("customerManagement.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type="text"
            name="search"
            preLabel={<SearchIcon className="size-5 text-gray-400" />}
            inputClasses="pl-9 !shadow-none focus:!ring-1 text-sm"
            otherClasses="flex-1"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black">
              {t("customerManagement.table.customers")} (
              {filteredCustomers.length})
            </h3>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <GroupIcon className="size-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-black">
                {t("customerManagement.noCustomersTitle")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {customers.length === 0
                  ? t("customerManagement.noCustomersFirst")
                  : t("customerManagement.noCustomersTry")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("customerManagement.table.name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("customerManagement.table.phone")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("customerManagement.table.email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("customerManagement.table.address")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("customerManagement.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-black">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-black">
                              {customer.name}
                            </div>
                            {customer.cif && (
                              <div className="text-sm text-gray-500">
                                CIF: {customer.cif}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {customer.email ||
                            t("customerManagement.noEmail", "No email")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black max-w-xs truncate">
                          {customer.address && customer.address.trim()
                            ? customer.address.includes("|")
                              ? formatAddress(customer.address)
                              : customer.address
                            : t("customerManagement.noAddress", "No address")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
                        <CustomButton
                          type="button"
                          label={t("common.edit", "Edit")}
                          variant="transparent"
                          onClick={() => openEditModal(customer)}
                          Icon={<EditIcon className="size-4" />}
                          className="text-black hover:text-black hover:bg-gray-50 hover:scale-105 !px-2 !py-1 !gap-1"
                        />
                        <CustomButton
                          type="button"
                          label={t("common.delete", "Delete")}
                          variant="transparent"
                          onClick={() =>
                            customer.id && handleDeleteCustomer(customer.id)
                          }
                          Icon={<DeleteIcon className="size-4" />}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 hover:scale-105 !px-2 !py-1 !gap-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        initialCustomer={editingCustomer}
        onSuccess={(customer) => {
          if (modalMode === "add") {
            setCustomers([...customers, customer]);
          } else {
            setCustomers(
              customers.map((c) => (c.id === customer.id ? customer : c))
            );
          }
        }}
      />

      {/* Bulk Import Modal */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {t("customerManagement.bulkImport.title")}
                </h3>
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => {
                    setIsBulkImportModalOpen(false);
                    setImportResults(null);
                  }}
                  Icon={<CrossIcon className="size-6" />}
                  className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
                />
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              {!importResults ? (
                <div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                      {t("customerManagement.bulkImport.description")}
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t("customerManagement.bulkImport.expectedColumns")}
                      </h4>
                      <ul className="text-sm text-gray-800 list-disc list-inside space-y-1">
                        <li>
                          {t("customerManagement.bulkImport.columns.name")}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.phone")}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.address")}
                        </li>
                        <li>
                          {t(
                            "customerManagement.bulkImport.columns.postalCode"
                          )}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.city")}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.province")}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.email")}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.cif")}
                        </li>
                        <li>
                          {t("customerManagement.bulkImport.columns.comments")}
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <CustomButton
                        type="button"
                        variant="secondary"
                        onClick={handleDownloadTemplate}
                        label={t(
                          "customerManagement.bulkImport.downloadTemplate"
                        )}
                        className="hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-black transition-colors">
                    <input
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileChange}
                      disabled={bulkImportLoading}
                      className="hidden"
                      id="bulk-import-file"
                    />
                    <label
                      htmlFor="bulk-import-file"
                      className={`cursor-pointer flex flex-col items-center ${
                        bulkImportLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <AddIcon className="size-8 text-gray-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        {bulkImportLoading
                          ? t("customerManagement.bulkImport.processing")
                          : t("customerManagement.bulkImport.uploadText")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("customerManagement.bulkImport.fileFormat")}
                      </p>
                    </label>
                  </div>

                  {bulkImportLoading && (
                    <div className="mt-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">
                      {t("customerManagement.bulkImport.results")}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-700">
                          {importResults.success}
                        </div>
                        <div className="text-sm text-green-600">
                          {t("customerManagement.bulkImport.successCount")}
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-700">
                          {importResults.failed}
                        </div>
                        <div className="text-sm text-red-600">
                          {t("customerManagement.bulkImport.failedCount")}
                        </div>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <h5 className="font-semibold text-red-900 mb-2">
                          {t("customerManagement.bulkImport.errors")}
                        </h5>
                        <ul className="text-sm text-red-800 space-y-1">
                          {importResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {importResults.failed > 50 && (
                            <li className="text-gray-600 italic">
                              {t("customerManagement.bulkImport.moreErrors", {
                                count: importResults.failed - 50,
                              })}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-4">
                    <CustomButton
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsBulkImportModalOpen(false);
                        setImportResults(null);
                      }}
                      label={t("common.close")}
                      className="hover:scale-105"
                    />
                    <CustomButton
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setImportResults(null);
                      }}
                      label={t("customerManagement.bulkImport.importAnother")}
                      className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 hover:scale-105"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
