import { STATUS_DISTRIBUTION } from "@/constants/report";
import { AnalyticsType } from "@/types/report";
import { useMemo } from "react";

export const StatusDistribution: React.FC<{ analytics: AnalyticsType | null }> = ({ analytics }) => {
    const distribution = useMemo(
        () =>
            STATUS_DISTRIBUTION.map((item) => ({
                ...item,
                count: analytics ? (analytics[item.key as keyof AnalyticsType] as number) : 0,
            })).filter((item) => item.count > 0),
        [analytics]
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
            <div className="space-y-4">
                {distribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full ${item.color} mr-3`}></div>
                            <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                            <span className="text-sm text-gray-500">
                                ({analytics?.totalOrders ? Math.round((item.count / analytics.totalOrders) * 100) : 0}%)
                            </span>
                        </div>
                    </div>
                ))}
                {distribution.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No orders in selected period</div>
                )}
            </div>
        </div>
    );
};