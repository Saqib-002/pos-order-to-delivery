import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { DeliveryPerson } from "@/types/delivery";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/shared/Header.order";
import { OrderTable } from "../components/shared/OrderTable";
import { DeliveryPersonModal } from "../components/delivery/modals/DeliveryPersonModal";
import DeliveredIcon from "../assets/icons/delivered.svg?react";

export const DeliveryManagement = () => {
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
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Phone validation function
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9\s\-\(\)\+]*$/;
    if (!phone.trim()) {
      return "Phone number is required";
    }
    if (!phoneRegex.test(phone)) {
      return "Please enter a valid phone number";
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return "Phone number must have at least 10 digits";
    }
    if (digitsOnly.length > 15) {
      return "Phone number cannot exceed 15 digits";
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
        toast.error("Failed to fetch delivery personnel");
        return;
      }
      setDeliveryPersons(res.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch delivery personnel");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeliveryPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeliveryPerson) return;

    // Validate required fields
    if (!currentDeliveryPerson.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!(currentDeliveryPerson as any).licenseNo?.trim()) {
      toast.error("Please enter a license number");
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
            ? "Email already exists"
            : `Failed to ${isEditing ? "update" : "add"} delivery person`
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
        `Delivery person ${isEditing ? "updated" : "added"} successfully`
      );
    } catch (error) {
      toast.error(`Failed to ${isEditing ? "update" : "add"} delivery person`);
    }
  };

  const handleDeleteDeliveryPerson = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this delivery person?"))
      return;
    try {
      const statsRes = await (window as any).electronAPI.getDeliveryPersonStats(
        token,
        userId
      );
      if (!statsRes.status) {
        toast.error("Failed to fetch delivery person stats");
        return;
      }
      if (statsRes.data.totalAssigned > 0) {
        alert(
          `Cannot delete delivery person with ${statsRes.data.totalAssigned} assigned orders`
        );
        return;
      }
      const res = await (window as any).electronAPI.deleteDeliveryPerson(
        token,
        userId
      );
      if (!res.status) {
        toast.error("Failed to delete delivery person");
        return;
      }
      await fetchDeliveryPersons();
      toast.success("Delivery person deleted successfully");
    } catch (error) {
      toast.error("Failed to delete delivery person");
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
    { value: "bike", label: "Bike" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "car", label: "Car" },
    { value: "scooter", label: "Scooter" },
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
            <div className="text-sm font-medium text-gray-900">
              {person.name}
            </div>
            <div className="text-sm text-gray-500">Delivery Personnel</div>
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
        <div className="text-sm text-gray-900">{person.email || "-"}</div>
        <div className="text-sm text-gray-500">{person.phone || "-"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{person.licenseNo || "-"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{person.totalAssigned || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {person.totalDelivered || 0}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {person.totalCancelled || 0}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {person.avgDeliveryTime
            ? `${person.avgDeliveryTime.toFixed(2)}min`
            : "0min"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
        <button
          onClick={() => handleEditDeliveryPerson(person as DeliveryPerson)}
          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </button>
        <button
          onClick={() => person.id && handleDeleteDeliveryPerson(person.id)}
          className="text-red-600 hover:text-red-900 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
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
    <div className="h-screen flex flex-col">
      <Header
        title="Delivery Management"
        subtitle="Manage delivery personnel and their vehicle information"
        icon={<DeliveredIcon className="size-8 text-blue-600" />}
        iconbgClasses="bg-blue-100"
      />
      <div className="flex-1">
        <div className="pb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery Personnel
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add and manage delivery staff
                </p>
              </div>
              <button
                onClick={handleAddDeliveryPerson}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer hover:scale-105"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Delivery Person
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Delivery Personnel
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deliveryPersons.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bikes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      deliveryPersons.filter(
                        (person) => person.vehicleType === "bike"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Motorcycles
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      deliveryPersons.filter(
                        (person) => person.vehicleType === "motorcycle"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cars</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      deliveryPersons.filter(
                        (person) => person.vehicleType === "car"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search delivery personnel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedVehicleType("all")}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    selectedVehicleType === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Vehicles
                </button>
                {["bike", "motorcycle", "car", "scooter"].map((vehicleType) => (
                  <button
                    key={vehicleType}
                    onClick={() => setSelectedVehicleType(vehicleType)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      selectedVehicleType === vehicleType
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {getVehicleTypeLabel(vehicleType)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Personnel Table */}
          <OrderTable
            title={`Delivery Personnel (${filteredDeliveryPersons.length})`}
            subtitle={
              filteredDeliveryPersons.length === 0
                ? deliveryPersons.length === 0
                  ? "Get started by adding your first delivery person."
                  : "Try adjusting your search or vehicle filter."
                : undefined
            }
            columns={[
              "Delivery Person",
              "Vehicle",
              "Contact",
              "License",
              "Total Assigned",
              "Total Delivered",
              "Total Cancelled",
              "Avg. Delivery Time",
              "Actions",
            ]}
            data={filteredDeliveryPersons}
            renderRow={renderDeliveryPersonRow}
            emptyStateIcon={
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
            emptyStateTitle="No delivery personnel found"
          />
        </div>
      </div>

      {/* Delivery Person Modal */}
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
