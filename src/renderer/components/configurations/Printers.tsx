import { fetchConnectedPrinters, fetchPrinters } from '@/renderer/utils/printer';
import { useEffect, useState } from 'react'
import Header from '../shared/Header.order';
import { DeleteIcon, EditIcon, EyeIcon, PrinterIcon } from '@/renderer/assets/Svg';
import CustomButton from '../ui/CustomButton';
import { useAuth } from '@/renderer/contexts/AuthContext';
import { toast } from "react-toastify";
import { PrinterModal } from './Modals/PrinterModal';
import { useConfirm } from '@/renderer/hooks/useConfirm';

const Printers = () => {
    const [connectedPrinters, setConnectedPrinters] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [mode, setMode] = useState<'add' | 'edit' | 'view'>('add');
    const [currentPrinter, setCurrentPrinter] = useState<any>(null);
    const { auth: { token } } = useAuth();
    const confirm =useConfirm();

    useEffect(() => {
        fetchConnectedPrinters(token, setConnectedPrinters);
        fetchPrinters(token, setPrinters);
    }, [token]);

    const handleAddPrinter = () => {
        setMode('add');
        setCurrentPrinter(null);
        setShowPrinterModal(true);
    };

    const handleEdit = (printer: any) => {
        setMode('edit');
        setCurrentPrinter(printer);
        setShowPrinterModal(true);
    };

    const handleView = (printer: any) => {
        setMode('view');
        setCurrentPrinter(printer);
        setShowPrinterModal(true);
    };

    const handleDelete = async (id: string,printerName:string) => {
        const ok=await confirm({
            title:'Delete Printer',
            message:'Are you sure you want to delete this printer?Every product attach to this printer will be detached and?',
            confirmText:'Delete',
            cancelText:'Cancel',
            itemName:printerName
        });
        if(!ok) return;
        try {
            const res = await (window as any).electronAPI.deletePrinter(token, id);
            if (res.status) {
                toast.success('Printer deleted successfully');
                fetchPrinters(token, setPrinters);
            } else {
                toast.error('Failed to delete printer');
            }
        } catch (error) {
            toast.error('An error occurred while deleting the printer');
        }
    };

    const onCloseModal = () => {
        setShowPrinterModal(false);
        setCurrentPrinter(null);
        setMode('add');
    };

    return (
        <div className='relative'>
            {showPrinterModal && (
                <PrinterModal
                    onClose={onCloseModal}
                    mode={mode}
                    printer={currentPrinter}
                    connectedPrinters={connectedPrinters}
                    token={token}
                    onSuccess={() => fetchPrinters(token, setPrinters)}
                />
            )}
            <Header title='Printers' subtitle='Manage Printers' icon={<PrinterIcon className='size-8 text-blue-500' />} iconbgClasses="bg-blue-100" />
            <div className="pb-6 flex-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Printers
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Add and manage your printers
                            </p>
                        </div>
                        <CustomButton type="button" label="Add Printer" onClick={handleAddPrinter} Icon={<PrinterIcon className="size-5" />} />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Connected Printers
                    </h3>
                    {printers.length === 0 ? (
                        <p className="text-gray-500">No printers connected yet. Add one above.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Printer Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {printers.map((printer: any) => (
                                        <tr key={printer.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{printer.displayName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{printer.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(printer.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                                <CustomButton type="button" onClick={() => handleView(printer)} Icon={<EyeIcon className="size-5" />} variant="transparent" className='!p-0'/>
                                                <CustomButton type="button" onClick={() => handleEdit(printer)} Icon={<EditIcon className="size-5" />} variant="transparent" className='!p-0 !text-blue-500 hover:!text-blue-700'/>
                                                <CustomButton type="button" onClick={() => handleDelete(printer.id,printer.displayName)} Icon={<DeleteIcon className="size-5" />} variant="transparent" className='!p-0 !text-red-500 hover:!text-red-700'/>
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
    )
}

export default Printers