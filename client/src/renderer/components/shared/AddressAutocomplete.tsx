import { useEffect, useRef, useState } from "react";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    google: any;
  }
}

interface AddressComponents {
  address: string;
  apartment?: string;
  postalCode: string;
  city: string;
  province: string;
}

interface AddressAutocompleteProps {
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
  const { configurations } = useConfigurations();
  const apiKey = configurations?.googleMapsApiKey || "";
  const [isLoaded, setIsLoaded] = useState(false);
  const [address1, setAddress1] = useState(value);
  const [internalApartment, setInternalApartment] = useState(apartmentValue);
  const [internalPostalCode, setInternalPostalCode] = useState(postalCodeValue);
  const [internalCity, setInternalCity] = useState(cityValue);
  const [internalProvince, setInternalProvince] = useState(provinceValue);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const address1FieldRef = useRef<HTMLInputElement>(null);

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (!apiKey) {
      setIsLoaded(false);
      return;
    }

    if (window.google?.maps?.importLibrary) {
      setIsLoaded(true);
      return;
    }

    const POLL_INTERVAL_MS = 200;
    const POLL_TIMEOUT_MS = 15000;
    let cancelled = false;

    const waitForGoogleMaps = () => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }
        if (window.google?.maps?.importLibrary) {
          clearInterval(interval);
          setIsLoaded(true);
          return;
        }
        if (Date.now() - start >= POLL_TIMEOUT_MS) {
          clearInterval(interval);
          console.warn("Google Maps API did not load within timeout");
        }
      }, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    };

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      const clearWait = waitForGoogleMaps();
      return () => {
        cancelled = true;
        clearWait();
      };
    }

    const loaderScript = document.querySelector(
      'script[data-google-maps-loader="true"]'
    ) as HTMLScriptElement | null;
    if (loaderScript && loaderScript.dataset.apiKey === apiKey) {
      const clearWait = waitForGoogleMaps();
      return () => {
        cancelled = true;
        clearWait();
      };
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute("data-google-maps-loader", "true");
    script.dataset.apiKey = apiKey;
    script.innerHTML = `
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
      ({key: "${apiKey}", v: "weekly"});
    `;
    document.head.appendChild(script);

    script.onerror = () => {
      cancelled = true;
      setIsLoaded(false);
      console.error("Failed to load Google Maps API");
    };

    const clearWait = waitForGoogleMaps();

    return () => {
      cancelled = true;
      clearWait();
    };
  }, [apiKey]);

  // Initialize standard Google Places Autocomplete on the search input
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current || !window.google) return;

    let isMounted = true;

    const initAutocomplete = async () => {
      try {
        const { Autocomplete } = (await window.google.maps.importLibrary("places")) as any;
        if (!searchInputRef.current || !isMounted) return;

        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        autocompleteRef.current = new Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: "ES" },
          fields: ["address_components", "geometry", "formatted_address"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (!place) return;

          let streetNumber = "";
          let route = "";
          let postalCode = "";
          let city = "";
          let province = "";

          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes("street_number")) {
                streetNumber = component.long_name || component.short_name || "";
              }
              if (component.types.includes("route")) {
                // Use long_name so full name like "Calle Madres de la Plaza de Mayo" is preserved
                route = component.long_name || component.short_name || "";
              }
              if (component.types.includes("postal_code")) {
                postalCode = component.long_name || component.short_name || "";
              }
              if (
                component.types.includes("locality") ||
                component.types.includes("postal_town") ||
                component.types.includes("sublocality") ||
                component.types.includes("sublocality_level_1")
              ) {
                if (!city) city = component.long_name || component.short_name || "";
              }
              if (component.types.includes("administrative_area_level_2")) {
                // In Spain, level 2 is the province (e.g. Madrid, Barcelona)
                if (!province) province = component.long_name || component.short_name || "";
              }
              if (component.types.includes("administrative_area_level_1")) {
                if (!province) province = component.long_name || component.short_name || "";
              }
            }
          }

          // Format street: in Spanish addresses, route/street name comes first, followed by number
          let street = "";
          if (route && streetNumber) {
            street = `${route}, ${streetNumber}`;
          } else if (route) {
            street = route;
          } else if (streetNumber) {
            street = streetNumber;
          }

          if (!street && place.formatted_address) {
            street = place.formatted_address.split(",")[0]?.trim() || "";
          }

          setAddress1(street);
          setInternalPostalCode(postalCode);
          setInternalCity(city);
          setInternalProvince(province);

          if (address1FieldRef.current) {
            address1FieldRef.current.value = street;
          }

          if (onPostalCodeChange) onPostalCodeChange(postalCode);
          if (onCityChange) onCityChange(city);
          if (onProvinceChange) onProvinceChange(province);

          onAddressSelect({
            address: street,
            apartment: internalApartment,
            postalCode,
            city,
            province,
          });

          if (onChange) {
            onChange(street);
          }
        });
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error);
      }
    };

    initAutocomplete();

    return () => {
      isMounted = false;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onAddressSelect, onChange, internalApartment, onPostalCodeChange, onCityChange, onProvinceChange]);

  useEffect(() => {
    if (value !== address1) {
      setAddress1(value);
      if (address1FieldRef.current) {
        address1FieldRef.current.value = value;
      }
    }
  }, [value, address1]);

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

  return (
    <>
      <style>{`
        .pac-container {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.75rem !important;
          margin-top: 4px !important;
          font-family: inherit !important;
          z-index: 999999 !important;
          padding: 4px !important;
        }
        .pac-item {
          border-top: 1px solid #f3f4f6 !important;
          padding: 8px 12px !important;
          color: #374151 !important;
          cursor: pointer !important;
          border-radius: 0.375rem !important;
          font-size: 13px !important;
          display: flex;
          align-items: center;
        }
        .pac-item:first-child {
          border-top: none !important;
        }
        .pac-item:hover, .pac-item-selected {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        .pac-item-query {
          color: #111827 !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding-right: 4px;
        }
        .pac-matched {
          color: #000000 !important;
          font-weight: 700 !important;
        }
        .pac-icon {
          margin-right: 8px !important;
        }
      `}</style>
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
        <div className="mb-4">
          <label
            htmlFor={`${id || name}-search`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {searchAddressLabel}
          </label>
          <input
            ref={searchInputRef}
            type="text"
            id={`${id || name}-search`}
            name={`${name}-search`}
            disabled={!isLoaded}
            placeholder={isLoaded ? placeholder : (apiKey ? "Loading address search..." : "Configure Google Maps API key in Settings")}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-colors ${
              !isLoaded ? "bg-gray-100 cursor-not-allowed" : "bg-white"
            } ${inputClasses}`}
          />
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
            ref={address1FieldRef}
            type="text"
            id={`${id || name}-address1`}
            name={`${name}-address1`}
            value={address1}
            onChange={(e) => {
              const val = e.target.value;
              setAddress1(val);
              if (onChange) onChange(val);
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
    </>
  );
};
