import { createContext, useContext, useState } from "react";

interface ConfigurationType {
  name: string;
  address: string;
  logo: string;
  language?: "en" | "es";
  vatNumber?: string;
}
interface ConfigurationContextType {
  configurations: ConfigurationType;
  setConfigurations: React.Dispatch<React.SetStateAction<ConfigurationType>>;
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
  const [configurations, setConfigurations] = useState<{
    name?: string;
    address: string;
    logo: string;
    language?: "en" | "es";
    vatNumber?: string;
  }>({
    name: "",
    address: "",
    logo: "",
    language: "en",
    vatNumber: "",
  });
  const value = {
    configurations,
    setConfigurations,
  } as ConfigurationContextType;
  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};
