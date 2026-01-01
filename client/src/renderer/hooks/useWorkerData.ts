import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { Worker, WorkerFilters, PaginatedResult } from "@/types/workers";

export const useWorkerData = () => {
  const {
    auth: { token },
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workersData, setWorkersData] = useState<PaginatedResult<Worker>>({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
  });
  const [filters, setFilters] = useState<WorkerFilters>({
    page: 1,
    pageSize: 10,
    search: "",
  });

  const fetchWorkers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.getWorkers(token, filters);
      if (res.status) {
        setWorkersData(res.data);
      } else {
        toast.error(res.error || "Failed to fetch workers");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading workers");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const createWorker = async (data: Partial<Worker>) => {
    try {
      const res = await (window as any).electronAPI.createWorker(token, data);
      if (res.status) {
        toast.success("Worker registered successfully");
        fetchWorkers();
        return true;
      } else {
        toast.error(res.error || "Failed to create worker");
        return false;
      }
    } catch (err) {
      toast.error("Error creating worker");
      return false;
    }
  };

  const updateWorker = async (id: string, data: Partial<Worker>) => {
    try {
      const res = await (window as any).electronAPI.updateWorker(
        token,
        id,
        data
      );
      if (res.status) {
        toast.success("Worker updated successfully");
        fetchWorkers();
        return true;
      } else {
        toast.error(res.error);
        return false;
      }
    } catch (err) {
      toast.error("Error updating worker");
      return false;
    }
  };

  const deleteWorker = async (id: string) => {
    try {
      const res = await (window as any).electronAPI.deleteWorker(token, id);
      if (res.status) {
        toast.success("Worker deleted");
        fetchWorkers();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Error deleting worker");
    }
  };

  // Salary Operations Wrapper
  const addSalary = async (data: any) => {
    const res = await (window as any).electronAPI.addSalaryRecord(token, data);
    if (res.status) {
      toast.success("Salary recorded");
      return { success: true, data: res.data };
    } else {
      toast.error(res.error);
      return { success: false, data: null };
    }
  };

  const fetchSalaryRecords = async (workerId: string, filters: any) => {
    const res = await (window as any).electronAPI.getSalaryRecords(
      token,
      workerId,
      filters
    );
    if (res.status) return res.data;
    return { data: [], pagination: { total: 0 } };
  };
  const updateSalary = async (id: string, data: any) => {
    const res = await (window as any).electronAPI.updateSalaryRecord(
      token,
      id,
      data
    );
    if (res.status) {
      toast.success("Salary updated");
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  const deleteSalary = async (id: string) => {
    const res = await (window as any).electronAPI.deleteSalaryRecord(token, id);
    if (res.status) {
      toast.success("Record deleted");
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  // Payment Transaction Operations
  const addPaymentTransaction = async (data: any) => {
    const res = await (window as any).electronAPI.addPaymentTransaction(token, data);
    if (res.status) {
      toast.success("Payment recorded");
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  const addMultiplePaymentTransactions = async (salaryId: string, payments: any[]) => {
    const res = await (window as any).electronAPI.addMultiplePaymentTransactions(token, salaryId, payments);
    if (res.status) {
      toast.success("Payments recorded");
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  const getPaymentTransactions = async (salaryId: string) => {
    const res = await (window as any).electronAPI.getPaymentTransactions(token, salaryId);
    if (res.status) return res.data;
    return [];
  };

  const updatePaymentTransaction = async (id: string, data: any) => {
    const res = await (window as any).electronAPI.updatePaymentTransaction(token, id, data);
    if (res.status) {
      toast.success("Payment updated");
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  const deletePaymentTransaction = async (id: string) => {
    const res = await (window as any).electronAPI.deletePaymentTransaction(token, id);
    if (res.status) {
      toast.success("Payment deleted");
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  const getTotalPaidForSalary = async (salaryId: string) => {
    const res = await (window as any).electronAPI.getTotalPaidForSalary(token, salaryId);
    if (res.status) return res.data;
    return 0;
  };

  return {
    workersData,
    loading,
    filters,
    setFilters,
    createWorker,
    updateWorker,
    deleteWorker,
    addSalary,
    updateSalary,
    fetchSalaryRecords,
    deleteSalary,
    // Payment transactions
    addPaymentTransaction,
    addMultiplePaymentTransactions,
    getPaymentTransactions,
    updatePaymentTransaction,
    deletePaymentTransaction,
    getTotalPaidForSalary,
  };
};
