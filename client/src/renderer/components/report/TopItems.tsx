export const TopItems: React.FC<{ topItems: { name: string; count: number }[],title:string }> = ({ topItems,title }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
            {topItems.map((item, index) => (
                <div key={index} className="flex items-center">
                    <span className="w-8 text-sm font-medium text-gray-600">#{index + 1}</span>
                    <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${
                                        topItems.some((t) => t.count > 0)
                                            ? (item.count / Math.max(...topItems.map((t) => t.count))) * 100
                                            : 0
                                    }%`,
                                }}
                            ></div>
                        </div>
                        <span className="w-12 text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                </div>
            ))}
            {topItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">No items ordered in selected period</div>
            )}
        </div>
    </div>
);