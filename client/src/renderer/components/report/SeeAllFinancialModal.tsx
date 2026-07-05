import React from "react";
import { useTranslation } from "react-i18next";
import { X as XIcon, Download as DownloadIcon } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import CustomButton from "../ui/CustomButton";
import { generatePDFReportHTML } from "../../utils/pdfTemplates/baseReportTemplate";
import { useAuth } from "../../contexts/AuthContext";

interface SeeAllFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  type: 'income' | 'expense-category' | 'supplier' | 'worker' | 'vehicle' | 'product';
  totalReference: number;
  dateRange: string;
  selectedDate: string;
  startDateRange: Date | null;
  endDateRange: Date | null;
  configurations: any;
}

export const SeeAllFinancialModal: React.FC<SeeAllFinancialModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  type,
  totalReference,
  dateRange,
  selectedDate,
  startDateRange,
  endDateRange,
  configurations,
}) => {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [isExporting, setIsExporting] = React.useState(false);

  if (!isOpen) return null;

  const calculatePercentage = (value: number, total: number) => {
    if (!total) return 0;
    return (value / total) * 100;
  };

  const getThemeColor = () => {
    switch (type) {
      case 'income': return "#10b981";
      case 'expense-category': return "#008080";
      case 'supplier': return "#3b82f6";
      case 'worker': return "#f43f5e";
      case 'vehicle': return "#0ea5e9";
      case 'product': return "#a855f7";
      default: return "#6366f1";
    }
  };

  const color = getThemeColor();

  const sectionTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const sectionPending = items.reduce((sum, item) => sum + (Number(item.pending) || 0), 0);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      let filterPeriod = "-";
      const now = new Date();
      
      const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return "-";
        try {
          let date: Date;
          if (typeof dateString === "string") {
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
              date = new Date(dateString + "T00:00:00");
            } else {
              date = new Date(dateString);
            }
          } else {
            date = dateString;
          }
          if (isNaN(date.getTime())) return String(dateString);
          return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } catch {
          return String(dateString);
        }
      };

      if (dateRange === "today") {
        filterPeriod = `${t("reports.components.dateRangeSelector.periods.today") || "Today"}: ${formatDate(selectedDate || now)}`;
      } else if (dateRange === "week") {
        filterPeriod = t("reports.components.dateRangeSelector.periods.week") || "This Week";
      } else if (dateRange === "month") {
        filterPeriod = t("dateRangePicker.shortcuts.currentMonth") || t("reports.components.dateRangeSelector.periods.month") || "This Month";
      } else if (dateRange === "custom" && startDateRange && endDateRange) {
        filterPeriod = `${formatDate(startDateRange)} - ${formatDate(endDateRange)}`;
      } else {
        filterPeriod = dateRange || "-";
      }

      let tableHeaders: string[] = [];
      const isCashInOut = type === 'income' && items.some(item => item.transactionType !== undefined);
      
      if (isCashInOut) {
        tableHeaders = [
          t("receipt.date") || "Date",
          t("common.description") || "Description",
          t("workerManagement.paymentMethod") || "Payment Method",
          t("common.type") || "Type",
          t("receipt.total") || "Amount"
        ];
      } else if (type === 'product') {
        tableHeaders = [
          t("product.name") || "Product",
          t("reports.financial.units") || "Units",
          t("receipt.total") || "Total"
        ];
      } else {
        const hasPending = items.some(item => item.pending !== undefined);
        const nameHeader = 
          type === 'worker' ? (t("worker.name") || "Worker") :
          type === 'vehicle' ? (t("vehicle.name") || "Vehicle") :
          type === 'supplier' ? (t("supplier.name") || "Supplier") :
          t("common.description") || "Description";
          
        tableHeaders = [
          nameHeader,
          t("receipt.total") || "Total",
          ...(hasPending ? [t("common.paymentStatus.pending") || "Pending"] : [])
        ];
      }

      const tableRows = items.map((item) => {
        const formattedTotal = `${Number(item.total || 0).toFixed(2)}€`;
        
        if (isCashInOut) {
          const isInflow = item.transactionType === "in";
          const typeLabel = isInflow ? t("reports.financial.cashIn") : t("reports.financial.cashOut");
          const sign = isInflow ? "+" : "-";
          const formattedDate = item.date ? dayjs(item.date).format("YYYY-MM-DD HH:mm") : "-";
          const cleanMethod = (item.paymentType || "cash").split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          return `
            <tr>
              <td>${formattedDate}</td>
              <td>${item.name || "-"}</td>
              <td>${cleanMethod}</td>
              <td style="color: ${isInflow ? "#16a34a" : "#dc2626"}; font-weight: bold;">${typeLabel}</td>
              <td style="color: ${isInflow ? "#16a34a" : "#dc2626"}; font-weight: bold;">${sign}${formattedTotal}</td>
            </tr>
          `;
        }
        
        if (type === 'product') {
          return `
            <tr>
              <td>${item.name || "-"}</td>
              <td>${Number(item.units || 0)}</td>
              <td>${formattedTotal}</td>
            </tr>
          `;
        }
        
        const hasPending = item.pending !== undefined;
        if (hasPending) {
          const formattedPending = `${Number(item.pending || 0).toFixed(2)}€`;
          return `
            <tr>
              <td>${item.name || "-"}</td>
              <td>${formattedTotal}</td>
              <td style="color: ${Number(item.pending) > 0 ? "#d97706" : "inherit"}; font-weight: bold;">${formattedPending}</td>
            </tr>
          `;
        }
        
        return `
          <tr>
            <td>${item.name || "-"}</td>
            <td>${formattedTotal}</td>
          </tr>
        `;
      }).join("");

      const summary = [];
      if (isCashInOut) {
        const totalIn = items.filter(item => item.transactionType === "in").reduce((sum, item) => sum + Number(item.total), 0);
        const totalOut = items.filter(item => item.transactionType === "out").reduce((sum, item) => sum + Number(item.total), 0);
        summary.push({ label: t("reports.financial.cashIn") || "Cash In", value: `+${totalIn.toFixed(2)}€` });
        summary.push({ label: t("reports.financial.cashOut") || "Cash Out", value: `-${totalOut.toFixed(2)}€` });
        summary.push({ label: t("reports.financial.netBalance") || "Net Balance", value: `${(totalIn - totalOut).toFixed(2)}€` });
      } else {
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        summary.push({ label: t("reports.financial.total") || "Total", value: `${totalAmount.toFixed(2)}€` });
        
        const totalPending = items.reduce((sum, item) => sum + (Number(item.pending) || 0), 0);
        if (totalPending > 0) {
          summary.push({ label: t("common.paymentStatus.pending") || "Pending", value: `${totalPending.toFixed(2)}€` });
        }
      }

      const html = generatePDFReportHTML({
        title,
        entityInfo: [
          { label: t("company.name") || "Company", value: configurations?.name || "" },
          { label: t("receipt.vat") || "VAT", value: configurations?.vatNumber || "" }
        ],
        reportInfo: [
          { label: t("reports.financial.period") || "Period", value: filterPeriod }
        ],
        tableHeaders,
        tableRows,
        summary,
        configurations: configurations || {},
        t
      });

      const token = auth?.token || "";
      const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const defaultFileName = `${sanitizedTitle}-${dateRange || "report"}-${dayjs().format("YYYY-MM-DD")}.pdf`;
      
      const result = await (window as any).electronAPI.savePDFReport(
        token,
        "financialAnalytics",
        html,
        defaultFileName
      );

      if (result.status) {
        toast.success(t("marketPurchaseManagement.invoiceReport.pdfSaved") || "PDF saved successfully");
      } else {
        if (result.error !== "Save cancelled") {
          toast.error(t("marketPurchaseManagement.invoiceReport.pdfError") || "Error saving PDF");
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gray-900 px-8 py-6 text-white rounded-t-2xl flex justify-between items-center">
          <h3 className="text-xl font-bold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-6">
            {items.map((item, idx) => {
              const hasPending = item.pending !== undefined;
              const isInflow = item.transactionType === "in";
              const isOutflow = item.transactionType === "out";
              const isCashInOut = isInflow || isOutflow;
              
              const displayValue = isCashInOut
                ? `${isInflow ? "+" : "-"}${Number(item.total).toFixed(2)}€`
                : `${Number(item.total || 0).toFixed(2)}€`;
                
              const itemColor = isCashInOut
                ? (isInflow ? "#10b981" : "#ef4444")
                : color;

              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium truncate pr-4" title={item.name}>
                      {type === 'product' ? `(${item.units} ${t("reports.financial.units")}) ${item.name}` : item.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-bold ${isCashInOut ? (isInflow ? "text-emerald-600" : "text-rose-600") : "text-gray-900"}`}>
                        {displayValue}
                      </span>
                      {hasPending && item.pending > 0 && (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {Number(item.pending || 0).toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="h-full rounded-l-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${calculatePercentage(hasPending ? item.total - item.pending : item.total, totalReference)}%`, 
                          backgroundColor: itemColor
                        }}
                      />
                      {hasPending && item.pending > 0 && (
                        <div
                          className="h-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${calculatePercentage(item.pending, totalReference)}%`, 
                            backgroundColor: "#fbbf24"
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm mb-4">
            <div className="flex flex-col">
              <span className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">{t("reports.financial.total")}</span>
              <span className="text-lg font-bold text-gray-900">{sectionTotal.toFixed(2)}€</span>
            </div>
            {sectionPending > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-amber-500 uppercase tracking-widest text-[10px] font-bold">{t("common.paymentStatus.pending")}</span>
                <span className="text-lg font-bold text-amber-600">{sectionPending.toFixed(2)}€</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={t("common.close")}
            />
            <CustomButton
              type="button"
              variant="primary"
              onClick={handleExport}
              label={t("common.export") || "Export PDF"}
              isLoading={isExporting}
              Icon={<DownloadIcon className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
