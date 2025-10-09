export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
    itemName?: string;
    icon?: React.ReactNode;
    isLoading?: boolean;
}
export interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}