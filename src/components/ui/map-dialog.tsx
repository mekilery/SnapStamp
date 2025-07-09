"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { GoogleMap, useJsApiLoader, StandaloneSearchBox, Marker } from "@react-google-maps/api";

interface LocationDetails {
    road: string;
    city: string;
    country: string;
}

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, coords: GeolocationCoordinates, details: LocationDetails) => void;
  initialCoords?: GeolocationCoordinates | null;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const libraries: "places"[] = ["places"];

const defaultCenter = { lat: 26.2285, lng: 50.5860 }; // Manama, Bahrain

export function MapDialog({ isOpen, onClose, onLocationSelect, initialCoords }: MapDialogProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState<{lat: number, lng: number} | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const [isMapLoading, setMapLoading] = useState(true);

  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setMapLoading(false);
    if(initialCoords) {
        const newCenter = { lat: initialCoords.latitude, lng: initialCoords.longitude };
        setCenter(newCenter);
        setMarkerPosition(newCenter);
    }
  }, [initialCoords]);

  const onPlacesChanged = () => {
    if (searchBoxRef.current && map) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const location = place.geometry.location;
          const newCenter = { lat: location.lat(), lng: location.lng() };
          map.panTo(newCenter);
          setMarkerPosition(newCenter);
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              handleSelect(results[0]);
            }
          });
        }
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const location = e.latLng;
      setMarkerPosition({ lat: location.lat(), lng: location.lng() });
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            handleSelect(results[0]);
        } else {
            toast({ variant: 'destructive', title: 'Could not get address for this location.' });
        }
      });
    }
  };

  const handleSelect = (place: google.maps.GeocoderResult) => {
    let road = '';
    let city = '';
    let country = '';

    place.address_components?.forEach(component => {
        const types = component.types;
        if (types.includes('route')) {
            road = component.long_name;
        }
        if (types.includes('locality')) {
            city = component.long_name;
        } else if (types.includes('postal_town') && !city) {
            city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !city) {
            city = component.long_name;
        }
        if (types.includes('country')) {
            country = component.long_name;
        }
    });
    
    const address = [road, city, country].filter(Boolean).join(", ");
    
    if (place.geometry && place.geometry.location) {
      const coords: GeolocationCoordinates = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      };

      const details: LocationDetails = { road, city, country };

      onLocationSelect(address || place.formatted_address, coords, details);
      onClose();
    }
  };

  useEffect(() => {
    if (loadError) {
      toast({
        variant: "destructive",
        title: "Error loading Google Maps",
        description: "Please check your API key and try again.",
      });
    }
  }, [loadError, toast]);
  
  useEffect(() => {
    if (isOpen && initialCoords) {
        const newCenter = { lat: initialCoords.latitude, lng: initialCoords.longitude };
        setCenter(newCenter);
        setMarkerPosition(newCenter);
        if(map) {
            map.panTo(newCenter);
        }
    } else if (isOpen) {
        setCenter(defaultCenter);
        setMarkerPosition(null);
    }
  }, [isOpen, initialCoords, map]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Search for a location or click on the map.
          </DialogDescription>
        </DialogHeader>

        {isLoaded && (
            <div className="space-y-4">
                <StandaloneSearchBox
                    onLoad={(ref) => (searchBoxRef.current = ref)}
                    onPlacesChanged={onPlacesChanged}
                >
                    <Input
                    type="text"
                    placeholder="Search for an address..."
                    className="w-full"
                    />
                </StandaloneSearchBox>
                <div className="relative">
                    {(isMapLoading || !isLoaded) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10 rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={10}
                        onLoad={onMapLoad}
                        onClick={handleMapClick}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                        }}
                    >
                        {markerPosition && <Marker position={markerPosition} />}
                    </GoogleMap>
                </div>
            </div>
        )}
        {loadError && (
            <div className="text-center text-destructive py-8">
                Failed to load map. Please check your API key configuration.
            </div>
        )}
        {!isLoaded && !loadError && (
            <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
