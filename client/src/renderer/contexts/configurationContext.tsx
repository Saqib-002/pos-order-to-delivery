import i18n from "@/i18n";
import { createContext, useContext, useEffect, useState } from "react";

interface KitchenTimeEstimationRange {
  minOrders: number;
  maxOrders: number;
  estimatedTime: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  points: { lat: number; lng: number }[];
  minOrderAmount: number;
}

interface ConfigurationType {
  name?: string;
  logo: string;
  vatNumber?: string;
  orderPrefix?: string;
  lowKitchenPriorityTime?: number;
  mediumKitchenPriorityTime?: number;
  highKitchenPriorityTime?: number;
  kitchenTimeEstimationRanges?: KitchenTimeEstimationRange[];
  deliveryZones?: DeliveryZone[];
  googleMapsApiKey?: string;
  address: string;
  apartment?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  authorName?: string;
  authorWebsite?: string;
  authorEmail?: string;
  softwareVersion?: string;
  contactTypes?: any[];
  externalApiUrl?: string;
}
interface ConfigurationContextType {
  configurations: ConfigurationType;
  setConfigurations: React.Dispatch<React.SetStateAction<ConfigurationType>>;
  language: "en" | "es";
  setLanguage: React.Dispatch<React.SetStateAction<"en" | "es">>;
}

const ConfigurationContext = createContext<ConfigurationContextType | null>(
  null,
);
export const useConfigurations = () => {
  const context = useContext(ConfigurationContext);
  if (context === null) {
    throw new Error(
      "useConfigurations must be used within a ConfigurationsProvider",
    );
  }
  return context;
};
export const ConfigurationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [configurations, setConfigurations] = useState<ConfigurationType>({
    name: "",
    logo: "",
    vatNumber: "",
    orderPrefix: "",
    lowKitchenPriorityTime: 0,
    mediumKitchenPriorityTime: 0,
    highKitchenPriorityTime: 0,
    googleMapsApiKey: "",
    deliveryZones: [],
    address: "",
    apartment: "",
    postalCode: "",
    city: "",
    province: "",
  });
  const [language, setLanguage] = useState<"en" | "es">("en");

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await (window as any).electronAPI.getLanguage();
        if (
          storedLanguage &&
          (storedLanguage === "en" || storedLanguage === "es")
        ) {
          setLanguage(storedLanguage as "en" | "es");
          localStorage.setItem("language", storedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language from store:", error);
      }
    };
    loadLanguage();
  }, []);

  const handleSetLanguage = async (
    newLanguage: "en" | "es" | ((prevState: "en" | "es") => "en" | "es"),
  ) => {
    const lang =
      typeof newLanguage === "function" ? newLanguage(language) : newLanguage;
    setLanguage(lang);
    localStorage.setItem("language", lang);
    try {
      await (window as any).electronAPI.saveLanguage(lang);
    } catch (error) {
      console.error("Failed to save language to store:", error);
    }
  };

  const value = {
    configurations,
    setConfigurations,
    language,
    setLanguage: handleSetLanguage,
  } as ConfigurationContextType;
  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};
