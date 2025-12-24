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
      return true;
    } else {
      toast.error(res.error);
      return false;
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
  };
};
