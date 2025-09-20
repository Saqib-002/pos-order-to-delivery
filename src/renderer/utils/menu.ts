import { toast } from "react-toastify";

export const getVariants = async (
    token: string | null,
    setVariants: React.Dispatch<React.SetStateAction<any>>
) => {
    const res = await (window as any).electronAPI.getVariants(token);
    if (!res.status) {
        toast.error("Unable to get variants");
        return;
    }
    setVariants(res.data);
};
export const getGroups = async (
    token: string | null,
    setGroups: React.Dispatch<React.SetStateAction<any>>
) => {
    (window as any).electronAPI.getGroups(token).then((res: any) => {
        if (!res.status) {
            toast.error("Unable to get groups");
            return;
        }
        setGroups(res.data);
    });
};
