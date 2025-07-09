"use client";

import { useState, useCallback } from "react";
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

interface LocationDetails {
    road: string;
    city: string;
    country: string;
}

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, coords: GeolocationCoordinates, details: LocationDetails) => void;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  }
}

export function MapDialog({ isOpen, onClose, onLocationSelect }: MapDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching locations.",
        description: "Could not fetch locations. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast]);

  const handleSelect = (suggestion: Suggestion) => {
    const { road, city, town, village, country } = suggestion.address || {};
    const cityOrTown = city || town || village || '';
    let address = [road, cityOrTown, country].filter(Boolean).join(", ");
    if (!address) {
      address = suggestion.display_name;
    }

    const coords: GeolocationCoordinates = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      accuracy: 1,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    };

    const details: LocationDetails = {
        road: road || '',
        city: cityOrTown,
        country: country || ''
    };

    onLocationSelect(address, coords, details);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Search for a location to tag your photo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          <div className="h-64 w-full bg-muted rounded-md overflow-y-auto">
            {suggestions.length > 0 ? (
              <ul className="p-2">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    className="p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleSelect(s)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Search results will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
