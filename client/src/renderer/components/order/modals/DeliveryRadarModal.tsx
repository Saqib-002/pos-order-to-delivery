import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Compass,
  MapPin,
  Route,
  Navigation,
  Sparkles,
  ChefHat,
  RefreshCw,
  X,
  CheckCircle2,
  Check,
  Phone,
  Crosshair,
  Store,
  Clock,
} from "lucide-react";
import { Order, DeliveryPerson } from "@/types/order";
import { CustomSelect } from "../../ui/CustomSelect";
import {
  geocodeAddress,
  calculateBearing,
  getCompassDirection,
  getCompassCode,
  calculateHaversineDistance,
  findDeliveryClusters,
  GeocodedDeliveryOrder,
  DeliveryCluster,
} from "../../../utils/googleMaps";
import { formatAddress, getOrderDisplayNumber } from "../../../utils/utils";
import { updateOrder } from "../../../utils/order";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { useConfigurations } from "../../../contexts/configurationContext";

const formatElapsedTime = (minutes: number) => {
  if (minutes < 1) return "< 1m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const getOrderElapsedTime = (order: Order) => {
  const isReady = order.status?.toLowerCase() === "ready for delivery";
  const timestamp = isReady
    ? order.readyAt || order.createdAt
    : order.createdAt;

  if (!timestamp) return { text: "-", minutes: 0, timeStr: "-" };
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  );
  return {
    text: formatElapsedTime(diffMinutes),
    minutes: diffMinutes,
    timeStr: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

interface DeliveryRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  readyOrders: Order[];
  kitchenOrders: Order[];
  restaurantAddress: string;
  googleMapsApiKey: string;
  deliveryPersons: DeliveryPerson[];
  token: string | null;
  onOrdersAssigned: () => void;
  orderPrefix?: string;
  restaurantLogo?: string;
}

