import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { Income, IncomeFilters, PaginatedResult } from "@/types/incomes";

export const useExpenseData = () => {
  const {
    auth: { token },
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [expensesData, setExpensesData] = useState<PaginatedResult<Income>>({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
  });
  const [filters, setFilters] = useState<IncomeFilters>({
    page: 1,
    pageSize: 10,
    search: "",
  });

  const fetchExpenses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.getAllExpenses(
        token,
        filters
      );
      if (res.status) {
        setExpensesData(res.data);
      } else {
        toast.error(res.error || "Failed to fetch expenses");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading expenses");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (data: Income) => {
    try {
      const res = await (window as any).electronAPI.createExpense(token, data);
      if (res.status) {
        toast.success("Expense created successfully");
        fetchExpenses();
        return true;
      } else {
        toast.error(res.error || "Failed to create expense");
        return false;
      }
    } catch (err) {
      toast.error("Error creating expense");
      return false;
    }
  };

  const updateExpense = async (id: string, data: Partial<Income>) => {
    try {
      const res = await (window as any).electronAPI.updateExpense(
        token,
        id,
        data
      );
      if (res.status) {
        toast.success("Expense updated successfully");
        fetchExpenses();
        return true;
      } else {
        toast.error(res.error || "Failed to update expense");
        return false;
      }
    } catch (err) {
      toast.error("Error updating expense");
      return false;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const res = await (window as any).electronAPI.deleteExpense(token, id);
      if (res.status) {
        toast.success("Expense deleted successfully");
        fetchExpenses();
      } else {
        toast.error(res.error || "Failed to delete expense");
      }
    } catch (err) {
      toast.error("Error deleting expense");
    }
  };

  return {
    expensesData,
    loading,
    filters,
    setFilters,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
