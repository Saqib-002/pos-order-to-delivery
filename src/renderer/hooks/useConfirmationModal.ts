import { useState, useCallback } from "react";

interface ConfirmationOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  itemName?: string;
  icon?: React.ReactNode;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const useConfirmationModal = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
  });

  const showConfirmation = useCallback(
    (onConfirm: () => void, options: ConfirmationOptions = {}) => {
      setState({
        isOpen: true,
        onConfirm,
        onCancel: () => setState({ isOpen: false }),
        ...options,
      });
    },
    []
  );

  const hideConfirmation = useCallback(() => {
    setState({ isOpen: false });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm();
    }
    hideConfirmation();
  }, [state.onConfirm, hideConfirmation]);

  const handleCancel = useCallback(() => {
    if (state.onCancel) {
      state.onCancel();
    }
    hideConfirmation();
  }, [state.onCancel, hideConfirmation]);

  return {
    isOpen: state.isOpen,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    handleCancel,
    confirmationProps: {
      isOpen: state.isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      title: state.title,
      message: state.message,
      confirmText: state.confirmText,
      cancelText: state.cancelText,
      type: state.type,
      itemName: state.itemName,
      icon: state.icon,
    },
  };
};
