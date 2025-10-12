import { createContext, useContext, useState } from "react";

interface ConfigurationType {
    name: string;
    address: string;
    logo: string;
}
interface ConfigurationContextType {
    configurations: ConfigurationType;
    setConfigurations: React.Dispatch<React.SetStateAction<ConfigurationType>>;
}

const ConfigurationContext = createContext<ConfigurationContextType | null>(null);
export const useConfigurations = () => {
    const context = useContext(ConfigurationContext);
    if (context === null) {
        throw new Error("useConfigurations must be used within a ConfigurationsProvider");
    }
    return context;
};
export const ConfigurationsProvider = ({ children }: { children: React.ReactNode })=>{
    const [configurations, setConfigurations] = useState<{
        name?: string,
        address: string,
        logo: string
    }>({
        name: "",
        address: "",
        logo: ""
    });
    const value={
        configurations,
        setConfigurations
    } as ConfigurationContextType;
    return(
        <ConfigurationContext.Provider value={value}>
            {children}
        </ConfigurationContext.Provider>
    )
};