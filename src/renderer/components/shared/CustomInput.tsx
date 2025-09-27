interface CustomInputProps {
    otherClasses?: string;
    label: string;
    preLabel?: string;
    postLabel?: string;
    name: string;
    type: "text" | "email" | "password" | "tel" | "number";
    placeholder?: string;
    required?: boolean;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputClasses?: string;
    [key: string]: any;
}
const CustomInput = ({
    otherClasses,
    label,
    preLabel,
    postLabel,
    name,
    type,
    placeholder,
    value,
    onChange,
    required,
    inputClasses,
    ...rest
}: CustomInputProps) => {
    return (
        <div className={otherClasses}>
            <label
                htmlFor={name}
                className={`block text-sm font-medium text-gray-700 mb-2 ${otherClasses}`}
            >
                {label}
            </label>
            <div className="relative">
                {preLabel &&<span className="absolute left-3 top-2 text-gray-500">{preLabel} </span>}
                <input
                    type={type}
                    id={name}
                    placeholder={placeholder}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClasses}`}
                    {...rest}
                    />
                    {postLabel &&<span className="absolute right-3 top-2 text-gray-500">{postLabel} </span>}
            </div>
        </div>
    );
};

export default CustomInput;
