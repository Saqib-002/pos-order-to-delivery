import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, LocationIcon } from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { toast } from "react-toastify";

declare global {
    interface Window {
        google: any;
    }
}

interface DeliveryZone {
    id: string;
    name: string;
    points: { lat: number; lng: number }[];
    minOrderAmount: number;
}

interface DeliveryZoneMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (zones: DeliveryZone[]) => void;
    initialZones: DeliveryZone[];
    restaurantAddress: string;
    googleMapsApiKey: string;
}

const DeliveryZoneMapModal: React.FC<DeliveryZoneMapModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialZones,
    restaurantAddress,
    googleMapsApiKey,
}) => {
    const { t } = useTranslation();
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zones, setZones] = useState<DeliveryZone[]>(initialZones || []);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const polygonsRef = useRef<{ [key: string]: any }>({});
    const mapInstanceRef = useRef<any>(null);

    // Sync zones state when modal opens
    useEffect(() => {
        if (isOpen) {
            setZones(initialZones || []);
            setSelectedZoneId(null);
            setError(null);
        }
    }, [isOpen, initialZones]);

    // Load Google Maps Script
    useEffect(() => {
        if (!isOpen || !googleMapsApiKey) return;

        if (window.google?.maps?.importLibrary) {
            setIsLoaded(true);
            return;
        }

        const scriptId = "google-maps-script-delivery-zones";
        if (document.getElementById(scriptId)) {
            const checkLoaded = setInterval(() => {
                if (window.google?.maps?.importLibrary) {
                    setIsLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry,drawing,places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError(t("configurations.deliveryZones.errors.loadFailed"));
        document.head.appendChild(script);
    }, [isOpen, googleMapsApiKey, t]);

    const updateZonePoints = useCallback((zoneId: string, polygon: any) => {
        if (!polygon) return;
        const path = polygon.getPath();
        const points: { lat: number; lng: number }[] = [];
        for (let i = 0; i < path.getLength(); i++) {
            points.push({ lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
        }

        setZones(prev => prev.map(z => z.id === zoneId ? { ...z, points } : z));
    }, []);

    useEffect(() => {
        if (!isLoaded || !isOpen || !mapRef.current || !window.google?.maps?.importLibrary) return;

        let active = true;

        const initMap = async () => {
            try {
                // Ensure core namespaces exist
                const [mapsLib, drawingLib, geocodingLib, markerLib] = await Promise.all([
                    window.google.maps.importLibrary("maps"),
                    window.google.maps.importLibrary("drawing"),
                    window.google.maps.importLibrary("geocoding"),
                    window.google.maps.importLibrary("marker"),
                ]);

                if (!active || !mapRef.current) return;

                const { Map } = mapsLib;
                const { Geocoder } = geocodingLib;
                const { DrawingManager } = drawingLib;

                // Safe access to constants which are global after importLibrary
                const ControlPosition = window.google.maps.ControlPosition;
                const OverlayType = window.google.maps.drawing.OverlayType;

                if (!Map || !Geocoder || !DrawingManager || !ControlPosition || !OverlayType) {
                    console.error("Missing Google Maps components:", { Map, Geocoder, DrawingManager, ControlPosition, OverlayType });
                    setError(t("configurations.deliveryZones.errors.mapInitError"));
                    return;
                }

                const geocoder = new Geocoder();

                geocoder.geocode({ address: restaurantAddress || "Madrid, Spain" }, (results: any, status: any) => {
                    if (!active || !mapRef.current) return;

                    if (status === "OK" && results && results[0]) {
                        const center = results[0].geometry.location;

                        const newMap = new Map(mapRef.current, {
                            center: center,
                            zoom: 13,
                            mapId: "DELIVERY_ZONE_MAP",
                            mapTypeControl: true,
                            streetViewControl: true,
                            fullscreenControl: true,
                        });

                        mapInstanceRef.current = newMap;

                        // Add Restaurant Marker
                        const Marker = markerLib.AdvancedMarkerElement || markerLib.Marker;
                        if (markerLib.AdvancedMarkerElement) {
                            new Marker({
                                position: center,
                                map: newMap,
                                title: restaurantAddress,
                            });
                        } else if (markerLib.Marker) {
                            new (markerLib.Marker as any)({
                                position: center,
                                map: newMap,
                                title: restaurantAddress,
                                zIndex: 1000,
                            });
                        }

                        const dm = new DrawingManager({
                            drawingMode: null,
                            drawingControl: true,
                            drawingControlOptions: {
                                position: ControlPosition.TOP_CENTER,
                                drawingModes: [OverlayType.POLYGON],
                            },
                            polygonOptions: {
                                fillColor: "#10B981",
                                fillOpacity: 0.3,
                                strokeWeight: 2,
                                strokeColor: "#059669",
                                clickable: true,
                                editable: true,
                                zIndex: 1,
                            },
                        });

                        dm.setMap(newMap);

                        window.google.maps.event.addListener(dm, 'polygoncomplete', (polygon: any) => {
                            const path = polygon.getPath();
                            const points: { lat: number; lng: number }[] = [];
                            for (let i = 0; i < path.getLength(); i++) {
                                points.push({ lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
                            }

                            const zoneId = Math.random().toString(36).substring(2, 11);

                            setZones(prev => {
                                const newZone: DeliveryZone = {
                                    id: zoneId,
                                    name: `${t("configurations.deliveryZones.zoneNamePlaceholder")} ${prev.length + 1}`,
                                    points: points,
                                    minOrderAmount: 0,
                                };
                                return [...prev, newZone];
                            });

                            setSelectedZoneId(zoneId);
                            polygonsRef.current[zoneId] = polygon;

                            dm.setDrawingMode(null);

                            window.google.maps.event.addListener(polygon, 'click', () => {
                                setSelectedZoneId(zoneId);
                            });

                            const updateEvents = ['set_at', 'insert_at', 'remove_at'];
                            updateEvents.forEach(eventName => {
                                window.google.maps.event.addListener(path, eventName, () => updateZonePoints(zoneId, polygon));
                            });
                        });

                        // Render Initial Zones
                        initialZones.forEach(zone => {
                            if (!zone.points || zone.points.length === 0) return;

                            const polygon = new window.google.maps.Polygon({
                                paths: zone.points,
                                fillColor: "#10B981",
                                fillOpacity: 0.3,
                                strokeWeight: 2,
                                strokeColor: "#059669",
                                map: newMap,
                                editable: true,
                                clickable: true,
                            });

                            polygonsRef.current[zone.id] = polygon;

                            window.google.maps.event.addListener(polygon, 'click', () => {
                                setSelectedZoneId(zone.id);
                            });

                            const path = polygon.getPath();
                            const updateEvents = ['set_at', 'insert_at', 'remove_at'];
                            updateEvents.forEach(eventName => {
                                window.google.maps.event.addListener(path, eventName, () => updateZonePoints(zone.id, polygon));
                            });
                        });
                    } else {
                        console.error("Geocoding failed:", status);
                        setError(t("configurations.deliveryZones.errors.couldNotLocateRestaurant"));
                    }
                });
            } catch (e) {
                console.error("Map init error:", e);
                setError(t("configurations.deliveryZones.errors.mapInitError"));
            }
        };

        if (isLoaded) initMap();

        return () => {
            active = false;
            Object.values(polygonsRef.current).forEach(p => p.setMap(null));
            polygonsRef.current = {};
            mapInstanceRef.current = null;
        };
    }, [isLoaded, isOpen, restaurantAddress, t, updateZonePoints]);

    const handleDeleteZone = (zoneId: string) => {
        if (polygonsRef.current[zoneId]) {
            polygonsRef.current[zoneId].setMap(null);
            delete polygonsRef.current[zoneId];
        }
        setZones(prev => prev.filter(z => z.id !== zoneId));
        if (selectedZoneId === zoneId) setSelectedZoneId(null);
    };

    const handleSave = () => {
        if (zones.length === 0) {
            toast.warn(t("configurations.deliveryZones.validation.atLeastOneZone"));
            return;
        }
        onSave(zones);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 bg-black text-white">
                    <div className="flex items-center gap-3">
                        <LocationIcon className="size-6 text-emerald-400" />
                        <div>
                            <h3 className="text-xl font-bold">{t("configurations.deliveryZones.title")}</h3>
                            <p className="text-sm text-gray-400">{t("configurations.deliveryZones.subtitle")}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <CrossIcon className="size-6" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-80 border-r border-gray-100 overflow-y-auto p-4 space-y-6 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800">{t("configurations.deliveryZones.listTitle")}</h4>
                            <CustomButton
                                label={t("configurations.deliveryZones.clearMap")}
                                size="sm"
                                variant="transparent"
                                className="text-red-500 text-xs"
                                type="button"
                                onClick={() => {
                                    Object.values(polygonsRef.current).forEach(p => p.setMap(null));
                                    polygonsRef.current = {};
                                    setZones([]);
                                    setSelectedZoneId(null);
                                }}
                            />
                        </div>

                        {zones.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">{t("configurations.deliveryZones.noZones")}</p>
                                <p className="text-xs mt-1">{t("configurations.deliveryZones.drawHelp")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {zones.map((zone) => (
                                    <div
                                        key={zone.id}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedZoneId === zone.id
                                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                            : "border-white bg-white hover:border-gray-200"
                                            }`}
                                        onClick={() => setSelectedZoneId(zone.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <input
                                                type="text"
                                                value={zone.name}
                                                onChange={(e) => setZones(prev => prev.map(z => z.id === zone.id ? { ...z, name: e.target.value } : z))}
                                                className="bg-transparent font-bold text-gray-800 border-none focus:ring-0 focus:outline-none p-0 w-full"
                                                placeholder={t("configurations.deliveryZones.zoneNamePlaceholder")}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteZone(zone.id);
                                                }}
                                                className="text-red-400 hover:text-red-600 hover:cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{t("configurations.deliveryZones.minOrderLabel")}</span>
                                            <div className="flex-1">
                                                <CustomInput
                                                    type="number"
                                                    name="minOrderAmount"
                                                    value={String(zone.minOrderAmount)}
                                                    onChange={(e) => setZones(prev => prev.map(z => z.id === zone.id ? { ...z, minOrderAmount: Number(e.target.value) } : z))}
                                                    inputClasses="pl-8"
                                                    preLabel="€"
                                                    otherClasses="relative"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative bg-gray-100">
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                                <div className="text-center p-6">
                                    <p className="text-red-500 font-bold mb-2">{t("common.error")}</p>
                                    <p className="text-gray-700">{error}</p>
                                </div>
                            </div>
                        )}
                        {!isLoaded && !error && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/80 backdrop-blur-sm">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                            </div>
                        )}
                        <div ref={mapRef} className="w-full h-full" />
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-6 text-sm text-gray-500 italic">
                        {t("configurations.deliveryZones.editHelp")}
                    </div>
                    <div className="flex gap-4">
                        <CustomButton
                            type="button"
                            label={t("common.cancel")}
                            onClick={onClose}
                            variant="transparent"
                            className="px-8"
                        />
                        <CustomButton
                            type="button"
                            label={t("configurations.deliveryZones.saveButton")}
                            onClick={handleSave}
                            className="bg-black hover:scale-105 px-8"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryZoneMapModal;
