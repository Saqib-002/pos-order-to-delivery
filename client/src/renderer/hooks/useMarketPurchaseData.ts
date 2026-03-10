 import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  MarketPurchase,
  MarketPurchaseFilters,
  PaginatedResult,
} from "@/types/marketPurchases";
import { useAuth } from "../contexts/AuthContext";
import { calculatePaymentStatus } from "../utils/paymentStatus";

const INITIAL_FILTERS: MarketPurchaseFilters = {
  page: 1,
  pageSize: 10,
  search: "",
  paymentStatus: "all",
};

export const useMarketPurchaseData = () => {
  const { auth } = useAuth();

  const [purchasesData, setPurchasesData] = useState<
    PaginatedResult<MarketPurchase>
  >({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] =
    useState<MarketPurchaseFilters>(INITIAL_FILTERS);

  const fetchPurchases = useCallback(async () => {
    try {
      const filterParams: any = {
        supplierId: filters.supplierId || undefined,
        expenseTypeId: filters.expenseTypeId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        ticketNumber: filters.search || undefined,
      };
      // Remove undefined values
      Object.keys(filterParams).forEach(
        (key) => filterParams[key] === undefined && delete filterParams[key]
      );

      const res = await (window as any).electronAPI.getAllMarketPurchases(
        auth.token,
        filterParams
      );
      if (res.status) {
        let allData: MarketPurchase[] = res.data || [];
        if (filters.paymentStatus && filters.paymentStatus !== "all") {
          allData = allData.filter((purchase) => {
            const total =
              typeof purchase.totalAmount === "number"
                ? purchase.totalAmount
                : parseFloat(String(purchase.totalAmount || 0)) || 0;
            const statusInfo = calculatePaymentStatus(
              purchase.paymentType || "",
              total
            );
            return statusInfo.status.toLowerCase() === filters.paymentStatus;
          });
        }

        const startIndex = (filters.page - 1) * filters.pageSize;
        const endIndex = startIndex + filters.pageSize;
        const paginatedData = allData.slice(startIndex, endIndex);
        setPurchasesData({
          data: paginatedData,
          pagination: {
            total: allData.length,
            page: filters.page,
            pageSize: filters.pageSize,
            totalPages: Math.ceil(allData.length / filters.pageSize),
          },
        });
      } else {
        toast.error(res.error || "Failed to fetch market purchases");
      }
    } catch (error) {
      toast.error("Error fetching market purchases");
    }
  }, [auth.token, filters]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await (window as any).electronAPI.getAllSuppliers(auth.token);
      if (res.status) setSuppliers(res.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, [auth.token]);

  const fetchExpenseTypes = useCallback(async () => {
    try {
      const res = await (window as any).electronAPI.getAllExpenseTypes(
        auth.token
      );
      if (res.status) setExpenseTypes(res.data || []);
    } catch (error) {
      console.error("Error fetching expense types:", error);
    }
  }, [auth.token]);

  const fetchInventoryProducts = useCallback(async () => {
    try {
      const res = await (window as any).electronAPI.getAllInventoryProducts(
        auth.token
      );
      if (res.status) setInventoryProducts(res.data || []);
    } catch (error) {
      console.error("Error fetching inventory products:", error);
    }
  }, [auth.token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPurchases(),
        fetchSuppliers(),
        fetchExpenseTypes(),
        fetchInventoryProducts(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPurchases, fetchSuppliers, fetchExpenseTypes]);

  const createPurchase = async (data: MarketPurchase) => {
    const res = await (window as any).electronAPI.createMarketPurchase(
      auth.token,
      data
    );
    if (res.status) {
      toast.success("Market purchase created successfully");
      fetchPurchases();
      return true;
    }
    toast.error(res.error || "Failed to create market purchase");
    return false;
  };

  const updatePurchase = async (id: string, data: MarketPurchase) => {
    const res = await (window as any).electronAPI.updateMarketPurchase(
      auth.token,
      id,
      data
    );
    if (res.status) {
      toast.success("Market purchase updated successfully");
      fetchPurchases();
      return true;
    }
    toast.error(res.error || "Failed to update market purchase");
    return false;
  };

  const deletePurchase = async (id: string) => {
    const res = await (window as any).electronAPI.deleteMarketPurchase(
      auth.token,
      id
    );
    if (res.status) {
      toast.success("Market purchase deleted successfully");
      fetchPurchases();
      return true;
    }
    toast.error(res.error || "Failed to delete market purchase");
    return false;
  };

  return {
    purchasesData,
    suppliers,
    expenseTypes,
    inventoryProducts,
    loading,
    filters,
    setFilters,
    createPurchase,
    updatePurchase,
    deletePurchase,
    fetchPurchases,
  };
};
