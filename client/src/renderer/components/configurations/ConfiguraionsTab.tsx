import React, { useEffect, useState } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import { CustomSelect } from "../ui/CustomSelect";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";
import { ImgIcon } from "@/renderer/assets/Svg";

const ConfigurationsTab = () => {
  const [configurationsId, setConfigurationsId] = useState<string>("");
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const {
    auth: { token },
  } = useAuth();
  const { configurations, setConfigurations, language, setLanguage } = useConfigurations();
  const { i18n, t } = useTranslation();

  const getConfigurations = async () => {
    const res = await (window as any).electronAPI.getConfigurations(token);
    if (!res.status) {
      toast.error("Error getting configurations");
      return;
    }
    if (res.data) {
      setConfigurations(res.data);
      setConfigurationsId(res.data.id);
      setMode("edit");
      if (res.data.logo) {
        setLogoPreview(res.data.logo);
      }
    }
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      i18n.changeLanguage(savedLanguage);
      setLanguage(savedLanguage as 'en' | 'es');
    }
  };

  useEffect(() => {
    getConfigurations();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setConfigurations({ ...configurations, logo: base64 });
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let res;
    if (mode === "add") {
      res = await (window as any).electronAPI.createConfigurations(
        token,
        configurations
      );
      if (res.data) {
        setConfigurations(res.data);
        setConfigurationsId(res.data.id);
        setMode("edit");
        if (res.data.logo) {
          setLogoPreview(res.data.logo);
        }
      }
    } else {
      res = await (window as any).electronAPI.updateConfigurations(
        token,
        configurationsId,
        configurations
      );
    }
    if (!res.status) {
      toast.error("Error saving configurations");
      return;
    }
    getConfigurations();
    toast.success("Configurations saved successfully");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("configurations.title")}</h2>
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Form Fields */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2 w-48">
              <label className="text-sm font-medium text-gray-700">
                {t("configurations.languageLabel")}
              </label>
              <CustomSelect
                options={[
                  {
                    value: "en",
                    label: t("configurations.languageOptions.en"),
                  },
                  {
                    value: "es",
                    label: t("configurations.languageOptions.es"),
                  },
                ]}
                value={language || "en"}
                onChange={(val) => {
                  const lang = val as "en" | "es";
                  i18n.changeLanguage(lang);
                  setLanguage(lang);
                  localStorage.setItem('language', lang);
                }}
                className="w-full"
                portalClassName="language-select-portal"
                placeholder={t("configurations.languageLabel")}
              />
            </div>
            <CustomInput
              type="text"
              value={configurations.name}
              onChange={(e) =>
                setConfigurations({ ...configurations, name: e.target.value })
              }
              label={t("configurations.companyName")}
              name="name"
              placeholder={t("configurations.companyNamePlaceholder")}
              required={true}
              inputClasses="bg-white"
            />
            <CustomInput
              type="text"
              value={configurations.address}
              onChange={(e) =>
                setConfigurations({
                  ...configurations,
                  address: e.target.value,
                })
              }
              label={t("configurations.companyAddress")}
              name="address"
              placeholder={t("configurations.companyAddressPlaceholder")}
              required={true}
              inputClasses="bg-white"
            />
            <CustomInput
              type="text"
              value={configurations.vatNumber || ""}
              onChange={(e) =>
                setConfigurations({
                  ...configurations,
                  vatNumber: e.target.value,
                })
              }
              label={t("configurations.vatNumber")}
              name="vatNumber"
              placeholder={t("configurations.vatNumberPlaceholder")}
              required={false}
              inputClasses="bg-white"
            />
            <div>
              <h3>{t("configurations.kitchenPriorityLabel")}</h3>
              <div className="flex gap-4">
                <CustomInput
                  type="number"
                  value={String(configurations.lowKitchenPriorityTime) || "0"}
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      lowKitchenPriorityTime: Number(e.target.value),
                    })
                  }
                  label={t("configurations.lowKitchenPriorityTime")}
                  name="low"
                  placeholder="0"
                  min="0"
                  required={false}
                  inputClasses="bg-white"
                />
                <CustomInput
                  type="number"
                  value={String(configurations.mediumKitchenPriorityTime) || "0"}
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      mediumKitchenPriorityTime: Number(e.target.value),
                    })
                  }
                  min="0"
                  label={t("configurations.mediumKitchenPriorityTime")}
                  name="medium"
                  placeholder="0"
                  required={false}
                  inputClasses="bg-white"
                />
                <CustomInput
                  type="number"
                  value={String(configurations.highKitchenPriorityTime) || "0"}
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      highKitchenPriorityTime: Number(e.target.value),
                    })
                  }
                  min="0"
                  label={t("configurations.highKitchenPriorityTime")}
                  name="high"
                  placeholder="0"
                  required={false}
                  inputClasses="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Company Logo */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t("configurations.companyLogo")}
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 min-h-[200px] flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {logoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    crossOrigin="anonymous"
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-32 h-32 object-cover rounded-lg shadow-md mb-2"
                  />
                  <span className="text-xs text-gray-500 text-center">
                    {t("configurations.clickChangeLogo")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <ImgIcon className="size-16 mb-3" />
                  <p className="text-sm font-medium">
                    {t("configurations.uploadLogoPrompt")}
                  </p>
                  <p className="text-xs">{t("configurations.uploadLogoSub")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <CustomButton
          type="submit"
          className="w-36"
          label={t("configurations.save")}
        />
      </form>
    </div>
  );
};

export default ConfigurationsTab;
