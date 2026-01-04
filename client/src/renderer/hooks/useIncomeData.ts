import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { Income, IncomeFilters, PaginatedResult } from "@/types/incomes";

export const useOtherIncomesData = () => {
  const {
    auth: { token },
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otherIncomesData, setOtherIncomesData] = useState<PaginatedResult<Income>>({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
  });
  const [filters, setFilters] = useState<IncomeFilters>({
    page: 1,
    pageSize: 10,
    search: "",
  });

  const fetchOtherIncomes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.getAllOtherIncomes(
        token,
        filters
      );
      if (res.status) {
        setOtherIncomesData(res.data);
      } else {
        toast.error(res.error || "Failed to fetch other incomes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading other incomes");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchOtherIncomes();
  }, [fetchOtherIncomes]);

  const createOtherIncome = async (data: Income) => {
    try {
      const res = await (window as any).electronAPI.createOtherIncome(token, data);
      if (res.status) {
        toast.success("Other income created successfully");
        fetchOtherIncomes();
        return true;
      } else {
        toast.error(res.error || "Failed to create other income");
        return false;
      }
    } catch (err) {
      toast.error("Error creating other income");
      return false;
    }
  };

  const updateOtherIncome = async (id: string, data: Partial<Income>) => {
    try {
      const res = await (window as any).electronAPI.updateOtherIncome(
        token,
        id,
        data
      );
      if (res.status) {
        toast.success("Other income updated successfully");
        fetchOtherIncomes();
        return true;
      } else {
        toast.error(res.error || "Failed to update other income");
        return false;
      }
    } catch (err) {
      toast.error("Error updating other income");
      return false;
    }
  };

  const deleteOtherIncome = async (id: string) => {
    try {
      const res = await (window as any).electronAPI.deleteOtherIncome(token, id);
      if (res.status) {
        toast.success("Other income deleted successfully");
        fetchOtherIncomes();
      } else {
        toast.error(res.error || "Failed to delete other income");
      }
    } catch (err) {
      toast.error("Error deleting other income");
    }
  };

  return {
    otherIncomesData,
    loading,
    filters,
    setFilters,
    createOtherIncome,
    updateOtherIncome,
    deleteOtherIncome,
  };
};

export const useCashOutData = () => {
  const {
    auth: { token },
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cashOutData, setCashOutData] = useState<PaginatedResult<Income>>({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
  });
  const [filters, setFilters] = useState<IncomeFilters>({
    page: 1,
    pageSize: 10,
    search: "",
  });

  const fetchCashOuts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.getCashOuts(token, filters);
      if (res.status) {
        setCashOutData(res.data);
      } else {
        toast.error(res.error || "Failed to fetch cash outs");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading cash outs");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchCashOuts();
  }, [fetchCashOuts]);

  const createCashOut = async (data: Income) => {
    try {
      const res = await (window as any).electronAPI.createCashOut(token, data);
      if (res.status) {
        toast.success("Cash out recorded successfully");
        fetchCashOuts();
        return true;
      } else {
        toast.error(res.error || "Failed to record cash out");
        return false;
      }
    } catch (err) {
      toast.error("Error recording cash out");
      return false;
    }
  };

  const updateCashOut = async (id: string, data: Partial<Income>) => {
    try {
      const res = await (window as any).electronAPI.updateCashOut(token, id, data);
      if (res.status) {
        toast.success("Cash out updated successfully");
        fetchCashOuts();
        return true;
      } else {
        toast.error(res.error || "Failed to update cash out");
        return false;
      }
    } catch (err) {
      toast.error("Error updating cash out");
      return false;
    }
  };

  const deleteCashOut = async (id: string) => {
    try {
      const res = await (window as any).electronAPI.deleteCashOut(token, id);
      if (res.status) {
        toast.success("Cash out deleted successfully");
        fetchCashOuts();
      } else {
        toast.error(res.error || "Failed to delete cash out");
      }
    } catch (err) {
      toast.error("Error deleting cash out");
    }
  };

  return {
    cashOutData,
    loading,
    filters,
    setFilters,
    createCashOut,
    updateCashOut,
    deleteCashOut,
    refresh: fetchCashOuts,
  };
};
