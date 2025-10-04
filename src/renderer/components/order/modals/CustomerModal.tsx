import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import AddIcon from "../../../assets/icons/add.svg?react";
import { useEffect, useState } from "react";
import AddressModal from "./AddressModal";
import { Tooltip } from "react-tooltip";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { Customer } from "@/types/order";

interface CustomerModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCustomerCreated?: (customer: Customer) => void;
}

const CustomerModal = ({
  setIsOpen,
  onCustomerCreated,
}: CustomerModalProps) => {
  const [address, setAddress] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const {auth:{token}}=useAuth();
  const fetchCustomers = debounce(async (phone: string) => {
    if (!phone || phone.length < 3) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await (window as any).electronAPI.getCustomersByPhone(
        token,
        phone
      );
      if (res.status) {
        setCustomers(res.data);
        setShowDropdown(true);
      } else {
        setCustomers([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setShowDropdown(false);
    }
  }, 500);
  useEffect(() => {
    if (!isSelected) {
      fetchCustomers(phone);
    } else {
      setCustomers([]);
      setShowDropdown(false);
    }
    return () => {
      fetchCustomers.cancel();
    };
  }, [phone]);
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setIsSelected(false);
  };
  const handlePhoneBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };
  const handleCustomerSelect = (customer: Customer) => {
    fetchCustomers.cancel();
    setIsSelected(true);
    setPhone(customer.phone);
    setAddress(customer.address || "");
    setShowDropdown(false);
    const form = document.querySelector("form");
    if (form) {
      (form.querySelector("[name='name']") as HTMLInputElement).value =
        customer.name || "";
      (form.querySelector("[name='cif']") as HTMLInputElement).value =
        customer.cif || "";
      (form.querySelector("[name='email']") as HTMLInputElement).value =
        customer.email || "";
      (form.querySelector("[name='comments']") as HTMLTextAreaElement).value =
        customer.comments || "";
      setIsEditing(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here, e.g., add customer to order
    const formData = new FormData(e.target as HTMLFormElement);
    const customer = Object.fromEntries(formData.entries());
    customer.address = address;
    let res;
    if (!isEditing) {
      res = await (window as any).electronAPI.createCustomer(token, customer);
    } else {
      res = await (window as any).electronAPI.upsertCustomer(token, customer);
    }
    if (!res.status) {
      if (res.error.includes("customers_phone_unique")) {
        toast.error("Customer already exists");
        return;
      }
      toast.error(
        isEditing ? "Failed to edit customer" : "Failed to add customer"
      );
      return;
    }

    // Call the callback with the created customer data
    if (onCustomerCreated && !isEditing) {
      const createdCustomer: Customer = {
        id: res.data.id,
        name: customer.name as string,
        phone: customer.phone as string,
        address: customer.address as string,
        cif: customer.cif as string,
        email: customer.email as string,
        comments: customer.comments as string,
        createdAt: res.data.createdAt,
        updatedAt: res.data.updatedAt,
      };
      onCustomerCreated(createdCustomer);
    } else {
      setIsOpen(false);
    }
  };
  const formatAddress = (address: string) => {
    if (!address) return "";
    const parts = address.split("|");
    return (
      parts
        .map((item, index) => {
          if (index === 1) return null;
          const value = item.split("=")[1];
          return value || "";
        })
        .filter(Boolean)
        .join(", ") +
      ", " +
      (parts[1]?.split("=")[1] || "")
    );
  };
  return (
    <>
      {isAddressModalOpen && (
        <AddressModal
          setIsOpen={setIsAddressModalOpen}
          setAddress={setAddress}
        />
      )}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-indigo-500">
              Add Customer
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <CustomInput
                type="tel"
                name="phone"
                label="Phone"
                placeholder="+1 (555) 123-4567"
                required
                otherClasses="mb-4"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {customers.map((customer, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                      {customer.address && (
                        <p className="text-sm text-gray-500 truncate">
                          {formatAddress(customer.address)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                type="text"
                name="name"
                label="Name"
                placeholder="John Doe"
                required
                otherClasses="mb-4 col-span-2"
              />
              <CustomInput
                type="text"
                name="cif"
                label="CIF/DNI"
                placeholder="12345678Z"
                otherClasses="mb-4 col-span-1"
              />
            </div>
            <CustomInput
              type="email"
              name="email"
              label="Email"
              placeholder="zOg2Q@example.com"
              otherClasses="mb-4"
            />
            <div className="mb-4">
              <label
                htmlFor="comments"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                placeholder="comments"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address
              </label>
              {address ? (
                <>
                  <Tooltip id="address-tooltip" place="bottom" />
                  <p
                    className="text-gray-800 whitespace-nowrap truncate max-w-full w-max"
                    data-tooltip-id="address-tooltip"
                    data-tooltip-content={formatAddress(address)}
                  >
                    {formatAddress(address)}
                  </p>
                </>
              ) : (
                <CustomButton
                  Icon={<AddIcon className="text-lg" />}
                  onClick={() => setIsAddressModalOpen(true)}
                  type="button"
                  label="Add Address"
                  variant="transparent"
                />
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <CustomButton
                label="Cancel"
                variant="secondary"
                onClick={() => setIsOpen(false)}
                type="button"
              />
              <CustomButton label="Add Customer" type="submit" />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CustomerModal;
