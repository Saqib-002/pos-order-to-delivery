import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { CustomSelect } from "@/renderer/components/ui/CustomSelect";
import CustomButton from "@/renderer/components/ui/CustomButton";
import { CrossIcon } from "@/renderer/public/Svg";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Power,
  UserCheck,
  UserX,
} from "lucide-react";

export interface CustomerAddress {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface WebCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryNotes?: string | null;
  addresses?: CustomerAddress[];
}

interface CustomerListResponse {
  customers: WebCustomer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

type StatusFilter = "all" | "active" | "inactive";
type VerifiedFilter = "all" | "verified" | "unverified";

export const WebCustomersTab: React.FC = () => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<WebCustomer[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");
  const [showDeleted, setShowDeleted] = useState(false);

  // Customer Modal details
  const [modalCustomer, setModalCustomer] = useState<WebCustomer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(
    async (
      page: number,
      q: string,
      status: StatusFilter,
      verified: VerifiedFilter,
      deleted: boolean
    ) => {
      setLoading(true);
      setLoadError("");
      try {
        const queryParams: Record<string, any> = { page, limit: 20 };
        if (q.trim()) queryParams.search = q.trim();
        if (deleted) queryParams.deleted = "true";
        if (!deleted && status !== "all") queryParams.isActive = status === "active" ? "true" : "false";
        if (verified !== "all") queryParams.isVerified = verified === "verified" ? "true" : "false";

        if ((window as any).electronAPI?.getWebCustomers) {
          const res = await (window as any).electronAPI.getWebCustomers(token, queryParams);
          if (res?.status && res?.data) {
            setCustomers(res.data.customers || []);
            setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
          } else {
            throw new Error(res?.message || "Failed to fetch");
          }
        }
      } catch {
        setLoadError(t("webAdmin.customers.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [token, t]
  );

  useEffect(() => {
    fetchCustomers(1, "", statusFilter, verifiedFilter, showDeleted);
  }, [fetchCustomers]);

  useEffect(() => {
    fetchCustomers(1, search, statusFilter, verifiedFilter, showDeleted);
  }, [statusFilter, verifiedFilter, showDeleted]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(1, val, statusFilter, verifiedFilter, showDeleted);
    }, 350);
  };

  const handleToggleStatus = async (customer: WebCustomer) => {
    const isActivating = !customer.isActive;
    const confirmed = await confirm({
      title: isActivating
        ? t("webAdmin.customers.activate", "Activar Cliente")
        : t("webAdmin.customers.deactivate", "Desactivar Cliente"),
      message: isActivating
        ? `¿Deseas activar la cuenta de "${customer.name}"? Podrá iniciar sesión y realizar pedidos.`
        : `¿Deseas desactivar la cuenta de "${customer.name}"? No podrá acceder a la plataforma.`,
      type: isActivating ? "info" : "danger",
      confirmText: isActivating
        ? t("webAdmin.customers.activate", "Activar")
        : t("webAdmin.customers.deactivate", "Desactivar"),
      cancelText: t("webAdmin.common.cancel", "Cancelar"),
    });

    if (!confirmed) return;

    try {
      if ((window as any).electronAPI?.updateWebCustomer) {
        const res = await (window as any).electronAPI.updateWebCustomer(token, customer.id, {
          isActive: isActivating,
        });
        if (!res?.status) throw new Error(res?.message);
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: isActivating } : c))
        );
        if (modalCustomer?.id === customer.id) {
          setModalCustomer((prev) => (prev ? { ...prev, isActive: isActivating } : null));
        }
        toast.success(
          isActivating
            ? t("webAdmin.customers.statusActive")
            : t("webAdmin.customers.statusInactive")
        );
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    }
  };

