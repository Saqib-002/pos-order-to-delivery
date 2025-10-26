import React, { useEffect, useState } from "react";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon } from "@/renderer/public/Svg";
import CustomInput from "../../shared/CustomInput";
import { toast } from "react-toastify";

interface PrinterModalProps {
  onClose: () => void;
  mode: "add" | "edit" | "view";
  connectedPrinters: any[];
  printer?: any;
  token: string | null;
  onSuccess?: () => void;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({
  onClose,
  mode,
  printer,
  connectedPrinters,
  token,
  onSuccess,
}) => {
  const [selectedPrinter, setSelectedPrinter] = useState({
    name: connectedPrinters.length > 0 ? connectedPrinters[0].name : "",
    isMain: false,
    displayName: "",
  });

  useEffect(() => {
    if (printer && (mode === "edit" || mode === "view")) {
      setSelectedPrinter({
        name: printer.name,
        isMain: printer.isMain,
        displayName: printer.displayName,
      });
    }
  }, [printer, mode]);

  const getPrintersOptions = connectedPrinters.map((p: any) => ({
    value: p.name,
    label: p.displayName,
  }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "view") return;

    if (mode === "add" && !selectedPrinter.name) {
      toast.error("Please select a printer");
      return;
    }
    if (!selectedPrinter.displayName) {
      toast.error("Please enter display name");
      return;
    }

    const payload =
      mode === "add"
        ? selectedPrinter
        : {
            displayName: selectedPrinter.displayName,
            isMain: selectedPrinter.isMain,
            name: selectedPrinter.name,
          };
    let res;
    try {
      if (mode === "add") {
        res = await (window as any).electronAPI.createPrinter(token, payload);
      } else {
        res = await (window as any).electronAPI.updatePrinter(
          token,
          printer.id,
          payload
        );
      }
      if (!res.status) {
        if (res.error?.includes("already exists")) {
          toast.warn("This printer already added!");
          return;
        }
        const errorMsg =
          mode === "add" ? "Unable to add printer" : "Unable to update printer";
        toast.error(errorMsg);
        return;
      }
      const successMsg =
        mode === "add"
          ? "Printer added successfully"
          : "Printer updated successfully";
      toast.success(successMsg);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const renderPrinterField = () => {
    if (mode === "add") {
      return (
        <CustomSelect
          options={getPrintersOptions}
          value={selectedPrinter.name}
          onChange={(value: string) => {
            setSelectedPrinter({
              ...selectedPrinter,
              name: value,
            });
          }}
          placeholder="Select printer"
          portalClassName="printer-dropdown-portal"
        />
      );
    } else {
      return (
        <div className="flex items-center py-3 px-4 border border-gray-300 rounded-md bg-gray-50 text-sm text-black">
          {printer?.name}
        </div>
      );
    }
  };

  const isViewMode = mode === "view";
  const isAddOrEditMode = mode === "add" || mode === "edit";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-black px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {mode === "view"
                ? "View Printer"
                : mode === "edit"
                  ? "Edit Printer"
                  : "Add New Printer"}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-indigo-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-8">
          <div className="flex flex-col gap-6">
            <CustomInput
              label="Display Name *"
              name="name"
              type="text"
              placeholder="Enter display name"
              value={selectedPrinter.displayName}
              onChange={(e) => {
                setSelectedPrinter({
                  ...selectedPrinter,
                  displayName: e.target.value,
                });
              }}
              inputClasses="py-3 px-4"
              readOnly={isViewMode}
              required={isAddOrEditMode}
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={selectedPrinter.isMain}
                  onChange={() => {
                    setSelectedPrinter({
                      ...selectedPrinter,
                      isMain: !selectedPrinter.isMain,
                    });
                  }}
                  disabled={isViewMode}
                  className="size-4"
                />
                <span className="text-sm">Main Printer</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Printer {isAddOrEditMode ? "*" : ""}
              </label>
              {renderPrinterField()}
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            {isViewMode ? (
              <CustomButton
                type="button"
                variant="primary"
                onClick={onClose}
                label="Close"
                className="bg-black hover:scale-105"
              />
            ) : (
              <>
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  label="Cancel"
                  className="hover:scale-105"
                />
                <CustomButton
                  type="submit"
                  variant="primary"
                  label={mode === "edit" ? "Update Printer" : "Add Printer"}
                  className="bg-black hover:scale-105"
                />
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
