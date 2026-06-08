import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Package as PackageIcon, Route, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { defaultRouteForRole, useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function WorkWithUs() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={defaultRouteForRole(user.role)} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim())    { setError("Enter your name."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email."); return;
    }
    if (!phone.trim())   { setError("Enter a phone number."); return; }
    if (!vehicle.trim()) { setError("Describe your vehicle or fleet unit."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: "carrier",
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
      toast({ title: "Welcome aboard", description: "You are signed in as a carrier." });
      navigate(defaultRouteForRole("carrier"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Truck className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold">PacketFlow</span>
          </div>
          <h1 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
            Work <span>with</span> us
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Apply as a carrier for the PacketFlow network.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Route className="h-4 w-4 text-foreground" />
              </span>
              <span>
                <span className="font-medium text-foreground">Routes</span> — carriers use Packages and Routes in the console.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <PackageIcon className="h-4 w-4 text-foreground" />
              </span>
              <span>
                <span className="font-medium text-foreground">Operations</span> — admins can assign your fleet record to shipments.
              </span>
            </li>
          </ul>
          <p className="mt-10 text-sm text-muted-foreground">
            <Link to="/signup" className="font-medium text-foreground font-medium underline-offset-4 hover:underline">
              Sender / recipient sign up
            </Link>
            {" · "}
            <Link to="/login" className="font-medium text-foreground font-medium underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <Card className="border-border bg-card p-6 md:p-8">
          <h2 className="text-xl font-bold">Carrier application</h2>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ww-name">Full name</Label>
              <Input id="ww-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ww-email">Email</Label>
              <Input id="ww-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ww-phone">Phone</Label>
              <Input id="ww-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ww-vehicle">Vehicle / fleet unit</Label>
              <Input id="ww-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. Van — STO 412" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ww-address">Base location (optional)</Label>
              <Input id="ww-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ww-pass">Password</Label>
              <Input id="ww-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ww-confirm">Confirm password</Label>
              <Input id="ww-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "Applying..." : "Apply & sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
