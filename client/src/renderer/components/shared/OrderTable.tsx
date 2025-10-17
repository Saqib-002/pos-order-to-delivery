import { JSX } from "react";

// ICONS
import DeliveredIcon from "../../assets/icons/delivered.svg?react";

export const OrderTable = <T,>({
  data,
  title,
  subtitle,
  columns,
  renderRow,
  emptyStateIcon,
  emptyStateTitle,
}: {
  data: T[];
  title?: string;
  subtitle?: string;
  columns: string[];
  renderRow: (item: T) => JSX.Element;
  emptyStateIcon?: JSX.Element;
  emptyStateTitle?: string;
}) => (
  <div>
    {title && (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-black">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    )}
    {data.length === 0 ? (
      <div className="text-center py-12">
        {emptyStateIcon || (
          <DeliveredIcon className="mx-auto size-12 text-gray-400" />
        )}
        <h3 className="mt-2 text-sm font-medium text-black">
          {emptyStateTitle || (title ? `No data found` : "No data found")}
        </h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 ${index === columns.length - 1 ? "text-right" : "text-left"} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(renderRow)}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
