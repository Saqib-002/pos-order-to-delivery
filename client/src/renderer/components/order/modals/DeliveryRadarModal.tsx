import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Compass, Layers } from "lucide-react";
import { Order, DeliveryPerson } from "@/types/order";
import {
  geocodeAddress,
  geocodeAddressDetailed,
  getOsrmBaseUrl,
  calculateBearing,
  getCompassDirection,
  getCompassCode,
  calculateHaversineDistance,
  findDeliveryClusters,
  isPointInPolygon,
  setNominatimSlotReserver,
  forgetGeocodedAddress,
  GeocodedDeliveryOrder,
  DeliveryCluster,
  type GeocodeHit,
  type LocationWarning,
} from "../../../utils/googleMaps";
import {
  formatAddressForGeocoding,
  extractPostcode,
  getOrderDisplayNumber,
} from "../../../utils/utils";
import { updateOrder } from "../../../utils/order";
import { useConfigurations } from "../../../contexts/configurationContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getAddressCacheKey,
  loadCachedCoordinates,
  saveCachedCoordinates,
  saveManualLocation,
  deleteCachedLocation,
  reserveNominatimSlot,
} from "./radar/geocodeCacheApi";
import {
  type CustomRadarGroup,
  type UnlocatedRadarOrder,
  removeOrderIdsFromGroups,
  GROUP_NUMBER_TOKEN,
  getNextGroupColor,
} from "./radar/radarTypes";
import {
  fetchRadarGroups,
  createRadarGroup,
  updateRadarGroup,
  deleteRadarGroup,
  addOrdersToRadarGroup,
  removeOrdersFromRadarGroups,
} from "./radar/radarGroupsApi";
import { RadarHeader } from "./radar/RadarHeader";
import { RadarMapControls } from "./radar/RadarMapControls";
import { RadarOrderInspector } from "./radar/RadarOrderInspector";
import { RadarMoveOrderModal } from "./radar/RadarMoveOrderModal";
import { RadarAutoSidebar } from "./radar/RadarAutoSidebar";
import { RadarCustomSidebar } from "./radar/RadarCustomSidebar";

// Addresses looked up online at the same time (Nominatim is queued separately
// to respect its 1 request/second limit)
const GEOCODE_CONCURRENCY = 4;

interface DeliveryRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  readyOrders: Order[];
  kitchenOrders: Order[];
  restaurantAddress: string;
  googleMapsApiKey?: string;
  deliveryPersons: DeliveryPerson[];
  token: string | null;
  onOrdersAssigned: () => void;
  orderPrefix?: string;
  restaurantLogo?: string;
  restaurantCoords?: { lat: number; lng: number };
}

