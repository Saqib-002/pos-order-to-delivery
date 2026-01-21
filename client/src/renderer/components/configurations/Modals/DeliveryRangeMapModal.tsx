import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, LocationIcon } from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";

interface DeliveryRangeMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    minKm: number;
    maxKm: number;
    restaurantAddress: string;
    googleMapsApiKey: string;
}

const DeliveryRangeMapModal: React.FC<DeliveryRangeMapModalProps> = ({
    isOpen,
    onClose,
    minKm,
    maxKm,
    restaurantAddress,
    googleMapsApiKey,
}) => {
    const { t } = useTranslation();
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !googleMapsApiKey) return;

        if (window.google?.maps?.importLibrary) {
            setIsLoaded(true);
            return;
        }

        const scriptId = "google-maps-script-delivery-preview";
        if (document.getElementById(scriptId)) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError("Failed to load Google Maps");
        document.head.appendChild(script);
    }, [isOpen, googleMapsApiKey]);

    useEffect(() => {
        if (!isLoaded || !isOpen || !mapRef.current) return;

        const initMap = async () => {
            try {
                const mapsLib = await window.google.maps.importLibrary("maps");
                const geocodingLib = await window.google.maps.importLibrary("geocoding");
                const markerLib = await window.google.maps.importLibrary("marker");

                const Map = mapsLib.Map;
                const Circle = mapsLib.Circle;
                const Geocoder = geocodingLib.Geocoder;
                const Marker = markerLib.Marker;

                const geocoder = new Geocoder();

                geocoder.geocode({ address: restaurantAddress }, (results: any, status: any) => {
                    if (status === "OK" && results[0]) {
                        const center = results[0].geometry.location;

                        const map = new Map(mapRef.current!, {
                            center: center,
                            zoom: 14,
                            mapTypeControl: true,
                            streetViewControl: true,
                            fullscreenControl: true,
                            styles: [
                                {
                                    featureType: "poi",
                                    elementType: "labels",
                                    stylers: [{ visibility: "off" }]
                                }
                            ]
                        });

                        new Marker({
                            position: center,
                            map: map,
                            title: t("deliveryRangeMapModal.restaurant"),
                            zIndex: 1000,
                            animation: window.google.maps.Animation.DROP
                        });

                        if (Number(maxKm) > 0) {
                            const outerCircle = new Circle({
                                strokeColor: "#059669",
                                strokeOpacity: 1.0,
                                strokeWeight: 4,
                                fillColor: "#10B981",
                                fillOpacity: 0.35,
                                map: map,
                                center: center,
                                radius: Number(maxKm) * 1000,
                                zIndex: 1
                            });

                            const bounds = outerCircle.getBounds();
                            if (bounds) {
                                map.fitBounds(bounds);
                                window.google.maps.event.addListenerOnce(map, 'idle', () => {
                                    const currentZoom = map.getZoom();
                                    if (currentZoom) map.setZoom(currentZoom + 1);
                                });
                            }
                        }

                        if (Number(minKm) > 0) {
                            new Circle({
                                strokeColor: "#DC2626",
                                strokeOpacity: 1.0,
                                strokeWeight: 4,
                                fillColor: "#EF4444",
                                fillOpacity: 0.25,
                                map: map,
                                center: center,
                                radius: Number(minKm) * 1000,
                                zIndex: 2
                            });
                        }
                    } else {
                        setError(t("deliveryRangeMapModal.errors.couldNotLocate", { status }));
                    }
                });
            } catch (e) {
                console.error("Map init error:", e);
                setError("Error initializing map");
            }
        };

        initMap();
    }, [isLoaded, isOpen, restaurantAddress, minKm, maxKm, t]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 bg-black text-white">
                    <div className="flex items-center gap-3">
                        <LocationIcon className="size-6 text-emerald-400" />
                        <div>
                            <h3 className="text-xl font-bold">{t("deliveryRangeMapModal.title")}</h3>
                            <p className="text-sm text-gray-400">
                                {minKm}km - {maxKm}km
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <CrossIcon className="size-6" />
                    </button>
                </div>

                <div className="flex-1 relative bg-gray-100">
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                            <div className="text-center p-6">
                                <p className="text-red-500 font-bold mb-2">Error</p>
                                <p className="text-gray-700">{error}</p>
                            </div>
                        </div>
                    )}
                    {!isLoaded && !error && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                        </div>
                    )}
                    <div ref={mapRef} className="w-full h-full" />
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                            <span className="text-gray-600">{t("deliveryRangeMapModal.deliveryZone")}</span>
                        </div>
                        {minKm > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400 ring-2 ring-red-100" />
                                <span className="text-gray-600">{t("deliveryRangeMapModal.excludedZone")}</span>
                            </div>
                        )}
                    </div>
                    <CustomButton
                        label={t("common.close")}
                        onClick={onClose}
                        type="button"
                        className="bg-black hover:scale-105 px-8"
                    />
                </div>
            </div>
        </div>
    );
};

export default DeliveryRangeMapModal;
