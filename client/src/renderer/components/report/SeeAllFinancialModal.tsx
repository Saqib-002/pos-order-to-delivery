import React from "react";
import { useTranslation } from "react-i18next";
import { X as XIcon } from "lucide-react";
import CustomButton from "../ui/CustomButton";

interface SeeAllFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  type: 'income' | 'expense-category' | 'supplier' | 'worker' | 'vehicle' | 'product';
  totalReference: number;
}

export const SeeAllFinancialModal: React.FC<SeeAllFinancialModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  type,
  totalReference
}) => {
  const { t } = useTranslation();

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
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium truncate pr-4" title={item.name}>
                      {type === 'product' ? `(${item.units} ${t("reports.financial.units")}) ${item.name}` : item.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-gray-900">
                        {Number(item.total || 0).toFixed(2)}€
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
                          backgroundColor: color
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
          <div className="flex justify-end">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={t("common.close")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
