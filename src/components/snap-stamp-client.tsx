
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent } from "react";
import {
  Image as ImageIcon,
  Clock,
  MapPin,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MapDialog } from "@/components/ui/map-dialog";
import { DatePickerWithTime } from "@/components/ui/date-picker-with-time";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const timeFormats = [
  { value: "MM/dd/yyyy, h:mm:ss a", label: "08/23/2024, 4:30:00 PM" },
  { value: "eeee, MMMM do, yyyy", label: "Friday, August 23rd, 2024" },
  { value: "MMM d, yyyy, h:mm a", label: "Aug 23, 2024, 4:30 PM" },
  { value: "yyyy-MM-dd HH:mm:ss", label: "2024-08-23 16:30:00" },
];

export function SnapStampClient() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(() => new Date());
  const [timeFormat, setTimeFormat] = useState(timeFormats[0].value);

  const [locationInput, setLocationInput] = useState<string>("");
  const [locationInfo, setLocationInfo] = useState<{ address: string; coords: GeolocationCoordinates; } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapDialogOpen, setMapDialogOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchLocation = useCallback(() => {
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const geoData = await geoResponse.json();
          const address = geoData.display_name || "Unknown location";
          setLocationInput(address);
          setLocationInfo({ address, coords: position.coords });
        } catch (error) {
          toast({ variant: "destructive", title: "Error fetching location details." });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        toast({ variant: "destructive", title: "Location Error", description: error.message });
        setIsLoadingLocation(false);
      }, { enableHighAccuracy: true }
    );
  }, [toast]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !photoPreviewUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = photoPreviewUrl;
    img.onload = () => {
      const canvasWidth = 800;
      const canvasHeight = (img.height / img.width) * canvasWidth;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const stampText = selectedDateTime ? format(selectedDateTime, timeFormat) : "";
      let locationText = locationInput;

      ctx.font = "600 24px Montserrat";
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
      
      ctx.fillStyle = "white";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      
      if (stampText) ctx.fillText(stampText, canvas.width - 20, canvas.height - 55);
      
      ctx.font = "400 18px Montserrat";
      if (locationText) ctx.fillText(locationText, canvas.width - 20, canvas.height - 25);
    };
  }, [photoPreviewUrl, selectedDateTime, timeFormat, locationInput]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);
  
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !photoFile) {
        toast({variant: "destructive", title: "No photo selected", description: "Please select a photo before downloading."});
        return;
    };
    const link = document.createElement("a");
    link.download = `snapstamp-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleLocationSelect = (address: string, coords: GeolocationCoordinates) => {
    setLocationInput(address);
    setLocationInfo({ address, coords });
  };


  return (
    <>
      <MapDialog 
        isOpen={isMapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Photo Preview</CardTitle>
              <CardDescription>Your final stamped image will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {photoPreviewUrl ? (
                  <canvas ref={canvasRef} className="max-w-full h-auto" />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <ImageIcon className="mx-auto h-16 w-16" />
                    <p className="mt-4 font-medium">Upload a photo to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Stamp</CardTitle>
              <CardDescription>Customize the timestamp and location for your photo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Step 1: Select a Photo</Label>
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  {photoFile ? "Change Photo" : "Upload Photo"}
                </Button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />
                {photoFile && <p className="text-sm text-muted-foreground">Selected: {photoFile.name}</p>}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="time-format" className="flex items-center gap-2"><Clock className="h-4 w-4"/> Step 2: Choose Time Format</Label>
                <div className="flex items-center space-x-2">
                  <DatePickerWithTime date={selectedDateTime} onDateChange={setSelectedDateTime} />
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                  <SelectTrigger id="time-format">
                    <SelectValue placeholder="Select time format" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>
              
              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Step 3: Tag Location</Label>
                  <Button variant="ghost" size="icon" onClick={() => fetchLocation()} disabled={isLoadingLocation} aria-label="Refresh Location">
                    {isLoadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Fetching location..."
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    disabled={isLoadingLocation}
                  />
                   <Button variant="outline" onClick={() => setMapDialogOpen(true)}>
                    Change
                  </Button>
                </div>
              </div>

              <Separator />

              <Button onClick={handleDownload} className="w-full bg-primary-gradient font-semibold text-lg py-6" disabled={!photoFile}>
                <Download className="mr-2 h-5 w-5" />
                Download Stamped Photo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
