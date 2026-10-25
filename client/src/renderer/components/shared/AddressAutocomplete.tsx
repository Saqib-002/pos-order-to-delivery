import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Search, Loader2 } from "lucide-react";
import { searchAddressCandidates, AddressCandidate } from "@/renderer/utils/addressSearch";

export interface AddressComponents {
  address: string;
  apartment?: string;
  postalCode: string;
  city: string;
  province: string;
  // Number: coordinates of the picked suggestion. null: a location field was
  // edited by hand, so earlier coordinates no longer apply. undefined: the
  // location didn't change (apartment edits) — keep whatever the caller has.
  lat?: number | null;
  lng?: number | null;
}

export interface AddressAutocompleteProps {
  onAddressSelect: (components: AddressComponents) => void;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClasses?: string;
  error?: string;
  name?: string;
  id?: string;
  apartmentValue?: string;
  postalCodeValue?: string;
  cityValue?: string;
  provinceValue?: string;
  onApartmentChange?: (value: string) => void;
  onPostalCodeChange?: (value: string) => void;
  onCityChange?: (value: string) => void;
  onProvinceChange?: (value: string) => void;
  apartmentLabel?: string;
  postalCodeLabel?: string;
  cityLabel?: string;
  provinceLabel?: string;
  searchAddressLabel?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  value = "",
  onChange,
  label,
  placeholder = "Search address...",
  required = false,
  className = "",
  inputClasses = "",
  error,
  name,
  id,
  apartmentValue = "",
  postalCodeValue = "",
  cityValue = "",
  provinceValue = "",
  onApartmentChange,
  onPostalCodeChange,
  onCityChange,
  onProvinceChange,
  apartmentLabel = "Apartment, unit, suite, or floor #",
  postalCodeLabel = "Postal Code",
  cityLabel = "City",
  provinceLabel = "Province/State",
  searchAddressLabel = "Search address",
}) => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [address1, setAddress1] = useState(value);
  const [internalApartment, setInternalApartment] = useState(apartmentValue);
  const [internalPostalCode, setInternalPostalCode] = useState(postalCodeValue);
  const [internalCity, setInternalCity] = useState(cityValue);
  const [internalProvince, setInternalProvince] = useState(provinceValue);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external values with internal state
  useEffect(() => {
    if (value !== address1) {
      setAddress1(value);
    }
  }, [value]);

  useEffect(() => {
    if (apartmentValue !== internalApartment) {
      setInternalApartment(apartmentValue);
    }
  }, [apartmentValue]);

  useEffect(() => {
    if (postalCodeValue !== internalPostalCode) {
      setInternalPostalCode(postalCodeValue);
    }
  }, [postalCodeValue]);

  useEffect(() => {
    if (cityValue !== internalCity) {
      setInternalCity(cityValue);
    }
  }, [cityValue]);

  useEffect(() => {
    if (provinceValue !== internalProvince) {
      setInternalProvince(provinceValue);
    }
  }, [provinceValue]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Debounced search query
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim() || query.trim().length < 3) {
      setCandidates([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddressCandidates(query);
        setCandidates(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error("Address search error:", err);
        setCandidates([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  }, []);

  // When a candidate address is chosen
  const handleSelectCandidate = useCallback(
    (item: AddressCandidate) => {
      const selectedStreet = item.street || item.displayAddress;
      const selectedCity = item.city || "";
      const selectedProvince = item.province || "";
      const selectedPostal = item.postalCode || "";

      setAddress1(selectedStreet);
      setInternalCity(selectedCity);
      setInternalProvince(selectedProvince);
      setInternalPostalCode(selectedPostal);
      setSearchQuery(selectedStreet);
      setIsOpen(false);

      if (onPostalCodeChange) onPostalCodeChange(selectedPostal);
      if (onCityChange) onCityChange(selectedCity);
      if (onProvinceChange) onProvinceChange(selectedProvince);

      if (onChange) {
        onChange(selectedStreet);
      }

      onAddressSelect({
        address: selectedStreet,
        apartment: internalApartment,
        postalCode: selectedPostal,
        city: selectedCity,
        province: selectedProvince,
        lat: item.lat,
        lng: item.lng,
      });
    },
    [
      internalApartment,
      onAddressSelect,
      onChange,
      onCityChange,
      onPostalCodeChange,
      onProvinceChange,
    ]
  );

  // Keyboard navigation for search suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || candidates.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : candidates.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < candidates.length) {
        handleSelectCandidate(candidates[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      {/* Autocomplete Search Input */}
      <div className="relative mb-4">
        <label
          htmlFor={`${id || name}-search`}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {searchAddressLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            id={`${id || name}-search`}
            name={`${name}-search`}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (candidates.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors bg-white ${inputClasses}`}
          />
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && candidates.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
          >
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-medium text-gray-400">
              <span>Sugerencias de dirección</span>
              <span className="text-[10px] text-gray-400">OpenStreetMap / CartoCiudad</span>
            </div>
            {candidates.map((item, index) => {
              const isSelected = index === highlightedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectCandidate(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
                    isSelected ? "bg-gray-100 text-black" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.street || item.displayAddress}
                    </p>
                    {(item.city || item.province || item.postalCode) && (
                      <p className="text-xs text-gray-500 truncate">
                        {[item.postalCode, item.city, item.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Street address field */}
      <div className="mb-4">
        <label
          htmlFor={`${id || name}-address1`}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label || "Street address"}
        </label>
        <input
          type="text"
          id={`${id || name}-address1`}
          name={`${name}-address1`}
          value={address1}
          onChange={(e) => {
            const val = e.target.value;
            setAddress1(val);
            if (onChange) onChange(val);
            onAddressSelect({
              address: val,
              apartment: internalApartment,
              postalCode: internalPostalCode,
              city: internalCity,
              province: internalProvince,
              lat: null,
              lng: null,
            });
          }}
          placeholder={t("customerManagement.modal.address") || "Street address"}
          required={required}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors ${
            error
              ? "border-red-300 focus:ring-red-600 focus:border-red-600"
              : "border-gray-300"
          } ${inputClasses}`}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-600 mb-4">{error}</p>}

      {/* Apartment field */}
      <div className="mb-4">
        <label
          htmlFor={`${id || name}-apartment`}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {apartmentLabel}
        </label>
        <input
          type="text"
          id={`${id || name}-apartment`}
          name={`${name}-apartment`}
          value={internalApartment}
          onChange={(e) => {
            const val = e.target.value;
            setInternalApartment(val);
            if (onApartmentChange) onApartmentChange(val);
            onAddressSelect({
              address: address1,
              apartment: val,
              postalCode: internalPostalCode,
              city: internalCity,
              province: internalProvince,
            });
          }}
          placeholder={apartmentLabel}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors border-gray-300 ${inputClasses}`}
        />
      </div>

      {/* City, State/Province, Postal Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor={`${id || name}-city`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {cityLabel}
          </label>
          <input
            type="text"
            id={`${id || name}-city`}
            name={`${name}-city`}
            value={internalCity}
            onChange={(e) => {
              const val = e.target.value;
              setInternalCity(val);
              if (onCityChange) onCityChange(val);
              onAddressSelect({
                address: address1,
                apartment: internalApartment,
                postalCode: internalPostalCode,
                city: val,
                province: internalProvince,
                lat: null,
                lng: null,
              });
            }}
            placeholder={cityLabel}
            required={required}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors ${
              error
                ? "border-red-300 focus:ring-red-600 focus:border-red-600"
                : "border-gray-300"
            } ${inputClasses}`}
          />
        </div>
        <div>
          <label
            htmlFor={`${id || name}-province`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {provinceLabel}
          </label>
          <input
            type="text"
            id={`${id || name}-province`}
            name={`${name}-province`}
            value={internalProvince}
            onChange={(e) => {
              const val = e.target.value;
              setInternalProvince(val);
              if (onProvinceChange) onProvinceChange(val);
              onAddressSelect({
                address: address1,
                apartment: internalApartment,
                postalCode: internalPostalCode,
                city: internalCity,
                province: val,
                lat: null,
                lng: null,
              });
            }}
            placeholder={provinceLabel}
            required={required}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors ${
              error
                ? "border-red-300 focus:ring-red-600 focus:border-red-600"
                : "border-gray-300"
            } ${inputClasses}`}
          />
        </div>
        <div>
          <label
            htmlFor={`${id || name}-postal`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {postalCodeLabel}
          </label>
          <input
            type="text"
            id={`${id || name}-postal`}
            name={`${name}-postal`}
            value={internalPostalCode}
            onChange={(e) => {
              const val = e.target.value;
              setInternalPostalCode(val);
              if (onPostalCodeChange) onPostalCodeChange(val);
              onAddressSelect({
                address: address1,
                apartment: internalApartment,
                postalCode: val,
                city: internalCity,
                province: internalProvince,
                lat: null,
                lng: null,
              });
            }}
            placeholder={postalCodeLabel}
            required={required}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors ${
              error
                ? "border-red-300 focus:ring-red-600 focus:border-red-600"
                : "border-gray-300"
            } ${inputClasses}`}
          />
        </div>
      </div>
    </div>
  );
};
export default AddressAutocomplete;
