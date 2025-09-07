import { getHourlyChartConfig } from "@/renderer/utils/report";
import { AnalyticsType } from "@/types/report";
import { Bar } from "react-chartjs-2";

export const HourlyDistribution: React.FC<{ analytics: AnalyticsType | null }> = ({ analytics }) => {
    const { data, options } = getHourlyChartConfig(analytics);
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Order Distribution</h3>
            <div className="h-64">
                {analytics?.hourlyData.some((h) => h > 0) ? (
                    <Bar data={data} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            <p className="text-sm">No orders in selected period</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};