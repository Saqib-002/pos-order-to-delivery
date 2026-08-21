import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { CustomSelect } from "@/renderer/components/ui/CustomSelect";
import CustomButton from "@/renderer/components/ui/CustomButton";
import {
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Send,
  CheckCircle2,
  RotateCcw,
  Loader2,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  CornerDownLeft,
  User,
  Inbox,
} from "lucide-react";

export interface ConversationSummary {
  id: string;
  customerId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  subject: string;
  type: "general" | "complaint" | "suggestion";
  status: "open" | "closed";
  lastMessageAt: string;
  createdAt: string;
  displayName: string;
  displayEmail: string;
  lastMessage: { body: string; sender: string; createdAt: string } | null;
  unreadCount: number;
}

export interface SupportMessage {
  id: string;
  sender: "customer" | "admin";
  body: string;
  readByAdmin: boolean;
  readByCustomer: boolean;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: SupportMessage[];
}

type StatusFilter = "all" | "open" | "closed";
type TypeFilter = "all" | "general" | "complaint" | "suggestion";

export const SupportTab: React.FC = () => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const confirm = useConfirm();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Selected active conversation
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<ConversationDetail | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversations = useCallback(
    async (
      page: number,
      q: string,
      status: StatusFilter,
      type: TypeFilter
    ) => {
      setLoading(true);
      setLoadError("");
      try {
        const queryParams: Record<string, any> = { page, limit: 20 };
        if (q.trim()) queryParams.search = q.trim();
        if (status !== "all") queryParams.status = status;
        if (type !== "all") queryParams.type = type;

        if ((window as any).electronAPI?.getSupportConversations) {
          const res = await (window as any).electronAPI.getSupportConversations(token, queryParams);
          if (res?.status && res?.data) {
            const list: ConversationSummary[] = res.data.conversations || [];
            setConversations(list);
            setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
          } else {
            throw new Error(res?.message || "Failed to fetch");
          }
        }
      } catch {
        setLoadError(t("webAdmin.support.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [token, t ]
  );

  useEffect(() => {
    fetchConversations(1, "", statusFilter, typeFilter);
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations(1, search, statusFilter, typeFilter);
  }, [statusFilter, typeFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchConversations(1, val, statusFilter, typeFilter);
    }, 350);
  };

  // Background polling timer for active conversation (every 6 seconds)
  useEffect(() => {
    if (!selectedConvId) return;

    const interval = setInterval(async () => {
      try {
        if ((window as any).electronAPI?.getSupportMessages) {
          const res = await (window as any).electronAPI.getSupportMessages(token, selectedConvId);
          if (res?.status && res?.data) {
            setActiveConv((prev) => {
              if (!prev || prev.id !== selectedConvId) return res.data;
              if (res.data.messages?.length !== prev.messages?.length) {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
                return res.data;
              }
              return prev;
            });
          }
        }
      } catch {
        // silently ignore background poll errors
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [selectedConvId, token]);

  // Background polling timer for conversations list (every 15 seconds)
  useEffect(() => {
    const listInterval = setInterval(async () => {
      try {
        const queryParams: Record<string, any> = { page: pagination.page, limit: 20 };
        if (search.trim()) queryParams.search = search.trim();
        if (statusFilter !== "all") queryParams.status = statusFilter;
        if (typeFilter !== "all") queryParams.type = typeFilter;

        if ((window as any).electronAPI?.getSupportConversations) {
          const res = await (window as any).electronAPI.getSupportConversations(token, queryParams);
          if (res?.status && res?.data?.conversations) {
            setConversations(res.data.conversations);
            setPagination(res.data.pagination || pagination);
          }
        }
      } catch {
        // silently ignore background poll errors
      }
    }, 15000);

    return () => clearInterval(listInterval);
  }, [pagination.page, search, statusFilter, typeFilter, token]);

  const selectConversation = async (conv: ConversationSummary) => {
    setSelectedConvId(conv.id);
    setConvLoading(true);
    try {
      if ((window as any).electronAPI?.getSupportMessages) {
        const res = await (window as any).electronAPI.getSupportMessages(token, conv.id);
        if (res?.status && res?.data) {
          setActiveConv(res.data);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          throw new Error(res?.message);
        }
      }
    } catch {
      toast.error(t("webAdmin.support.loadError"));
    } finally {
      setConvLoading(false);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConv || !reply.trim() || sending) return;

    const sentText = reply.trim();
    setSending(true);
    try {
      if ((window as any).electronAPI?.sendSupportReply) {
        const res = await (window as any).electronAPI.sendSupportReply(token, activeConv.id, sentText);
        if (!res?.status || !res?.data) throw new Error(res?.message);

        const now = new Date().toISOString();
        const newMsg: SupportMessage = {
          id: res.data.id || res.data.messageId || Math.random().toString(),
          sender: "admin",
          body: res.data.body || sentText,
          readByAdmin: true,
          readByCustomer: false,
          createdAt: res.data.createdAt || now,
        };

        setActiveConv((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMsg],
                lastMessageAt: newMsg.createdAt,
              }
            : null
        );

        // Update preview in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  lastMessageAt: newMsg.createdAt,
                  lastMessage: { body: newMsg.body, sender: newMsg.sender, createdAt: newMsg.createdAt },
                }
              : c
          )
        );

        setReply("");
        toast.success(t("webAdmin.support.toastReplySent"));
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleToggleStatus = async () => {
    if (!activeConv) return;
    const newStatus = activeConv.status === "open" ? "closed" : "open";
    try {
      if ((window as any).electronAPI?.updateSupportStatus) {
        const res = await (window as any).electronAPI.updateSupportStatus(token, activeConv.id, newStatus);
        if (!res?.status) throw new Error(res?.message);
        setActiveConv((prev) => (prev ? { ...prev, status: newStatus } : null));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
        );
        toast.success(
          newStatus === "closed"
            ? t("webAdmin.support.toastClosed")
            : t("webAdmin.support.toastReopened")
        );
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t("webAdmin.support.drawerDelete", "Eliminar Conversación"),
      message: t("webAdmin.support.drawerDeleteConfirm"),
      type: "danger",
      confirmText: t("webAdmin.support.drawerDelete", "Eliminar"),
      cancelText: t("webAdmin.common.cancel", "Cancelar"),
    });

    if (!confirmed) return;

    try {
      if ((window as any).electronAPI?.deleteSupportConversation) {
        const res = await (window as any).electronAPI.deleteSupportConversation(token, id);
        if (!res?.status) throw new Error(res?.message);
        toast.success(t("webAdmin.support.toastDeleted"));
        const updated = conversations.filter((c) => c.id !== id);
        setConversations(updated);
        if (activeConv?.id === id) {
          if (updated.length > 0) {
            selectConversation(updated[0]);
          } else {
            setActiveConv(null);
            setSelectedConvId(null);
          }
        }
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "complaint":
        return {
          icon: ShieldAlert,
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "suggestion":
        return {
          icon: Lightbulb,
          className: "bg-purple-100 text-purple-800 border-purple-200",
        };
      default:
        return {
          icon: HelpCircle,
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xs flex overflow-hidden min-h-[660px] h-[calc(100vh-210px)] max-w-full">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Sidebar with Conversations List
      ───────────────────────────────────────────────────────────── */}
      <div className="w-80 lg:w-[380px] border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0">
        {/* Search & Filters Header */}
        <div className="p-3.5 border-b border-gray-200 bg-white space-y-2.5 shrink-0">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("webAdmin.support.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>

          {/* Filter CustomSelects */}
          <div className="grid grid-cols-2 gap-2">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as StatusFilter)}
              options={[
                { value: "all", label: `${t("webAdmin.support.filterStatus")}: ${t("webAdmin.support.filterAll")}` },
                { value: "open", label: t("webAdmin.support.filterOpen") },
                { value: "closed", label: t("webAdmin.support.filterClosed") },
              ]}
              className="text-xs py-0"
            />

            <CustomSelect
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as TypeFilter)}
              options={[
                { value: "all", label: `${t("webAdmin.support.filterType")}: ${t("webAdmin.support.filterAll")}` },
                { value: "general", label: t("webAdmin.support.filterGeneral") },
                { value: "complaint", label: t("webAdmin.support.filterComplaint") },
                { value: "suggestion", label: t("webAdmin.support.filterSuggestion") },
              ]}
              className="text-xs py-0"
            />
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            /* Skeleton rows */
            <div className="p-3 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs space-y-2 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                    <div className="w-12 h-2.5 bg-gray-200 rounded" />
                  </div>
                  <div className="w-40 h-3.5 bg-gray-300 rounded" />
                  <div className="w-full h-2.5 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="p-8 text-center text-xs text-red-600">
              {loadError}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-2">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-600">{t("webAdmin.support.noResults")}</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = selectedConvId === c.id;
              const typeBadge = getTypeBadge(c.type);
              const TypeIcon = typeBadge.icon;

              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={`p-3.5 transition-all cursor-pointer select-none relative border-l-4 ${isSelected
                      ? "bg-white border-l-black shadow-xs ring-1 ring-black/5"
                      : "border-l-transparent hover:bg-white/80"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Customer Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${isSelected
                          ? "bg-black text-white"
                          : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {c.displayName ? c.displayName.charAt(0).toUpperCase() : "U"}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {c.displayName}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(c.lastMessageAt || c.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">
                        {c.subject}
                      </p>

                      {c.lastMessage && (
                        <p className="text-[11px] text-gray-500 truncate mt-0.5 line-clamp-1">
                          {c.lastMessage.body}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-2">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${typeBadge.className}`}
                        >
                          <TypeIcon className="w-2.5 h-2.5" />
                          {t(`webAdmin.support.type${c.type.charAt(0).toUpperCase() + c.type.slice(1)}`)}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.status === "open"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {c.status === "open" ? t("webAdmin.support.statusOpen") : t("webAdmin.support.statusClosed")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-600 shrink-0">
            <span className="text-[11px]">
              {t("webAdmin.common.total")}: {pagination.total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  fetchConversations(pagination.page - 1, search, statusFilter, typeFilter)
                }
                className="p-1 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold px-1">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  fetchConversations(pagination.page + 1, search, statusFilter, typeFilter)
                }
                className="p-1 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: Active Chat Box Screen
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        {!activeConv ? (
          /* Empty Chat State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4 shadow-2xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {t("webAdmin.support.noConversationSelected", "Selecciona una conversación")}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
              {t(
                "webAdmin.support.noConversationSubtitle",
                "Elige un ticket de soporte de la lista lateral para ver el historial y responder directamente al cliente."
              )}
            </p>
          </div>
        ) : (
          /* Active Chat Screen */
          <>
            {/* Top Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {activeConv.displayName ? activeConv.displayName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {activeConv.displayName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${activeConv.status === "open"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {activeConv.status === "open" ? t("webAdmin.support.statusOpen") : t("webAdmin.support.statusClosed")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {activeConv.displayEmail} • <span className="font-semibold text-gray-800">{activeConv.subject}</span>
                  </p>
                </div>
              </div>

              {/* Chat Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <CustomButton
                  type="button"
                  label={
                    activeConv.status === "open"
                      ? t("webAdmin.support.drawerMarkClosed")
                      : t("webAdmin.support.drawerReopen")
                  }
                  variant={activeConv.status === "open" ? "secondary" : "primary"}
                  onClick={handleToggleStatus}
                  Icon={
                    activeConv.status === "open" ? (
                      <CheckCircle2 className="size-4 text-gray-600" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )
                  }
                  className="!px-3 !py-1.5 !text-xs !gap-1.5"
                />

                <CustomButton
                  type="button"
                  label={t("webAdmin.support.drawerDelete")}
                  variant="red"
                  onClick={() => handleDelete(activeConv.id)}
                  Icon={<Trash2 className="size-4" />}
                  className="!px-3 !py-1.5 !text-xs !gap-1.5"
                />
              </div>
            </div>

            {/* Message Thread Canvas */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/70">
              {convLoading ? (
                <div className="py-24 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span>{t("webAdmin.actions.refreshing")}</span>
                </div>
              ) : activeConv.messages && activeConv.messages.length > 0 ? (
                <>
                  {/* Subject Summary Card */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs text-xs text-slate-700">
                    <span className="font-bold text-slate-900">{t("webAdmin.support.chatSubject")}: </span>
                    {activeConv.subject}
                  </div>

                  {activeConv.messages.map((m) => {
                    const isAdmin = m.sender === "admin";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} space-y-1`}
                      >
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            {isAdmin
                              ? t("webAdmin.support.drawerYou")
                              : activeConv.displayName || t("webAdmin.support.drawerCustomer")}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {m.createdAt && !isNaN(new Date(m.createdAt).getTime())
                              ? new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <div
                          className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed break-words shadow-xs ${isAdmin
                              ? "bg-slate-900 text-white rounded-br-2xs"
                              : "bg-white text-gray-900 border border-gray-200/90 rounded-bl-2xs"
                            }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="py-24 text-center text-xs text-gray-400">
                  {t("webAdmin.support.noMessages")}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chatbox Composer Footer */}
            <div className="p-4 border-t border-gray-200 bg-white shrink-0">
              {activeConv.status === "closed" ? (
                <div className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">
                    {t("webAdmin.support.drawerClosedBanner")}
                  </span>
                  <CustomButton
                    type="button"
                    label={t("webAdmin.support.drawerReopen")}
                    variant="secondary"
                    onClick={handleToggleStatus}
                    Icon={<RotateCcw className="size-3.5" />}
                    className="!px-3 !py-1.5 !text-xs !gap-1"
                  />
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="space-y-2">
                  <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 focus-within:border-gray-400 rounded-xl p-2 transition-colors">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("webAdmin.support.drawerReplyPlaceholder")}
                      className="flex-1 p-1 text-xs bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none text-gray-900 placeholder:text-gray-400 leading-relaxed"
                    />
                    <CustomButton
                      type="submit"
                      label={t("webAdmin.support.drawerSendReply")}
                      variant="primary"
                      disabled={sending || !reply.trim()}
                      Icon={
                        sending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )
                      }
                      className="!px-4 !py-2 !text-xs !rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between px-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <CornerDownLeft className="w-3 h-3" />
                      {t("webAdmin.support.chatHint")}
                    </span>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupportTab;
