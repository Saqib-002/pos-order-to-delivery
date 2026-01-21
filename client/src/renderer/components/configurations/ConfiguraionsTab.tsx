import React, { useEffect, useState } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import { CustomSelect } from "../ui/CustomSelect";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";
import { EyeIcon, ImgIcon, LocationIcon } from "@/renderer/public/Svg";
import { AddressAutocomplete } from "../shared/AddressAutocomplete";
import DeliveryRangeMapModal from "./Modals/DeliveryRangeMapModal";

const ConfigurationsTab = () => {
  const [configurationsId, setConfigurationsId] = useState<string>("");
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cdnUrl, setCdnUrl] = useState<string>(""); // State for CDN URL
  const {
    auth: { token },
  } = useAuth();
  const { configurations, setConfigurations, language, setLanguage } =
    useConfigurations();
  const { i18n, t } = useTranslation();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewRange, setPreviewRange] = useState<{ minKm: number; maxKm: number } | null>(null);

  const getConfigurations = async () => {
    // Fetch CDN URL
    const url = await (window as any).electronAPI.getCdnUrl();
    if (url) setCdnUrl(url);

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
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "es")) {
      i18n.changeLanguage(savedLanguage);
      setLanguage(savedLanguage as "en" | "es");
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
    let cleanedRanges: any[] = [];
    if (
      configurations.kitchenTimeEstimationRanges &&
      Array.isArray(configurations.kitchenTimeEstimationRanges)
    ) {
      cleanedRanges = configurations.kitchenTimeEstimationRanges
        .filter((range: any) => {
          return (
            range &&
            typeof range === "object" &&
            typeof range.minOrders === "number" &&
            typeof range.maxOrders === "number" &&
            typeof range.estimatedTime === "number" &&
            !isNaN(range.minOrders) &&
            !isNaN(range.maxOrders) &&
            !isNaN(range.estimatedTime) &&
            isFinite(range.minOrders) &&
            isFinite(range.maxOrders) &&
            isFinite(range.estimatedTime) &&
            range.minOrders >= 0 &&
            range.maxOrders >= 0 &&
            range.estimatedTime >= 0
          );
        })
        .map((range: any) => ({
          minOrders: Math.floor(Math.max(0, range.minOrders)),
          maxOrders: Math.floor(Math.max(0, range.maxOrders)),
          estimatedTime: Math.floor(Math.max(0, range.estimatedTime)),
        }));
    }

    let cleanedDeliveryRanges: any[] = [];
    if (
      configurations.deliveryMinOrderRanges &&
      Array.isArray(configurations.deliveryMinOrderRanges)
    ) {
      cleanedDeliveryRanges = configurations.deliveryMinOrderRanges
        .filter((range: any) => {
          return (
            range &&
            typeof range === "object" &&
            typeof range.minKm === "number" &&
            typeof range.maxKm === "number" &&
            typeof range.minOrderAmount === "number" &&
            !isNaN(range.minKm) &&
            !isNaN(range.maxKm) &&
            !isNaN(range.minOrderAmount) &&
            range.minKm >= 0 &&
            range.maxKm >= 0 &&
            range.minOrderAmount >= 0
          );
        })
        .map((range: any) => ({
          minKm: Math.max(0, range.minKm),
          maxKm: Math.max(0, range.maxKm),
          minOrderAmount: Math.max(0, range.minOrderAmount),
        }));
    }

    const cleanedConfigurations = {
      ...configurations,
      kitchenTimeEstimationRanges: cleanedRanges,
      deliveryMinOrderRanges: cleanedDeliveryRanges,
    };

    // Save CDN URL
    await (window as any).electronAPI.saveCdnUrl(cdnUrl);

    let res;
    if (mode === "add") {
      res = await (window as any).electronAPI.createConfigurations(
        token,
        cleanedConfigurations
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
        cleanedConfigurations
      );
    }
    if (!res.status) {
      toast.error(res.error || "Error saving configurations");
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
            <div className="flex gap-4">
              <CustomInput
                type="text"
                value={configurations.orderPrefix}
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    orderPrefix: e.target.value,
                  })
                }
                label={t("configurations.orderPrefix")}
                name="orderPrefix"
                placeholder={t("configurations.orderPrefixPlaceholder")}
                required={true}
                inputClasses="bg-white"
              />
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
                    localStorage.setItem("language", lang);
                  }}
                  className="w-full"
                  portalClassName="language-select-portal"
                  placeholder={t("configurations.languageLabel")}
                />
              </div>
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
            <AddressAutocomplete
              value={configurations.address}
              onChange={(value) =>
                setConfigurations((prev) => ({
                  ...prev,
                  address: value,
                }))
              }
              apartmentValue={configurations.apartment || ""}
              postalCodeValue={configurations.postalCode || ""}
              cityValue={configurations.city || ""}
              provinceValue={configurations.province || ""}
              onApartmentChange={(val) =>
                setConfigurations((prev) => ({ ...prev, apartment: val }))
              }
              onPostalCodeChange={(val) =>
                setConfigurations((prev) => ({ ...prev, postalCode: val }))
              }
              onCityChange={(val) =>
                setConfigurations((prev) => ({ ...prev, city: val }))
              }
              onProvinceChange={(val) =>
                setConfigurations((prev) => ({ ...prev, province: val }))
              }
              onAddressSelect={(components) => {
                setConfigurations((prev) => ({
                  ...prev,
                  address: components.address,
                  apartment: components.apartment || prev.apartment || "",
                  postalCode: components.postalCode,
                  city: components.city,
                  province: components.province,
                }));
              }}
              label={t("configurations.companyAddress")}
              name="address"
              placeholder={t("configurations.companyAddressPlaceholder")}
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
              inputClasses="bg-white"
            />
            <CustomInput
              type="text"
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
              label="CDN URL"
              name="cdnUrl"
              placeholder="http://localhost:3000"
              inputClasses="bg-white"
            />
            <CustomInput
              type="password"
              value={configurations.googleMapsApiKey || ""}
              onChange={(e) =>
                setConfigurations({
                  ...configurations,
                  googleMapsApiKey: e.target.value,
                })
              }
              label={t("configurations.googleMapsApiKey")}
              name="googleMapsApiKey"
              placeholder={t("configurations.googleMapsApiKeyPlaceholder")}
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
                  inputClasses="bg-white"
                />
                <CustomInput
                  type="number"
                  value={
                    String(configurations.mediumKitchenPriorityTime) || "0"
                  }
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
                  inputClasses="bg-white"
                />
              </div>
            </div>

            {/* Kitchen Time Estimation Ranges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {t("configurations.kitchenTimeEstimationLabel")}
                </h3>
                <CustomButton
                  type="button"
                  onClick={() => {
                    const newRange = {
                      minOrders: 0,
                      maxOrders: 10,
                      estimatedTime: 20,
                    };
                    const updatedRanges = [
                      ...(configurations.kitchenTimeEstimationRanges || []),
                      newRange,
                    ];
                    setConfigurations({
                      ...configurations,
                      kitchenTimeEstimationRanges: updatedRanges,
                    });
                  }}
                  label={t("configurations.addTimeRange")}
                  size="sm"
                  variant="secondary"
                />
              </div>

              {(configurations.kitchenTimeEstimationRanges || []).length ===
                0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No time ranges configured</p>
                  <p className="text-xs mt-1">
                    Add ranges to estimate kitchen preparation time
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(configurations.kitchenTimeEstimationRanges || []).map(
                    (range, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-6">
                          {/* Orders Range */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 min-w-fit">
                              {t("configurations.ordersLabel")}
                            </span>
                            <div className="flex items-center gap-1">
                              <CustomInput
                                type="number"
                                value={String(range.minOrders)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numValue =
                                    value === "" ? 0 : Number(value);
                                  if (isNaN(numValue)) return;

                                  const updatedRanges = [
                                    ...(configurations.kitchenTimeEstimationRanges ||
                                      []),
                                  ];
                                  updatedRanges[index] = {
                                    ...range,
                                    minOrders: numValue,
                                  };
                                  setConfigurations({
                                    ...configurations,
                                    kitchenTimeEstimationRanges: updatedRanges,
                                  });
                                }}
                                placeholder="0"
                                min="0"
                                inputClasses="w-16 text-center px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black bg-white"
                                name={`minOrders-${index}`}
                              />
                              <span className="text-gray-500">-</span>
                              <CustomInput
                                type="number"
                                value={String(range.maxOrders)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numValue =
                                    value === "" ? 0 : Number(value);
                                  if (isNaN(numValue)) return;

                                  const updatedRanges = [
                                    ...(configurations.kitchenTimeEstimationRanges ||
                                      []),
                                  ];
                                  updatedRanges[index] = {
                                    ...range,
                                    maxOrders: numValue,
                                  };
                                  setConfigurations({
                                    ...configurations,
                                    kitchenTimeEstimationRanges: updatedRanges,
                                  });
                                }}
                                placeholder="10"
                                min="0"
                                inputClasses="w-16 text-center px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black bg-white"
                                name={`maxOrders-${index}`}
                              />
                            </div>
                          </div>

                          {/* Estimated Time */}
                          <div className="flex items-center gap-2 mr-4">
                            <span className="text-sm font-medium text-gray-700 min-w-fit">
                              {t("configurations.estimatedTimeLabel")}
                            </span>
                            <div className="flex items-center gap-1">
                              <CustomInput
                                type="number"
                                value={String(range.estimatedTime)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numValue =
                                    value === "" ? 0 : Number(value);
                                  if (isNaN(numValue)) return;

                                  const updatedRanges = [
                                    ...(configurations.kitchenTimeEstimationRanges ||
                                      []),
                                  ];
                                  updatedRanges[index] = {
                                    ...range,
                                    estimatedTime: numValue,
                                  };
                                  setConfigurations({
                                    ...configurations,
                                    kitchenTimeEstimationRanges: updatedRanges,
                                  });
                                }}
                                placeholder="20"
                                min="0"
                                inputClasses="w-20 text-center px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black bg-white"
                                name={`estimatedTime-${index}`}
                              />
                              <span className="text-sm text-gray-600">
                                {t("configurations.minutesLabel")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <CustomButton
                          type="button"
                          onClick={() => {
                            const updatedRanges = [
                              ...(configurations.kitchenTimeEstimationRanges ||
                                []),
                            ];
                            updatedRanges.splice(index, 1);
                            setConfigurations({
                              ...configurations,
                              kitchenTimeEstimationRanges: updatedRanges,
                            });
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                          label="✕"
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Delivery Minimum Order Ranges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {t("configurations.deliveryMinOrderLabel")}
                </h3>
                <CustomButton
                  type="button"
                  onClick={() => {
                    const newRange = {
                      minKm: 0,
                      maxKm: 5,
                      minOrderAmount: 15,
                    };
                    const updatedRanges = [
                      ...(configurations.deliveryMinOrderRanges || []),
                      newRange,
                    ];
                    setConfigurations({
                      ...configurations,
                      deliveryMinOrderRanges: updatedRanges,
                    });
                  }}
                  label={t("configurations.addDistanceRange")}
                  size="sm"
                  variant="secondary"
                />
              </div>

              {(configurations.deliveryMinOrderRanges || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No delivery minimum order ranges configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(configurations.deliveryMinOrderRanges || []).map(
                    (range: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-6">
                          {/* Distance Range */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 min-w-fit">
                              {t("configurations.distanceLabel")}
                            </span>
                            <div className="flex items-center gap-1">
                              <CustomInput
                                type="number"
                                value={String(range.minKm)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numValue = value === "" ? 0 : Number(value);
                                  const updatedRanges = [...(configurations.deliveryMinOrderRanges || [])];
                                  updatedRanges[index] = { ...range, minKm: numValue };
                                  setConfigurations({ ...configurations, deliveryMinOrderRanges: updatedRanges });
                                }}
                                placeholder="0"
                                min="0"
                                inputClasses="w-16 text-center px-2 py-1 text-sm"
                                name={`minKm-${index}`}
                              />
                              <span className="text-gray-500">-</span>
                              <CustomInput
                                type="number"
                                value={String(range.maxKm)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numValue = value === "" ? 0 : Number(value);
                                  const updatedRanges = [...(configurations.deliveryMinOrderRanges || [])];
                                  updatedRanges[index] = { ...range, maxKm: numValue };
                                  setConfigurations({ ...configurations, deliveryMinOrderRanges: updatedRanges });
                                }}
                                placeholder="5"
                                min="0"
                                inputClasses="w-16 text-center px-2 py-1 text-sm"
                                name={`maxKm-${index}`}
                              />
                              <span className="text-sm text-gray-600">km</span>
                            </div>
                          </div>

                          {/* Min Order Amount */}
                          <div className="flex items-center gap-2 mr-4">
                            <span className="text-sm font-medium text-gray-700 min-w-fit">
                              {t("configurations.minOrderAmountLabel")}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600">€</span>
                              <CustomInput
                                type="number"
                                value={String(range.minOrderAmount)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numValue = value === "" ? 0 : Number(value);
                                  const updatedRanges = [...(configurations.deliveryMinOrderRanges || [])];
                                  updatedRanges[index] = { ...range, minOrderAmount: numValue };
                                  setConfigurations({ ...configurations, deliveryMinOrderRanges: updatedRanges });
                                }}
                                placeholder="15"
                                min="0"
                                inputClasses="w-20 text-center px-2 py-1 text-sm"
                                name={`minOrderAmount-${index}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <CustomButton
                            type="button"
                            onClick={() => {
                              setPreviewRange({ minKm: range.minKm, maxKm: range.maxKm });
                              setIsPreviewModalOpen(true);
                            }}
                            variant="transparent"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 !p-2"
                            Icon={<EyeIcon className="size-5" />}
                            title="Preview on Map"
                          />
                          <CustomButton
                            type="button"
                            onClick={() => {
                              const updatedRanges = [...(configurations.deliveryMinOrderRanges || [])];
                              updatedRanges.splice(index, 1);
                              setConfigurations({ ...configurations, deliveryMinOrderRanges: updatedRanges });
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                            label="✕"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Company Logo */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t("configurations.companyLogo")}
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 min-h-50 flex items-center justify-center">
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
      <DeliveryRangeMapModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        minKm={previewRange?.minKm || 0}
        maxKm={previewRange?.maxKm || 0}
        restaurantAddress={configurations.address || ""}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
      />
    </div>
  );
};

export default ConfigurationsTab;
