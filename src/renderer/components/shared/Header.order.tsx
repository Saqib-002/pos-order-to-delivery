interface HeaderProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconbgClasses?: string;
}
const Header = ({
    title,
    subtitle,
    icon, iconbgClasses

}: HeaderProps) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {subtitle}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${iconbgClasses && iconbgClasses}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

export default Header