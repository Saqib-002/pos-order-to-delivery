import { toast } from "react-toastify";

export const fetchConnectedPrinters = async (
    token: string | null,
    setPrinters: React.Dispatch<React.SetStateAction<any>>
) => {
    const res = await (window as any).electronAPI.getConnectedPrinters(token);
    if (!res.status) {
        setPrinters([]);
        toast.error("Unable to get printers");
        return;
    }
    setPrinters(res.data);
};
export const fetchPrinters = async (
    token: string | null,
    setPrinters: React.Dispatch<React.SetStateAction<any>>
) => {
    const res = await (window as any).electronAPI.getAllPrinters(token);
    if (!res.status) {
        setPrinters([]);
        toast.error("Unable to get printers");
        return;
    }
    setPrinters(res.data);
};
