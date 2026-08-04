import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, CarIcon, BikeIcon, LocationIcon } from "@/renderer/public/Svg";
import { MessageSquare, ChevronDown } from "lucide-react";
import CustomButton from "../../ui/CustomButton";
import { useConfigurations } from "../../../contexts/configurationContext";

interface DeliveryRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    origin: string;
    destination: string;
    googleMapsApiKey: string;
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
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [travelMode, setTravelMode] = useState<"DRIVE" | "BICYCLE">("DRIVE");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
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

    // Keep a ref of isChatOpen so socket handler doesn't read stale state
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
    const [showTraffic, setShowTraffic] = useState(false);
    const [showZones, setShowZones] = useState(false);

    const mapInstanceRef = useRef<any>(null);
    const polylinesRef = useRef<any[]>([]);
    const markersRef = useRef<any[]>([]);
    const zonePolygonsRef = useRef<any[]>([]);
    const driverMarkerRef = useRef<any>(null);

    const formatDuration = (durationStr: string) => {
        if (!durationStr) return "";
        const seconds = parseInt(durationStr.replace("s", ""), 10);
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} ${t("deliveryRouteModal.estimation.minutes")}`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} ${t("deliveryRouteModal.estimation.hours")} ${remainingMinutes} ${t("deliveryRouteModal.estimation.minutes")}`;
    };

    const animateMarker = (marker: any, startLat: number, startLng: number, endLat: number, endLng: number) => {
        const startTime = Date.now();
        const duration = 2800;  

        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentLat = startLat + (endLat - startLat) * progress;
            const currentLng = startLng + (endLng - startLng) * progress;

            marker.setPosition({ lat: currentLat, lng: currentLng });

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const fetchChatMessages = async () => {
        if (!orderId) return;
        try {
            const apiUrl = (import.meta as any).env.VITE_DRIVER_API_URL || "http://localhost:3002/api";
            const response = await fetch(`${apiUrl}/driver/orders/${orderId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setChatMessages(data);
                // Calculate unread count on load if the chat drawer is closed
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
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!newMessageText.trim() || !orderId) return;
        const text = newMessageText.trim();
        setNewMessageText("");

        try {
            const apiUrl = (import.meta as any).env.VITE_DRIVER_API_URL || "http://localhost:3002/api";
            const response = await fetch(`${apiUrl}/driver/orders/${orderId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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

        // Custom PNG for Restaurant (Origin)
        const restaurantIcon = {
            url: "./images/restaurant.png",
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
        };

        // Custom PNG for Customer (Destination)
        const customerIcon = {
            url: "./images/cutlery.png",
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

    useEffect(() => {
        if (!isOpen || !orderId) {
            if (driverMarkerRef.current) {
                driverMarkerRef.current.setMap(null);
                driverMarkerRef.current = null;
            }
            return;
        }

        const wsUrl = (import.meta as any).env.VITE_DRIVER_WS_URL || "ws://localhost:3002";
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log("POS Map WebSocket connected");
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                // Handle initial locations download
                if (message.type === "init_locations") {
                    const matched = message.locations.find((l: any) => l.orderId === orderId);
                    if (matched && mapInstanceRef.current && window.google) {
                        updateDriverMarker(matched.latitude, matched.longitude, matched.driverName);
                    }
                }
                
                // Handle real-time updates
                if (message.type === "location_update" && message.data && message.data.orderId === orderId) {
                    const { latitude, longitude, driverName } = message.data;
                    if (mapInstanceRef.current && window.google) {
                        updateDriverMarker(latitude, longitude, driverName);
                    }
                }

                // Handle real-time chat messages
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
            if (!mapInstanceRef.current || !window.google) return;

            const bikeIcon = {
                url: "./images/delivery.png",
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20),
            };

            if (!driverMarkerRef.current) {
                driverMarkerRef.current = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: mapInstanceRef.current,
                    title: `${driverName} (Driver)`,
                    icon: bikeIcon
                });
            } else {
                const oldPos = driverMarkerRef.current.getPosition();
                if (oldPos) {
                    animateMarker(driverMarkerRef.current, oldPos.lat(), oldPos.lng(), lat, lng);
                } else {
                    driverMarkerRef.current.setPosition({ lat, lng });
                }
            }
        };

        return () => {
            socket.close();
            if (driverMarkerRef.current) {
                driverMarkerRef.current.setMap(null);
                driverMarkerRef.current = null;
            }
        };
    }, [isOpen, orderId, isLoaded]);

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

                            {/* Chat Button */}
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`relative w-full py-3 rounded-xl text-xs font-black transition-all border mt-2 flex items-center justify-center gap-2 ${isChatOpen ? "bg-emerald-500 border-emerald-500 text-white shadow-xl scale-[1.02]" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300"}`}
                            >
                                <MessageSquare className="size-4" />
                                {isChatOpen ? t("deliveryRouteModal.chat.closeChat") : t("deliveryRouteModal.chat.chatWithDriver")}
                                {unreadCount > 0 && !isChatOpen && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] size-5 flex items-center justify-center font-bold animate-bounce shadow-md">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative flex overflow-hidden">
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

                        <div ref={mapRef} className="flex-1 h-full" />

                        {/* Chat Panel side drawer */}
                        <div className={`border-l border-gray-200 bg-white flex flex-col h-full shadow-2xl relative z-10 transition-all duration-300 ease-in-out ${isChatOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none border-l-0"}`}>
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