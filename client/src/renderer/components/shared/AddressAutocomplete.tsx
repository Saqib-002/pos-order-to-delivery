import { useEffect, useRef, useState } from "react";
import { useConfigurations } from "@/renderer/contexts/configurationContext";

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
  placeholder = "Enter address",
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
  const { configurations } = useConfigurations();
  const apiKey = configurations?.googleMapsApiKey || "";
  const [isLoaded, setIsLoaded] = useState(false);
  const [address1, setAddress1] = useState(value);
  const [internalApartment, setInternalApartment] = useState(apartmentValue);
  const [internalPostalCode, setInternalPostalCode] = useState(postalCodeValue);
  const [internalCity, setInternalCity] = useState(cityValue);
  const [internalProvince, setInternalProvince] = useState(provinceValue);
  const autocompleteRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const address1FieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apiKey) {
      setIsLoaded(false);
      return;
    }
    const existingScripts = document.querySelectorAll(
      'script[src*="maps.googleapis.com"]'
    );
    existingScripts.forEach((script) => script.remove());

    if (window.google?.maps?.importLibrary) {
      setIsLoaded(true);
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.importLibrary) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = `
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
      ({key: "${apiKey}", v: "weekly"});
    `;
    document.head.appendChild(script);

    script.onload = () => {
      setTimeout(() => {
        if (window.google?.maps?.importLibrary) {
          setIsLoaded(true);
        }
      }, 100);
    };

    script.onerror = () => {
      setIsLoaded(false);
      console.error("Failed to load Google Maps API");
    };
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.google) return;

    const initAutocomplete = async () => {
      try {
        const { Place, Autocomplete } = (await window.google.maps.importLibrary(
          "places"
        )) as any;

        if (!autocompleteRef.current && containerRef.current) {
          const autocompleteElement = document.createElement(
            "gmp-place-autocomplete"
          ) as any;

          autocompleteElement.setAttribute(
            "id",
            id || name || "place-autocomplete"
          );
          if (placeholder) {
            autocompleteElement.setAttribute("placeholder", placeholder);
          }
          if (required) {
            autocompleteElement.setAttribute("required", "true");
          }

          // autocompleteElement.setAttribute(
          //   "included-primary-types",
          //   "street_address"
          // );
          
          autocompleteElement.setAttribute("included-region-codes", "ES");

          containerRef.current.appendChild(autocompleteElement);
          autocompleteRef.current = autocompleteElement;

          setTimeout(async () => {
            const placeAutocomplete = document.querySelector(
              `#${id || name || "place-autocomplete"}`
            ) as any;

            if (!placeAutocomplete) return;

            if (value) {
              placeAutocomplete.value = value;
              setAddress1(value);
            }

            placeAutocomplete.addEventListener(
              "gmp-select",
              async (event: any) => {
                try {
                  const placePrediction =
                    event.placePrediction || event.detail?.placePrediction;
                  if (placePrediction) {
                    await fillInAddress(placePrediction);
                  }
                } catch (err) {
                  console.error("Error in gmp-select handler:", err);
                }
              }
            );

            placeAutocomplete.addEventListener("input", (event: any) => {
              const newValue = event.target?.value || "";
              setAddress1(newValue);
              if (onChange) {
                onChange(newValue);
              }
            });
          }, 100);
        }
      } catch (error) {
        console.error("Error initializing autocomplete:", error);
      }
    };

    initAutocomplete();
  }, [isLoaded, id, name, placeholder, required, error, value, onChange]);

  const fillInAddress = async (placePrediction: any) => {
    try {
      const { Place } = (await window.google.maps.importLibrary(
        "places"
      )) as any;

      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress"],
      });

      if (!place.addressComponents) {
        return;
      }

      let address1Value = "";
      let postalCode = "";
      let city = "";
      let province = "";

      for (const component of place.addressComponents) {
        if (component.types.includes("street_address")) {
          address1Value = `${component.longText} ${address1Value}`;
        }
        if (component.types.includes("street_number")) {
          address1Value = `${component.longText} ${address1Value}`;
        }
        if (component.types.includes("route")) {
          address1Value += component.shortText;
        }
        if (component.types.includes("postal_code")) {
          postalCode = `${component.longText}${postalCode}`;
        }
        if (component.types.includes("postal_code_suffix")) {
          postalCode = `${postalCode}-${component.longText}`;
        }
        if (
          component.types.includes("locality") ||
          component.types.includes("postal_town")
        ) {
          city = component.longText || "";
        }
        if (component.types.includes("administrative_area_level_1")) {
          province = component.shortText || component.longText || "";
        }
      }

      address1Value = address1Value.trim();

      setAddress1(address1Value);
      setInternalPostalCode(postalCode);
      setInternalCity(city);
      setInternalProvince(province);

      if (address1FieldRef.current) {
        address1FieldRef.current.value = address1Value;
      }

      if (onPostalCodeChange) onPostalCodeChange(postalCode);
      if (onCityChange) onCityChange(city);
      if (onProvinceChange) onProvinceChange(province);

      onAddressSelect({
        address: address1Value,
        apartment: internalApartment,
        postalCode: postalCode,
        city: city,
        province: province,
      });

      if (onChange) {
        onChange(address1Value);
      }
    } catch (error) {
      console.error("Error filling address:", error);
    }
  };

  useEffect(() => {
    if (value !== address1) {
      setAddress1(value);
      if (address1FieldRef.current) {
        address1FieldRef.current.value = value;
      }
      if (autocompleteRef.current) {
        (autocompleteRef.current as any).value = value;
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
        gmp-basic-place-autocomplete,
        gmp-place-autocomplete {
          color-scheme: light !important;
          padding: 0 !important;
          width: 100% !important;
          display: block !important;
          border: 1px solid #d1d5db !important;
          border-radius: 0.5rem !important;
        }
        
        gmp-place-autocomplete::part(input) {
          width: 100% !important;
          padding: 12px 16px !important;
          border: none !important;
          border-radius: 0 !important;
          font-size: 16px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          background-color: #ffffff !important;
          color: #1f2937 !important;
          outline: none !important;
        }
        
        gmp-place-autocomplete:focus-within {
          border: none !important;
          outline: none !important;
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

        {/* Autocomplete field */}
        <div className="mb-4">
          <label
            htmlFor={id || name}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {searchAddressLabel}
          </label>
          <div
            ref={containerRef}
            className="relative border border-gray-300 rounded-lg focus:border-0 focus:ring-0 focus:outline-none"
          >
            {!isLoaded && (
              <input
                type="text"
                id={id || name}
                name={name}
                value={address1}
                disabled
                placeholder={placeholder}
                required={required}
                className={`w-full px-4 py-3 bg-gray-100 cursor-not-allowed ${inputClasses}`}
              />
            )}
          </div>
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
            placeholder="Street address"
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
