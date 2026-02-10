import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, CarIcon, BikeIcon, LocationIcon } from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";
import { useConfigurations } from "../../../contexts/configurationContext";

interface DeliveryRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    origin: string;
    destination: string;
    googleMapsApiKey: string;
}

const DeliveryRouteModal: React.FC<DeliveryRouteModalProps> = ({
    isOpen,
    onClose,
    origin,
    destination,
    googleMapsApiKey,
}) => {
    const { t } = useTranslation();
    const { configurations } = useConfigurations();
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [travelMode, setTravelMode] = useState<"DRIVE" | "BICYCLE">("DRIVE");

    // Toggles for visibility
    const [showTraffic, setShowTraffic] = useState(false);
    const [showZones, setShowZones] = useState(false);

    const mapInstanceRef = useRef<any>(null);
    const polylinesRef = useRef<any[]>([]);
    const markersRef = useRef<any[]>([]);
    const zonePolygonsRef = useRef<any[]>([]);

    const formatDuration = (durationStr: string) => {
        if (!durationStr) return "";
        const seconds = parseInt(durationStr.replace("s", ""), 10);
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} ${t("deliveryRouteModal.estimation.minutes")}`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} ${t("deliveryRouteModal.estimation.hours")} ${remainingMinutes} ${t("deliveryRouteModal.estimation.minutes")}`;
    };

    // Load Google Maps Core
    useEffect(() => {
        if (!isOpen) {
            mapInstanceRef.current = null;
            polylinesRef.current = [];
            markersRef.current = [];
            zonePolygonsRef.current = [];
            return;
        }

        if (!googleMapsApiKey) return;
        const scriptId = "google-maps-script-delivery-route";
        if (document.getElementById(scriptId)) {
            setIsLoaded(true);
            return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);
    }, [isOpen, googleMapsApiKey]);

    // Update Markers (Origin & Destination)
    const updateMarkers = (originPos: any, destPos: any) => {
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        if (!mapInstanceRef.current || !window.google) return;

        // Custom SVG for Restaurant (Origin)
        const restaurantIcon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
                    <path fill="#10B981" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
                    <circle fill="#FFFFFF" cx="12" cy="9" r="5"/>
                    <circle fill="#10B981" cx="12" cy="9" r="3"/>
                </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
        };

        // Custom SVG for Customer (Destination)
        const customerIcon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
                    <path fill="#EF4444" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
                    <circle fill="#FFFFFF" cx="12" cy="9" r="5"/>
                    <circle fill="#EF4444" cx="12" cy="9" r="3"/>
                </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
        };

        // Origin Marker (Restaurant)
        const originMarker = new window.google.maps.Marker({
            position: originPos,
            map: mapInstanceRef.current,
            title: "Restaurant",
            icon: restaurantIcon,
            animation: window.google.maps.Animation.DROP
        });

        // Destination Marker (Customer)
        const destMarker = new window.google.maps.Marker({
            position: destPos,
            map: mapInstanceRef.current,
            title: "Customer",
            icon: customerIcon,
            animation: window.google.maps.Animation.DROP
        });

        markersRef.current.push(originMarker, destMarker);
    };

    // Update Zones
    const updateZones = () => {
        zonePolygonsRef.current.forEach(p => p.setMap(null));
        zonePolygonsRef.current = [];

        if (!mapInstanceRef.current || !window.google || !showZones) return;

        const zones = configurations.deliveryZones || [];
        zones.forEach(zone => {
            const polygon = new window.google.maps.Polygon({
                paths: zone.points,
                fillColor: "#10B981",
                fillOpacity: 0.15,
                strokeColor: "#059669",
                strokeWeight: 1,
                map: mapInstanceRef.current,
                clickable: false
            });
            zonePolygonsRef.current.push(polygon);
        });
    };

    // Fetch from Routes API
    const fetchRoutes = async () => {
        try {
            setError(null);

            const requestBody: any = {
                origin: { address: origin },
                destination: { address: destination },
                travelMode: travelMode,
                computeAlternativeRoutes: true,
            };

            if (travelMode === "DRIVE") {
                requestBody.routingPreference = "TRAFFIC_AWARE";
                requestBody.extraComputations = ["TRAFFIC_ON_POLYLINE"];
            }

            const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": googleMapsApiKey,
                    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline,routes.travelAdvisory.speedReadingIntervals,routes.viewport"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                setRoutes(data.routes);
                setSelectedRouteIndex(0);
                drawTrafficRoute(data.routes[0]);
            } else {
                setError(t("deliveryRouteModal.errors.routeNotFound"));
            }
        } catch (e) {
            setError("Failed to fetch routes.");
        }
    };

    // Draw the color-coded polyline
    const drawTrafficRoute = (route: any) => {
        if (!mapInstanceRef.current || !window.google) return;

        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];

        const fullPath = window.google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
        const originPos = fullPath[0];
        const destPos = fullPath[fullPath.length - 1];

        updateMarkers(originPos, destPos);

        const intervals = route.travelAdvisory?.speedReadingIntervals || [];

        if (!showTraffic || intervals.length === 0) {
            const poly = new window.google.maps.Polyline({
                path: fullPath,
                strokeColor: "#3B82F6",
                strokeWeight: 4,
                strokeOpacity: 0.8,
                map: mapInstanceRef.current
            });
            polylinesRef.current.push(poly);
        } else {
            intervals.forEach((interval: any) => {
                const segmentPath = fullPath.slice(interval.startPolylinePointIndex, (interval.endPolylinePointIndex || fullPath.length - 1) + 1);

                let color = "#4ADE80"; // Normal
                if (interval.speed === "SLOW") color = "#FACC15"; // Slow
                if (interval.speed === "TRAFFIC_JAM") color = "#F87171"; // Jam

                const poly = new window.google.maps.Polyline({
                    path: segmentPath,
                    strokeColor: color,
                    strokeWeight: 4,
                    strokeOpacity: 1,
                    map: mapInstanceRef.current
                });
                polylinesRef.current.push(poly);
            });
        }

        const bounds = new window.google.maps.LatLngBounds();
        fullPath.forEach((point: any) => bounds.extend(point));
        mapInstanceRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    };

    useEffect(() => {
        if (isLoaded && isOpen && mapRef.current) {
            if (!mapInstanceRef.current) {
                setRoutes([]);
                setSelectedRouteIndex(0);
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 0, lng: 0 },
                    zoom: 12,
                    mapId: "DELIVERY_ROUTE_MAP",
                    disableDefaultUI: true,
                });
            }
            fetchRoutes();
            updateZones();
        }
    }, [isLoaded, isOpen, origin, destination, travelMode]);

    // Handle toggles
    useEffect(() => {
        if (routes[selectedRouteIndex]) {
            drawTrafficRoute(routes[selectedRouteIndex]);
        }
    }, [showTraffic]);

    useEffect(() => {
        updateZones();
    }, [showZones, isLoaded]);

    if (!isOpen) return null;

    const selectedRoute = routes[selectedRouteIndex];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-black text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            {travelMode === "DRIVE" ? <CarIcon className="size-6 text-emerald-400" /> : <BikeIcon className="size-6 text-emerald-400" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t("deliveryRouteModal.title")}</h3>
                            <p className="text-sm text-gray-400">{t("deliveryRouteModal.subtitle")}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <CrossIcon className="size-6" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden bg-gray-100">
                    {/* Sidebar */}
                    <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto flex flex-col p-4 shadow-xl z-20">
                        <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest mb-4">
                            {t("deliveryRouteModal.alternativeRoutes")}
                        </h4>

                        <div className="space-y-3 mb-6">
                            {routes.map((route, index) => (
                                <button
                                    key={index}
                                    onClick={() => { setSelectedRouteIndex(index); drawTrafficRoute(route); }}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedRouteIndex === index ? "border-teal-500 bg-teal-50 shadow-md" : "border-gray-50 bg-gray-50/50 hover:border-gray-200"}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase">
                                            {t("deliveryRouteModal.routeLabel", { index: index + 1 })}
                                        </span>
                                        {selectedRouteIndex === index && <div className="size-2 bg-teal-500 rounded-full animate-pulse" />}
                                    </div>
                                    <div className="text-lg font-black text-gray-900">{formatDuration(route.duration)}</div>
                                    <div className="text-xs text-gray-400">{(route.distanceMeters / 1000).toFixed(1)} km</div>
                                </button>
                            ))}
                        </div>

                        {error && <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl mb-4">{error}</div>}

                        <div className="mt-auto space-y-6">
                            {/* Layer Toggles Section */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {t("deliveryRouteModal.layers.title")}
                                </h5>

                                <div className="space-y-4">
                                    {/* Traffic Toggle */}
                                    <div
                                        onClick={() => setShowTraffic(!showTraffic)}
                                        className="flex items-center justify-between cursor-pointer group"
                                    >
                                        <span className={`text-sm font-bold transition-colors ${showTraffic ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {t("deliveryRouteModal.layers.traffic")}
                                        </span>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${showTraffic ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                            <div className={`size-3 bg-white rounded-full transition-all duration-300 transform ${showTraffic ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>

                                    {/* Zones Toggle */}
                                    <div
                                        onClick={() => setShowZones(!showZones)}
                                        className="flex items-center justify-between cursor-pointer group"
                                    >
                                        <span className={`text-sm font-bold transition-colors ${showZones ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {t("deliveryRouteModal.layers.zones")}
                                        </span>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${showZones ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                            <div className={`size-3 bg-white rounded-full transition-all duration-300 transform ${showZones ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Travel Mode Toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                                <button
                                    onClick={() => setTravelMode("DRIVE")}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black transition-all ${travelMode === "DRIVE" ? "bg-black text-white shadow-xl scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
                                >
                                    <CarIcon className="size-4" />
                                    {t("deliveryRouteModal.modes.car")}
                                </button>
                                <button
                                    onClick={() => setTravelMode("BICYCLE")}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black transition-all ${travelMode === "BICYCLE" ? "bg-black text-white shadow-xl scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
                                >
                                    <BikeIcon className="size-4" />
                                    {t("deliveryRouteModal.modes.bike")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative">
                        {/* Info Overlay */}
                        {selectedRoute && (
                            <div className="absolute top-4 left-4 z-10 bg-black/90 text-white px-5 py-3 rounded-2xl flex items-center gap-4 text-sm font-black backdrop-blur-xl shadow-2xl border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-teal-400 uppercase tracking-tighter">
                                        {t("deliveryRouteModal.estimation.duration")}
                                    </span>
                                    <span>{formatDuration(selectedRoute.duration)}</span>
                                </div>
                                <div className="w-px h-6 bg-white/20" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-teal-400 uppercase tracking-tighter">
                                        {t("deliveryRouteModal.estimation.distance")}
                                    </span>
                                    <span>{(selectedRoute.distanceMeters / 1000).toFixed(1)} km</span>
                                </div>
                            </div>
                        )}

                        <div ref={mapRef} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryRouteModal;