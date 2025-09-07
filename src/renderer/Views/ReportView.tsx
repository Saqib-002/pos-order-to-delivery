import { METRICS } from "@/constants/report";
import { ReportViewProps, AnalyticsType } from "@/types/report";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { OrderTable } from "../components/report/OrderTable";
import { DateRangeSelector } from "../components/report/DateRangeSelector";
import { HourlyDistribution } from "../components/report/HourlyDistribution";
import { MetricCard } from "../components/report/MetricCard";
import { StatusDistribution } from "../components/report/StatusDistribution";
import { TopItems } from "../components/report/TopItems";

export const ReportView: React.FC<ReportViewProps> = ({ orders, setOrders, filter, token, setFilter }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [dateRange, setDateRange] = useState<string>("today");
    const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const res = await (window as any).electronAPI.getOrderAnalytics(token, { dateRange, selectedDate });
            if (!res.status) {
                toast.error("Failed to fetch analytics");
                return;
            }
            const totalOrders =
                res.data.totalCancelled +
                res.data.totalDelivered +
                res.data.totalOutForDelivery +
                res.data.totalReadyForDelivery +
                res.data.totalSentToKitchen;
            setAnalytics({
                ...res.data,
                totalOrders,
                inProgress: res.data.totalReadyForDelivery + res.data.totalOutForDelivery + res.data.totalSentToKitchen,
                successRate: totalOrders > 0 ? Math.round((res.data.totalDelivered / totalOrders) * 100) : 0,
            });
        };
        fetchAnalytics();
        setFilter({ selectedDate: null, selectedStatus: ["all"], searchTerm: "" });
    }, [dateRange, selectedDate, setFilter]);

    return (
        <div className="mt-4 p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[98%] mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
                            <p className="text-gray-600 mt-1">Comprehensive insights into order performance and trends</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {METRICS.map((metric) => (
                        <MetricCard
                            key={metric.title}
                            title={metric.title}
                            value={analytics ? (analytics[metric.key as keyof AnalyticsType] as number) : 0}
                            icon={metric.icon}
                            color={metric.color}
                            subtext={metric.subtext?.(analytics || ({} as AnalyticsType))}
                            format={metric.format}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <StatusDistribution analytics={analytics} />
                    <HourlyDistribution analytics={analytics} />
                </div>
                <TopItems analytics={analytics} />
                <OrderTable analytics={analytics} />
            </div>
        </div>
    );
};