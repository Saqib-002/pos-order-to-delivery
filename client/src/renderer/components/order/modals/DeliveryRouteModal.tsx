import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, CarIcon, BikeIcon } from "@/renderer/public/Svg";
import { MessageSquare, ChevronDown } from "lucide-react";
import CustomButton from "../../ui/CustomButton";
import { useConfigurations } from "../../../contexts/configurationContext";
import { geocodeAddress, getOsrmBaseUrl } from "../../../utils/googleMaps";
import { useAuth } from "../../../contexts/AuthContext";
import { locateDeliveryAddress } from "./radar/geocodeCacheApi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    origin: string;
    // The order's original customer address (structured or plain text), not the
    // display-formatted one, so the apartment can be stripped for the lookup
    destination: string;
    googleMapsApiKey?: string;
    orderId?: string;
}

const DeliveryRouteModal: React.FC<DeliveryRouteModalProps> = ({
    isOpen,
    onClose,
    origin,
    destination,
    googleMapsApiKey,
    orderId,
}) => {
    const { t } = useTranslation();
    const { configurations } = useConfigurations();
    const { auth } = useAuth();
    const mapRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [travelMode, setTravelMode] = useState<"DRIVE" | "BICYCLE">("DRIVE");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    // Safe Logo loader
    const [safeLogoUrl, setSafeLogoUrl] = useState<string>(
        configurations?.logo || "./logo.png"
    );

    useEffect(() => {
        const rawLogo = configurations?.logo || "./logo.png";
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
    }, [configurations?.logo]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 80;
        setShowScrollDownBtn(!isNearBottom);
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const isChatOpenRef = useRef(isChatOpen);
    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
        if (isChatOpen) {
            setUnreadCount(0);
            if (orderId) {
                const apiUrl = (import.meta as any).env.VITE_DRIVER_API_URL || "http://localhost:3002/api";
                fetch(`${apiUrl}/pos/orders/${orderId}/messages/read`, { method: "POST" })
                    .catch(err => console.error("Error marking messages as read on POS:", err));
            }
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: "auto" });
                }
            }, 100);
        }
    }, [isChatOpen, orderId]);

    // Toggles for visibility
    const [showZones, setShowZones] = useState(false);

    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylinesRef = useRef<L.Polyline[]>([]);
    const markersRef = useRef<L.Marker[]>([]);
    const zonePolygonsRef = useRef<L.Polygon[]>([]);
    const driverMarkerRef = useRef<L.Marker | null>(null);
    // Incremented per fetch so a slow response for a previous travel mode
    // can't overwrite the route of the mode selected afterwards
    const routeRequestSeqRef = useRef(0);

    const formatDuration = (durationStr: string) => {
        if (!durationStr) return "";
        const seconds = parseInt(durationStr.replace("s", ""), 10);
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} ${t("deliveryRouteModal.estimation.minutes")}`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} ${t("deliveryRouteModal.estimation.hours")} ${remainingMinutes} ${t("deliveryRouteModal.estimation.minutes")}`;
    };

    const fetchChatMessages = async () => {
        if (!orderId) return;
        try {
            const apiUrl = (import.meta as any).env.VITE_DRIVER_API_URL || "http://localhost:3002/api";
            const response = await fetch(`${apiUrl}/driver/orders/${orderId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setChatMessages(data);
                if (!isChatOpenRef.current) {
                    const unread = data.filter((m: any) => m.sender === "driver" && !m.read).length;
                    setUnreadCount(unread);
                }
            }
        } catch (err) {
            console.error("Error loading chat messages:", err);
        }
    };

    useEffect(() => {
        if (isOpen && orderId) {
            fetchChatMessages();
        }
    }, [isOpen, orderId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 320);
        return () => clearTimeout(timer);
    }, [isChatOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessageText.trim() || !orderId) return;

        const text = newMessageText.trim();
        setNewMessageText("");

        try {
            const apiUrl = (import.meta as any).env.VITE_DRIVER_API_URL || "http://localhost:3002/api";
            const response = await fetch(`${apiUrl}/driver/orders/${orderId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: "pos",
                    senderName: "POS Manager",
                    message: text,
                }),
            });

            if (response.ok) {
                const savedMsg = await response.json();
                setChatMessages((prev) => {
                    if (prev.some((m) => m.id === savedMsg.id)) return prev;
                    return [...prev, savedMsg];
                });
            }
        } catch (err) {
            console.error("Error sending chat message:", err);
        }
    };

    // Update Markers (Origin & Destination)
    const updateMarkers = (originPos: { lat: number; lng: number }, destPos: { lat: number; lng: number }) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (!mapInstanceRef.current) return;

        // Restaurant Logo for Origin Marker
        const restaurantIcon = L.icon({
            iconUrl: safeLogoUrl || "./logo.png",
            iconSize: [46, 46],
            iconAnchor: [23, 23],
            className: "rounded-full shadow-lg border-2 border-white bg-white",
        });

        // Cutlery icon for Customer (Destination)
        const customerIcon = L.icon({
            iconUrl: "./images/cutlery.png",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
        });

        const originMarker = L.marker([originPos.lat, originPos.lng], {
            icon: restaurantIcon,
            title: "Restaurant",
        }).addTo(mapInstanceRef.current);

        const destMarker = L.marker([destPos.lat, destPos.lng], {
            icon: customerIcon,
            title: "Customer",
        }).addTo(mapInstanceRef.current);

        markersRef.current.push(originMarker, destMarker);
    };

    // Update Delivery Zones
    const updateZones = () => {
        zonePolygonsRef.current.forEach(p => p.remove());
        zonePolygonsRef.current = [];

        if (!mapInstanceRef.current || !showZones) return;

        const zones = configurations?.deliveryZones || [];
        zones.forEach(zone => {
            const polygon = L.polygon(
                zone.points.map((p: any) => [p.lat, p.lng]),
                {
                    color: "#059669",
                    fillColor: "#10B981",
                    fillOpacity: 0.15,
                    weight: 1.5,
                }
            ).addTo(mapInstanceRef.current!);
            zonePolygonsRef.current.push(polygon);
        });
    };

    // Fetch routes with OSRM (100% Free Open Source)
    const fetchRoutes = async () => {
        const seq = ++routeRequestSeqRef.current;
        try {
            setError(null);

            const [origCoords, destCoords] = await Promise.all([
                configurations?.latitude && configurations?.longitude
                    ? Promise.resolve({ lat: configurations.latitude, lng: configurations.longitude })
                    : geocodeAddress(origin, googleMapsApiKey),
                // Same lookup as the radar (shared cache, apartment stripped),
                // so an address the radar can place is found here too
                locateDeliveryAddress(auth.token, destination),
            ]);

            if (origCoords && destCoords) {
                const osrmBase = getOsrmBaseUrl(travelMode === "BICYCLE" ? "bike" : "car");
                const osrmUrl = `${osrmBase}/route/v1/driving/${origCoords.lng},${origCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&alternatives=true`;
                const osrmRes = await fetch(osrmUrl);
                if (osrmRes.ok) {
                    const osrmData = await osrmRes.json();
                    if (seq !== routeRequestSeqRef.current) return;
                    if (osrmData.code === "Ok" && Array.isArray(osrmData.routes) && osrmData.routes.length > 0) {
                        const formattedRoutes = osrmData.routes.map((r: any) => ({
                            duration: `${Math.round(r.duration)}s`,
                            distanceMeters: r.distance,
                            coordinates: r.geometry.coordinates.map((pt: [number, number]) => ({
                                lat: pt[1],
                                lng: pt[0],
                            })),
                            isOSRM: true,
                        }));
                        setRoutes(formattedRoutes);
                        setSelectedRouteIndex(0);
                        drawTrafficRoute(formattedRoutes[0]);
                        return;
                    }
                }
            }

            if (seq !== routeRequestSeqRef.current) return;
            setError(t("deliveryRouteModal.errors.routeNotFound"));
        } catch (e) {
            console.error("Failed to fetch routes:", e);
            if (seq !== routeRequestSeqRef.current) return;
            setError("Failed to fetch routes.");
        }
    };

    // Draw the color-coded polyline using Leaflet
    const drawTrafficRoute = (route: any) => {
        if (!mapInstanceRef.current || !route?.coordinates || route.coordinates.length === 0) return;

        polylinesRef.current.forEach(p => p.remove());
        polylinesRef.current = [];

        const latLngs: [number, number][] = route.coordinates.map((c: any) => [c.lat, c.lng]);
        const originPos = { lat: latLngs[0][0], lng: latLngs[0][1] };
        const destPos = { lat: latLngs[latLngs.length - 1][0], lng: latLngs[latLngs.length - 1][1] };

        updateMarkers(originPos, destPos);

        const poly = L.polyline(latLngs, {
            color: "#10B981",
            weight: 5,
            opacity: 0.9,
            lineJoin: "round",
        }).addTo(mapInstanceRef.current);

        polylinesRef.current.push(poly);
        mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [50, 50] });
    };

    // Initialize Leaflet Map
    useEffect(() => {
        if (!isOpen) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            polylinesRef.current = [];
            markersRef.current = [];
            zonePolygonsRef.current = [];
            driverMarkerRef.current = null;
            return;
        }

        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current, {
                zoomControl: false,
            }).setView([40.345, -3.521], 13);

            L.control.zoom({ position: "bottomright" }).addTo(map);

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            mapInstanceRef.current = map;

            // Invalidate size once DOM finishes rendering modal
            setTimeout(() => {
                map.invalidateSize();
            }, 250);

            updateZones();
        }

        // Refetch on open and whenever the route inputs or travel mode change
        if (mapInstanceRef.current) {
            setRoutes([]);
            setSelectedRouteIndex(0);
            fetchRoutes();
        }
    }, [isOpen, origin, destination, travelMode]);

    useEffect(() => {
        updateZones();
    }, [showZones]);

    // Real-time Driver Tracking via WebSocket
    useEffect(() => {
        if (!isOpen || !orderId) {
            if (driverMarkerRef.current) {
                driverMarkerRef.current.remove();
                driverMarkerRef.current = null;
            }
            return;
        }

        const wsUrl = (import.meta as any).env.VITE_DRIVER_WS_URL || "ws://localhost:3002";
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("POS Map WebSocket connected (Leaflet)");
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === "init_locations") {
                    const matched = message.locations.find((l: any) => l.orderId === orderId);
                    if (matched && mapInstanceRef.current) {
                        updateDriverMarker(matched.latitude, matched.longitude, matched.driverName);
                    }
                }

                if (message.type === "location_update" && message.data && message.data.orderId === orderId) {
                    const { latitude, longitude, driverName } = message.data;
                    if (mapInstanceRef.current) {
                        updateDriverMarker(latitude, longitude, driverName);
                    }
                }

                if (message.type === "chat_message" && message.data && message.data.orderId === orderId) {
                    setChatMessages((prev) => {
                        if (prev.some((m) => m.id === message.data.id)) return prev;
                        return [...prev, message.data];
                    });

                    if (!isChatOpenRef.current && message.data.sender === "driver") {
                        setUnreadCount((prev) => prev + 1);
                        try {
                            const audio = new Audio("./notification.wav");
                            audio.volume = 0.5;
                            audio.play().catch((playErr) => console.log("Sound play error:", playErr));
                        } catch (soundErr) {
                            console.log("Error playing alert chime:", soundErr);
                        }
                    }
                }
            } catch (err) {
                console.error("POS WebSocket message error:", err);
            }
        };

        const updateDriverMarker = (lat: number, lng: number, driverName: string) => {
            if (!mapInstanceRef.current) return;

            const bikeIcon = L.icon({
                iconUrl: "./images/delivery.png",
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                className: "drop-shadow-lg",
            });

            if (!driverMarkerRef.current) {
                driverMarkerRef.current = L.marker([lat, lng], {
                    icon: bikeIcon,
                    title: `${driverName} (Driver)`,
                }).addTo(mapInstanceRef.current);
            } else {
                driverMarkerRef.current.setLatLng([lat, lng]);
            }
        };

        return () => {
            socket.close();
            if (driverMarkerRef.current) {
                driverMarkerRef.current.remove();
                driverMarkerRef.current = null;
            }
        };
    }, [isOpen, orderId]);

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

                        <div className="mt-auto space-y-4">
                            {/* Layer Toggles Section */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {t("deliveryRouteModal.layers.title")}
                                </h5>

                                <div className="space-y-4">
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

                            {/* Chat Button */}
                            {orderId && (
                                <button
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                    className={`relative w-full py-3 rounded-xl text-xs font-black transition-all border mt-2 flex items-center justify-center gap-2 cursor-pointer ${isChatOpen ? "bg-emerald-500 border-emerald-500 text-white shadow-xl scale-[1.02]" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300"}`}
                                >
                                    <MessageSquare className="size-4" />
                                    {isChatOpen ? t("deliveryRouteModal.chat.closeChat") : t("deliveryRouteModal.chat.chatWithDriver")}
                                    {unreadCount > 0 && !isChatOpen && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] size-5 flex items-center justify-center font-bold animate-bounce shadow-md">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative flex overflow-hidden">
                        {/* Info Overlay */}
                        {selectedRoute && (
                            <div className="absolute top-4 left-4 z-[1000] bg-black/90 text-white px-5 py-3 rounded-2xl flex items-center gap-4 text-sm font-black backdrop-blur-xl shadow-2xl border border-white/10">
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

                        <div ref={mapRef} className="flex-1 h-full" />

                        {/* Chat Panel side drawer */}
                        <div className={`border-l border-gray-200 bg-white flex flex-col h-full shadow-2xl relative z-[1000] transition-all duration-300 ease-in-out ${isChatOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none border-l-0"}`}>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 bg-black text-white flex items-center justify-between flex-shrink-0 min-w-[320px]">
                                <span className="font-bold text-sm">{t("deliveryRouteModal.chat.chatWithDriver")}</span>
                                <button 
                                    onClick={() => setIsChatOpen(false)} 
                                    className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Message List */}
                            <div className="flex-1 relative flex flex-col min-h-0 bg-gray-50 min-w-[320px]">
                                <div 
                                    ref={messageListRef}
                                    onScroll={handleScroll}
                                    className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col"
                                >
                                    {chatMessages.length === 0 ? (
                                        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400 text-xs">
                                            <span>{t("deliveryRouteModal.chat.noMessagesYet")}</span>
                                            <span>{t("deliveryRouteModal.chat.sendFirstMessage")}</span>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg, index) => {
                                            const isPOS = msg.sender === "pos";
                                            return (
                                                <div key={msg.id || index} className={`flex flex-col ${isPOS ? "items-end text-right" : "items-start text-left"}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${isPOS ? "bg-black text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>
                                                        {!isPOS && <div className="font-black text-[9px] text-emerald-500 mb-1">{msg.senderName}</div>}
                                                        <div className="break-all whitespace-pre-wrap">{msg.message}</div>
                                                        <div className="text-[8px] mt-1 text-gray-400">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Floating Scroll Down Button */}
                                {showScrollDownBtn && (
                                    <button
                                        type="button"
                                        onClick={scrollToBottom}
                                        className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-2 shadow-lg transition-all hover:scale-110 flex items-center justify-center cursor-pointer animate-bounce z-10"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                )}
                            </div>

                            {/* Chat Input */}
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                className="p-3 border-t border-gray-200 flex gap-2 items-center bg-white flex-shrink-0 min-w-[320px]"
                            >
                                <input 
                                    type="text" 
                                    placeholder={t("deliveryRouteModal.chat.typeMessagePlaceholder")}
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    className="flex-1 bg-gray-100 border border-transparent focus:border-gray-200 focus:bg-white text-xs rounded-xl px-3 py-2 outline-none text-gray-800 transition-all"
                                />
                                <button 
                                    type="submit"
                                    className="bg-black text-white hover:bg-neutral-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                                >
                                    {t("deliveryRouteModal.chat.sendButton")}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryRouteModal;