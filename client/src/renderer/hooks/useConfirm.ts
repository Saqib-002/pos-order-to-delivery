import { createContext, useContext } from "react";
import { ConfirmContextType } from "@/types/confirm";
export const ConfirmContext = createContext<ConfirmContextType | null>(null);


export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
    return context.confirm;
};