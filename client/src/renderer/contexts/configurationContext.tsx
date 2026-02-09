import { createContext, useContext, useState } from "react";

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
  null
);
export const useConfigurations = () => {
  const context = useContext(ConfigurationContext);
  if (context === null) {
    throw new Error(
      "useConfigurations must be used within a ConfigurationsProvider"
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
  const [language, setLanguage] = useState("en");
  const value = {
    configurations,
    setConfigurations,
    language,
    setLanguage,
  } as ConfigurationContextType;
  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};
