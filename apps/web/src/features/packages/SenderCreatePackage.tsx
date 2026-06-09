import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useCreatePackage } from "./usePackages";
import { toast } from "@/hooks/use-toast";
import { SKANE_CITIES, DROP_OFF_POINTS } from "@packetflow/types";
import type { SkaneCity } from "@packetflow/types";

export default function SenderCreatePackage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createPackage = useCreatePackage();

  const [recipientName, setRecipientName]       = useState("");
  const [recipientEmail, setRecipientEmail]     = useState("");
  const [recipientPhone, setRecipientPhone]     = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [pickupCity, setPickupCity]             = useState<SkaneCity | "">("");
  const [destinationCity, setDestinationCity]   = useState<SkaneCity | "">("");
  const [weightKg, setWeightKg]                 = useState("0");
  const [length, setLength]                     = useState("0");
  const [width, setWidth]                       = useState("0");
  const [height, setHeight]                     = useState("0");
  const [error, setError]                       = useState<string | null>(null);

  // Where the sender leaves the package (origin city depot)
  const dropOffPoint = pickupCity      ? DROP_OFF_POINTS[pickupCity]      : null;
  // Where the recipient collects the package (destination city depot)
  const pickUpPoint  = destinationCity ? DROP_OFF_POINTS[destinationCity] : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const weightValue  = Number(weightKg);
    const lengthValue  = Number(length);
    const widthValue   = Number(width);
    const heightValue  = Number(height);

    if (!user)                       { setError("You must be signed in as a sender."); return; }
    if (!recipientName.trim())       { setError("Enter the recipient's name."); return; }
    if (!recipientEmail.trim())      { setError("Enter the recipient's email address."); return; }
    if (!pickupCity)                 { setError("Select a pickup city."); return; }
    if (!destinationCity)            { setError("Select a destination city."); return; }
    if ([weightValue, lengthValue, widthValue, heightValue].some((v) => Number.isNaN(v) || v <= 0)) {
      setError("Weight and dimensions must be positive numbers.");
      return;
    }

    try {
      const created = await createPackage.mutateAsync({
        senderName:      user.name,
        recipientName:   recipientName.trim(),
        recipientEmail:  recipientEmail.trim().toLowerCase(),
        recipientPhone:  recipientPhone.trim() || undefined,
        recipientAddress: recipientAddress.trim() || undefined,
        pickupCity,
        destinationCity,
        weight:     Number(weightValue.toFixed(2)),
        dimensions: { length: lengthValue, width: widthValue, height: heightValue },
      });
      toast({ title: "Package created", description: `Tracking: ${created.trackingCode}` });
      navigate(`/sender/packages/${created.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create package.";
      setError(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Create Shipment</h1>
        <p className="mt-1 text-muted-foreground">
          Register a new shipment and generate a tracking number instantly.
        </p>
      </header>

      <Card className="border-border bg-card p-6">
        <form onSubmit={submit} className="space-y-6">

          {/* Sender */}
          <section>
            <div className="space-y-1.5">
              <Label>Account holder</Label>
              <Input value={user?.name ?? ""} readOnly className="bg-secondary/40 text-muted-foreground" />
            </div>
          </section>

          {/* Recipient details */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Recipient</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="recipient-name">Recipient name</Label>
                <Input
                  id="recipient-name"
                  placeholder="Jane Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recipient-email">Email address<span className="text-destructive">*</span></Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="name@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="recipient-phone">Phone number<span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  id="recipient-phone"
                  type="tel"
                  placeholder="+46 70 123 45 67"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recipient-address">Address<span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  id="recipient-address"
                  placeholder="Storgatan 12, 211 20 Malmö"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Route cities — Skåne municipality dropdowns */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Pickup</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Origin city</Label>
                <Select value={pickupCity} onValueChange={(v) => setPickupCity(v as SkaneCity)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Skåne city…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKANE_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Destination city</Label>
                <Select value={destinationCity} onValueChange={(v) => setDestinationCity(v as SkaneCity)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Skåne city…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKANE_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-resolved depot addresses */}
            {(dropOffPoint || pickUpPoint) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {dropOffPoint && (
                  <div className="rounded-md border border-border bg-secondary/30 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">Drop-off point</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Where you leave the package</p>
                    <p className="mt-2 text-muted-foreground">{dropOffPoint}</p>
                  </div>
                )}
                {pickUpPoint && (
                  <div className="rounded-md border border-border bg-secondary/30 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">Pick-up point</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Where the recipient collects it</p>
                    <p className="mt-2 text-muted-foreground">{pickUpPoint}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Weight & dimensions */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Shipment details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="len">L (cm)</Label>
                  <Input id="len" type="number" min="1" value={length} onChange={(e) => setLength(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wid">W (cm)</Label>
                  <Input id="wid" type="number" min="1" value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hei">H (cm)</Label>
                  <Input id="hei" type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/sender/packages")}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={createPackage.isPending}>
              <PackagePlus className="h-4 w-4" />
              {createPackage.isPending ? "Creating..." : "Create shipment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
