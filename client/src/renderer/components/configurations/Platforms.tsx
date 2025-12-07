import { useEffect, useState } from "react";
import Header from "../shared/Header.order";
import { DeleteIcon, EditIcon, EyeIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { toast } from "react-toastify";
import { PlatformModal } from "./Modals/PlatformModal";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import { useTranslation } from "react-i18next";

const fetchPlatforms = async (
  token: string | null,
  setPlatforms: any,
  t: any
) => {
  if (!token) return;
  try {
    const res = await (window as any).electronAPI.getAllPlatforms(token);
    if (res.status) {
      setPlatforms(res.data || []);
    } else {
      toast.error(t("platforms.fetchError"));
    }
  } catch (error) {
    toast.error(t("platforms.fetchError"));
  }
};

const Platforms = () => {
  const [platforms, setPlatforms] = useState([]);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "view">("add");
  const [currentPlatform, setCurrentPlatform] = useState<any>(null);
  const {
    auth: { token },
  } = useAuth();
  const confirm = useConfirm();
  const { t } = useTranslation();

  useEffect(() => {
    fetchPlatforms(token, setPlatforms, t);
  }, [token, t]);

  const handleAddPlatform = () => {
    setMode("add");
    setCurrentPlatform(null);
    setShowPlatformModal(true);
  };

  const handleEdit = (platform: any) => {
    setMode("edit");
    setCurrentPlatform(platform);
    setShowPlatformModal(true);
  };

  const handleView = (platform: any) => {
    setMode("view");
    setCurrentPlatform(platform);
    setShowPlatformModal(true);
  };

  const handleDelete = async (id: string, platformName: string) => {
    const ok = await confirm({
      title: t("platforms.deleteTitle"),
      message: t("platforms.deleteMessage"),
      confirmText: t("platforms.deleteConfirm"),
      cancelText: t("platforms.deleteCancel"),
      itemName: platformName,
    });
    if (!ok) return;
    try {
      const res = await (window as any).electronAPI.deletePlatform(token, id);
      if (res.status) {
        toast.success(t("platforms.deletedSuccess"));
        fetchPlatforms(token, setPlatforms, t);
      } else {
        toast.error(t("platforms.deletedFailed"));
      }
    } catch (error) {
      toast.error(t("platforms.deletedError"));
    }
  };

  const onCloseModal = () => {
    setShowPlatformModal(false);
    setCurrentPlatform(null);
    setMode("add");
  };

  return (
    <div className="relative">
      {showPlatformModal && (
        <PlatformModal
          onClose={onCloseModal}
          mode={mode}
          platform={currentPlatform}
          token={token}
          onSuccess={() => fetchPlatforms(token, setPlatforms, t)}
        />
      )}
      <Header
        title={t("platforms.title")}
        subtitle={t("platforms.subtitle")}
        icon={<div className="size-8 text-green-500">📱</div>}
        iconbgClasses="bg-green-100"
      />
      <div className="pb-6 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-black">
                {t("platforms.title")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("platforms.manageDescription")}
              </p>
            </div>
            <CustomButton
              type="button"
              label={t("platforms.addPlatform")}
              onClick={handleAddPlatform}
              Icon={<span className="text-lg">➕</span>}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            {t("platforms.platformsList")}
          </h3>
          {platforms.length === 0 ? (
            <p className="text-gray-500">{t("platforms.noPlatforms")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("platforms.table.platformName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("platforms.table.createdAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("platforms.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {platforms.map((platform: any) => (
                    <tr key={platform.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {platform.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {new Date(platform.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                        <CustomButton
                          type="button"
                          onClick={() => handleView(platform)}
                          Icon={<EyeIcon className="size-5" />}
                          variant="transparent"
                          className="!p-0"
                        />
                        <CustomButton
                          type="button"
                          onClick={() => handleEdit(platform)}
                          Icon={<EditIcon className="size-5" />}
                          variant="transparent"
                          className="!p-0 !text-blue-500 hover:!text-blue-700"
                        />
                        <CustomButton
                          type="button"
                          onClick={() =>
                            handleDelete(platform.id, platform.name)
                          }
                          Icon={<DeleteIcon className="size-5" />}
                          variant="transparent"
                          className="!p-0 !text-red-500 hover:!text-red-700"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Platforms;
