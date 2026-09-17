/**
 * SupportNotificationContext
 *
 * Maintains a single persistent WebSocket connection to the driver-server
 * (same URL as the delivery map socket) and listens for `new_support_message`
 * events.  When a message arrives the global `unreadCount` increments and a
 * pulsing bubble appears in App.tsx — no polling involved.
 *
 * The socket performs the same admin-auth handshake used by the driver-server
 * so that `broadcastToAuthenticatedAdmins` events reach this client.
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

interface SupportNotificationContextType {
  unreadCount: number;
  clearUnread: () => void;
}

const SupportNotificationContext = createContext<
  SupportNotificationContextType | undefined
>(undefined);

export const useSupportNotification = () => {
  const ctx = useContext(SupportNotificationContext);
  if (!ctx) {
    throw new Error(
      "useSupportNotification must be used within SupportNotificationProvider"
    );
  }
  return ctx;
};

interface Props {
  children: ReactNode;
}

export const SupportNotificationProvider: React.FC<Props> = ({ children }) => {
  const { auth } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  // Fetch the current unread count from the server so the bubble appears
  // immediately on login without waiting for a new WebSocket message.
  const fetchInitialUnread = useCallback(async () => {
    try {
      const adminToken = await (window as any).electronAPI.getDriverAdminToken();
      const apiUrl =
        (import.meta as any).env.VITE_DRIVER_API_URL || "http://localhost:3002/api";
      const res = await fetch(`${apiUrl}/v1/support/unread-count`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === "number" && data.count > 0) {
          setUnreadCount(data.count);
        }
      }
    } catch {/* silently ignore — bubble will still appear on next WS message */}
  }, []);

  const connect = useCallback(async () => {
    // Only connect when the user is logged in
    if (!auth.token || unmountedRef.current) return;

    // Fetch a driver-server admin JWT (signed with ADMIN_JWT_SECRET) from the
    // main process. The POS user token won't pass the driver-server's auth check.
    let adminToken: string;
    try {
      adminToken = await (window as any).electronAPI.getDriverAdminToken();
    } catch {
      // If IPC fails, retry after a delay
      reconnectTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) connect();
      }, 5000);
      return;
    }

    const wsUrl =
      (import.meta as any).env.VITE_DRIVER_WS_URL || "ws://localhost:3002";

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      // Authenticate with the driver-server admin JWT so this socket
      // receives broadcastToAuthenticatedAdmins events.
      socket.send(JSON.stringify({ type: "auth", token: adminToken }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "new_support_message") {
          setUnreadCount((prev) => prev + 1);
          // Play the same notification sound used by the delivery chat
          try {
            const audio = new Audio("./notification.wav");
            audio.volume = 0.4;
            audio.play().catch(() => {/* user hasn't interacted yet */});
          } catch {/* ignore */}
        }
      } catch {/* ignore malformed frames */}
    };

    socket.onclose = () => {
      if (unmountedRef.current) return;
      // Reconnect after 5 s if the socket drops unexpectedly
      reconnectTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) connect();
      }, 5000);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [auth.token]);

  useEffect(() => {
    unmountedRef.current = false;

    if (auth.token) {
      fetchInitialUnread();
      connect(); // async — intentionally fire-and-forget
    }

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop on unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [auth.token, connect, fetchInitialUnread]);

  return (
    <SupportNotificationContext.Provider value={{ unreadCount, clearUnread }}>
      {children}
    </SupportNotificationContext.Provider>
  );
};
