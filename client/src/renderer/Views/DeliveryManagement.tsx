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
import { useConfirm } from "../hooks/useConfirm";

export const DeliveryManagement = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [currentDeliveryPerson, setCurrentDeliveryPerson] =
    useState<DeliveryPerson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const {
    auth: { token },
  } = useAuth();

  useEffect(() => {
    fetchDeliveryPersons();
  }, [token]);

  // Username validation function
  const validateUsername = (username: string) => {
    if (!username || username.trim() === "") {
      return t("deliveryManagement.errors.usernameRequired");
    }
    if (username.length < 3) {
      return t("deliveryManagement.errors.usernameTooShort");
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
    if (digitsOnly.length < 9) {
      return t("deliveryManagement.errors.phoneMinDigits");
    }
    if (digitsOnly.length > 15) {
      return t("deliveryManagement.errors.phoneMaxDigits");
    }
    return "";
  };

  // Handle username change
  const handleUsernameChange = (value: string) => {
    if (currentDeliveryPerson) {
      setCurrentDeliveryPerson({ ...currentDeliveryPerson, username: value } as any);
      if (usernameError) {
        setUsernameError("");
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

    // Validate username
    const username = (currentDeliveryPerson as any).username || "";
    const usernameValidationError = validateUsername(username);
    if (usernameValidationError) {
      setUsernameError(usernameValidationError);
      toast.error(usernameValidationError);
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

    // Validate password
    const pwd = (currentDeliveryPerson as any).password || "";
    if (!isEditing && !pwd.trim()) {
      toast.error(t("deliveryManagement.errors.enterPassword"));
      return;
    }
    if (pwd.trim() && pwd.length < 6) {
      toast.error(t("deliveryManagement.errors.passwordTooShort"));
      return;
    }

    try {
      let res;
      if (isEditing) {
        res = await (window as any).electronAPI.updateDeliveryPerson(
          token,
          currentDeliveryPerson.id,
          {
            name: currentDeliveryPerson.name,
            username: (currentDeliveryPerson as any).username,
            phone: (currentDeliveryPerson as any).phone,
            password: (currentDeliveryPerson as any).password,
            vehicleType: (currentDeliveryPerson as any).vehicleType,
            licenseNo: (currentDeliveryPerson as any).licenseNo,
            isActive: (currentDeliveryPerson as any).isActive !== false,
          }
        );
      } else {
        res = await (window as any).electronAPI.createDeliveryPerson(token, {
          name: currentDeliveryPerson.name,
          username: (currentDeliveryPerson as any).username,
          phone: (currentDeliveryPerson as any).phone,
          password: (currentDeliveryPerson as any).password,
          vehicleType: (currentDeliveryPerson as any).vehicleType || "bike",
          licenseNo: (currentDeliveryPerson as any).licenseNo,
          isActive: (currentDeliveryPerson as any).isActive !== false,
        });
      }

      if (!res.status) {
        toast.error(
          res.error.includes("UNIQUE constraint failed: delivery_persons.username")
            ? t("deliveryManagement.errors.usernameExists")
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
      setUsernameError("");
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
    const ok = await confirm({
      title: t("deliveryManagement.errors.deleteConfirm"),
      message: t("deliveryManagement.errors.deleteConfirmTitle"),
    });
    if (!ok) return;
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
      password: "",
      vehicleType: "bike",
      licenseNo: "",
      isActive: true,
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

  const filteredDeliveryPersons: DeliveryPerson[] = deliveryPersons.filter(
    (person) => {
      const matchesVehicleType =
        selectedVehicleType === "all" ||
        person.vehicleType === selectedVehicleType;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && (person as any).isActive !== false) ||
        (selectedStatus === "inactive" && (person as any).isActive === false);
      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesVehicleType && matchesStatus && matchesSearch;
    }
  );

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
      case "van":
        return "bg-pink-100 text-pink-800";
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
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-medium text-black">
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
          {t(`deliveryManagement.${person.vehicleType}`)}
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
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(person as any).isActive !== false
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
            }`}
        >
          {(person as any).isActive !== false
            ? t("deliveryManagement.active")
            : t("deliveryManagement.inactive")}
        </span>
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
          // label={t("deliveryManagement.edit")}
          variant="transparent"
          onClick={() => handleEditDeliveryPerson(person as DeliveryPerson)}
          Icon={<EditIcon className="size-5" />}
          className="text-black hover:text-black hover:bg-gray-50 hover:scale-105 !px-2 !py-1 !gap-1"
        />
        <CustomButton
          type="button"
          // label={t("deliveryManagement.delete")}
          variant="transparent"
          onClick={() => person.id && handleDeleteDeliveryPerson(person.id)}
          Icon={<DeleteIcon className="size-5" />}
          className="text-red-600 hover:text-red-900 hover:bg-red-50 hover:scale-105 !px-2 !py-1 !gap-1"
        />
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
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
            icon={<LocationIcon className="size-6 text-black" />}
            bgColor="bg-gray-100"
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
            {["all", "bike", "motorcycle", "car", "scooter", "van"].map(
              (vehicleType) => (
                <CustomButton
                  key={vehicleType}
                  type="button"
                  label={
                    vehicleType === "all"
                      ? t("deliveryManagement.all")
                      : t(`deliveryManagement.${vehicleType}`)
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
          <div className="flex gap-2 border-l border-gray-200 pl-4">
            {["all", "active", "inactive"].map((status) => (
              <CustomButton
                key={status}
                type="button"
                label={t(`deliveryManagement.${status}`)}
                onClick={() => setSelectedStatus(status)}
                variant={selectedStatus !== status ? "secondary" : "primary"}
              />
            ))}
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
            t("deliveryManagement.status"),
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
        usernameError={usernameError}
        phoneError={phoneError}
        handleUsernameChange={handleUsernameChange}
        handlePhoneChange={handlePhoneChange}
        isEditing={isEditing}
      />
    </div>
  );
};
