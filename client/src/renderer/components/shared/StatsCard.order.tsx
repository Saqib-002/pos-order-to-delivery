export const StatsCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  subtext?: string;
  format?: (value: number) => string;
}> = ({ title, value, icon, bgColor, subtext, format }) => (
  <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className={`p-3 ${bgColor} rounded-lg`}>{icon}</div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-black">
        {format && typeof value === "number" ? format(value) : value}
      </p>
      {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
    </div>
  </div>
);
