import React, { useEffect, useState } from 'react'
import CustomInput from '../shared/CustomInput'
import CustomButton from '../ui/CustomButton'
import { CustomSelect } from '../ui/CustomSelect'
import { toast } from 'react-toastify'
import { useAuth } from '@/renderer/contexts/AuthContext'
import { useConfigurations } from '@/renderer/contexts/configurationContext'
import { useTranslation } from 'react-i18next'

const ConfigurationsTab = () => {
  const [configurationsId, setConfigurationsId] = useState<string>("");
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { auth: { token } } = useAuth();
  const {configurations, setConfigurations}=useConfigurations();
  const { i18n, t } = useTranslation();

  const getConfigurations = async () => {
    const res = await (window as any).electronAPI.getConfigurations(token);
    if (!res.status) {
      toast.error("Error getting configurations");
      return;
    }
    if (res.data) {
      setConfigurations(res.data);
      setConfigurationsId(res.data.id);
      setMode("edit");
      if (res.data.logo) {
        setLogoPreview(res.data.logo);
      }
    }
  }

  useEffect(() => {
    getConfigurations();
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setConfigurations({ ...configurations, logo: base64 });
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let res;
    if (mode === "add") {
      res = await (window as any).electronAPI.createConfigurations(token, configurations);
      if (res.data) {
        setConfigurations(res.data);
        setConfigurationsId(res.data.id);
        setMode("edit");
        if (res.data.logo) {
          setLogoPreview(res.data.logo);
        }
      }
    } else {
      res = await (window as any).electronAPI.updateConfigurations(token, configurationsId, configurations);
    }
    if (!res.status) {
      toast.error("Error saving configurations");
      return;
    }
    getConfigurations();
    toast.success("Configurations saved successfully");
  }

  return (
    <div>
      <h2 className='text-2xl font-bold mb-6'>{t('configurations.title')}</h2>
      <form className='w-1/2 flex flex-col gap-6' onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 w-48">
          <label className="text-sm font-medium text-gray-700">{t('configurations.languageLabel')}</label>
          <CustomSelect
            options={[
              { value: 'en', label: t('configurations.languageOptions.en') },
              { value: 'es', label: t('configurations.languageOptions.es') },
            ]}
            value={configurations.language || 'en'}
            onChange={(val) => {
              const lang = val as 'en' | 'es';
              i18n.changeLanguage(lang);
              setConfigurations({ ...configurations, language: lang });
            }}
            className="w-full"
            portalClassName="language-select-portal"
            placeholder={t('configurations.languageLabel')}
          />
        </div>
        <CustomInput
          type='text'
          value={configurations.name}
          onChange={(e) => setConfigurations({ ...configurations, name: e.target.value })}
          label={t('configurations.companyName')}
          name='name'
          placeholder={t('configurations.companyNamePlaceholder')}
          required={true}
        />
        <CustomInput
          type='text'
          value={configurations.address}
          onChange={(e) => setConfigurations({ ...configurations, address: e.target.value })}
          label={t('configurations.companyAddress')}
          name='address'
          placeholder={t('configurations.companyAddressPlaceholder')}
          required={true}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">{t('configurations.companyLogo')}</label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {logoPreview ? (
              <div className="flex flex-col items-center">
                <img
                  crossOrigin="anonymous"
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-24 h-24 object-cover rounded-lg shadow-md mb-2"
                />
                <span className="text-xs text-gray-500 text-center">{t('configurations.clickChangeLogo')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">{t('configurations.uploadLogoPrompt')}</p>
                <p className="text-xs">{t('configurations.uploadLogoSub')}</p>
              </div>
            )}
          </div>
        </div>

        <CustomButton type='submit' label={t('configurations.save')} />
      </form>
    </div>
  )
}

export default ConfigurationsTab