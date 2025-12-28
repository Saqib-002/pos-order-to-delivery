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
