interface CustomInputProps {
    otherClasses?: string;
    label?: string;
    labelAction?: React.ReactNode;
    preLabel?: string | React.ReactElement;
    postLabel?: string | React.ReactElement;
    name: string;
    type: "text" | "email" | "password" | "tel" | "number" | "date";
    placeholder?: string;
    required?: boolean;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputClasses?: string;
    labelClasses?: string;
    secLabelClasses?: string;
    error?: string;
    [key: string]: any;
}
const CustomInput = ({
    otherClasses,
    label,
    labelAction,
    preLabel,
    postLabel,
    name,
    type,
    placeholder,
    value,
    onChange,
    required,
    inputClasses,
    labelClasses,
    secLabelClasses,
    error,
    ...rest
}: CustomInputProps) => {
    return (
        <div className={otherClasses}>
            {(label || labelAction) && (
                <div className="flex items-center justify-between gap-2 mb-2">
                    {label && (
                        <label
                            htmlFor={name}
                            className={`block text-sm font-medium text-gray-700 ${labelClasses}`}
                        >
                            {label}
                        </label>
                    )}
                    {labelAction && <span>{labelAction}</span>}
                </div>
            )}
            <div className="relative">
                {preLabel && <span className={`absolute left-3 top-2 text-gray-500 ${secLabelClasses}`}>{preLabel} </span>}
                <input
                    type={type}
                    id={name}
                    placeholder={placeholder}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black ${inputClasses}`}
                    {...rest}
                />
                {postLabel && <span className={`absolute text-gray-500 ${secLabelClasses?secLabelClasses:"left-3 top-2"}`}>{postLabel} </span>}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default CustomInput;