  const handleSoftDelete = async (customer: WebCustomer) => {
    const confirmed = await confirm({
      title: t("webAdmin.customers.delete", "Eliminar Cliente"),
      message: t("webAdmin.customers.deleteConfirm"),
      type: "danger",
      confirmText: t("webAdmin.customers.delete", "Eliminar"),
      cancelText: t("webAdmin.common.cancel", "Cancelar"),
    });

    if (!confirmed) return;

    try {
      if ((window as any).electronAPI?.deleteWebCustomer) {
        const res = await (window as any).electronAPI.deleteWebCustomer(token, customer.id);
        if (!res?.status) throw new Error(res?.message);
        toast.success(t("webAdmin.customers.delete"));
        fetchCustomers(pagination.page, search, statusFilter, verifiedFilter, showDeleted);
        if (modalCustomer?.id === customer.id) setModalCustomer(null);
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    }
  };

  const handleRestore = async (customer: WebCustomer) => {
    const confirmed = await confirm({
      title: t("webAdmin.customers.restore", "Restaurar Cliente"),
      message: t("webAdmin.customers.restoreConfirm"),
      type: "info",
      confirmText: t("webAdmin.customers.restore", "Restaurar"),
      cancelText: t("webAdmin.common.cancel", "Cancelar"),
    });

    if (!confirmed) return;

    try {
      if ((window as any).electronAPI?.restoreWebCustomer) {
        const res = await (window as any).electronAPI.restoreWebCustomer(token, customer.id);
        if (!res?.status) throw new Error(res?.message);
        toast.success(t("webAdmin.customers.restore"));
        fetchCustomers(pagination.page, search, statusFilter, verifiedFilter, showDeleted);
        if (modalCustomer?.id === customer.id) setModalCustomer(null);
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    }
  };

  const openCustomerDetails = async (customer: WebCustomer) => {
    setModalCustomer(customer);
    setModalLoading(true);
    try {
      if ((window as any).electronAPI?.getWebCustomerById) {
        const res = await (window as any).electronAPI.getWebCustomerById(token, customer.id);
        if (res?.status && res?.data) {
          setModalCustomer(res.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* ── Search & Filter Controls ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("webAdmin.customers.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />
        </div>

        {/* CustomSelect Filters */}
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
          <div className="w-48">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as StatusFilter)}
              options={[
                { value: "all", label: `${t("webAdmin.customers.filterStatus")}: ${t("webAdmin.customers.filterAll")}` },
                { value: "active", label: t("webAdmin.customers.filterActive") },
                { value: "inactive", label: t("webAdmin.customers.filterInactive") },
              ]}
              className="text-xs"
            />
          </div>

          <div className="w-52">
            <CustomSelect
              value={verifiedFilter}
              onChange={(val) => setVerifiedFilter(val as VerifiedFilter)}
              options={[
                { value: "all", label: `${t("webAdmin.customers.filterVerification")}: ${t("webAdmin.customers.filterAll")}` },
                { value: "verified", label: t("webAdmin.customers.filterVerified") },
                { value: "unverified", label: t("webAdmin.customers.filterUnverified") },
              ]}
              className="text-xs"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors h-[38px]">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-black focus:ring-black border-gray-300 cursor-pointer"
            />
            <span>{t("webAdmin.customers.showDeleted")}</span>
          </label>
        </div>
      </div>

      {/* ── Customers Table ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          /* ── Skeleton Loading Rows ── */
          <div className="p-4 space-y-3">
            <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50/80 rounded-lg animate-pulse flex items-center justify-between px-4"
              >
                <div className="w-36 h-3 bg-gray-200 rounded" />
                <div className="w-48 h-3 bg-gray-200 rounded" />
                <div className="w-24 h-3 bg-gray-200 rounded" />
                <div className="w-16 h-5 bg-gray-200 rounded-full" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
                <div className="w-24 h-7 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="py-12 text-center text-xs text-red-600">
            {loadError}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">{t("webAdmin.customers.noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">{t("webAdmin.customers.colName")}</th>
                  <th className="px-4 py-3.5">{t("webAdmin.customers.colEmail")}</th>
                  <th className="px-4 py-3.5">{t("webAdmin.customers.colPhone")}</th>
                  <th className="px-4 py-3.5">{t("webAdmin.customers.colStatus")}</th>
                  <th className="px-4 py-3.5">{t("webAdmin.customers.colVerified")}</th>
                  <th className="px-4 py-3.5">{t("webAdmin.customers.colRegistered")}</th>
                  <th className="px-4 py-3.5 text-right">{t("webAdmin.customers.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const isDeleted = !!c.deletedAt;
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isDeleted ? "opacity-60 bg-red-50/30" : ""
                      }`}
                    >
                      <td
                        onClick={() => openCustomerDetails(c)}
                        className="px-4 py-3 font-semibold text-gray-900 cursor-pointer hover:underline flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 border border-slate-200">
                          {c.name ? c.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="truncate">{c.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {c.isActive
                            ? t("webAdmin.customers.statusActive")
                            : t("webAdmin.customers.statusInactive")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t("webAdmin.customers.verifiedYes")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 font-medium text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            {t("webAdmin.customers.verifiedNo")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <CustomButton
                            type="button"
                            variant="transparent"
                            onClick={() => openCustomerDetails(c)}
                            Icon={<Eye className="size-4" />}
                            className="p-1"
                          />

                          {/* Toggle Active/Inactive Action Button */}
                          {!isDeleted && (
                            <CustomButton
                              type="button"
                              label={
                                c.isActive
                                  ? t("webAdmin.customers.deactivate", "Desactivar")
                                  : t("webAdmin.customers.activate", "Activar")
                              }
                              variant="secondary"
                              onClick={() => handleToggleStatus(c)}
                              Icon={
                                c.isActive ? (
                                  <UserX className="size-3.5 text-red-700" />
                                ) : (
                                  <UserCheck className="size-3.5 text-emerald-700" />
                                )
                              }
                              className={`!px-2.5 !py-1 !text-xs !gap-1 ${
                                c.isActive
                                  ? "!text-red-800 hover:!bg-red-100"
                                  : "!text-emerald-800 hover:!bg-emerald-100"
                              }`}
                            />
                          )}

                          {/* Delete / Restore Button */}
                          {isDeleted ? (
                            <CustomButton
                              type="button"
                              label={t("webAdmin.customers.restore")}
                              variant="secondary"
                              onClick={() => handleRestore(c)}
                              Icon={<RotateCcw className="size-3.5 text-emerald-600" />}
                              className="!px-2.5 !py-1 !text-xs !gap-1 text-emerald-700"
                            />
                          ) : (
                            <CustomButton
                              type="button"
                              label={t("webAdmin.customers.delete")}
                              variant="red"
                              onClick={() => handleSoftDelete(c)}
                              Icon={<Trash2 className="size-3.5" />}
                              className="!px-2.5 !py-1 !text-xs !gap-1"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-xs text-gray-600">
            <span>
              {t("webAdmin.common.total")}: {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  fetchCustomers(
                    pagination.page - 1,
                    search,
                    statusFilter,
                    verifiedFilter,
                    showDeleted
                  )
                }
                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold px-2">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  fetchCustomers(
                    pagination.page + 1,
                    search,
                    statusFilter,
                    verifiedFilter,
                    showDeleted
                  )
                }
                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── POS-Standard Customer Details Modal ── */}
      {modalCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Standard POS Gradient Header */}
            <div className="bg-linear-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/15 text-white font-bold text-lg flex items-center justify-center border border-white/20">
                    {modalCustomer.name ? modalCustomer.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{modalCustomer.name}</h3>
                    <p className="text-xs text-white/70 font-mono">ID: {modalCustomer.id}</p>
                  </div>
                </div>
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => setModalCustomer(null)}
                  Icon={<CrossIcon className="size-6" />}
                  className="text-white hover:text-gray-300 p-2! rounded-full! hover:bg-white/20"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Account Information Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{t("webAdmin.customers.colEmail")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{modalCustomer.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t("webAdmin.customers.colPhone")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{modalCustomer.phone || "—"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t("webAdmin.customers.colRegistered")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(modalCustomer.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-medium mb-1">{t("webAdmin.customers.colStatus")}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        modalCustomer.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {modalCustomer.isActive
                        ? t("webAdmin.customers.statusActive")
                        : t("webAdmin.customers.statusInactive")}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        modalCustomer.isVerified
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {modalCustomer.isVerified
                        ? t("webAdmin.customers.verifiedYes")
                        : t("webAdmin.customers.verifiedNo")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Notes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-gray-700" />
                  <span>{t("webAdmin.customers.drawerNotes")}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 leading-relaxed">
                  {modalCustomer.deliveryNotes || (
                    <span className="text-gray-400 italic">
                      {t("webAdmin.customers.drawerNoNotes")}
                    </span>
                  )}
                </div>
              </div>

              {/* Saved Addresses */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{t("webAdmin.customers.drawerAddress")}</span>
                </div>
                {modalCustomer.addresses && modalCustomer.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalCustomer.addresses.map((a) => (
                      <div
                        key={a.id}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 space-y-1"
                      >
                        <p className="font-bold text-gray-900">{a.street}</p>
                        <p className="text-gray-500">
                          {a.city}, {a.postalCode}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-200 rounded-xl p-4">
                    {t("webAdmin.customers.drawerNoAddress")}
                  </p>
                )}
              </div>
            </div>

            {/* Standard POS Footer */}
            <div className="flex justify-between items-center px-8 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
              <CustomButton
                type="button"
                label={
                  modalCustomer.isActive
                    ? t("webAdmin.customers.deactivate", "Desactivar Cuenta")
                    : t("webAdmin.customers.activate", "Activar Cuenta")
                }
                variant="secondary"
                onClick={() => handleToggleStatus(modalCustomer)}
                Icon={
                  modalCustomer.isActive ? (
                    <UserX className="size-4 text-red-700" />
                  ) : (
                    <UserCheck className="size-4 text-emerald-700" />
                  )
                }
              />
              <CustomButton
                type="button"
                label={t("webAdmin.common.close")}
                variant="primary"
                onClick={() => setModalCustomer(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebCustomersTab;
