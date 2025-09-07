export const StatsCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
}> = ({ title, value, icon, bgColor, textColor }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center">
            <div className={`p-2 ${bgColor} rounded-lg`}>{icon}</div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);
