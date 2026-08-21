import { SiteContentOperations } from "../database/siteContentOperations.js";
import { verifyToken } from "./auth.js";
import Logger from "electron-log";
import jwt from "jsonwebtoken";

const getVpsUrl = () => process.env.DRIVER_API_URL || "http://localhost:3002";

const getAuthHeaders = () => {
  const adminSecret =
    process.env.ADMIN_JWT_SECRET || "";
  const token = jwt.sign(
    { email: "pos-admin@system", name: "POS Admin", type: "admin" },
    adminSecret,
    { expiresIn: "7d" }
  );
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getSiteContent = async (event: any, token: string, key?: string) => {
  try {
    verifyToken(event, token);
    const data = await SiteContentOperations.getSiteContent(key);
    return { status: true, data };
  } catch (error: any) {
    return { status: false, message: error.message };
  }
};

export const saveSiteContent = async (event: any, token: string, key: string, value: any) => {
  try {
    verifyToken(event, token);
    const res = await SiteContentOperations.saveSiteContent(key, value);
    return { status: true, data: res };
  } catch (error: any) {
    return { status: false, message: error.message };
  }
};

export const fetchRemoteSiteContent = async (event: any, token: string) => {
  try {
    verifyToken(event, token);
    const data = await SiteContentOperations.fetchRemoteSiteContent();
    return { status: true, data };
  } catch (error: any) {
    return { status: false, message: error.message };
  }
};

// ── Web Customers Handlers ───────────────────────────────────────────────────

export const getWebCustomers = async (event: any, token: string, queryParams: Record<string, any> = {}) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, String(v));
      }
    }
    const res = await fetch(`${vpsUrl}/api/v1/customers?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error("WebAdmin [getWebCustomers] error:", error);
    return { status: false, message: error.message };
  }
};

export const getWebCustomerById = async (event: any, token: string, id: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/customers/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [getWebCustomerById ${id}] error:`, error);
    return { status: false, message: error.message };
  }
};

export const updateWebCustomer = async (event: any, token: string, id: string, payload: any) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/customers/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [updateWebCustomer ${id}] error:`, error);
    return { status: false, message: error.message };
  }
};

export const deleteWebCustomer = async (event: any, token: string, id: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/customers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [deleteWebCustomer ${id}] error:`, error);
    return { status: false, message: error.message };
  }
};

export const restoreWebCustomer = async (event: any, token: string, id: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/customers/${id}/restore`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [restoreWebCustomer ${id}] error:`, error);
    return { status: false, message: error.message };
  }
};

// ── Support Handlers ─────────────────────────────────────────────────────────

export const getSupportConversations = async (event: any, token: string, queryParams: Record<string, any> = {}) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, String(v));
      }
    }
    const res = await fetch(`${vpsUrl}/api/v1/support/conversations?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error("WebAdmin [getSupportConversations] error:", error);
    return { status: false, message: error.message };
  }
};

export const getSupportMessages = async (event: any, token: string, conversationId: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/support/conversations/${conversationId}/messages/admin`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [getSupportMessages ${conversationId}] error:`, error);
    return { status: false, message: error.message };
  }
};

export const sendSupportReply = async (event: any, token: string, conversationId: string, body: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/support/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const now = new Date().toISOString();
    return {
      status: true,
      data: {
        id: data.id || data.messageId || Math.random().toString(),
        messageId: data.messageId || data.id,
        conversationId,
        sender: "admin",
        body,
        readByAdmin: true,
        readByCustomer: false,
        createdAt: data.createdAt || now,
      },
    };
  } catch (error: any) {
    Logger.error(`WebAdmin [sendSupportReply ${conversationId}] error:`, error);
    return { status: false, message: error.message };
  }
};

export const updateSupportStatus = async (event: any, token: string, conversationId: string, status: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/support/conversations/${conversationId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [updateSupportStatus ${conversationId}] error:`, error);
    return { status: false, message: error.message };
  }
};

export const deleteSupportConversation = async (event: any, token: string, conversationId: string) => {
  try {
    verifyToken(event, token);
    const vpsUrl = getVpsUrl();
    const res = await fetch(`${vpsUrl}/api/v1/support/conversations/${conversationId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { status: true, data };
  } catch (error: any) {
    Logger.error(`WebAdmin [deleteSupportConversation ${conversationId}] error:`, error);
    return { status: false, message: error.message };
  }
};
