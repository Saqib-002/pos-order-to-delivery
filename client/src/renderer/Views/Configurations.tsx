import { useState } from "react";
import Printers from "../components/configurations/Printers";
import ConfigurationsTab from "../components/configurations/ConfiguraionsTab";
import Platforms from "../components/configurations/Platforms";
import Suppliers from "../components/configurations/Suppliers";
import ExpenseTypes from "../components/configurations/ExpenseTypes";
import IncomeSources from "../components/configurations/IncomeSources";
import Inventory from "../components/configurations/Inventory";
import AuthorInfo from "../components/configurations/AuthorInfo";
import Allergens from "../components/configurations/Allergens";
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
      case "suppliers":
        return <Suppliers />;
      case "expenseTypes":
        return <ExpenseTypes />;
      case "incomeSources":
        return <IncomeSources />;
      case "inventory":
        return <Inventory />;
      case "allergens":
        return <Allergens />;
      case "config":
        return <ConfigurationsTab />;
      case "authorInfo":
        return <AuthorInfo />;
      default:
        return <Printers />;
    }
  };

  return (
    <div className="p-4 flex flex-col">
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
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
          onClick={() => setCurrentSubview("suppliers")}
          className={`px-5 py-3 ${currentSubview === "suppliers" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("suppliers.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("expenseTypes")}
          className={`px-5 py-3 ${currentSubview === "expenseTypes" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("expenseTypes.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("incomeSources")}
          className={`px-5 py-3 ${currentSubview === "incomeSources" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("incomeSources.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("inventory")}
          className={`px-5 py-3 ${currentSubview === "inventory" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("inventory.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("allergens")}
          className={`px-5 py-3 ${currentSubview === "allergens" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("allergens.tabTitle", "Alérgenos")}
        </button>
        <button
          onClick={() => setCurrentSubview("config")}
          className={`px-5 py-3 ${currentSubview === "config" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("configurations.title")}
        </button>
        <button
          onClick={() => setCurrentSubview("authorInfo")}
          className={`px-5 py-3 ${currentSubview === "authorInfo" ? "border-b-2 border-black " : " text-gray-700 hover:bg-gray-200 cursor-pointer"} touch-manipulation transition-colors duration-300`}
        >
          {t("authorInfo.title")}
        </button>
      </div>
      <div>{renderSubview()}</div>
    </div>
  );
};

export default Configurations;
