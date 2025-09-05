import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { toast } from "react-toastify";
import { CustomSelect } from "../components/ui/CustomSelect";

export const DeliveryManagement: React.FC<{ token: string | null }> = ({
  token,
}) => {
  const [deliveryPersons, setDeliveryPersons] = useState<
    Omit<User, "password">[]
  >([]);
  const [newDeliveryPerson, setNewDeliveryPerson] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleType: "bike",
    licenseNumber: "",
  });
  const [editingDeliveryPerson, setEditingDeliveryPerson] =
    useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("all");

  useEffect(() => {
    fetchDeliveryPersons();
  }, [token]);

  const fetchDeliveryPersons = async () => {
    try {
      setLoading(true);
      const users = await (window as any).electronAPI.getUsers(token);
      // Filter only delivery personnel
      const deliveryUsers = users.filter(
        (user: User) => user.role === "delivery"
      );
      setDeliveryPersons(deliveryUsers);
    } catch (error) {
      toast.error("Failed to fetch delivery personnel");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryPerson = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!newDeliveryPerson.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!newDeliveryPerson.email.trim()) {
      toast.error("Please enter an email");
      return;
    }
    if (!newDeliveryPerson.phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    if (!newDeliveryPerson.licenseNumber.trim()) {
      toast.error("Please enter a license number");
      return;
    }

    try {
      const userData = {
        ...newDeliveryPerson,
        role: "delivery",
      };
      const user = await (window as any).electronAPI.registerUser(userData);
      setDeliveryPersons([...deliveryPersons, user]);
      setNewDeliveryPerson({
        name: "",
        email: "",
        phone: "",
        vehicleType: "bike",
        licenseNumber: "",
      });
      setIsAddModalOpen(false);
      toast.success("Delivery person added successfully");
    } catch (error) {
      toast.error("Failed to add delivery person");
    }
  };

  const handleUpdateDeliveryPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeliveryPerson) return;

    // Validate required fields
    if (!editingDeliveryPerson.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!editingDeliveryPerson.email?.trim()) {
      toast.error("Please enter an email");
      return;
    }

    try {
      const updatedUser = await (window as any).electronAPI.updateUser(
        token,
        editingDeliveryPerson
      );
      setDeliveryPersons(
        deliveryPersons.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      setEditingDeliveryPerson(null);
      toast.success("Delivery person updated successfully");
    } catch (error) {
      toast.error("Failed to update delivery person");
    }
  };

  const handleDeleteDeliveryPerson = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this delivery person?"))
      return;

    try {
      await (window as any).electronAPI.deleteUser(token, userId);
      setDeliveryPersons(deliveryPersons.filter((u) => u.id !== userId));
      toast.success("Delivery person deleted successfully");
    } catch (error) {
      toast.error("Failed to delete delivery person");
    }
  };

  const getVehicleTypeOptions = () => [
    { value: "bike", label: "Bike" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "car", label: "Car" },
    { value: "scooter", label: "Scooter" },
  ];

  const getVehicleTypeFilterOptions = () => [
    { value: "all", label: "All Vehicles" },
    { value: "bike", label: "Bike" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "car", label: "Car" },
    { value: "scooter", label: "Scooter" },
  ];

  const filteredDeliveryPersons = deliveryPersons.filter((person) => {
    const matchesVehicleType =
      selectedVehicleType === "all" ||
      (person as any).vehicleType === selectedVehicleType;
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person as any).phone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVehicleType && matchesSearch;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[98%] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Delivery Management
              </h2>
              <p className="text-gray-600 mt-1">
                Manage delivery personnel and their vehicle information
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
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
                  Total Delivery
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
                      (person) => (person as any).vehicleType === "bike"
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
                <p className="text-sm font-medium text-gray-600">Motorcycles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    deliveryPersons.filter(
                      (person) => (person as any).vehicleType === "motorcycle"
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
                      (person) => (person as any).vehicleType === "car"
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedVehicleType("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Personnel ({filteredDeliveryPersons.length})
            </h3>
          </div>

          {filteredDeliveryPersons.length === 0 ? (
            <div className="text-center py-12">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No delivery personnel found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {deliveryPersons.length === 0
                  ? "Get started by adding your first delivery person."
                  : "Try adjusting your search or vehicle filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveryPersons.map((person) => (
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
                            <div className="text-sm text-gray-500">
                              Delivery Personnel
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleTypeBadgeColor(
                            (person as any).vehicleType || "bike"
                          )}`}
                        >
                          {getVehicleTypeLabel(
                            (person as any).vehicleType || "bike"
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {person.email || "No email"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(person as any).phone || "No phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(person as any).licenseNumber || "No license"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setEditingDeliveryPerson(person as User)
                          }
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
                          onClick={() =>
                            person.id && handleDeleteDeliveryPerson(person.id)
                          }
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Delivery Person Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add New Delivery Person</h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewDeliveryPerson({
                      name: "",
                      email: "",
                      phone: "",
                      vehicleType: "bike",
                      licenseNumber: "",
                    });
                  }}
                  className="text-white hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleAddDeliveryPerson} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newDeliveryPerson.name}
                    onChange={(e) =>
                      setNewDeliveryPerson({
                        ...newDeliveryPerson,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newDeliveryPerson.email}
                    onChange={(e) =>
                      setNewDeliveryPerson({
                        ...newDeliveryPerson,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newDeliveryPerson.phone}
                    onChange={(e) =>
                      setNewDeliveryPerson({
                        ...newDeliveryPerson,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    value={newDeliveryPerson.licenseNumber}
                    onChange={(e) =>
                      setNewDeliveryPerson({
                        ...newDeliveryPerson,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Enter license number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type *
                  </label>
                  <CustomSelect
                    options={getVehicleTypeOptions()}
                    value={newDeliveryPerson.vehicleType}
                    onChange={(value: string) =>
                      setNewDeliveryPerson({
                        ...newDeliveryPerson,
                        vehicleType: value,
                      })
                    }
                    placeholder="Select vehicle type"
                    portalClassName="vehicle-type-dropdown-portal"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewDeliveryPerson({
                      name: "",
                      email: "",
                      phone: "",
                      vehicleType: "bike",
                      licenseNumber: "",
                    });
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  Add Delivery Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Delivery Person Modal */}
      {editingDeliveryPerson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Edit Delivery Person</h3>
                <button
                  onClick={() => setEditingDeliveryPerson(null)}
                  className="text-white hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateDeliveryPerson} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editingDeliveryPerson.name}
                    onChange={(e) =>
                      setEditingDeliveryPerson({
                        ...editingDeliveryPerson,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingDeliveryPerson.email || ""}
                    onChange={(e) =>
                      setEditingDeliveryPerson({
                        ...editingDeliveryPerson,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={(editingDeliveryPerson as any).phone || ""}
                    onChange={(e) =>
                      setEditingDeliveryPerson({
                        ...editingDeliveryPerson,
                        phone: e.target.value,
                      } as any)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={(editingDeliveryPerson as any).licenseNumber || ""}
                    onChange={(e) =>
                      setEditingDeliveryPerson({
                        ...editingDeliveryPerson,
                        licenseNumber: e.target.value,
                      } as any)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Enter license number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type
                  </label>
                  <CustomSelect
                    options={getVehicleTypeOptions()}
                    value={(editingDeliveryPerson as any).vehicleType || "bike"}
                    onChange={(value: string) =>
                      setEditingDeliveryPerson({
                        ...editingDeliveryPerson,
                        vehicleType: value,
                      } as any)
                    }
                    placeholder="Select vehicle type"
                    portalClassName="edit-vehicle-type-dropdown-portal"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setEditingDeliveryPerson(null)}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  Update Delivery Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
