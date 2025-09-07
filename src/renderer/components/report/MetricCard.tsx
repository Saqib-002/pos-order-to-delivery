export const MetricCard: React.FC<{
    title: string;
    value: number;
    icon: string;
    color: string;
    subtext?: string;
    format?: (value: number) => string;
}> = ({ title, value, icon, color, subtext, format }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
            <div className={`p-3 bg-${color}-100 rounded-lg`}>
                <svg className={`w-8 h-8 text-${color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{format ? format(value) : value}</p>
                {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
            </div>
        </div>
    </div>
);