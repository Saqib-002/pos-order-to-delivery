import type { CustomRadarGroup } from "./radarTypes";

// Thin wrappers over the delivery radar group IPC calls. Groups live in the
// shared local database, so every POS sees the same groups.
// Each call resolves to the fresh group list, or throws on failure.

const api = () => (window as any).electronAPI;

const unwrap = <T>(res: any): T => {
  if (!res?.status) {
    throw new Error(res?.error || "Delivery radar group request failed");
  }
  return res.data as T;
};

export const fetchRadarGroups = async (token: string | null) =>
  unwrap<CustomRadarGroup[]>(await api().getDeliveryRadarGroups(token));

export const createRadarGroup = async (
  token: string | null,
  data: { name?: string; nameTemplate?: string; color: string }
) =>
  unwrap<{ group: CustomRadarGroup; groups: CustomRadarGroup[] }>(
    await api().createDeliveryRadarGroup(token, data)
  );

export const updateRadarGroup = async (
  token: string | null,
  id: string,
  updates: { name?: string; color?: string }
) =>
  unwrap<CustomRadarGroup[]>(
    await api().updateDeliveryRadarGroup(token, id, updates)
  );

export const deleteRadarGroup = async (token: string | null, id: string) =>
  unwrap<CustomRadarGroup[]>(await api().deleteDeliveryRadarGroup(token, id));

export const addOrdersToRadarGroup = async (
  token: string | null,
  groupId: string,
  orderIds: string[]
) =>
  unwrap<CustomRadarGroup[]>(
    await api().addOrdersToDeliveryRadarGroup(token, groupId, orderIds)
  );

export const removeOrdersFromRadarGroups = async (
  token: string | null,
  orderIds: string[]
) =>
  unwrap<CustomRadarGroup[]>(
    await api().removeOrdersFromDeliveryRadarGroups(token, orderIds)
  );
