import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { toast } from "react-toastify";
import { CustomSelect } from "../components/ui/CustomSelect";
import { useAuth } from "../contexts/AuthContext";
import { AddIcon, CrossIcon, DeleteIcon, EditIcon, GroupIcon, GroupIcon2, OfficeBuilding, SearchIcon, ShieldCheck } from "../assets/Svg";
import CustomButton from "../components/ui/CustomButton";
import { StatsCard } from "../components/shared/StatsCard.order";
import CustomInput from "../components/shared/CustomInput";
import { useTranslation } from 'react-i18next';

export const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "staff",
    id: "",
  });
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [emailError, setEmailError] = useState("");
  const { auth: { token } } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return t('userManagement.validation.emailRequired');
    }
    if (!emailRegex.test(email)) {
      return t('userManagement.validation.emailInvalid');
    }
    return "";
  };

  // Handle email change
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    if (emailError) {
      setEmailError("");
    }
  };

  // Handle email blur
  const handleEmailBlur = () => {
    const error = validateEmail(formData.email);
    setEmailError(error);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await (window as any).electronAPI.getUsers(token);
      if (!res.status) {
        toast.error(res.error || t('userManagement.messages.fetchFailed'));
        return;
      }
      setUsers(res.data);
    } catch (error) {
      toast.error(t('userManagement.messages.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.username.trim()) {
      toast.error(t('userManagement.validation.usernameRequired'));
      return;
    }
    if (!formData.name.trim()) {
      toast.error(t('userManagement.validation.nameRequired'));
      return;
    }

    // Validate email
    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      toast.error(emailValidationError);
      return;
    }

    if (modalMode === "add") {
      if (!formData.password.trim()) {
        toast.error(t('userManagement.validation.passwordRequired'));
        return;
      }

      try {
        const res = await (window as any).electronAPI.registerUser(
          token,
          {
            username: formData.username,
            password: formData.password,
            name: formData.name,
            email: formData.email,
            role: formData.role,
          }
        );
        if (!res.status) {
          toast.error(
            res.error.includes("UNIQUE constraint failed: users.username")
              ? t('userManagement.messages.usernameTaken')
              : t('userManagement.messages.addFailed')
          );
          return;
        }
        const user = res.data;
        setUsers([...users, user]);
        resetForm();
        setIsModalOpen(false);
        toast.success(t('userManagement.messages.added'));
      } catch (error) {
        toast.error(t('userManagement.messages.addFailed'));
      }
    } else {
      try {
        const res = await (window as any).electronAPI.updateUser(
          token,
          formData
        );
        if (!res.status) {
          toast.error(
            res.error.includes("UNIQUE constraint failed: users.username")
              ? t('userManagement.messages.usernameTaken')
              : t('userManagement.messages.updateFailed')
          );
          return;
        }
        setUsers(users.map((u) => (u.id === res.data.id ? res.data : u)));
        setIsModalOpen(false);
        toast.success(t('userManagement.messages.updated'));
      } catch (error) {
        toast.error(t('userManagement.messages.updateFailed'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "staff",
      id: "",
    });
    setEmailError("");
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('userManagement.deleteConfirmMessage'))) return;

    try {
      const res = await (window as any).electronAPI.deleteUser(token, userId);
      if (!res.status) {
        toast.error(res.error || t('userManagement.messages.deleteFailed'));
        return;
      }
      setUsers(users.filter((u) => u.id !== userId));
      toast.success(t('userManagement.messages.deleted'));
    } catch (error) {
      toast.error(t('userManagement.messages.deleteFailed'));
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setFormData({
      id: user?.id || "",
      username: user.username,
      name: user.name,
      email: user.email || "",
      role: user.role,
      password: "",
    });
    setEmailError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmailError("");
  };

  const getRoleOptions = () => [
    { value: "admin", label: t('userManagement.roles.admin') },
    { value: "staff", label: t('userManagement.roles.staff') },
    { value: "kitchen", label: t('userManagement.roles.kitchen') },
    { value: "manager", label: t('userManagement.roles.manager') },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleLabel = (role: string) => {
    try {
      return t(`userManagement.roles.${role}`) || (role.charAt(0).toUpperCase() + role.slice(1));
    } catch {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "staff":
        return "bg-blue-100 text-blue-800";
      case "kitchen":
        return "bg-orange-100 text-orange-800";
      case "manager":
        return "bg-green-100 text-green-800";
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
    <div className="p-6 bg-gray-50">
      <div className="max-w-[98%] mx-auto">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('userManagement.title')}
            </h2>
            <p className="text-gray-600 mt-1">
              {t('userManagement.subtitle')}
            </p>
          </div>
          <CustomButton onClick={openAddModal} type="button" label={t('userManagement.addUser')} Icon={<AddIcon className="size-5" />} className="whitespace-nowrap" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard title={t('userManagement.totalUsers')} value={users.length} icon={<GroupIcon className="size-6 text-indigo-600" />} bgColor="bg-indigo-100" />
          <StatsCard title={t('userManagement.admins')} value={users.filter((user) => user.role === "admin").length} icon={<ShieldCheck className="size-6 text-red-600" />} bgColor="bg-red-100" />
          <StatsCard title={t('userManagement.staff')} value={users.filter((user) => user.role === "staff").length} icon={<GroupIcon2 className="size-6 text-blue-600" />} bgColor="bg-blue-100" />
          <StatsCard title={t('userManagement.kitchenManager')} value={users.filter((user) => user.role === "kitchen" || user.role === "manager").length} icon={<OfficeBuilding className="size-6 text-orange-600" />} bgColor="bg-orange-100" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <CustomInput placeholder={t('userManagement.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="text" name="search" preLabel={<SearchIcon className="size-5 text-gray-400" />} inputClasses="pl-9 !shadow-none focus:!ring-1 text-sm" otherClasses="flex-1" />
          <div className="flex gap-2">
            {["all", "admin", "staff", "kitchen", "manager"].map((role) => (
              <CustomButton key={role} type="button" label={getRoleLabel(role)} onClick={() => setSelectedRole(role)} variant={selectedRole !== role ? "secondary" : "primary"} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <GroupIcon className="size-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {t('userManagement.noUsersTitle')}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {users.length === 0
                    ? t('userManagement.noUsersFirst')
                    : t('userManagement.noUsersTry')}
                </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userManagement.table.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userManagement.table.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userManagement.table.email')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userManagement.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email || t('userManagement.noEmail', 'No email')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
                        <CustomButton type="button" label={t('common.edit', 'Edit')} variant="transparent" onClick={() => openEditModal(user as User)} Icon={<EditIcon className="size-4" />} className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 hover:scale-105 !px-2 !py-1 !gap-1" />
                        <CustomButton type="button" label={t('common.delete', 'Delete')} variant="transparent" onClick={() => user.id && handleDeleteUser(user.id)} Icon={<DeleteIcon className="size-4" />} className="text-red-600 hover:text-red-900 hover:bg-red-50 hover:scale-105 !px-2 !py-1 !gap-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{modalMode === "add" ? t('userManagement.modal.addNew') : t('userManagement.modal.edit')}</h3>
                <CustomButton type="button" variant="transparent" onClick={closeModal} Icon={<CrossIcon className="size-6" />} className="text-white hover:text-indigo-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20" />
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomInput label={`${t('userManagement.modal.username')} *`} type="text" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder={t('userManagement.modal.username')} inputClasses="py-3 px-4" />
                <CustomInput label={modalMode === "add" ? `${t('userManagement.modal.password')} *` : t('userManagement.modal.newPassword')} type="password" name="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={modalMode === "add" ? t('userManagement.modal.password') : t('userManagement.modal.newPassword')} inputClasses="py-3 px-4" />
                <CustomInput label={`${t('userManagement.modal.fullName')} *`} type="text" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('userManagement.modal.fullName')} inputClasses="py-3 px-4" />
                <CustomInput label={`${t('userManagement.modal.email')} *`} type="email" name="email" value={formData.email} onChange={(e) => handleEmailChange(e.target.value)} placeholder={t('userManagement.modal.email')} inputClasses={`py-3 px-4 ${emailError ? "border-red-300 focus:!ring-1 focus:ring-red-600 focus:border-red-600" : "border-gray-300 focus:ring-indigo-600 focus:border-indigo-600"}`} onBlur={handleEmailBlur} error={emailError} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('userManagement.modal.role')} *
                  </label>
                  <CustomSelect
                    options={getRoleOptions()}
                    value={formData.role}
                    onChange={(value: string) =>
                      setFormData({ ...formData, role: value as any })
                    }
                    placeholder={t('userManagement.modal.role')}
                    portalClassName="role-dropdown-portal"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <CustomButton type="button" variant="secondary" onClick={closeModal} label={t('userManagement.modal.cancel')} className="hover:scale-105" />
                <CustomButton type="submit" variant="primary" label={modalMode === "add" ? t('userManagement.modal.add') : t('userManagement.modal.update')} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105" />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};