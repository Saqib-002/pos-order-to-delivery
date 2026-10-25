import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, LocationIcon } from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { toast } from "react-toastify";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "../../../utils/googleMaps";

interface DeliveryZone {
    id: string;
    name: string;
    points: { lat: number; lng: number }[];
    minOrderAmount: number;
}

interface DeliveryZoneMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (zones: DeliveryZone[], coords?: { lat: number; lng: number }) => void;
    initialZones: DeliveryZone[];
    restaurantAddress: string;
    restaurantCoords?: { lat: number; lng: number };
    googleMapsApiKey?: string;
}

const DeliveryZoneMapModal: React.FC<DeliveryZoneMapModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialZones,
    restaurantAddress,
    restaurantCoords,
    googleMapsApiKey,
}) => {
    const { t } = useTranslation();
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zones, setZones] = useState<DeliveryZone[]>(initialZones || []);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
        restaurantCoords || null
    );
    const polygonsRef = useRef<{ [key: string]: L.Polygon }>({});
    const mapInstanceRef = useRef<L.Map | null>(null);
    const restaurantMarkerRef = useRef<L.Marker | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [tempPoints, setTempPoints] = useState<{ lat: number; lng: number }[]>([]);

    const tempPolylineRef = useRef<L.Polyline | null>(null);
    const tempMarkersRef = useRef<L.CircleMarker[]>([]);
    const tempPointsRef = useRef<{ lat: number; lng: number }[]>([]);

    // Sync zones state when modal opens
    useEffect(() => {
        if (isOpen) {
            setZones(initialZones || []);
            setSelectedZoneId(null);
            setError(null);
        }
    }, [isOpen, initialZones]);

    const cleanupDrawingState = useCallback(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.off("click", handleMapClick);
            mapInstanceRef.current.off("mousemove", handleMapMouseMove);
            const container = mapInstanceRef.current.getContainer();
            if (container) container.style.cursor = "";
        }
        if (tempPolylineRef.current) {
            tempPolylineRef.current.remove();
            tempPolylineRef.current = null;
        }
        tempMarkersRef.current.forEach(m => m.remove());
        tempMarkersRef.current = [];
        tempPointsRef.current = [];
        setTempPoints([]);
        setIsDrawing(false);
    }, []);

    const finishDrawing = useCallback(() => {
        const currentPoints = tempPointsRef.current;
        if (currentPoints.length < 3) return;

        cleanupDrawingState();

        const zoneId = Math.random().toString(36).substring(2, 11);
        const newZone: DeliveryZone = {
            id: zoneId,
            name: `${t("configurations.deliveryZones.zoneNamePlaceholder")} ${zones.length + 1}`,
            points: currentPoints,
            minOrderAmount: 0,
        };

        setZones((prev) => [...prev, newZone]);
        setSelectedZoneId(zoneId);
    }, [cleanupDrawingState, t, zones.length]);

    const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
        const newPt = { lat: e.latlng.lat, lng: e.latlng.lng };
        const updated = [...tempPointsRef.current, newPt];
        tempPointsRef.current = updated;
        setTempPoints(updated);

        if (tempPolylineRef.current) {
            tempPolylineRef.current.setLatLngs(updated.map(p => [p.lat, p.lng]));
        }

        const isFirst = updated.length === 1;

        if (mapInstanceRef.current) {
            const circle = L.circleMarker([newPt.lat, newPt.lng], {
                radius: isFirst ? 8 : 6,
                color: "#ffffff",
                weight: 2,
                fillColor: isFirst ? "#059669" : "#10B981",
                fillOpacity: 1,
            }).addTo(mapInstanceRef.current);

            circle.on("click", (evt) => {
                L.DomEvent.stopPropagation(evt);
                if (isFirst && tempPointsRef.current.length >= 3) {
                    finishDrawing();
                } else if (!isFirst) {
                    const filtered = tempPointsRef.current.filter(
                        p => !(p.lat === newPt.lat && p.lng === newPt.lng)
                    );
                    tempPointsRef.current = filtered;
                    setTempPoints(filtered);
                    if (tempPolylineRef.current) {
                        tempPolylineRef.current.setLatLngs(filtered.map(p => [p.lat, p.lng]));
                    }
                    circle.remove();
                    tempMarkersRef.current = tempMarkersRef.current.filter(m => m !== circle);
                }
            });

            tempMarkersRef.current.push(circle);
        }
    }, [finishDrawing]);

    const handleMapMouseMove = useCallback((e: L.LeafletMouseEvent) => {
        if (tempPointsRef.current.length === 0 || !tempPolylineRef.current) return;
        const currentLatLngs: [number, number][] = tempPointsRef.current.map(p => [p.lat, p.lng]);
        currentLatLngs.push([e.latlng.lat, e.latlng.lng]);
        tempPolylineRef.current.setLatLngs(currentLatLngs);
    }, []);

    const startDrawing = () => {
        if (!mapInstanceRef.current) return;
        cleanupDrawingState();
        setIsDrawing(true);
        setSelectedZoneId(null);

        const container = mapInstanceRef.current.getContainer();
        if (container) container.style.cursor = "crosshair";

        tempPolylineRef.current = L.polyline([], {
            color: "#10B981",
            opacity: 0.8,
            weight: 3,
        }).addTo(mapInstanceRef.current);

        mapInstanceRef.current.on("click", handleMapClick);
        mapInstanceRef.current.on("mousemove", handleMapMouseMove);
    };

    const cancelDrawing = () => {
        cleanupDrawingState();
    };

    // Initialize Leaflet Map
    useEffect(() => {
        if (!isOpen) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            polygonsRef.current = {};
            restaurantMarkerRef.current = null;
            cleanupDrawingState();
            setIsLoaded(false);
            return;
        }

        let active = true;

        const initMap = async () => {
            if (!mapRef.current || mapInstanceRef.current) return;

            try {
                // Use explicit coordinates if provided in configurations, otherwise geocode
                let resolvedCoords: { lat: number; lng: number } | null =
                    (restaurantCoords && restaurantCoords.lat && restaurantCoords.lng)
                        ? restaurantCoords
                        : null;

                if (!resolvedCoords && restaurantAddress) {
                    resolvedCoords = await geocodeAddress(restaurantAddress);
                }
                // The hardcoded center is only for framing the map; it must never be
                // saved as the restaurant location (only real or dragged coords are)
                const centerCoords = resolvedCoords || { lat: 40.3450255, lng: -3.5214149 };
                setCurrentCoords(resolvedCoords);

                if (!active || !mapRef.current) return;

                const map = L.map(mapRef.current, {
                    zoomControl: false,
                }).setView([centerCoords.lat, centerCoords.lng], 15);

                L.control.zoom({ position: "bottomright" }).addTo(map);

                L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }).addTo(map);

                mapInstanceRef.current = map;
                setIsLoaded(true);

                // Add Restaurant Marker (Draggable to pinpoint exact restaurant building or entrance)
                const restIcon = L.divIcon({
                    html: `<div style="background-color: #000; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #fff;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
                    className: "",
                    iconSize: [34, 34],
                    iconAnchor: [17, 17],
                });

                const restMarker = L.marker([centerCoords.lat, centerCoords.lng], {
                    icon: restIcon,
                    title: restaurantAddress || "Restaurant",
                    draggable: true,
                    zIndexOffset: 1000,
                }).addTo(map);

                restMarker.on("dragend", () => {
                    const pos = restMarker.getLatLng();
                    setCurrentCoords({ lat: pos.lat, lng: pos.lng });
                });

                restaurantMarkerRef.current = restMarker;

                setTimeout(() => {
                    map.invalidateSize();
                }, 250);
            } catch (err) {
                console.error("Map init error:", err);
                setError(t("configurations.deliveryZones.errors.mapInitError"));
            }
        };

        initMap();

        return () => {
            active = false;
        };
    }, [isOpen, restaurantAddress, t, cleanupDrawingState]);

    // Render polygons for zones on map
    useEffect(() => {
        if (!mapInstanceRef.current || !isLoaded) return;

        // Clear existing polygons
        Object.values(polygonsRef.current).forEach(p => p.remove());
        polygonsRef.current = {};

        zones.forEach(zone => {
            if (!zone.points || zone.points.length === 0) return;
            const isSelected = selectedZoneId === zone.id;

            const polygon = L.polygon(
                zone.points.map(p => [p.lat, p.lng]),
                {
                    color: isSelected ? "#2563EB" : "#059669",
                    fillColor: isSelected ? "#3B82F6" : "#10B981",
                    fillOpacity: isSelected ? 0.45 : 0.25,
                    weight: isSelected ? 3 : 2,
                }
            ).addTo(mapInstanceRef.current!);

            polygon.on("click", (e) => {
                L.DomEvent.stopPropagation(e);
                setSelectedZoneId(zone.id);
            });

            polygonsRef.current[zone.id] = polygon;
        });
    }, [zones, selectedZoneId, isLoaded]);

    const handleDeleteZone = (zoneId: string) => {
        if (polygonsRef.current[zoneId]) {
            polygonsRef.current[zoneId].remove();
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
        onSave(zones, currentCoords || undefined);
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
                                    Object.values(polygonsRef.current).forEach(p => p.remove());
                                    polygonsRef.current = {};
                                    setZones([]);
                                    setSelectedZoneId(null);
                                    cancelDrawing();
                                }}
                            />
                        </div>

                        {/* Drawing Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                            {!isDrawing ? (
                                <CustomButton
                                    label={t("configurations.deliveryZones.drawNewZone")}
                                    onClick={startDrawing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center transition-all"
                                    type="button"
                                />
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                            {t("configurations.deliveryZones.drawingModeActive")}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {t("configurations.deliveryZones.drawingHelpText", { count: tempPoints.length })}
                                    </p>
                                    <div className="flex gap-2">
                                        <CustomButton
                                            label={t("configurations.deliveryZones.finishDrawingButton")}
                                            onClick={finishDrawing}
                                            disabled={tempPoints.length < 3}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                                            type="button"
                                        />
                                        <CustomButton
                                            label={t("configurations.deliveryZones.cancelDrawingButton")}
                                            onClick={cancelDrawing}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                                            type="button"
                                        />
                                    </div>
                                </div>
                            )}
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
                            <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/80 backdrop-blur-sm">
                                <div className="text-center p-6">
                                    <p className="text-red-500 font-bold mb-2">{t("common.error")}</p>
                                    <p className="text-gray-700">{error}</p>
                                </div>
                            </div>
                        )}
                        {!isLoaded && !error && (
                            <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/80 backdrop-blur-sm">
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
