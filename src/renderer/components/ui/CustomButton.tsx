interface CustomButtonProps {
    type: "submit" | "button";
    onClick?: () => void;
    className?: string;
    label?: string;
    postLabel?: string;
    Icon?: React.ReactElement;
    variant?: "primary" | "secondary" | "transparent" | "yellow" | "red" | "orange";
}
const CustomButton = ({
    type,
    onClick,
    className,
    label,
    postLabel,
    Icon,
    variant,
}: CustomButtonProps) => {
    const getVariant = () => {
        switch (variant) {
            case "primary":
                return "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-900";
            case "secondary":
                return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300";
            case "transparent":
                return "border-0 focus:ring-0 focus:ring-transparent text-gray-700 hover:text-indigo-500";
            case "yellow":
                return "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600 focus:ring-yellow-300";
            case "red":
                return "bg-red-500 text-white hover:bg-red-600 border-red-600 focus:ring-red-300";
            case "orange":
                return "bg-orange-500 text-white hover:bg-orange-600 border-orange-600 focus:ring-orange-300";
            default:
                return "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-900";
        }
    };
    return (
        <button
            type={type}
            onClick={onClick}
            className={`flex justify-center items-center gap-2 px-4 py-2 cursor-pointer font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-300 ${getVariant()} ${className}`}
        >
            {Icon && Icon}
            {label}
            {postLabel && <p>{postLabel}</p>}
        </button>
    );
};

export default CustomButton;
