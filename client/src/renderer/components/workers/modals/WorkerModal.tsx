import { useState, useEffect } from "react";
import { Worker } from "@/types/workers";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomButton from "../../ui/CustomButton";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Worker>) => Promise<boolean>;
  initialData?: Worker | null;
}

export const WorkerModal = ({ isOpen, onClose, onSubmit, initialData }: Props) => {
  const [formData, setFormData] = useState<Partial<Worker>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { paymentMethod: 'transfer' });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) onClose();
  };

  const getInputValue = (dateVal: string | Date | undefined) => {
    if (!dateVal) return '';
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    if (typeof dateVal === 'string') {
      return dateVal.split('T')[0];
    }
    return '';
  };

  const paymentOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'mixed', label: 'Half Cash / Half Transfer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {initialData ? "Edit Worker" : "Register Worker"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
             <CustomInput name="fullname" type="text" label="Full Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          
          {/* Use the helper function here */}
          <CustomInput 
            name="dob" 
            label="Date of Birth" 
            type="date" 
            value={getInputValue(formData.dateOfBirth)} 
            onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
          />
          
          <CustomInput name="id" type="tel" label="ID Number (DNI/NIE)" value={formData.idNumber || ''} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
          
          <CustomInput name="phone" type="tel" label="Phone Number" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
          <CustomSelect placeholder="Payment Method" options={paymentOptions} value={formData.paymentMethod || 'transfer'} onChange={val => setFormData({...formData, paymentMethod: val as any})} label="Payment Method" className="px-2!" />

          <div className="col-span-2 border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Banking Details</h4>
          </div>
          
          <CustomInput type="text" name="bankName" label="Bank Name" value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} />
          <CustomInput type="tel" name="account" label="Account Number" value={formData.bankAccountNumber || ''} onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} />

          <div className="col-span-2 flex justify-end gap-3 mt-6">
            <CustomButton type="button" label="Cancel" onClick={onClose} variant="secondary" />
            <CustomButton type="submit" label="Save Worker" />
          </div>
        </form>
      </div>
    </div>
  );
};