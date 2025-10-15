import { getHourlyChartConfig } from "@/renderer/utils/report";
import { AnalyticsType } from "@/types/report";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  Tooltip,
  Title,
  Legend,
} from "chart.js";
import { AnalyticsIcon } from "@/renderer/assets/Svg";
import { useTranslation } from "react-i18next";
ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const HourlyDistribution: React.FC<{
  analytics: AnalyticsType | null;
}> = ({ analytics }) => {
  const { t } = useTranslation();
  const { data, options } = getHourlyChartConfig(analytics);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("reports.components.hourlyDistribution.title")}
      </h3>
      <div className="h-64">
        {analytics?.hourlyData.some((h) => h > 0) ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <AnalyticsIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm">
                {t("reports.components.hourlyDistribution.noOrders")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
