import { useEffect, useState } from "react";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
    RefreshIcon,
    GlobeIcon,
    MailIcon,
    InfoIcon,
    PhoneIcon,
    MessageCircleIcon
} from "@/renderer/public/Svg";

const AuthorInfo = () => {
    const { configurations, setConfigurations } = useConfigurations();
    const { auth: { token } } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleSync = async (silent = false) => {
        if (!token) return;
        if (!silent) setLoading(true);
        try {
            const res = await (window as any).electronAPI.syncAuthorInfo(token);
            if (res.status) {
                setConfigurations(res.data);
                if (!silent) toast.success(t("authorInfo.syncSuccess"));
            } else {
                if (!silent) toast.error(res.error || t("authorInfo.syncError"));
            }
        } catch (error) {
            if (!silent) toast.error(t("authorInfo.syncError"));
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Auto sync on mount
    useEffect(() => {
        handleSync(true);
    }, []);

    const getContactIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes("phone") || lowerType.includes("tel")) return <PhoneIcon className="size-5" />;
        if (lowerType.includes("email") || lowerType.includes("mail")) return <MailIcon className="size-5" />;
        if (lowerType.includes("whatsapp") || lowerType.includes("chat")) return <MessageCircleIcon className="size-5" />;
        return <GlobeIcon className="size-5" />;
    };

    const getContactColor = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes("phone") || lowerType.includes("tel")) return "text-blue-500 bg-blue-50";
        if (lowerType.includes("email") || lowerType.includes("mail")) return "text-red-500 bg-red-50";
        if (lowerType.includes("whatsapp")) return "text-green-500 bg-green-50";
        return "text-indigo-500 bg-indigo-50";
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                <InfoIcon className="size-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{t("authorInfo.title")}</h1>
                                <p className="text-gray-400 mt-1">{t("authorInfo.subtitle")}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSync()}
                            disabled={loading}
                            className={`p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 ${loading ? 'opacity-50' : 'active:scale-95'}`}
                        >
                            <RefreshIcon className={`size-6 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Developer Details */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                                    {t("authorInfo.authorDetails")}
                                </h3>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">
                                            <GlobeIcon className="size-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t("authorInfo.name")}</p>
                                            <p className="font-bold text-gray-900">{configurations.authorName || t("common.notAvailable")}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">
                                            <MailIcon className="size-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t("authorInfo.email")}</p>
                                            {configurations.authorEmail ? (
                                                <a href={`mailto:${configurations.authorEmail}`} className="font-bold text-gray-900 hover:underline">
                                                    {configurations.authorEmail}
                                                </a>
                                            ) : <p className="font-bold">{t("common.notAvailable")}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">
                                            <GlobeIcon className="size-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t("authorInfo.website")}</p>
                                            {configurations.authorWebsite ? (
                                                <a href={configurations.authorWebsite} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:underline">
                                                    {configurations.authorWebsite}
                                                </a>
                                            ) : <p className="font-bold">{t("common.notAvailable")}</p>}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">{t("authorInfo.softwareVersion")}</p>
                                        <p className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-sm font-bold border border-gray-100">
                                            v{configurations.softwareVersion || "1.0.0"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Channels Grid */}
                        <div className="lg:col-span-2">
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 h-full">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                                    {t("contactTypes.title")}
                                </h3>

                                {configurations.contactTypes && configurations.contactTypes.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {configurations.contactTypes.map((contact: any, index: number) => (
                                            <div
                                                key={index}
                                                className="group p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-lg ${getContactColor(contact.type)} transition-transform group-hover:scale-110`}>
                                                        {getContactIcon(contact.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 truncate uppercase text-xs tracking-wider">
                                                            {contact.type}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 font-medium truncate">{contact.value}</p>
                                                        {contact.label && (
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{contact.label}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                        <MessageCircleIcon className="size-12 text-gray-200 mb-3" />
                                        <p className="text-gray-400 font-medium">{t("contactTypes.noContacts")}</p>
                                    </div>
                                )}

                                <div className="mt-8 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                    <p className="text-xs text-black font-medium leading-relaxed">
                                        {t("contactTypes.syncHelp")}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthorInfo;
