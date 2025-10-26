import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { DeliveryPerson } from "@/types/delivery";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { OrderTable } from "../components/shared/OrderTable";
import { DeliveryPersonModal } from "../components/delivery/modals/DeliveryPersonModal";
import CustomButton from "../components/ui/CustomButton";
import {
  AddIcon,
  BikeIcon,
  CarIcon,
  DeleteIcon,
  DeliveredIcon,
  EditIcon,
  LocationIcon,
  MotorcycleIcon,
  SearchIcon,
} from "../public/Svg";
import { StatsCard } from "../components/shared/StatsCard.order";
import CustomInput from "../components/shared/CustomInput";

export const DeliveryManagement = () => {
  const { t } = useTranslation();
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [currentDeliveryPerson, setCurrentDeliveryPerson] =
    useState<DeliveryPerson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("all");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const {
    auth: { token },
  } = useAuth();

  useEffect(() => {
    fetchDeliveryPersons();
  }, [token]);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return t("deliveryManagement.errors.emailRequired");
    }
    if (!emailRegex.test(email)) {
      return t("deliveryManagement.errors.validEmail");
    }
    return "";
  };

  // Phone validation function
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9\s\-\(\)\+]*$/;
    if (!phone.trim()) {
      return t("deliveryManagement.errors.phoneRequired");
    }
    if (!phoneRegex.test(phone)) {
      return t("deliveryManagement.errors.validPhone");
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return t("deliveryManagement.errors.phoneMinDigits");
    }
    if (digitsOnly.length > 15) {
      return t("deliveryManagement.errors.phoneMaxDigits");
    }
    return "";
  };

  // Handle email change
  const handleEmailChange = (value: string) => {
    if (currentDeliveryPerson) {
      setCurrentDeliveryPerson({ ...currentDeliveryPerson, email: value });
      if (emailError) {
        setEmailError("");
      }
    }
  };

  // Handle phone change
  const handlePhoneChange = (value: string) => {
    const phoneRegex = /^[0-9\s\-\(\)\+]*$/;
    if (phoneRegex.test(value) && currentDeliveryPerson) {
      setCurrentDeliveryPerson({
        ...currentDeliveryPerson,
        phone: value,
      } as any);
      if (phoneError) {
        setPhoneError("");
      }
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      setLoading(true);
      const res = await (window as any).electronAPI.getDeliveryPersons(token);
      if (!res.status) {
        toast.error(t("deliveryManagement.errors.fetchFailed"));
        return;
      }
      setDeliveryPersons(res.data);
    } catch (error) {
      console.log(error);
      toast.error(t("deliveryManagement.errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeliveryPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeliveryPerson) return;

    // Validate required fields
    if (!currentDeliveryPerson.name.trim()) {
      toast.error(t("deliveryManagement.errors.enterName"));
      return;
    }
    if (!(currentDeliveryPerson as any).licenseNo?.trim()) {
      toast.error(t("deliveryManagement.errors.enterLicenseNumber"));
      return;
    }

    // Validate email
    const emailValidationError = validateEmail(
      currentDeliveryPerson.email || ""
    );
    if (emailValidationError) {
      setEmailError(emailValidationError);
      toast.error(emailValidationError);
      return;
    }

    // Validate phone if provided
    const phone = (currentDeliveryPerson as any).phone || "";
    if (phone.trim()) {
      const phoneValidationError = validatePhone(phone);
      if (phoneValidationError) {
        setPhoneError(phoneValidationError);
        toast.error(phoneValidationError);
        return;
      }
    }

    try {
      let res;
      if (isEditing) {
        res = await (window as any).electronAPI.updateDeliveryPerson(
          token,
          currentDeliveryPerson.id,
          {
            name: currentDeliveryPerson.name,
            email: currentDeliveryPerson.email,
            phone: (currentDeliveryPerson as any).phone,
            vehicleType: (currentDeliveryPerson as any).vehicleType,
            licenseNo: (currentDeliveryPerson as any).licenseNo,
          }
        );
      } else {
        res = await (window as any).electronAPI.createDeliveryPerson(token, {
          name: currentDeliveryPerson.name,
          email: currentDeliveryPerson.email,
          phone: (currentDeliveryPerson as any).phone,
          vehicleType: (currentDeliveryPerson as any).vehicleType || "bike",
          licenseNo: (currentDeliveryPerson as any).licenseNo,
        });
      }

      if (!res.status) {
        toast.error(
          res.error.includes("UNIQUE constraint failed: delivery_persons.email")
            ? t("deliveryManagement.errors.emailExists")
            : t(
                isEditing
                  ? "deliveryManagement.errors.updateFailed"
                  : "deliveryManagement.errors.addFailed"
              )
        );
        return;
      }

      await fetchDeliveryPersons();
      setCurrentDeliveryPerson(null);
      setIsModalOpen(false);
      setIsEditing(false);
      setEmailError("");
      setPhoneError("");
      toast.success(
        t(
          isEditing
            ? "deliveryManagement.success.updated"
            : "deliveryManagement.success.added"
        )
      );
    } catch (error) {
      toast.error(
        t(
          isEditing
            ? "deliveryManagement.errors.updateFailed"
            : "deliveryManagement.errors.addFailed"
        )
      );
    }
  };

  const handleDeleteDeliveryPerson = async (userId: string) => {
    if (!confirm(t("deliveryManagement.errors.deleteConfirm"))) return;
    try {
      const statsRes = await (window as any).electronAPI.getDeliveryPersonStats(
        token,
        userId
      );
      if (!statsRes.status) {
        toast.error(t("deliveryManagement.errors.fetchStatsFailed"));
        return;
      }
      if (statsRes.data.totalAssigned > 0) {
        alert(
          t("deliveryManagement.errors.cannotDeleteWithOrders", {
            count: statsRes.data.totalAssigned,
          })
        );
        return;
      }
      const res = await (window as any).electronAPI.deleteDeliveryPerson(
        token,
        userId
      );
      if (!res.status) {
        toast.error(t("deliveryManagement.errors.deleteFailed"));
        return;
      }
      await fetchDeliveryPersons();
      toast.success(t("deliveryManagement.success.deleted"));
    } catch (error) {
      toast.error(t("deliveryManagement.errors.deleteFailed"));
    }
  };

  const handleAddDeliveryPerson = () => {
    setCurrentDeliveryPerson({
      id: "",
      name: "",
      email: "",
      phone: "",
      vehicleType: "bike",
      licenseNo: "",
    } as any);
    setIsEditing(false);
    setIsModalOpen(true);
    setEmailError("");
    setPhoneError("");
  };

  const handleEditDeliveryPerson = (person: DeliveryPerson) => {
    setCurrentDeliveryPerson(person);
    setIsEditing(true);
    setIsModalOpen(true);
    setEmailError("");
    setPhoneError("");
  };

  const handleCloseModal = () => {
    setCurrentDeliveryPerson(null);
    setIsModalOpen(false);
    setIsEditing(false);
    setEmailError("");
    setPhoneError("");
  };

  const getVehicleTypeOptions = () => [
    { value: "bike", label: t("deliveryManagement.bike") },
    { value: "motorcycle", label: t("deliveryManagement.motorcycle") },
    { value: "car", label: t("deliveryManagement.car") },
    { value: "scooter", label: t("deliveryManagement.scooter") },
  ];

  const filteredDeliveryPersons: DeliveryPerson[] = deliveryPersons.filter(
    (person) => {
      const matchesVehicleType =
        selectedVehicleType === "all" ||
        person.vehicleType === selectedVehicleType;
      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesVehicleType && matchesSearch;
    }
  );

  const getVehicleTypeLabel = (vehicleType: string) => {
    return vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
  };

  const getVehicleTypeBadgeColor = (vehicleType: string) => {
    switch (vehicleType) {
      case "bike":
        return "bg-blue-100 text-blue-800";
      case "motorcycle":
        return "bg-orange-100 text-orange-800";
      case "car":
        return "bg-green-100 text-green-800";
      case "scooter":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderDeliveryPersonRow = (person: DeliveryPerson) => (
    <tr
      key={person.id}
      className="hover:bg-gray-50 transition-colors duration-150"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">
                {person.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-black">{person.name}</div>
            <div className="text-sm text-gray-500">
              {t("deliveryManagement.deliveryPersonnelLabel")}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleTypeBadgeColor(
            person.vehicleType || "bike"
          )}`}
        >
          {getVehicleTypeLabel(person.vehicleType || "bike")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">{person.email || "-"}</div>
        <div className="text-sm text-gray-500">{person.phone || "-"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">{person.licenseNo || "-"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">{person.totalAssigned || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">{person.totalDelivered || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">{person.totalCancelled || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-black">
          {person.avgDeliveryTime
            ? `${person.avgDeliveryTime.toFixed(2)}${t("deliveryManagement.minutes")}`
            : `0${t("deliveryManagement.minutes")}`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
        <CustomButton
          type="button"
          label={t("deliveryManagement.edit")}
          variant="transparent"
          onClick={() => handleEditDeliveryPerson(person as DeliveryPerson)}
          Icon={<EditIcon className="size-4" />}
          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 hover:scale-105 !px-2 !py-1 !gap-1"
        />
        <CustomButton
          type="button"
          label={t("deliveryManagement.delete")}
          variant="transparent"
          onClick={() => person.id && handleDeleteDeliveryPerson(person.id)}
          Icon={<DeleteIcon className="size-4" />}
          className="text-red-600 hover:text-red-900 hover:bg-red-50 hover:scale-105 !px-2 !py-1 !gap-1"
        />
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return (
    <div className="p-4 flex flex-col">
      <Header
        title={t("deliveryManagement.title")}
        subtitle={t("deliveryManagement.subtitle")}
        icon={<DeliveredIcon className="size-8 text-blue-600" />}
        iconbgClasses="bg-blue-100"
      />
      <div className="pb-6 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-black">
                {t("deliveryManagement.deliveryPersonnel")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("deliveryManagement.addAndManageStaff")}
              </p>
            </div>
            <CustomButton
              type="button"
              label={t("deliveryManagement.addDeliveryPerson")}
              onClick={handleAddDeliveryPerson}
              Icon={<AddIcon className="size-5" />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title={t("deliveryManagement.deliveryPersonnelCount")}
            value={deliveryPersons.length}
            icon={<LocationIcon className="size-6 text-indigo-600" />}
            bgColor="bg-indigo-100"
          />
          <StatsCard
            title={t("deliveryManagement.bikes")}
            value={
              deliveryPersons.filter((person) => person.vehicleType === "bike")
                .length
            }
            icon={<BikeIcon className="size-6 text-blue-600" />}
            bgColor="bg-blue-100"
          />
          <StatsCard
            title={t("deliveryManagement.motorcycles")}
            value={
              deliveryPersons.filter(
                (person) => person.vehicleType === "motorcycle"
              ).length
            }
            icon={<MotorcycleIcon className="size-6 text-orange-600 " />}
            bgColor="bg-orange-100"
          />
          <StatsCard
            title={t("deliveryManagement.cars")}
            value={
              deliveryPersons.filter((person) => person.vehicleType === "car")
                .length
            }
            icon={<CarIcon className="size-6 text-green-600" />}
            bgColor="bg-green-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <CustomInput
            placeholder={t("deliveryManagement.searchDeliveryPersonnel")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type="text"
            name="search"
            preLabel={<SearchIcon className="size-5 text-gray-400" />}
            inputClasses="pl-9 !shadow-none focus:!ring-1 text-sm"
            otherClasses="flex-1"
          />
          <div className="flex gap-2">
            {["all", "bike", "motorcycle", "car", "scooter"].map(
              (vehicleType) => (
                <CustomButton
                  key={vehicleType}
                  type="button"
                  label={
                    vehicleType === "all"
                      ? t("deliveryManagement.all")
                      : getVehicleTypeLabel(vehicleType)
                  }
                  onClick={() => setSelectedVehicleType(vehicleType)}
                  variant={
                    selectedVehicleType !== vehicleType
                      ? "secondary"
                      : "primary"
                  }
                />
              )
            )}
          </div>
        </div>

        <OrderTable
          title={t("deliveryManagement.deliveryPersonnelTable", {
            count: filteredDeliveryPersons.length,
          })}
          subtitle={
            filteredDeliveryPersons.length === 0
              ? deliveryPersons.length === 0
                ? t("deliveryManagement.getStartedMessage")
                : t("deliveryManagement.adjustFiltersMessage")
              : undefined
          }
          columns={[
            t("deliveryManagement.deliveryPerson"),
            t("deliveryManagement.vehicle"),
            t("deliveryManagement.contact"),
            t("deliveryManagement.license"),
            t("deliveryManagement.totalAssigned"),
            t("deliveryManagement.totalDelivered"),
            t("deliveryManagement.totalCancelled"),
            t("deliveryManagement.avgDeliveryTime"),
            t("deliveryManagement.actions"),
          ]}
          data={filteredDeliveryPersons}
          renderRow={renderDeliveryPersonRow}
          emptyStateIcon={
            <LocationIcon className="mx-auto h-12 w-12 text-gray-400" />
          }
          emptyStateTitle={t("deliveryManagement.noDeliveryPersonnelFound")}
        />
      </div>

      <DeliveryPersonModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitDeliveryPerson}
        deliveryPerson={currentDeliveryPerson}
        setDeliveryPerson={setCurrentDeliveryPerson}
        emailError={emailError}
        phoneError={phoneError}
        handleEmailChange={handleEmailChange}
        handlePhoneChange={handlePhoneChange}
        isEditing={isEditing}
      />
    </div>
  );
};
