interface CustomInputProps {
    otherClasses?: string;
    label: string;
    name: string;
    required?: boolean;
    inputClasses?: string;
}
const CustomInput = ({
    otherClasses,
    label,
    name,
    required,
    inputClasses,
}: CustomInputProps) => {
    return (
        <div className={otherClasses}>
            <label
                htmlFor={name}
                className={`block text-sm font-medium text-gray-700 mb-2 ${otherClasses}`}
            >
                {label}
            </label>
            <input
                type="text"
                id={name}
                name={name}
                required={required}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${inputClasses}`}
            />
        </div>
    );
};

export default CustomInput;
