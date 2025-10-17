import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  portalClassName?: string;
  maxHeight?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  portalClassName = "",
  maxHeight = "max-h-60",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        const target = event.target as Element;
        if (portalClassName && !target.closest(`.${portalClassName}`)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, portalClassName]);

  const selectedOption = options.find((option) => option.value === value);

  const handleOptionClick = (optionValue: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <>
      <div className={`relative ${className}`} ref={selectRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`relative w-full px-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors duration-200 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        >
          <span className="text-black">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            } ${disabled ? "opacity-50" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Portal Dropdown */}
      {isOpen &&
        selectRef.current &&
        createPortal(
          <div
            className={`fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl ${maxHeight} overflow-auto ${portalClassName}`}
            style={{
              top: selectRef.current.getBoundingClientRect().bottom + 4,
              left: selectRef.current.getBoundingClientRect().left,
              width: selectRef.current.getBoundingClientRect().width,
              minWidth: "auto",
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOptionClick(option.value, option.disabled);
                }}
                disabled={option.disabled}
                className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  option.disabled
                    ? "text-gray-400 cursor-not-allowed bg-gray-50"
                    : value === option.value
                      ? "bg-indigo-100 text-indigo-900 font-medium hover:bg-indigo-200"
                      : "text-black hover:bg-indigo-500 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
