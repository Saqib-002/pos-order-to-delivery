import { createContext, useContext, useState } from "react";

interface ConfigurationType {
  name?: string;
  address: string;
  logo: string;
  vatNumber?: string;
  orderPrefix?: string;
  lowKitchenPriorityTime?: number;
  mediumKitchenPriorityTime?: number;
  highKitchenPriorityTime?: number;
}
interface ConfigurationContextType {
  configurations: ConfigurationType;
  setConfigurations: React.Dispatch<React.SetStateAction<ConfigurationType>>;
  language: "en" | "es";
  setLanguage: React.Dispatch<React.SetStateAction<"en" | "es">>
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
    address: "",
    logo: "",
    vatNumber: "",
    orderPrefix: "",
    lowKitchenPriorityTime: 0,
    mediumKitchenPriorityTime: 0,
    highKitchenPriorityTime: 0,
  });
  const [language, setLanguage] = useState("en");
  const value = {
    configurations,
    setConfigurations,
    language,
    setLanguage
  } as ConfigurationContextType;
  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};