export const DeliveryRadarModal: React.FC<DeliveryRadarModalProps> = ({
  isOpen,
  onClose,
  readyOrders,
  kitchenOrders,
  restaurantAddress,
  googleMapsApiKey,
  deliveryPersons,
  token,
  onOrdersAssigned,
  orderPrefix = "K",
  restaurantLogo,
}) => {
  const { t } = useTranslation();
  const { configurations } = useConfigurations();
  const deliveryZones = configurations?.deliveryZones || [];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const corridorPolylinesRef = useRef<any[]>([]);
  const zonePolygonsRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const geocodeCache = useRef<Map<string, { lat: number; lng: number }>>(
    new Map()
  );
  const hasFittedInitialBounds = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
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

  // Load Google Maps script once
  useEffect(() => {
    if (!isOpen || !googleMapsApiKey) return;

    const scriptId = "google-maps-script-delivery-radar";
    if (document.getElementById(scriptId)) {
      if (window.google?.maps) {
        setIsMapReady(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
    script.async = true;
    script.onload = () => setIsMapReady(true);
    document.head.appendChild(script);
  }, [isOpen, googleMapsApiKey]);

  // Clean up when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      if (markersRef.current) {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
      }
      if (corridorPolylinesRef.current) {
        corridorPolylinesRef.current.forEach((l) => l.setMap(null));
        corridorPolylinesRef.current = [];
      }
      if (zonePolygonsRef.current) {
        zonePolygonsRef.current.forEach((p) => p.setMap(null));
        zonePolygonsRef.current = [];
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      mapInstanceRef.current = null;
      hasFittedInitialBounds.current = false;
      setRouteInfo(null);
      setSelectedOrderIds([]);
      setInspectedOrder(null);
    }
  }, [isOpen]);

  // Geocode Restaurant and Delivery Orders
  const runGeocoding = useCallback(async () => {
    if (!restaurantAddress || !googleMapsApiKey) return;
    setIsGeocoding(true);

    try {
      // 1. Geocode restaurant address if not already cached
      let restLoc = geocodeCache.current.get(restaurantAddress);
      if (!restLoc) {
        const res = await geocodeAddress(restaurantAddress, googleMapsApiKey);
        if (res) {
          restLoc = res;
          geocodeCache.current.set(restaurantAddress, res);
        }
      }

      if (!restLoc) {
        console.warn("Could not geocode restaurant address");
        setIsGeocoding(false);
        return;
      }
      setRestaurantCoord(restLoc);

      // 2. Geocode delivery orders
      const allOrdersToGeocode = [...readyOrders, ...kitchenOrders];
      const results: GeocodedDeliveryOrder[] = [];

      for (const order of allOrdersToGeocode) {
        const rawAddr = order.customer?.address
          ? formatAddress(order.customer.address)
          : "";
        if (!rawAddr.trim()) continue;

        let loc: { lat: number; lng: number } | null | undefined =
          geocodeCache.current.get(rawAddr);
        if (!loc) {
          loc = await geocodeAddress(rawAddr, googleMapsApiKey);
          if (loc) {
            geocodeCache.current.set(rawAddr, loc);
          }
        }

        if (loc) {
          const bearing = calculateBearing(restLoc, loc);
          const compassDir = getCompassDirection(bearing);
          const compassCode = getCompassCode(bearing);
          const distKm = calculateHaversineDistance(restLoc, loc);

          results.push({
            order,
            location: loc,
            distanceFromRestaurantKm: Math.round(distKm * 10) / 10,
            bearing: Math.round(bearing),
            compassDir,
            compassCode,
          });
        }
      }

      setGeocodedOrders(results);
    } catch (err) {
      console.error("Error geocoding radar orders:", err);
    } finally {
      setIsGeocoding(false);
    }
  }, [restaurantAddress, googleMapsApiKey, readyOrders, kitchenOrders]);

  useEffect(() => {
    if (isOpen && isMapReady) {
      runGeocoding();
    }
  }, [isOpen, isMapReady, runGeocoding]);

  // Compute smart corridor clusters (55° max angle diff, 1.8km local hop, 0.85km corridor lateral offset)
  const clusters = useMemo(() => {
    return findDeliveryClusters(geocodedOrders, 55, 1.8, 0.85);
  }, [geocodedOrders]);

  // Orders filtered by visibility toggles
  const visibleGeocodedOrders = useMemo(() => {
    return geocodedOrders.filter((item) => {
      const isReady = item.order.status?.toLowerCase() === "ready for delivery";
      const isKitchen = item.order.status?.toLowerCase() === "sent to kitchen";
      if (isReady && !showReadyOrders) return false;
      if (isKitchen && !showKitchenOrders) return false;
      return true;
    });
  }, [geocodedOrders, showReadyOrders, showKitchenOrders]);

  // Selected orders as full objects
  const selectedOrders = useMemo(() => {
    return geocodedOrders
      .filter((g) => selectedOrderIds.includes(g.order.id))
      .map((g) => g.order);
  }, [geocodedOrders, selectedOrderIds]);

  // Initialize Map whenever modal opens and container is in the DOM
  useEffect(() => {
    if (!isOpen || !isMapReady || !mapContainerRef.current) return;

    if (!mapInstanceRef.current && window.google?.maps) {
      const center = restaurantCoord
        ? new window.google.maps.LatLng(restaurantCoord.lat, restaurantCoord.lng)
        : new window.google.maps.LatLng(40.4168, -3.7038); // Madrid fallback

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      mapInstanceRef.current = map;

      directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
        {
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 5,
            strokeOpacity: 0.95,
          },
        }
      );
    }
  }, [isOpen, isMapReady, restaurantCoord]);

  // Crisp Vector Pin Generator (NO emojis, NO dotted circular border)
  const createPinIcon = (
    label: string,
    bgColor: string,
    isKitchen: boolean,
    isSelected: boolean
  ) => {
    const stroke = isSelected ? "#FFFFFF" : "rgba(0,0,0,0.2)";
    const strokeWidth = isSelected ? 2.5 : 1;

    // Dynamically adjust font size so prefixed ticket numbers (P12, W-0001, K4) fit cleanly
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

    // If kitchen order, embed clean vector chef hat above label
    const content = isKitchen
      ? `<path d="M23 15 C21.5 15 20.5 16.5 21 18 C19.5 18.5 19 20 20 21.5 C19.5 22.5 20 24 21.5 24 L34.5 24 C36 24 36.5 22.5 36 21.5 C37 20 36.5 18.5 35 18 C35.5 16.5 34.5 15 33 15 C32 13 24 13 23 15 Z" fill="${bgColor}"/>
         <text x="28" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="900" fill="${bgColor}" text-anchor="middle" letter-spacing="-0.2px">${label}</text>`
      : `<text x="28" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${bgColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="-0.2px">${label}</text>`;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="66" viewBox="0 0 56 66">
        <path d="M28 62 C28 62 10 38 10 24 C10 12.95 18.05 4 28 4 C37.95 4 46 12.95 46 24 C46 38 28 62 28 62 Z" fill="${bgColor}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
        <circle cx="28" cy="24" r="14.5" fill="#FFFFFF"/>
        ${content}
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(56, 66),
      anchor: new window.google.maps.Point(28, 62),
    };
  };

  // Restaurant Logo Marker
  const createRestaurantIcon = () => {
    return {
      url: safeLogoUrl || "./logo.png",
      scaledSize: new window.google.maps.Size(46, 46),
      anchor: new window.google.maps.Point(23, 23),
    };
  };

  // Render Delivery Zones
  useEffect(() => {
    zonePolygonsRef.current.forEach((p) => p.setMap(null));
    zonePolygonsRef.current = [];

    if (!isOpen || !mapInstanceRef.current || !window.google?.maps || !showZones) return;

    deliveryZones.forEach((zone: any) => {
      if (!zone.points || zone.points.length === 0) return;
      const polygon = new window.google.maps.Polygon({
        paths: zone.points,
        fillColor: "#10B981",
        fillOpacity: 0.15,
        strokeColor: "#059669",
        strokeWeight: 1.5,
        map: mapInstanceRef.current,
        clickable: false,
      });
      zonePolygonsRef.current.push(polygon);
    });
  }, [isOpen, showZones, deliveryZones]);

  // Recenter Map Helper (Centering explicitly on Restaurant or fitting active markers)
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    if (restaurantCoord) {
      bounds.extend(
        new window.google.maps.LatLng(restaurantCoord.lat, restaurantCoord.lng)
      );
    }
    visibleGeocodedOrders.forEach((item) => {
      bounds.extend(
        new window.google.maps.LatLng(item.location.lat, item.location.lng)
      );
    });
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, 60);
    } else if (restaurantCoord) {
      mapInstanceRef.current.panTo(
        new window.google.maps.LatLng(restaurantCoord.lat, restaurantCoord.lng)
      );
      mapInstanceRef.current.setZoom(14);
    }
  };

  // Draw Markers & Cluster Radar Lines
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current || !window.google?.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear old corridor lines
    corridorPolylinesRef.current.forEach((l) => l.setMap(null));
    corridorPolylinesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // 1. Restaurant marker
    if (restaurantCoord) {
      const restLatLng = new window.google.maps.LatLng(
        restaurantCoord.lat,
        restaurantCoord.lng
      );
      const restMarker = new window.google.maps.Marker({
        position: restLatLng,
        map: mapInstanceRef.current,
        title: t("deliveryView.radar.restaurantBase"),
        icon: createRestaurantIcon(),
        zIndex: 100,
      });
      bounds.extend(restLatLng);
      markersRef.current.push(restMarker);
    }

    // 2. Order markers
    visibleGeocodedOrders.forEach((item) => {
      const isReady = item.order.status?.toLowerCase() === "ready for delivery";
      const isKitchen = item.order.status?.toLowerCase() === "sent to kitchen";
      const isSelected = selectedOrderIds.includes(item.order.id);
      const isHighlightedCluster =
        activeClusterId &&
        clusters
          .find((c) => c.id === activeClusterId)
          ?.orders.some((o) => o.order.id === item.order.id);

      // Black Theme: Selected orders are solid black, Ready are emerald, Kitchen are amber
      let pinColor = isReady ? "#16A34A" : "#D97706";
      if (isSelected) pinColor = "#000000";
      else if (isHighlightedCluster) pinColor = "#3F3F46";

      const displayNum = getOrderDisplayNumber(item.order, orderPrefix);
      const label = displayNum;
      const orderLatLng = new window.google.maps.LatLng(
        item.location.lat,
        item.location.lng
      );

      const marker = new window.google.maps.Marker({
        position: orderLatLng,
        map: mapInstanceRef.current,
        title: t("deliveryView.radar.customerTitle", {
          displayNum,
          name: item.order.customer?.name || "Cliente",
        }),
        icon: createPinIcon(label, pinColor, isKitchen, isSelected),
        zIndex: isSelected ? 50 : isReady ? 30 : 20,
      });

      marker.addListener("click", () => {
        setInspectedOrder(item);
        if (isReady) {
          toggleOrderSelection(item.order.id);
        }
      });

      bounds.extend(orderLatLng);
      markersRef.current.push(marker);
    });

    // 3. Draw faint corridor connectors for multi-order clusters
    clusters.forEach((cluster) => {
      if (cluster.orders.length > 1 && restaurantCoord) {
        const isClusterActive = activeClusterId === cluster.id;
        const strokeColor = isClusterActive ? "#000000" : "#A1A1AA";
        const strokeOpacity = isClusterActive ? 0.85 : 0.35;
        const strokeWeight = isClusterActive ? 3 : 2;

        const restLatLng = new window.google.maps.LatLng(
          restaurantCoord.lat,
          restaurantCoord.lng
        );

        cluster.orders.forEach((o) => {
          const line = new window.google.maps.Polyline({
            path: [
              restLatLng,
              new window.google.maps.LatLng(o.location.lat, o.location.lng),
            ],
            map: mapInstanceRef.current,
            strokeColor,
            strokeOpacity,
            strokeWeight,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 3,
                },
                offset: "0",
                repeat: "14px",
              },
            ],
            clickable: false,
          });
          corridorPolylinesRef.current.push(line);
        });
      }
    });

    // ONLY adjust zoom/bounds automatically ONCE upon initial load so user can freely pan away!
    if (!hasFittedInitialBounds.current && !bounds.isEmpty() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, 50);
      hasFittedInitialBounds.current = true;
      const listener = window.google.maps.event.addListener(
        mapInstanceRef.current,
        "idle",
        () => {
          if (mapInstanceRef.current && mapInstanceRef.current.getZoom() > 16) {
            mapInstanceRef.current.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        }
      );
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
    configurations,
    restaurantLogo,
    safeLogoUrl,
  ]);

  // Calculate & Draw Driving Route for Selected Orders
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current || !window.google?.maps || !restaurantCoord) {
      return;
    }

    if (selectedOrderIds.length === 0) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      setRouteInfo(null);
      return;
    }

    // Sort selected stops by distance from restaurant to optimize drop-off progression
    const selectedGeocoded = geocodedOrders
      .filter((g) => selectedOrderIds.includes(g.order.id))
      .sort(
        (a, b) => a.distanceFromRestaurantKm - b.distanceFromRestaurantKm
      );

    const origin = new window.google.maps.LatLng(
      restaurantCoord.lat,
      restaurantCoord.lng
    );
    const destination = new window.google.maps.LatLng(
      selectedGeocoded[selectedGeocoded.length - 1].location.lat,
      selectedGeocoded[selectedGeocoded.length - 1].location.lng
    );
    const waypoints = selectedGeocoded
      .slice(0, -1)
      .map((g) => ({
        location: new window.google.maps.LatLng(g.location.lat, g.location.lng),
        stopover: true,
      }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result: any, status: string) => {
        if (status === "OK" && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);

          let totalDistMeters = 0;
          let totalSecs = 0;
          result.routes[0].legs.forEach((leg: any) => {
            totalDistMeters += leg.distance?.value || 0;
            totalSecs += leg.duration?.value || 0;
          });

          setRouteInfo({
            distanceKm: Math.round((totalDistMeters / 1000) * 10) / 10,
            durationMin: Math.round(totalSecs / 60),
          });
        }
      }
    );
  }, [isOpen, selectedOrderIds, geocodedOrders, restaurantCoord]);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectClusterOrders = (cluster: DeliveryCluster) => {
    // Only select the ready orders from this cluster (kitchen orders aren't packed yet)
    const readyIds = cluster.orders
      .filter((o) => o.order.status?.toLowerCase() === "ready for delivery")
      .map((o) => o.order.id);

    if (readyIds.length === 0) {
      toast.info(t("deliveryView.radar.messages.corridorOnlyKitchen"));
      return;
    }

    // Replace or add to selection
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

  // Batch Assign selected orders to chosen driver
  const handleBatchAssign = async () => {
    if (selectedOrders.length === 0) {
      toast.error(t("deliveryView.radar.messages.selectAtLeastOne"));
      return;
    }
    if (!selectedDriverId) {
      toast.error(t("deliveryView.radar.messages.pleaseSelectDriver"));
      return;
    }

    const driver = deliveryPersons.find((d) => d.id === selectedDriverId);
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

      if (allSuccess) {
        toast.success(
          t("deliveryView.radar.messages.assignSuccess", {
            count: selectedOrders.length,
            name: driver.name,
          })
        );
        setSelectedOrderIds([]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Bar: Sleek Black Theme */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white shadow-md">
              <Compass className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {t("deliveryView.radar.title")}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
                  {t("deliveryView.radar.badgeAngle")}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t("deliveryView.radar.subtitle")}
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs shadow-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
                {t("deliveryView.radar.readyOrdersBadge", {
                  count: readyOrders.length,
                })}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                <ChefHat className="size-3.5 text-amber-400" />
                {t("deliveryView.radar.kitchenOrdersBadge", {
                  count: kitchenOrders.length,
                })}
              </span>
            </div>

            <button
              onClick={runGeocoding}
              disabled={isGeocoding}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700 shadow-sm cursor-pointer"
              title={t("deliveryView.radar.refreshLocations")}
            >
              <RefreshCw
                className={`size-4 ${isGeocoding ? "animate-spin" : ""}`}
              />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Map + Smart Dispatch Side Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Interactive Google Map */}
          <div className="relative flex-1 h-full bg-zinc-100">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Top-Right Controls: Touch-friendly Recenter Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleRecenter}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 hover:bg-white text-zinc-800 rounded-xl shadow-lg border border-zinc-200 text-xs font-bold transition-all cursor-pointer backdrop-blur-md hover:shadow-xl active:scale-95 select-none"
                title={t("deliveryView.radar.recenterMap")}
              >
                <Crosshair className="size-4 text-red-600" />
                <span>{t("deliveryView.radar.recenter")}</span>
              </button>
            </div>

            {/* Map Floating Legend & Controls on Top-Left */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-zinc-200 text-xs space-y-2 select-none min-w-[220px]">
                <div className="font-bold text-zinc-500 uppercase tracking-wider text-[11px] px-1 pb-1 border-b border-zinc-100">
                  {t("deliveryView.radar.visibilityFilters")}
                </div>

                <label className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-100/80 active:bg-zinc-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showReadyOrders}
                    onChange={(e) => setShowReadyOrders(e.target.checked)}
                    className="size-5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer border-zinc-300"
                  />
                  <span className="size-3 rounded-full bg-emerald-600 shrink-0"></span>
                  <span className="text-zinc-800 font-bold text-xs sm:text-sm">
                    {t("deliveryView.radar.showReady", {
                      count: readyOrders.length,
                    })}
                  </span>
                </label>

                <label className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-100/80 active:bg-zinc-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showKitchenOrders}
                    onChange={(e) => setShowKitchenOrders(e.target.checked)}
                    className="size-5 rounded-md text-amber-600 focus:ring-amber-500 cursor-pointer border-zinc-300"
                  />
                  <span className="size-3 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="text-zinc-800 font-bold text-xs sm:text-sm">
                    {t("deliveryView.radar.showKitchen", {
                      count: kitchenOrders.length,
                    })}
                  </span>
                </label>

                {deliveryZones.length > 0 && (
                  <label className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-100/80 active:bg-zinc-200 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showZones}
                      onChange={(e) => setShowZones(e.target.checked)}
                      className="size-5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer border-zinc-300"
                    />
                    <span className="size-3 rounded-sm bg-emerald-500 border border-emerald-700 shrink-0"></span>
                    <span className="text-zinc-800 font-bold text-xs sm:text-sm">
                      {t("deliveryView.radar.showZones", {
                        count: deliveryZones.length,
                      })}
                    </span>
                  </label>
                )}
              </div>

              {routeInfo && (
                <div className="bg-zinc-950 text-white p-3.5 rounded-xl shadow-2xl border border-zinc-800 text-xs animate-in slide-in-from-top-2">
                  <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-zinc-400">
                    <Route className="size-3.5 text-white" /> {t("deliveryView.radar.multiStopRoute")}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {t("deliveryView.radar.deliveriesDistance", {
                      count: selectedOrders.length,
                      dist: routeInfo.distanceKm,
                    })}
                  </div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">
                    {t("deliveryView.radar.estimatedDriveTime", {
                      min: routeInfo.durationMin,
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Floating Order Inspector Card (if order clicked) */}
            {inspectedOrder && (
              <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-zinc-300 max-w-sm text-xs animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        inspectedOrder.order.status?.toLowerCase() ===
                        "ready for delivery"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inspectedOrder.order.status?.toLowerCase() ===
                      "ready for delivery"
                        ? t("deliveryView.radar.statusReady")
                        : t("deliveryView.radar.statusKitchen")}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 mt-1">
                      {t("deliveryView.radar.orderTitle", {
                        displayNum: getOrderDisplayNumber(
                          inspectedOrder.order,
                          orderPrefix
                        ),
                      })}
                    </h4>
                  </div>
                  <button
                    onClick={() => setInspectedOrder(null)}
                    className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 text-zinc-600">
                  <div className="flex items-center gap-1.5 text-zinc-900 font-medium">
                    <MapPin className="size-3.5 text-red-500 shrink-0" />
                    <span className="truncate">
                      {inspectedOrder.order.customer?.address
                        ? formatAddress(inspectedOrder.order.customer.address)
                        : t("deliveryView.radar.noAddress")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>
                      {t("deliveryView.radar.client", {
                        name: inspectedOrder.order.customer?.name || "-",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3 text-zinc-400" />
                      {inspectedOrder.order.customer?.phone || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-zinc-100 p-2.5 rounded-lg border border-zinc-200 mt-1">
                    <div>
                      <span className="text-zinc-500">
                        {t("deliveryView.radar.bearing")}{" "}
                      </span>
                      <strong className="text-zinc-900">
                        {t(
                          `deliveryView.radar.directions.${inspectedOrder.compassCode}`
                        )}{" "}
                        ({inspectedOrder.bearing}°)
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">
                        {t("deliveryView.radar.distance")}{" "}
                      </span>
                      <strong className="text-zinc-900">
                        {inspectedOrder.distanceFromRestaurantKm} km
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200 mt-1.5">
                    <span className="text-zinc-600 flex items-center gap-1 font-medium">
                      <Clock className="size-3 text-zinc-500" />
                      {inspectedOrder.order.status?.toLowerCase() ===
                      "ready for delivery"
                        ? t("deliveryView.radar.elapsedReady")
                        : t("deliveryView.radar.elapsedKitchen")}
                    </span>
                    <span className="font-bold text-zinc-900">
                      {getOrderElapsedTime(inspectedOrder.order).text}
                      <span className="text-zinc-400 font-normal ml-1">
                        ({getOrderElapsedTime(inspectedOrder.order).timeStr})
                      </span>
                    </span>
                  </div>
                </div>

                {inspectedOrder.order.status?.toLowerCase() ===
                  "ready for delivery" && (
                  <button
                    onClick={() =>
                      toggleOrderSelection(inspectedOrder.order.id)
                    }
                    className={`w-full mt-3 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrderIds.includes(inspectedOrder.order.id)
                        ? "bg-zinc-100 hover:bg-zinc-200 text-red-600 border border-zinc-300"
                        : "bg-black hover:bg-zinc-800 text-white shadow-md"
                    }`}
                  >
                    {selectedOrderIds.includes(inspectedOrder.order.id)
                      ? t("deliveryView.radar.removeFromRoute")
                      : t("deliveryView.radar.addToRoute")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Smart Suggestions & Batch Assign Panel */}
          <div className="w-[420px] h-full flex flex-col bg-white border-l border-zinc-200">
            {/* Suggestions Header: Dark/Zinc Theme */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                <Sparkles className="size-4 text-zinc-700" />
                {t("deliveryView.radar.corridorSuggestions")}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {t("deliveryView.radar.corridorDescription")}
              </p>
            </div>

            {/* Clusters & Orders Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {clusters.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <Compass className="size-10 mx-auto stroke-1 mb-2 text-zinc-300" />
                  <p className="text-sm font-medium">
                    {t("deliveryView.radar.noActiveOrders")}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {t("deliveryView.radar.noActiveOrdersSub")}
                  </p>
                </div>
              ) : (
                clusters.map((cluster) => {
                  const isHovered = activeClusterId === cluster.id;
                  const allReadySelected =
                    cluster.readyCount > 0 &&
                    cluster.orders
                      .filter(
                        (o) =>
                          o.order.status?.toLowerCase() === "ready for delivery"
                      )
                      .every((o) => selectedOrderIds.includes(o.order.id));

                  const translatedDir = t(
                    `deliveryView.radar.directions.${cluster.compassCode}`
                  );
                  const clusterTitle = t("deliveryView.radar.heading", {
                    dir: translatedDir,
                    deg: Math.round(cluster.averageBearing),
                  });

                  return (
                    <div
                      key={cluster.id}
                      onMouseEnter={() => setActiveClusterId(cluster.id)}
                      onMouseLeave={() => setActiveClusterId(null)}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isHovered
                          ? "border-zinc-800 bg-zinc-50 shadow-md"
                          : "border-zinc-200 bg-white hover:border-zinc-300 shadow-sm"
                      }`}
                    >
                      {/* Cluster Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
                            <Navigation className="size-3.5 text-zinc-900 rotate-45" />
                            {clusterTitle}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {t("deliveryView.radar.corridorStats", {
                              count: cluster.orders.length,
                              dist: cluster.maxDistanceBetweenKm,
                            })}
                          </div>
                        </div>

                        {cluster.readyCount > 0 && (
                          <button
                            onClick={() => selectClusterOrders(cluster)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                              allReadySelected
                                ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
                                : "bg-black text-white hover:bg-zinc-800 shadow-sm"
                            }`}
                          >
                            {allReadySelected ? (
                              <>
                                <Check className="size-3 text-emerald-600" />
                                {t("deliveryView.radar.selected")}
                              </>
                            ) : (
                              t("deliveryView.radar.groupReady")
                            )}
                          </button>
                        )}
                      </div>

                      {/* Orders in this cluster */}
                      <div className="mt-3 space-y-1.5">
                        {cluster.orders.map((item) => {
                          const isReady =
                            item.order.status?.toLowerCase() ===
                            "ready for delivery";
                          const isSelected = selectedOrderIds.includes(
                            item.order.id
                          );
                          const total = calculateOrderTotal(
                            item.order.items || []
                          ).orderTotal;

                          return (
                            <div
                              key={item.order.id}
                              onClick={() => {
                                setInspectedOrder(item);
                                if (isReady) {
                                  toggleOrderSelection(item.order.id);
                                }
                              }}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-black bg-zinc-100 font-semibold text-black shadow-sm"
                                  : isReady
                                  ? "border-emerald-200/60 bg-emerald-50/40 hover:bg-emerald-50"
                                  : "border-amber-200/60 bg-amber-50/40 hover:bg-amber-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden pr-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!isReady}
                                  onChange={() => {}}
                                  className="size-5 rounded-md text-black focus:ring-black disabled:opacity-30 cursor-pointer shrink-0"
                                />
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-zinc-900">
                                      {getOrderDisplayNumber(
                                        item.order,
                                        orderPrefix
                                      )}
                                    </span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-1 ${
                                        isReady
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {!isReady && (
                                        <ChefHat className="size-3 text-amber-600" />
                                      )}
                                      {isReady
                                        ? t("deliveryView.radar.statusTagReady")
                                        : t("deliveryView.radar.statusTagKitchen")}
                                    </span>
                                  </div>
                                  <div className="text-zinc-500 truncate text-[11px] mt-0.5">
                                    {item.order.customer?.address
                                      ? formatAddress(
                                          item.order.customer.address
                                        )
                                      : "-"}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                        isReady
                                          ? "bg-emerald-100/70 text-emerald-800"
                                          : "bg-amber-100/70 text-amber-900"
                                      }`}
                                    >
                                      <Clock className="size-2.5" />
                                      {isReady
                                        ? t("deliveryView.radar.readySinceLabel", {
                                            time: getOrderElapsedTime(item.order).text,
                                          })
                                        : t("deliveryView.radar.kitchenSinceLabel", {
                                            time: getOrderElapsedTime(item.order).text,
                                          })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-bold text-zinc-900">
                                  €{total.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {item.distanceFromRestaurantKm} km
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Hint if there's a cooking order on the same path with cooking duration */}
                      {cluster.kitchenCount > 0 && cluster.readyCount > 0 && (() => {
                        const kitchenOrdersList = cluster.orders
                          .filter(
                            (o) =>
                              o.order.status?.toLowerCase() ===
                              "sent to kitchen"
                          )
                          .map((o) => getOrderElapsedTime(o.order))
                          .sort((a, b) => b.minutes - a.minutes);
                        const longestKitchenTime = kitchenOrdersList[0]?.text;

                        return (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-1.5 shadow-sm">
                            <ChefHat className="size-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              {longestKitchenTime
                                ? t(
                                    "deliveryView.radar.kitchenAlertWithTime",
                                    {
                                      count: cluster.kitchenCount,
                                      time: longestKitchenTime,
                                    }
                                  )
                                : t("deliveryView.radar.kitchenAlert", {
                                    count: cluster.kitchenCount,
                                  })}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Dispatch / Assignment Bar: Sleek Black/Zinc */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  {t("deliveryView.radar.dispatchHeader")}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-black text-white font-bold">
                  {t("deliveryView.radar.selectedCount", {
                    count: selectedOrders.length,
                  })}
                </span>
              </div>

              {/* Delivery Person Dropdown */}
              <div>
                <CustomSelect
                  options={deliveryPersons
                    .filter((p) => p.isActive !== false)
                    .map((p) => ({
                      value: p.id || p.name,
                      label: `${p.name} (${p.vehicleType || "Vehículo"})`,
                    }))}
                  value={selectedDriverId}
                  onChange={(val) => setSelectedDriverId(val)}
                  placeholder={t("deliveryView.radar.selectDriverPlaceholder")}
                  className="w-full"
                  portalClassName="delivery-radar-driver-portal"
                />
              </div>

              {/* Dispatch Button */}
              <button
                onClick={handleBatchAssign}
                disabled={
                  isAssigning ||
                  selectedOrders.length === 0 ||
                  !selectedDriverId
                }
                className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.01] cursor-pointer"
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    {t("deliveryView.radar.assigning")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    {t("deliveryView.radar.assignButton", {
                      count: selectedOrders.length,
                    })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRadarModal;
