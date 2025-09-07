import { AnalyticsType } from "@/types/report";

export const getHourlyChartConfig = (analytics: AnalyticsType | null) => ({
    data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`),
        datasets: [
            {
                label: "Orders",
                data: analytics?.hourlyData,
                backgroundColor: analytics?.hourlyData.some((h: number) => h > 0)
                    ? "rgba(99, 102, 241, 0.8)"
                    : "rgba(156, 163, 175, 0.5)",
                borderColor: "rgba(99, 102, 241, 1)",
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "white",
                bodyColor: "white",
                borderColor: "rgba(99, 102, 241, 1)",
                borderWidth: 1,
                callbacks: { label: (context: any) => `Orders: ${context.parsed.y}` },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: "#6B7280", font: { size: 12 } },
                grid: { color: "rgba(0, 0, 0, 0.1)", drawBorder: false },
            },
            x: {
                ticks: { color: "#6B7280", font: { size: 11 }, maxRotation: 45, minRotation: 0 },
                grid: { display: false },
            },
        },
    },
});