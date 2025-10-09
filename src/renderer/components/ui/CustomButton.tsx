interface CustomButtonProps {
    type: "submit" | "button";
    className?: string;
    label?: string | React.ReactElement;
    postLabel?: string;
    isLoading?: boolean;
    Icon?: React.ReactElement;
    variant?: "primary" | "secondary" | "transparent" | "yellow" | "red" | "orange" | "green" | "gradient";
    [key: string]: any;
}
const CustomButton = ({
    type,
    className,
    label,
    postLabel,
    isLoading,
    Icon,
    variant,
    ...rest
}: CustomButtonProps) => {
    const getVariant = () => {
        switch (variant) {
            case "primary":
                return "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-900";
            case "secondary":
                return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300";
            case "gradient":
                return "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700";
            case "transparent":
                return "border-0 focus:ring-0 focus:ring-transparent text-gray-700 hover:text-indigo-500";
            case "yellow":
                return "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600 focus:ring-yellow-300";
            case "red":
                return "bg-red-500 text-white hover:bg-red-600 border-red-600 focus:ring-red-300";
            case "orange":
                return "bg-orange-500 text-white hover:bg-orange-600 border-orange-600 focus:ring-orange-300";
            case "green":
                return "bg-green-500 text-white hover:bg-green-600 border-green-600 focus:ring-green-300";
            default:
                return "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-900";
        }
    };
    return (
        <button
            type={type}
            className={`flex touch-manipulation justify-center items-center gap-2 px-4 py-2 cursor-pointer font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 disabled:opacity-50 ${getVariant()} ${className}`}
            {...rest}
        >
            {isLoading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (<>
                {Icon && Icon}
            </>)
            }
            {label}
            {postLabel && <p>{postLabel}</p>}
        </button>
    );
};

export default CustomButton;
