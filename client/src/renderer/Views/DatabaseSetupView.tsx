import React, { useState } from "react";
import CustomInput from "../components/shared/CustomInput";
import CustomButton from "../components/ui/CustomButton";
import { useTranslation } from "react-i18next";

// This prop is passed by the "gate" component to reload the app
type Props = {
  onSuccess: () => void;
};

export const DatabaseSetupView: React.FC<Props> = ({ onSuccess }) => {
  const { t, i18n } = useTranslation();
  const [creds, setCreds] = useState({
    host: "localhost",
    port: 5432,
    database: "restaurant_pos",
    user: "pos_admin",
    password: "",
    isSyncMaster: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setCreds({ ...creds, [name]: checked });
    } else {
      setCreds({ ...creds, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await (window as any).electronAPI.saveAndInitDb(creds);

    setLoading(false);
    if (result.success) {
      onSuccess(); // Tell the parent to show the main app
    } else {
      setError(t("databaseSetup.failedToConnect", "Failed to connect to the database."));
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 relative">
      {/* Language Switcher in top right */}
      <div className="absolute top-6 right-6 flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button
          type="button"
          onClick={() => changeLanguage("en")}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            i18n.language === "en"
              ? "bg-black text-white shadow-xs"
              : "text-gray-600 hover:text-black"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => changeLanguage("es")}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            i18n.language === "es"
              ? "bg-black text-white shadow-xs"
              : "text-gray-600 hover:text-black"
          }`}
        >
          Español
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded-xl shadow-md w-96 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("databaseSetup.title", "Database Connection")}
          </h2>
        </div>
        <p className="mb-5 text-sm text-gray-600">
          {t("databaseSetup.subtitle", "Please enter your PostgreSQL credentials to continue.")}
        </p>

        <CustomInput
          label={t("databaseSetup.host", "Host")}
          name="host"
          value={creds.host}
          onChange={handleChange}
          type="text"
        />
        <CustomInput
          label={t("databaseSetup.port", "Port")}
          name="port"
          value={creds.port}
          onChange={handleChange}
          type="number"
        />
        <CustomInput
          label={t("databaseSetup.database", "Database")}
          name="database"
          value={creds.database}
          onChange={handleChange}
          type="text"
        />
        <CustomInput
          label={t("databaseSetup.user", "User")}
          name="user"
          value={creds.user}
          onChange={handleChange}
          type="text"
        />
        <CustomInput
          label={t("databaseSetup.password", "Password")}
          name="password"
          value={creds.password}
          onChange={handleChange}
          type="password"
        />

        <div className="flex items-start gap-2.5 mt-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="isSyncMaster"
            name="isSyncMaster"
            checked={creds.isSyncMaster}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 text-black rounded border-gray-300 focus:ring-black cursor-pointer"
          />
          <label htmlFor="isSyncMaster" className="text-xs text-gray-700 cursor-pointer select-none">
            <span className="font-bold text-gray-900 block">
              {t("databaseSetup.serverPosMaster", "Server POS (Master Terminal)")}
            </span>
            <span className="text-gray-500 leading-tight block mt-0.5">
              {t(
                "databaseSetup.serverPosMasterDesc",
                "Syncs incoming web/app orders from cloud & auto-prints receipts. Disable on secondary client terminals."
              )}
            </span>
          </label>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <CustomButton
          type="submit"
          disabled={loading}
          label={
            loading
              ? t("databaseSetup.connecting", "Connecting...")
              : t("databaseSetup.saveAndConnect", "Save & Connect")
          }
          variant="primary"
          className="w-full mt-2"
        />
      </form>
    </div>
  );
};