export const DeliveryRadarModal: React.FC<DeliveryRadarModalProps> = ({
  isOpen,
  onClose,
  readyOrders,
  kitchenOrders,
  restaurantAddress,
  restaurantCoords,
  googleMapsApiKey,
  deliveryPersons,
  token,
  onOrdersAssigned,
  orderPrefix = "K",
  restaurantLogo,
}) => {
  const { t } = useTranslation();
  const { configurations } = useConfigurations();
  // Memoised so a missing config doesn't create a new array every render
  const deliveryZones = useMemo(
    () => configurations?.deliveryZones || [],
    [configurations?.deliveryZones]
  );
  // Read inside geocoding without re-running it when zones change
  const deliveryZonesRef = useRef(deliveryZones);
  deliveryZonesRef.current = deliveryZones;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const corridorPolylinesRef = useRef<L.Polyline[]>([]);
  const zonePolygonsRef = useRef<L.Polygon[]>([]);
  const osrmRoutePolylineRef = useRef<L.Polyline | null>(null);
  // Order address locations for this session, keyed by normalised address
  const geocodeCache = useRef<Map<string, GeocodeHit>>(new Map());
  const restaurantLocRef = useRef<{
    address: string;
    loc: { lat: number; lng: number };
  } | null>(null);
  const hasFittedInitialBounds = useRef(false);
  // Incremented per geocoding run so a slow, older run can't overwrite newer results
  const geocodeRunIdRef = useRef(0);

  const [isGeocoding, setIsGeocoding] = useState(false);
  // Online lookups of new addresses: done / total (null when idle)
  const [geocodeProgress, setGeocodeProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  // Orders that couldn't be placed on the map (shown in the header)
  const [unlocatedOrders, setUnlocatedOrders] = useState<UnlocatedRadarOrder[]>(
    []
  );
  const [showZones, setShowZones] = useState(false);
  const [restaurantCoord, setRestaurantCoord] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [geocodedOrders, setGeocodedOrders] = useState<GeocodedDeliveryOrder[]>(
    []
  );
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Custom Groups Mode State
  const [radarMode, setRadarMode] = useState<"auto" | "custom">("auto");
  // Groups are stored in the shared local database (visible on every POS)
  const [customGroups, setCustomGroups] = useState<CustomRadarGroup[]>([]);
  // Last server payload, so polling only re-renders when something changed
  const lastGroupsJsonRef = useRef<string>("");
  // While > 0, poll results are ignored so they can't undo an optimistic update
  const pendingGroupMutationsRef = useRef(0);
  const [selectedCustomGroupId, setSelectedCustomGroupId] = useState<string | null>(null);
  const [checkedUnassignedOrderIds, setCheckedUnassignedOrderIds] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>("");
  const [colorPickerGroupId, setColorPickerGroupId] = useState<string | null>(null);
  const [movingOrderState, setMovingOrderState] = useState<{
    orderId: string;
    currentGroupId: string;
  } | null>(null);
  const [customGroupDriverId, setCustomGroupDriverId] = useState<string>("");

  // Filters & display toggles
  const [showKitchenOrders, setShowKitchenOrders] = useState(true);
  const [showReadyOrders, setShowReadyOrders] = useState(true);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [inspectedOrder, setInspectedOrder] =
    useState<GeocodedDeliveryOrder | null>(null);

  // Driving route calculation summary for selected orders
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMin: number;
    stops: number;
  } | null>(null);

  // Safe Logo loader with crossOrigin="anonymous" to avoid CORS / CORP canvas blocking
  const [safeLogoUrl, setSafeLogoUrl] = useState<string>(
    restaurantLogo || configurations?.logo || "./logo.png"
  );

  useEffect(() => {
    const rawLogo = restaurantLogo || configurations?.logo || "./logo.png";
    if (
      !rawLogo ||
      rawLogo.startsWith("data:") ||
      rawLogo.startsWith("blob:") ||
      rawLogo.startsWith("./")
    ) {
      setSafeLogoUrl(rawLogo || "./logo.png");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 46;
        canvas.height = img.naturalHeight || 46;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setSafeLogoUrl(canvas.toDataURL("image/png"));
        } else {
          setSafeLogoUrl(rawLogo);
        }
      } catch {
        setSafeLogoUrl(rawLogo);
      }
    };
    img.onerror = () => {
      setSafeLogoUrl("./logo.png");
    };
    img.src = rawLogo;
  }, [configurations?.logo, restaurantLogo]);

  // Timer tick every 15s to keep elapsed preparation & ready times fresh
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const applyServerGroups = useCallback((groups: CustomRadarGroup[]) => {
    const json = JSON.stringify(groups);
    if (json === lastGroupsJsonRef.current) return;
    lastGroupsJsonRef.current = json;
    setCustomGroups(groups);
  }, []);

  // Local change shown immediately; the next server result always replaces it
  const setGroupsOptimistic = useCallback(
    (update: (prev: CustomRadarGroup[]) => CustomRadarGroup[]) => {
      lastGroupsJsonRef.current = "";
      setCustomGroups(update);
    },
    []
  );

  // The server also drops orders that were dispatched / delivered / cancelled
  // anywhere (other screens or POS), so groups never keep stale orders
  const loadCustomGroups = useCallback(async () => {
    if (pendingGroupMutationsRef.current > 0) return;
    try {
      const groups = await fetchRadarGroups(token);
      if (pendingGroupMutationsRef.current > 0) return;
      applyServerGroups(groups);
    } catch (err) {
      console.warn("Failed to load delivery radar groups:", err);
    }
  }, [token, applyServerGroups]);

  // Load on open and poll while open so changes from other POS show up
  useEffect(() => {
    if (!isOpen) return;
    loadCustomGroups();
    const interval = setInterval(loadCustomGroups, 5000);
    return () => clearInterval(interval);
  }, [isOpen, loadCustomGroups]);

  // Optimistically applies a group change, saves it, then shows the server state.
  // Returns false (after an error toast and a reload) if saving failed.
  const runGroupMutation = async (
    optimistic: (prev: CustomRadarGroup[]) => CustomRadarGroup[],
    request: () => Promise<CustomRadarGroup[]>
  ) => {
    pendingGroupMutationsRef.current += 1;
    setGroupsOptimistic(optimistic);
    try {
      const groups = await request();
      pendingGroupMutationsRef.current -= 1;
      // A later mutation still in flight will apply its own (newer) result
      if (pendingGroupMutationsRef.current === 0) applyServerGroups(groups);
      return true;
    } catch (err) {
      pendingGroupMutationsRef.current -= 1;
      console.error("Delivery radar group update failed:", err);
      toast.error(t("deliveryView.radar.messages.groupSaveError"));
      lastGroupsJsonRef.current = "";
      loadCustomGroups();
      return false;
    }
  };

  // Clean up when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      corridorPolylinesRef.current = [];
      zonePolygonsRef.current = [];
      osrmRoutePolylineRef.current = null;
      hasFittedInitialBounds.current = false;
      setRouteInfo(null);
      setSelectedOrderIds([]);
      setInspectedOrder(null);
      setCheckedUnassignedOrderIds([]);
      setEditingGroupId(null);
      setColorPickerGroupId(null);
      setMovingOrderState(null);
    }
  }, [isOpen]);

  // Geocode Restaurant and Delivery Orders.
  // Order: in-memory cache -> shared DB cache (instant) -> online lookup for new
  // addresses, a few in parallel. The map updates as orders are found instead
  // of waiting for all of them; orders that can't be placed are reported.
  // Several POS can run this at once: each works through the addresses in a
  // random order, re-checks the shared cache right before each online lookup and
  // saves every result immediately, so they split the work instead of repeating it.
  const runGeocoding = useCallback(async () => {
    if (!restaurantAddress) return;
    const runId = ++geocodeRunIdRef.current;
    const isStale = () => runId !== geocodeRunIdRef.current;
    setIsGeocoding(true);
    let publishTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      let restLoc: { lat: number; lng: number } | null =
        restaurantCoords && restaurantCoords.lat && restaurantCoords.lng
          ? restaurantCoords
          : restaurantLocRef.current?.address === restaurantAddress
          ? restaurantLocRef.current.loc
          : null;

      if (!restLoc) {
        const res = await geocodeAddress(restaurantAddress, googleMapsApiKey);
        if (res) {
          restLoc = res;
          restaurantLocRef.current = { address: restaurantAddress, loc: res };
        }
      }

      if (isStale()) return;
      if (!restLoc) {
        console.warn("Could not geocode restaurant address");
        return;
      }
      const origin = restLoc;
      setRestaurantCoord(origin);

      const allOrdersToGeocode = [...readyOrders, ...kitchenOrders];
      const unlocated: UnlocatedRadarOrder[] = [];
      // Geocoded without the apartment: same building, same location
      const withAddress: { order: Order; address: string; key: string }[] = [];
      for (const order of allOrdersToGeocode) {
        const address = order.customer?.address
          ? formatAddressForGeocoding(order.customer.address)
          : "";
        if (!address.trim()) {
          unlocated.push({ order, address: "", reason: "no_address" });
        } else {
          withAddress.push({ order, address, key: getAddressCacheKey(address) });
        }
      }

      // The shared DB is the source of truth (one local query): it brings in
      // locations found or manually fixed by other POS since the last load
      const allKeys = Array.from(new Set(withAddress.map((w) => w.key)));
      const dbCached = await loadCachedCoordinates(token, allKeys);
      dbCached.forEach((hit, key) => geocodeCache.current.set(key, hit));
      if (isStale()) return;

      const zones = (deliveryZonesRef.current || []).filter(
        (z: any) => Array.isArray(z?.points) && z.points.length >= 3
      );
      // Sanity checks on automatic locations; a manual location is trusted
      const getWarnings = (order: Order, hit: GeocodeHit): LocationWarning[] => {
        if (hit.source === "manual") return [];
        const warnings: LocationWarning[] = [];
        // Only the first 3 digits (province + town/area): neighbouring postcodes
        // of the same town (Rivas 28521/28522/28523) often disagree between
        // providers, but a different prefix means a match in the wrong town.
        const orderPostcode = extractPostcode(order.customer?.address || "");
        if (
          orderPostcode &&
          hit.postcode &&
          orderPostcode.slice(0, 3) !== hit.postcode.slice(0, 3)
        ) {
          warnings.push("postcode_mismatch");
        }
        if (
          zones.length > 0 &&
          !zones.some((z: any) => isPointInPolygon(hit, z.points))
        ) {
          warnings.push("outside_zones");
        }
        if (hit.precision === "town") warnings.push("approximate");
        return warnings;
      };

      const toGeocoded = (
        order: Order,
        key: string,
        hit: GeocodeHit
      ): GeocodedDeliveryOrder => {
        const loc = { lat: hit.lat, lng: hit.lng };
        const bearing = calculateBearing(origin, loc);
        return {
          order,
          location: loc,
          distanceFromRestaurantKm:
            Math.round(calculateHaversineDistance(origin, loc) * 10) / 10,
          bearing: Math.round(bearing),
          compassDir: getCompassDirection(bearing),
          compassCode: getCompassCode(bearing),
          addressKey: key,
          locationSource: hit.source,
          locationWarnings: getWarnings(order, hit),
        };
      };

      const resultsByOrderId = new Map<string, GeocodedDeliveryOrder>();
      const pendingByKey = new Map<
        string,
        { key: string; address: string; orders: Order[] }
      >();
      for (const w of withAddress) {
        const hit = geocodeCache.current.get(w.key);
        if (hit) {
          resultsByOrderId.set(w.order.id, toGeocoded(w.order, w.key, hit));
        } else {
          const entry = pendingByKey.get(w.key) || {
            key: w.key,
            address: w.address,
            orders: [],
          };
          entry.orders.push(w.order);
          pendingByKey.set(w.key, entry);
        }
      }

      // Keeps the original order sequence; coalesced so the map isn't redrawn per address
      const publishNow = () => {
        if (publishTimer) {
          clearTimeout(publishTimer);
          publishTimer = null;
        }
        if (isStale()) return;
        setGeocodedOrders(
          allOrdersToGeocode
            .map((o) => resultsByOrderId.get(o.id))
            .filter((g): g is GeocodedDeliveryOrder => !!g)
        );
      };
      const schedulePublish = () => {
        if (!publishTimer) publishTimer = setTimeout(publishNow, 500);
      };

      // Cached orders appear straight away
      publishNow();

      // Random order so POS running at the same time work on different addresses
      const queue = Array.from(pendingByKey.values());
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      const total = queue.length;
      let done = 0;
      if (total > 0) setGeocodeProgress({ done: 0, total });

      const placeOrders = (item: { key: string; orders: Order[] }, hit: GeocodeHit) => {
        geocodeCache.current.set(item.key, hit);
        item.orders.forEach((o) =>
          resultsByOrderId.set(o.id, toGeocoded(o, item.key, hit))
        );
        schedulePublish();
      };

      const worker = async () => {
        while (queue.length > 0 && !isStale()) {
          const item = queue.shift()!;
          // Another POS may have found it since this run started
          const shared = (await loadCachedCoordinates(token, [item.key])).get(
            item.key
          );
          if (shared) {
            placeOrders(item, shared);
          } else {
            const { hit, status } = await geocodeAddressDetailed(item.address);
            if (hit) {
              // Saved right away so other POS can reuse it immediately
              saveCachedCoordinates(token, [{ addressKey: item.key, hit }]);
              placeOrders(item, hit);
            } else {
              item.orders.forEach((o) =>
                unlocated.push({
                  order: o,
                  address: item.address,
                  addressKey: item.key,
                  reason: status === "error" ? "lookup_failed" : "not_found",
                })
              );
            }
          }
          done += 1;
          if (!isStale()) setGeocodeProgress({ done, total });
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(GEOCODE_CONCURRENCY, total) }, worker)
      );

      if (isStale()) return;
      publishNow();
      setUnlocatedOrders(unlocated);
    } catch (err) {
      console.error("Geocoding failed in Radar:", err);
    } finally {
      if (publishTimer) clearTimeout(publishTimer);
      if (!isStale()) {
        setIsGeocoding(false);
        setGeocodeProgress(null);
      }
    }
  }, [
    readyOrders,
    kitchenOrders,
    restaurantAddress,
    restaurantCoords,
    googleMapsApiKey,
    token,
  ]);

  // Shared Nominatim rate limit across every POS on this database
  useEffect(() => {
    if (!token) return;
    setNominatimSlotReserver((intervalMs) =>
      reserveNominatimSlot(token, intervalMs)
    );
    return () => setNominatimSlotReserver(null);
  }, [token]);

  // Manual location placement: the next tap on the map sets the location
  const [placingLocation, setPlacingLocation] = useState<{
    addressKey: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) setPlacingLocation(null);
  }, [isOpen]);

  // Saves a location as manual (placed on the map, or a flagged pin confirmed
  // as correct). Manual locations win over automatic lookups on every POS.
  const applyManualLocation = useCallback(
    async (addressKey: string, lat: number, lng: number) => {
      const ok = await saveManualLocation(token, addressKey, lat, lng);
      if (!ok) {
        toast.error(t("deliveryView.radar.messages.locationSaveError"));
        return;
      }
      geocodeCache.current.set(addressKey, {
        lat,
        lng,
        source: "manual",
        precision: "building",
        postcode: null,
      });
      forgetGeocodedAddress(addressKey);
      setInspectedOrder(null);
      toast.success(t("deliveryView.radar.messages.locationSaved"));
      runGeocoding();
    },
    [token, t, runGeocoding]
  );

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isOpen || !map || !placingLocation) return;
    const container = map.getContainer();
    container.style.cursor = "crosshair";
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { addressKey } = placingLocation;
      setPlacingLocation(null);
      applyManualLocation(addressKey, e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
      container.style.cursor = "";
    };
  }, [isOpen, placingLocation, applyManualLocation]);

  const handleStartPlaceLocation = (addressKey: string, label: string) => {
    setPlacingLocation({ addressKey, label });
  };

  // "Look up again": forget the stored location everywhere and re-geocode
  const handleLookUpAgain = async (addressKey: string) => {
    const ok = await deleteCachedLocation(token, addressKey);
    if (!ok) {
      toast.error(t("deliveryView.radar.messages.locationSaveError"));
      return;
    }
    geocodeCache.current.delete(addressKey);
    forgetGeocodedAddress(addressKey);
    setInspectedOrder(null);
    toast.info(t("deliveryView.radar.messages.lookUpAgainStarted"));
    runGeocoding();
  };

  useEffect(() => {
    if (isOpen) {
      runGeocoding();
    }
  }, [isOpen, runGeocoding]);

  // Compute smart corridor clusters (55° max angle diff, 1.8km local hop, 0.85km corridor lateral offset)
  const clusters: DeliveryCluster[] = useMemo(() => {
    return findDeliveryClusters(geocodedOrders, 55, 1.8, 0.85);
  }, [geocodedOrders]);

  // Filter geocoded orders based on visibility toggles
  const visibleGeocodedOrders = useMemo(() => {
    return geocodedOrders.filter((item) => {
      const isReady = item.order.status?.toLowerCase() === "ready for delivery";
      const isKitchen = item.order.status?.toLowerCase() === "sent to kitchen";
      if (isReady && !showReadyOrders) return false;
      if (isKitchen && !showKitchenOrders) return false;
      return true;
    });
  }, [geocodedOrders, showReadyOrders, showKitchenOrders]);

  // Orders on the map whose location failed a sanity check
  const warnedOrders = useMemo(
    () => geocodedOrders.filter((g) => (g.locationWarnings?.length ?? 0) > 0),
    [geocodedOrders]
  );

  // Selected orders as full objects (for auto mode)
  const selectedOrders = useMemo(() => {
    return geocodedOrders
      .filter((g) => selectedOrderIds.includes(g.order.id))
      .map((g) => g.order);
  }, [geocodedOrders, selectedOrderIds]);

  // Set of all order IDs that are currently assigned to any custom group
  const allCustomGroupedOrderIds = useMemo(() => {
    return new Set(customGroups.flatMap((g) => g.orderIds));
  }, [customGroups]);

  // Unassigned Geocoded Orders for Custom Mode (visible orders not in any custom group)
  const unassignedGeocodedOrders = useMemo(() => {
    return visibleGeocodedOrders.filter(
      (g) => !allCustomGroupedOrderIds.has(g.order.id)
    );
  }, [visibleGeocodedOrders, allCustomGroupedOrderIds]);

  // Drop checked orders that are no longer listed (hidden by a filter, grouped or gone)
  useEffect(() => {
    const listedIds = new Set(unassignedGeocodedOrders.map((g) => g.order.id));
    setCheckedUnassignedOrderIds((prev) => {
      const next = prev.filter((id) => listedIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [unassignedGeocodedOrders]);

  // Currently selected custom group object
  const selectedCustomGroup = useMemo(() => {
    return customGroups.find((g) => g.id === selectedCustomGroupId) || null;
  }, [customGroups, selectedCustomGroupId]);

  // Active Routing Order IDs (used for OSRM multi-stop road polyline)
  const activeRoutingOrderIds = useMemo(() => {
    if (radarMode === "auto") {
      return selectedOrderIds;
    }
    if (!selectedCustomGroupId) return [];
    const group = customGroups.find((g) => g.id === selectedCustomGroupId);
    return group ? group.orderIds : [];
  }, [radarMode, selectedOrderIds, selectedCustomGroupId, customGroups]);

  // Active Routing Color (matches custom group color or emerald for auto)
  const activeRouteColor = useMemo(() => {
    if (radarMode === "custom" && selectedCustomGroupId) {
      const group = customGroups.find((g) => g.id === selectedCustomGroupId);
      if (group?.color) return group.color;
    }
    return "#10B981";
  }, [radarMode, selectedCustomGroupId, customGroups]);

  // Initialize Leaflet Map whenever modal opens and container is in the DOM
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = restaurantCoord
        ? [restaurantCoord.lat, restaurantCoord.lng]
        : [40.4168, -3.7038];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView(initialCenter, 14);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, [isOpen, restaurantCoord]);

  // Crisp Vector Pin Generator
  const createPinIcon = (
    label: string,
    bgColor: string,
    isKitchen: boolean,
    isSelected: boolean,
    // Location may be wrong: adds a red "!" badge to the pin
    hasWarning = false
  ) => {
    const stroke = isSelected ? "#FFFFFF" : "rgba(0,0,0,0.2)";
    const strokeWidth = isSelected ? 2.5 : 1;

    const fontSize = isKitchen
      ? label.length > 5
        ? 6
        : label.length > 4
        ? 6.8
        : label.length > 3
        ? 7.5
        : 8.5
      : label.length > 5
      ? 6.8
      : label.length > 4
      ? 7.5
      : label.length > 3
      ? 8.5
      : label.length > 2
      ? 9.5
      : 10.5;

    const content = isKitchen
      ? `<path d="M23 15 C21.5 15 20.5 16.5 21 18 C19.5 18.5 19 20 20 21.5 C19.5 22.5 20 24 21.5 24 L34.5 24 C36 24 36.5 22.5 36 21.5 C37 20 36.5 18.5 35 18 C35.5 16.5 34.5 15 33 15 C32 13 24 13 23 15 Z" fill="${bgColor}"/>
         <text x="28" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="900" fill="${bgColor}" text-anchor="middle" letter-spacing="-0.2px">${label}</text>`
      : `<text x="28" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${bgColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="-0.2px">${label}</text>`;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="66" viewBox="0 0 56 66">
        <path d="M28 62 C28 62 10 38 10 24 C10 12.95 18.05 4 28 4 C37.95 4 46 12.95 46 24 C46 38 28 62 28 62 Z" fill="${bgColor}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
        <circle cx="28" cy="24" r="14.5" fill="#FFFFFF"/>
        ${content}
        ${
          hasWarning
            ? `<circle cx="45" cy="10" r="8" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/>
               <text x="45" y="10.5" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">!</text>`
            : ""
        }
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      iconSize: [56, 66],
      iconAnchor: [28, 62],
      popupAnchor: [0, -62],
    });
  };

  // Restaurant Logo Marker
  const createRestaurantIcon = () => {
    return L.icon({
      iconUrl: safeLogoUrl || "./logo.png",
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      className: "rounded-full shadow-lg border-2 border-white bg-white",
    });
  };

  // Render Delivery Zones
  useEffect(() => {
    zonePolygonsRef.current.forEach((p) => p.remove());
    zonePolygonsRef.current = [];

    if (!isOpen || !mapInstanceRef.current || !showZones) return;

    deliveryZones.forEach((zone: any) => {
      if (!zone.points || zone.points.length === 0) return;
      const poly = L.polygon(
        zone.points.map((p: any) => [p.lat, p.lng]),
        {
          color: "#059669",
          fillColor: "#10B981",
          fillOpacity: 0.15,
          weight: 1.5,
        }
      ).addTo(mapInstanceRef.current!);
      zonePolygonsRef.current.push(poly);
    });
  }, [isOpen, showZones, deliveryZones]);

  // Recenter Map Helper
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds(), {
        padding: [60, 60],
        maxZoom: 16,
      });
    } else if (restaurantCoord) {
      mapInstanceRef.current.setView([restaurantCoord.lat, restaurantCoord.lng], 14);
    }
  };

  // Zooms the map to an order's pin and opens its card (e.g. from the
  // location-problems list). Turns its status filter back on if it was hidden.
  const handleFocusOrder = (item: GeocodedDeliveryOrder) => {
    const status = item.order.status?.toLowerCase();
    if (status === "ready for delivery" && !showReadyOrders) setShowReadyOrders(true);
    if (status === "sent to kitchen" && !showKitchenOrders) setShowKitchenOrders(true);
    setInspectedOrder(item);
    mapInstanceRef.current?.flyTo([item.location.lat, item.location.lng], 17, {
      duration: 0.8,
    });
  };

  // "Not on map" orders have no location yet: start placement and show the
  // restaurant's area so the right spot can be tapped nearby
  const handlePlaceUnlocatedOrder = (addressKey: string, label: string) => {
    handleStartPlaceLocation(addressKey, label);
    if (restaurantCoord) {
      mapInstanceRef.current?.flyTo([restaurantCoord.lat, restaurantCoord.lng], 15, {
        duration: 0.8,
      });
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Draw Markers & Cluster Radar Lines
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    corridorPolylinesRef.current.forEach((l) => l.remove());
    corridorPolylinesRef.current = [];

    // 1. Restaurant marker
    if (restaurantCoord) {
      const restMarker = L.marker([restaurantCoord.lat, restaurantCoord.lng], {
        title: t("deliveryView.radar.restaurantBase"),
        icon: createRestaurantIcon(),
        zIndexOffset: 1000,
      }).addTo(mapInstanceRef.current);

      markersRef.current.push(restMarker);
    }

    // 2. Order markers
    visibleGeocodedOrders.forEach((item) => {
      const isReady = item.order.status?.toLowerCase() === "ready for delivery";
      const isKitchen = item.order.status?.toLowerCase() === "sent to kitchen";
      
      let isSelected = false;
      let pinColor = isReady ? "#16A34A" : "#D97706";

      if (radarMode === "auto") {
        isSelected = selectedOrderIds.includes(item.order.id);
        const isHighlightedCluster =
          activeClusterId &&
          clusters
            .find((c) => c.id === activeClusterId)
            ?.orders.some((o) => o.order.id === item.order.id);

        if (isSelected) pinColor = "#000000";
        else if (isHighlightedCluster) pinColor = "#3F3F46";
      } else {
        const group = customGroups.find((g) => g.orderIds.includes(item.order.id));
        if (group) {
          pinColor = group.color;
          isSelected = selectedCustomGroupId === group.id;
        } else {
          pinColor = isReady ? "#10B981" : "#D97706";
        }
      }

      const displayNum = getOrderDisplayNumber(item.order, orderPrefix);
      const label = displayNum;

      const marker = L.marker([item.location.lat, item.location.lng], {
        title: t("deliveryView.radar.customerTitle", {
          displayNum,
          name: item.order.customer?.name || "Cliente",
        }),
        icon: createPinIcon(
          label,
          pinColor,
          isKitchen,
          isSelected,
          (item.locationWarnings?.length ?? 0) > 0
        ),
        zIndexOffset: isSelected ? 500 : isReady ? 300 : 200,
      }).addTo(mapInstanceRef.current!);

      marker.on("click", () => {
        setInspectedOrder(item);
        if (radarMode === "auto" && isReady) {
          toggleOrderSelection(item.order.id);
        }
      });

      markersRef.current.push(marker);
    });

    // 3. Draw faint corridor connectors for multi-order clusters (AUTO MODE ONLY)
    if (radarMode === "auto") {
      clusters.forEach((cluster) => {
        if (cluster.orders.length > 1 && restaurantCoord) {
          const isClusterActive = activeClusterId === cluster.id;
          const strokeColor = isClusterActive ? "#000000" : "#A1A1AA";
          const strokeOpacity = isClusterActive ? 0.85 : 0.35;
          const strokeWeight = isClusterActive ? 3 : 2;

          cluster.orders.forEach((o) => {
            const line = L.polyline(
              [
                [restaurantCoord.lat, restaurantCoord.lng],
                [o.location.lat, o.location.lng],
              ],
              {
                color: strokeColor,
                opacity: strokeOpacity,
                weight: strokeWeight,
                dashArray: "5, 8",
              }
            ).addTo(mapInstanceRef.current!);
            corridorPolylinesRef.current.push(line);
          });
        }
      });
    }

    // ONLY adjust zoom/bounds automatically ONCE upon initial load
    if (
      !hasFittedInitialBounds.current &&
      // Wait for at least one order (orders now load progressively), not just the restaurant
      visibleGeocodedOrders.length > 0 &&
      mapInstanceRef.current
    ) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
      });
      hasFittedInitialBounds.current = true;
    }
  }, [
    isOpen,
    visibleGeocodedOrders,
    selectedOrderIds,
    restaurantCoord,
    activeClusterId,
    clusters,
    t,
    orderPrefix,
    safeLogoUrl,
    radarMode,
    customGroups,
    selectedCustomGroupId,
  ]);

  // Calculate & Draw Driving Route for Selected Orders (OSRM 100% Free)
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current || !restaurantCoord) {
      return;
    }

    if (activeRoutingOrderIds.length === 0) {
      if (osrmRoutePolylineRef.current) {
        osrmRoutePolylineRef.current.remove();
        osrmRoutePolylineRef.current = null;
      }
      setRouteInfo(null);
      return;
    }

    const selectedGeocoded = geocodedOrders
      .filter((g) => activeRoutingOrderIds.includes(g.order.id))
      .sort(
        (a, b) => a.distanceFromRestaurantKm - b.distanceFromRestaurantKm
      );

    if (selectedGeocoded.length === 0) {
      if (osrmRoutePolylineRef.current) {
        osrmRoutePolylineRef.current.remove();
        osrmRoutePolylineRef.current = null;
      }
      setRouteInfo(null);
      return;
    }

    const coordsList = [
      `${restaurantCoord.lng},${restaurantCoord.lat}`,
      ...selectedGeocoded.map((g) => `${g.location.lng},${g.location.lat}`),
    ].join(";");

    // Abort when selection/group changes so a late response can't draw the wrong route
    const controller = new AbortController();

    fetch(
      `${getOsrmBaseUrl("car")}/route/v1/driving/${coordsList}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((osrmData) => {
        if (controller.signal.aborted) return;
        if (osrmData?.code === "Ok" && osrmData.routes?.[0]) {
          const route = osrmData.routes[0];
          setRouteInfo({
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMin: Math.round(route.duration / 60),
            stops: selectedGeocoded.length,
          });

          if (osrmRoutePolylineRef.current) {
            osrmRoutePolylineRef.current.remove();
            osrmRoutePolylineRef.current = null;
          }

          if (mapInstanceRef.current) {
            const path: [number, number][] = route.geometry.coordinates.map(
              (pt: [number, number]) => [pt[1], pt[0]]
            );
            const poly = L.polyline(path, {
              color: activeRouteColor,
              weight: 5,
              opacity: 0.9,
              lineJoin: "round",
            }).addTo(mapInstanceRef.current);
            osrmRoutePolylineRef.current = poly;
          }
          return;
        }
        throw new Error("OSRM failed");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn("OSRM radar route calculation failed:", err);
        // Don't leave the previous route on screen labelled as the new selection
        if (osrmRoutePolylineRef.current) {
          osrmRoutePolylineRef.current.remove();
          osrmRoutePolylineRef.current = null;
        }
        setRouteInfo(null);
      });

    return () => controller.abort();
  }, [isOpen, activeRoutingOrderIds, activeRouteColor, geocodedOrders, restaurantCoord]);

  const selectClusterOrders = (cluster: DeliveryCluster) => {
    const readyIds = cluster.orders
      .filter((o) => o.order.status?.toLowerCase() === "ready for delivery")
      .map((o) => o.order.id);

    if (readyIds.length === 0) {
      toast.info(t("deliveryView.radar.messages.corridorOnlyKitchen"));
      return;
    }

    setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...readyIds])));
    const translatedDir = t(
      `deliveryView.radar.directions.${cluster.compassCode}`
    );
    toast.success(
      t("deliveryView.radar.messages.selectedCountHeading", {
        count: readyIds.length,
        dir: translatedDir,
      })
    );
  };

  // Batch Assign selected orders to chosen driver (Auto Mode)
  const handleBatchAssign = async () => {
    if (selectedOrders.length === 0) {
      toast.error(t("deliveryView.radar.messages.selectAtLeastOne"));
      return;
    }
    if (!selectedDriverId) {
      toast.error(t("deliveryView.radar.messages.pleaseSelectDriver"));
      return;
    }

    // Dropdown values are `p.id || p.name`, so match the same way
    const driver = deliveryPersons.find(
      (d) => (d.id || d.name) === selectedDriverId
    );
    if (!driver) {
      toast.error(t("deliveryView.radar.messages.driverNotFound"));
      return;
    }

    setIsAssigning(true);
    try {
      const nowIso = new Date().toISOString();
      const updatePromises = selectedOrders.map((order) =>
        updateOrder(token, order.id, {
          deliveryPersonId: driver.id,
          deliveryPersonPhone: driver.phone,
          deliveryPersonName: driver.name,
          deliveryPersonEmail: driver.email,
          deliveryPersonVehicleType: driver.vehicleType,
          deliveryPersonLicenseNo: driver.licenseNo,
          status: "out for delivery",
          assignedAt: nowIso,
        })
      );

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(Boolean);

      // Dispatched orders must not linger inside custom groups
      const assignedIds = selectedOrders
        .filter((_, i) => results[i])
        .map((o) => o.id);
      if (assignedIds.some((id) => allCustomGroupedOrderIds.has(id))) {
        runGroupMutation(
          (prev) => removeOrderIdsFromGroups(prev, assignedIds),
          () => removeOrdersFromRadarGroups(token, assignedIds)
        );
      }
      setSelectedOrderIds((prev) =>
        prev.filter((id) => !assignedIds.includes(id))
      );

      if (allSuccess) {
        toast.success(
          t("deliveryView.radar.messages.assignSuccess", {
            count: selectedOrders.length,
            name: driver.name,
          })
        );
        onOrdersAssigned();
        onClose();
      } else {
        toast.warn(t("deliveryView.radar.messages.assignPartialWarning"));
        onOrdersAssigned();
      }
    } catch (err) {
      console.error("Batch assign error:", err);
      toast.error(t("deliveryView.radar.messages.assignError"));
    } finally {
      setIsAssigning(false);
    }
  };

  // Custom Groups Operations (saved to the shared local database)
  const handleCreateGroup = async (customName?: string) => {
    const name =
      typeof customName === "string" && customName.trim() ? customName.trim() : undefined;
    // Default names get the next number of the day from the shared database
    // ("Group 6" even if 1–5 were deleted; back to 1 the next day). The token is
    // filled in by the server; a literal "{{num}}" can't be used because i18next
    // would try to interpolate it again.
    const nameTemplate = t("deliveryView.radar.groupDefaultName", {
      num: GROUP_NUMBER_TOKEN,
    });
    const color = getNextGroupColor(customGroups);

    // Not optimistic: the new group's id and number come from the database
    pendingGroupMutationsRef.current += 1;
    try {
      const { group, groups } = await createRadarGroup(token, {
        name,
        nameTemplate,
        color,
      });
      pendingGroupMutationsRef.current -= 1;
      lastGroupsJsonRef.current = "";
      applyServerGroups(groups);
      setSelectedCustomGroupId(group.id);
      toast.success(
        t("deliveryView.radar.messages.groupCreated", { name: group.name })
      );
    } catch (err) {
      pendingGroupMutationsRef.current -= 1;
      console.error("Failed to create delivery radar group:", err);
      toast.error(t("deliveryView.radar.messages.groupSaveError"));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (selectedCustomGroupId === groupId) {
      setSelectedCustomGroupId(null);
    }
    const ok = await runGroupMutation(
      (prev) => prev.filter((g) => g.id !== groupId),
      () => deleteRadarGroup(token, groupId)
    );
    if (ok) toast.info(t("deliveryView.radar.messages.groupDeleted"));
  };

  const handleStartRenameGroup = (group: CustomRadarGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveRenameGroup = (groupId: string) => {
    // Rename can fire twice (Enter, then blur as the input unmounts)
    if (editingGroupId !== groupId) return;
    const newName = editingGroupName.trim();
    const current = customGroups.find((g) => g.id === groupId);
    setEditingGroupId(null);
    if (!newName || !current || current.name === newName) return;
    runGroupMutation(
      (prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g)),
      () => updateRadarGroup(token, groupId, { name: newName })
    );
  };

  const handleChangeGroupColor = (groupId: string, newColor: string) => {
    runGroupMutation(
      (prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, color: newColor } : g)),
      () => updateRadarGroup(token, groupId, { color: newColor })
    );
  };

  const handleAddOrdersToGroup = async (
    groupId: string,
    orderIdsToAdd: string[]
  ) => {
    const group = customGroups.find((g) => g.id === groupId);
    if (!group || orderIdsToAdd.length === 0) return;
    setCheckedUnassignedOrderIds((prev) =>
      prev.filter((id) => !orderIdsToAdd.includes(id))
    );
    // An order lives in one group only, so it leaves any other group
    const ok = await runGroupMutation(
      (prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                orderIds: Array.from(
                  new Set([...g.orderIds, ...orderIdsToAdd])
                ),
              }
            : {
                ...g,
                orderIds: g.orderIds.filter(
                  (id) => !orderIdsToAdd.includes(id)
                ),
              }
        ),
      () => addOrdersToRadarGroup(token, groupId, orderIdsToAdd)
    );
    if (ok) {
      toast.success(
        t("deliveryView.radar.messages.orderAdded", { name: group.name })
      );
    }
  };

  // An order is in at most one group, so groupId only matters for the UI call
  const handleRemoveOrderFromGroup = async (_groupId: string, orderId: string) => {
    const ok = await runGroupMutation(
      (prev) => removeOrderIdsFromGroups(prev, [orderId]),
      () => removeOrdersFromRadarGroups(token, [orderId])
    );
    if (ok) toast.info(t("deliveryView.radar.messages.orderRemoved"));
  };

  const handleMoveOrderToGroup = async (
    orderId: string,
    fromGroupId: string,
    toGroupId: string
  ) => {
    const targetGroup = customGroups.find((g) => g.id === toGroupId);
    if (!targetGroup) return;
    setMovingOrderState(null);
    const ok = await runGroupMutation(
      (prev) =>
        prev.map((g) => {
          if (g.id === fromGroupId) {
            return { ...g, orderIds: g.orderIds.filter((id) => id !== orderId) };
          }
          if (g.id === toGroupId) {
            return {
              ...g,
              orderIds: Array.from(new Set([...g.orderIds, orderId])),
            };
          }
          return g;
        }),
      () => addOrdersToRadarGroup(token, toGroupId, [orderId])
    );
    if (ok) {
      toast.success(
        t("deliveryView.radar.messages.orderMoved", { name: targetGroup.name })
      );
    }
  };

  const handleDispatchCustomGroup = async (group: CustomRadarGroup) => {
    if (!customGroupDriverId) {
      toast.error(t("deliveryView.radar.messages.pleaseSelectDriver"));
      return;
    }
    const driver = deliveryPersons.find(
      (d) => (d.id || d.name) === customGroupDriverId
    );
    if (!driver) {
      toast.error(t("deliveryView.radar.messages.driverNotFound"));
      return;
    }

    const readyOrdersInGroup = geocodedOrders
      .filter(
        (g) =>
          group.orderIds.includes(g.order.id) &&
          g.order.status?.toLowerCase() === "ready for delivery"
      )
      .map((g) => g.order);

    if (readyOrdersInGroup.length === 0) {
      toast.info(t("deliveryView.radar.messages.customOnlyKitchen"));
      return;
    }

    setIsAssigning(true);
    try {
      const nowIso = new Date().toISOString();
      const updatePromises = readyOrdersInGroup.map((order) =>
        updateOrder(token, order.id, {
          deliveryPersonId: driver.id,
          deliveryPersonPhone: driver.phone,
          deliveryPersonName: driver.name,
          deliveryPersonEmail: driver.email,
          deliveryPersonVehicleType: driver.vehicleType,
          deliveryPersonLicenseNo: driver.licenseNo,
          status: "out for delivery",
          assignedAt: nowIso,
        })
      );

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(Boolean);

      // Remove every successfully dispatched order (also on partial failure).
      // The dispatched group itself is deleted once emptied; other empty groups stay.
      const assignedIds = readyOrdersInGroup
        .filter((_, i) => results[i])
        .map((o) => o.id);
      const remainingIds = group.orderIds.filter(
        (id) => !assignedIds.includes(id)
      );
      if (remainingIds.length === 0) {
        runGroupMutation(
          (prev) => prev.filter((g) => g.id !== group.id),
          () => deleteRadarGroup(token, group.id)
        );
      } else if (assignedIds.length > 0) {
        runGroupMutation(
          (prev) => removeOrderIdsFromGroups(prev, assignedIds),
          () => removeOrdersFromRadarGroups(token, assignedIds)
        );
      }

      if (allSuccess) {
        toast.success(
          t("deliveryView.radar.messages.assignCustomSuccess", {
            count: readyOrdersInGroup.length,
            group: group.name,
            name: driver.name,
          })
        );
        if (selectedCustomGroupId === group.id) {
          setSelectedCustomGroupId(null);
        }
        onOrdersAssigned();
        onClose();
      } else {
        toast.warn(t("deliveryView.radar.messages.assignPartialWarning"));
        onOrdersAssigned();
      }
    } catch (err) {
      console.error("Custom group dispatch error:", err);
      toast.error(t("deliveryView.radar.messages.assignError"));
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <RadarHeader
          readyOrdersCount={readyOrders.length}
          kitchenOrdersCount={kitchenOrders.length}
          isGeocoding={isGeocoding}
          geocodeProgress={geocodeProgress}
          unlocatedOrders={unlocatedOrders}
          warnedOrders={warnedOrders}
          onInspectOrder={handleFocusOrder}
          onPlaceOnMap={handlePlaceUnlocatedOrder}
          orderPrefix={orderPrefix}
          onRefresh={runGeocoding}
          onClose={onClose}
        />

        {/* Modal Body: Map + Smart Dispatch Side Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Interactive Map */}
          <div className="relative flex-1 h-full bg-zinc-100">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Manual location placement: next tap on the map sets the location */}
            {placingLocation && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1150] flex items-center gap-3 bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-sm font-semibold">
                <span>
                  {t("deliveryView.radar.placingBanner", {
                    order: placingLocation.label,
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => setPlacingLocation(null)}
                  className="min-h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer touch-manipulation"
                >
                  {t("deliveryView.radar.cancel")}
                </button>
              </div>
            )}

            {/* Recenter, Filters, and Route Summary controls overlay */}
            <RadarMapControls
              showReadyOrders={showReadyOrders}
              setShowReadyOrders={setShowReadyOrders}
              showKitchenOrders={showKitchenOrders}
              setShowKitchenOrders={setShowKitchenOrders}
              showZones={showZones}
              setShowZones={setShowZones}
              readyOrdersCount={readyOrders.length}
              kitchenOrdersCount={kitchenOrders.length}
              deliveryZonesCount={deliveryZones.length}
              onRecenter={handleRecenter}
              routeInfo={routeInfo}
              radarMode={radarMode}
              selectedCustomGroup={selectedCustomGroup}
            />

            {/* Floating Order Inspector Card */}
            <RadarOrderInspector
              inspectedOrder={inspectedOrder}
              onClose={() => setInspectedOrder(null)}
              orderPrefix={orderPrefix}
              radarMode={radarMode}
              selectedOrderIds={selectedOrderIds}
              onToggleOrderSelection={toggleOrderSelection}
              customGroups={customGroups}
              selectedCustomGroup={selectedCustomGroup}
              onRemoveOrderFromGroup={handleRemoveOrderFromGroup}
              onAddOrdersToGroup={handleAddOrdersToGroup}
              onStartMoveOrder={(orderId, currentGroupId) =>
                setMovingOrderState({ orderId, currentGroupId })
              }
              onFixLocation={handleStartPlaceLocation}
              onLookUpAgain={handleLookUpAgain}
              onConfirmLocation={applyManualLocation}
            />
          </div>

          {/* Right Column: Dispatch Panel with Segmented Tabs */}
          <div className="w-[430px] border-l border-zinc-200 bg-white flex flex-col h-full shrink-0 shadow-lg z-10">
            {/* Tab Switcher */}
            <div className="p-3 border-b border-zinc-200 bg-white">
              <div className="flex bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setRadarMode("auto");
                    setInspectedOrder(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    radarMode === "auto"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Compass className="size-3.5" />
                  <span>{t("deliveryView.radar.tabAuto", "Automático")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRadarMode("custom");
                    setInspectedOrder(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    radarMode === "custom"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>{t("deliveryView.radar.tabCustom", "Personalizado")}</span>
                  {customGroups.length > 0 && (
                    <span className="size-2 rounded-full bg-black ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: AUTO CLUSTERS */}
            {radarMode === "auto" && (
              <RadarAutoSidebar
                clusters={clusters}
                activeClusterId={activeClusterId}
                setActiveClusterId={setActiveClusterId}
                selectedOrderIds={selectedOrderIds}
                selectedOrders={selectedOrders}
                toggleOrderSelection={toggleOrderSelection}
                selectClusterOrders={selectClusterOrders}
                setInspectedOrder={setInspectedOrder}
                deliveryPersons={deliveryPersons}
                selectedDriverId={selectedDriverId}
                setSelectedDriverId={setSelectedDriverId}
                handleBatchAssign={handleBatchAssign}
                isAssigning={isAssigning}
                orderPrefix={orderPrefix}
              />
            )}

            {/* TAB 2: CUSTOM GROUPS */}
            {radarMode === "custom" && (
              <RadarCustomSidebar
                customGroups={customGroups}
                selectedCustomGroupId={selectedCustomGroupId}
                setSelectedCustomGroupId={setSelectedCustomGroupId}
                selectedCustomGroup={selectedCustomGroup}
                geocodedOrders={geocodedOrders}
                unassignedGeocodedOrders={unassignedGeocodedOrders}
                checkedUnassignedOrderIds={checkedUnassignedOrderIds}
                setCheckedUnassignedOrderIds={setCheckedUnassignedOrderIds}
                editingGroupId={editingGroupId}
                editingGroupName={editingGroupName}
                setEditingGroupName={setEditingGroupName}
                colorPickerGroupId={colorPickerGroupId}
                setColorPickerGroupId={setColorPickerGroupId}
                onCreateGroup={handleCreateGroup}
                onDeleteGroup={handleDeleteGroup}
                onStartRenameGroup={handleStartRenameGroup}
                onSaveRenameGroup={handleSaveRenameGroup}
                onCancelRenameGroup={() => setEditingGroupId(null)}
                onChangeGroupColor={handleChangeGroupColor}
                onAddOrdersToGroup={handleAddOrdersToGroup}
                onRemoveOrderFromGroup={handleRemoveOrderFromGroup}
                onStartMoveOrder={(orderId, currentGroupId) =>
                  setMovingOrderState({ orderId, currentGroupId })
                }
                setInspectedOrder={setInspectedOrder}
                deliveryPersons={deliveryPersons}
                customGroupDriverId={customGroupDriverId}
                setCustomGroupDriverId={setCustomGroupDriverId}
                onDispatchCustomGroup={handleDispatchCustomGroup}
                isAssigning={isAssigning}
                orderPrefix={orderPrefix}
              />
            )}
          </div>
        </div>

        {/* Modal Popover for Moving Order between Groups */}
        <RadarMoveOrderModal
          movingOrderState={movingOrderState}
          customGroups={customGroups}
          onClose={() => setMovingOrderState(null)}
          onMoveOrder={handleMoveOrderToGroup}
        />
      </div>
    </div>
  );
};

export default DeliveryRadarModal;
