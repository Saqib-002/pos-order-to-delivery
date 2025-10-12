import React, { useEffect, useState } from 'react'
import CustomInput from '../shared/CustomInput'
import CustomButton from '../ui/CustomButton'
import { toast } from 'react-toastify'
import { useAuth } from '@/renderer/contexts/AuthContext'

const ConfigurationsTab = () => {
  const [configurations, setConfigurations] = useState({
    name: "",
    address: "",
    logo: ""
  });
  const [configurationsId, setConfigurationsId] = useState<string>("");
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { auth: { token } } = useAuth();

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
      <h2 className='text-2xl font-bold mb-6'>Configurations</h2>
      <form className='w-1/2 flex flex-col gap-6' onSubmit={handleSubmit}>
        <CustomInput
          type='text'
          value={configurations.name}
          onChange={(e) => setConfigurations({ ...configurations, name: e.target.value })}
          label='Company Name'
          name='name'
          placeholder='Enter company name'
          required={true}
        />
        <CustomInput
          type='text'
          value={configurations.address}
          onChange={(e) => setConfigurations({ ...configurations, address: e.target.value })}
          label='Company Address'
          name='address'
          placeholder='Enter company Address'
          required={true}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Company Logo</label>
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
                <span className="text-xs text-gray-500 text-center">Click to change logo</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Upload your company logo</p>
                <p className="text-xs">PNG, JPG up to 2MB</p>
              </div>
            )}
          </div>
        </div>

        <CustomButton type='submit' label='Save' />
      </form>
    </div>
  )
}

export default ConfigurationsTab