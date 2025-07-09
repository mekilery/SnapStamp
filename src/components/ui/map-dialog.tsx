"use client";

import { useState } from "react";
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

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, coords: GeolocationCoordinates) => void;
}

export function MapDialog({ isOpen, onClose, onLocationSelect }: MapDialogProps) {
  // This is a placeholder for a map component.
  // In a real app, you would integrate a map library like Leaflet, Google Maps, or Mapbox.
  const [address, setAddress] = useState("");

  const handleSelect = () => {
    // In a real implementation, you'd get coords from the map.
    // Here we'll use placeholder coordinates.
    const mockCoords = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 1,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    };
    onLocationSelect(address, mockCoords);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Search for a location or pick a point on the map.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <Input 
                placeholder="Search for an address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />
          <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Map placeholder</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSelect} disabled={!address}>Select</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}