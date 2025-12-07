import { useState } from "react";
import Printers from "../components/configurations/Printers";
import ConfigurationsTab from "../components/configurations/ConfiguraionsTab";
import Platforms from "../components/configurations/Platforms";
import { useTranslation } from "react-i18next";

const Configurations = () => {
  const [currentSubview, setCurrentSubview] = useState("printers");
  const { t, i18n } = useTranslation();

  const renderSubview = () => {
    switch (currentSubview) {
      case "printers":
        return <Printers />;
      case "platforms":
        return <Platforms />;
      case "config":
        return <ConfigurationsTab />;
      default:
        return <Printers />;
    }
  };

  return (
    <div className="p-4 flex flex-col">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setCurrentSubview("printers")}
          className={`px-5 py-3 ${currentSubview === "printers" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("printers.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("platforms")}
          className={`px-5 py-3 ${currentSubview === "platforms" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("platforms.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("config")}
          className={`px-5 py-3 ${currentSubview === "config" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("configurations.title")}
        </button>
      </div>
      <div>{renderSubview()}</div>
    </div>
  );
};

export default Configurations;
