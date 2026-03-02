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
import DeliveryZoneMapModal from "./Modals/DeliveryZoneMapModal";

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
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

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

    let cleanedDeliveryZones: any[] = [];
    if (
      configurations.deliveryZones &&
      Array.isArray(configurations.deliveryZones)
    ) {
      cleanedDeliveryZones = configurations.deliveryZones
        .filter((zone: any) => {
          return (
            zone &&
            typeof zone === "object" &&
            zone.id &&
            zone.name &&
            Array.isArray(zone.points) &&
            typeof zone.minOrderAmount === "number"
          );
        })
        .map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          points: zone.points,
          minOrderAmount: Math.max(0, zone.minOrderAmount),
        }));
    }

    const cleanedConfigurations = {
      ...configurations,
      kitchenTimeEstimationRanges: cleanedRanges,
      deliveryZones: cleanedDeliveryZones,
    };

    // Save CDN URL
    await (window as any).electronAPI.saveCdnUrl(cdnUrl);

    let res;
    if (mode === "add") {
      res = await (window as any).electronAPI.createConfigurations(
        token,
        cleanedConfigurations,
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
        cleanedConfigurations,
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
          <div className="flex-auto flex flex-col gap-6">
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
                  variant="primary"
                />
              </div>

              {(configurations.kitchenTimeEstimationRanges || []).length ===
              0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">
                    {t("configurations.noTimeRangeSet")}
                  </p>
                  <p className="text-xs mt-1">
                    {t("configurations.addTimeRangeHelp")}
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
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Delivery Minimum Order Zones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {t("configurations.deliveryMinOrderLabel")}
                </h3>
                <CustomButton
                  type="button"
                  onClick={() => setIsZoneModalOpen(true)}
                  label={t("configurations.deliveryZones.manageButton")}
                  size="sm"
                  variant="primary"
                  Icon={<LocationIcon className="size-4" />}
                />
              </div>

              {(configurations.deliveryZones || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-sm">
                    {t("configurations.deliveryZones.noZonesConfigured")}
                  </p>
                  <p className="text-xs mt-1">
                    {t("configurations.deliveryZones.drawFirstZoneHelp")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(configurations.deliveryZones || []).map(
                    (zone: any, index: number) => (
                      <div
                        key={zone.id || index}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">
                            {zone.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {t("configurations.deliveryZones.minOrderShort")}{" "}
                            <span className="font-semibold text-emerald-600">
                              {zone.minOrderAmount}€
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium uppercase">
                            {t("configurations.deliveryZones.pointsCount", {
                              count: zone.points.length,
                            })}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Company Logo */}
          <div className="flex-auto flex flex-col gap-2">
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
      <DeliveryZoneMapModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        initialZones={configurations.deliveryZones || []}
        onSave={(zones) =>
          setConfigurations({ ...configurations, deliveryZones: zones })
        }
        restaurantAddress={configurations.address || ""}
        googleMapsApiKey={configurations.googleMapsApiKey || ""}
      />
    </div>
  );
};

export default ConfigurationsTab;
